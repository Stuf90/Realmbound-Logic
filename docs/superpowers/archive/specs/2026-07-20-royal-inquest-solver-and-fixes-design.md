# Royal Inquest — Solver and Fixes Design

## Objective

Playing `blackwoodKeep` (the first Royal Inquest case) surfaced several rule violations against
the intended Murdoku/Enigmic-style design:

- `legalCharacterIdsByPosition` (`definition.ts`) pinned every character to exactly one authored
  cell — this pre-solved the whole board, so clues never actually narrowed anything.
- 7 of 11 clues were `exact-row`/`exact-column`, stating a numeric row/column directly in clue
  text instead of naming a room.
- The `solar-witnesses` clue directly named `envoy` (the murder victim, `isVictim: true`) in a
  `same-chamber` predicate — leaking the victim's chamber instead of leaving it to be eliminated.
- No solver existed anywhere, so nothing enforced "the puzzle has exactly one solution" or "once
  every character but the victim is placed, exactly one legal cell remains for the victim, in a
  chamber whose only other occupant is the traitor."
- Props (chairs/thrones/pews) were purely decorative/impassable — no way for a character to
  occupy a seat.
- Missing UX: auto-placed "X" marks when a character is placed in a row/column, a distinct red
  conflict highlight for row/column clashes, a guard preventing manual-cross removal while its
  row/column still holds a character, carousel scroll not auto-selecting the character, and props
  rendering smaller than the practical tile ceiling.

Decisions confirmed up front:

1. Remove the pre-solve whitelist; add a real solver-backed validator.
2. Keep `exact-row`/`exact-column` predicate types in the engine (still internally useful), but
   ban them — and any clue naming the victim — at the authoring/validation layer.
3. Only chairs/benches/pews become occupiable "seat" props; tables/planters/cages/bookshelves
   stay decorative/impassable.

## Engine constraint discovered during implementation

`isLegalDestination` (`reducer.ts`) forbids any two characters from ever sharing a row or column,
for every valid placement — the core one-per-row/one-per-column ("Latin square") rule. Consequently
`beside`/`direction-from` between two *different* characters can never be authored `true` on this
board shape (both require a shared row or column between the two operands); `not-beside` is
correspondingly always trivially true. This is an accepted, permanent engine property — not
something this change fixes — so `blackwoodKeep`'s clue set is built from `exact-chamber`,
`same-chamber`/`different-chamber`, and a new `on-prop` predicate (below), not `beside`/
`direction-from`.

A second, harder discovery: **`exact-chamber`/`same-chamber`/`different-chamber` alone cannot
break a two-fold "swap" ambiguity between a clued character and the (permanently unclued) victim
who shares their chamber.** Any chamber housing both the traitor and the victim has (at minimum)
two reachable cells once every other character is placed — one for each — and no available
predicate can say "the traitor took *this* one, not that one" without either naming the victim
(banned) or relying on `beside`/`direction-from` (always false/true, uninformative). The fix: a
new `on-prop` predicate — `{ type: 'on-prop', characterId, propId }`, true when a character's
placement matches the one cell bearing that `propId`. "Aldric was found seated in the chair"
pins Aldric to an exact cell without ever stating a coordinate or naming the victim. This doubles
as the requested "usable prop" mechanic: the seat a clue points to is also a cell a character can
physically occupy.

## Data model changes

- **`types.ts`**: remove `legalCharacterIds?: CharacterId[]` from `InquestCell`; add
  `{ type: 'on-prop'; characterId: CharacterId; propId: PropAssetId }` to `InquestPredicate`.
- **`manifest.ts`**: add `propKindByAsset: Record<PropAssetId, 'seat' | 'decorative'>`. Seats:
  `throne`, `formal-chair`, `simple-chair`, `wooden-bench`(+variants), `church-pew`(+variants).
  Decorative: `stone-planter`, `wooden-planter`, `dining-table`(+variants), `kitchen-worktable`
  (+variants), `barrel-cluster`, `bookshelf`(+variants), `dungeon-cage`.
- Rule: a cell whose `propId` is a seat must have `blocked: false`; a cell whose `propId` is
  decorative must have `blocked: true`. `blocked` keeps its single existing meaning (impassable).

## Solver (new `src/features/royal-inquest/solver.ts`)

Author-time-only CSP backtracking solver, never called at runtime/play:

```ts
export interface SolveResult {
  solutions: Array<Record<CharacterId, GridPosition>>; // capped at 2 — only 0/1/2+ matters
}
export function solveInquestDefinition(
  definition: InquestDefinition,
  characterIds?: CharacterId[], // defaults to every character; used for the victim sub-solve
): SolveResult;

export interface VictimEliminationResult { ok: boolean }
export function checkVictimElimination(definition: InquestDefinition): VictimEliminationResult;
```

- Candidates per character: all `blocked: false` cells. Backtrack character-by-character, skipping
  any cell whose row/column is already taken in the current branch, pruning via
  `evaluatePredicate` (already handles partial placements — reused directly, no new evaluation
  logic). Stops after 2 full solutions.
- `checkVictimElimination`: solves for every character except the victim; asserts the resulting
  unique placement leaves exactly one unblocked, unclaimed cell (no shared row/column with any of
  the others), and that cell's chamber has exactly one occupant among the solved characters, equal
  to `traitorId`.

## Validation changes (`definitionValidation.ts`)

Additive, only evaluated once prior structural checks pass:

1. Reject any clue with `predicate.type` of `'exact-row'`/`'exact-column'`.
2. Reject any clue whose predicate names the victim as *any* operand of *any* type (via
   `getPredicateCharacterIds`, already exhaustive over every predicate variant).
3. Prop/blocked check becomes conditional on `propKindByAsset`: seat props must be unblocked,
   decorative props must be blocked (previously this check was accidentally deleted rather than
   made conditional in a prior change; this restores and generalizes it).
4. `solveInquestDefinition(definition).solutions.length === 1` and deep-equals the authored
   `solution`; `checkVictimElimination(definition).ok` must be `true`.

## `blackwoodKeep` content redesign

- `solar` now spans the full board width for its two rows (12 cells, still one contiguous
  chamber) so it can host both the envoy and the traitor without column-band pressure squeezing
  every chamber beneath it into a single shared column (verified necessary by hand-derivation
  before falling back to solver-driven iteration — see plan doc for the authoring process).
- The remaining four rows split into four irregular (non-uniform-grid) chambers — `guardroom`,
  `chapel`, `archives`, `crypt` — each hosting exactly one of the five non-victim characters.
  Chamber shapes are irregular by necessity: a uniform 2x2 grid of same-shaped chambers produces
  a highly symmetric CSP with many equally-valid solutions; asymmetry plus a handful of decorative
  blocked cells (placed to eliminate discovered ties) is what collapses the space to one solution.
- `legalCharacterIdsByPosition` is deleted entirely. Every clue is `exact-chamber`,
  `different-chamber`, `not-beside` (flavor only), or the new `on-prop` (for Aldric's chair).
  `solar-witnesses` (the old victim-naming clue) is removed outright — its narrative payoff ("only
  Aldric was with the envoy") survives in `RoyalInquest.tsx`'s unconditional resolution banner.
- Final clue set and prop placement were only finalized by running `solveInquestDefinition`
  against draft content and iterating — see the plan doc's authoring-loop notes. The shipped
  definition validates with zero issues (unique solution, matches authored `solution`, clean
  victim-elimination).

## UX additions

- **Auto-cross**: `selectors.ts`'s row/column-occupied-by-another-character branch is renamed
  from `'derived-unavailable'` to `'auto-cross'` — same live-computed, non-persisted mechanism,
  now a materialized "X" concept distinct from `manual-cross` in the CSS/glyph layer.
- **Conflict highlight**: `RoyalInquest.tsx` tracks a transient `conflictCellKey`; a placement
  attempt rejected specifically because the target's row/column is already taken gets a brief red
  `.cell.conflict` highlight (auto-clears after ~600ms or on the next action), distinct from the
  muted `auto-cross` styling.
- **Manual-cross removal guard**: `reducer.ts`'s `toggle-cross` only allows removing an existing
  manual cross when its row *and* column both currently hold zero placed characters.
- **Carousel auto-select**: prev/next carousel navigation dispatches `select-character` alongside
  updating the local carousel index, so scrolling immediately selects that character for
  placement.
- **Seat rendering**: a cell can now render both `.cell-prop` and `.cell-avatar` simultaneously
  (seat + occupant) instead of the previous either/or ternary.
- **Prop sizing**: `.cell-prop` grows from 92% to 96% of the tile (the practical ceiling given the
  cell's border); `.cell-avatar` stays at 78% so it reads clearly layered over a full-size seat.

## Non-goals

- No change to the core one-per-row/one-per-column engine rule.
- No fix to `direction-from`/`beside` being structurally unusable as `true` clues on this board
  shape (documented, accepted engine property).
- No change to `hints.ts` ordering/behavior.
- No change to Siege Lines or any non-Royal-Inquest feature.
- No requirement that future puzzles avoid `direction-from`/`beside`/`exact-row`/`exact-column` in
  the engine — only that authored *clues* must not use `exact-row`/`exact-column`, and
  `blackwoodKeep`'s specific full-permutation solution doesn't rely on adjacency predicates.

See `docs/superpowers/plans/2026-07-20-royal-inquest-solver-and-fixes.md` for the implementation
plan, including the solver-driven clue-authoring process.
