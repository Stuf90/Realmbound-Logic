# Royal Inquest Predicate Catch-Up #2 Design

## Objective

`murdoku-logic-engine` (sibling repo, the asset-agnostic reference implementation) has grown to 34
`MurdokuPredicate` variants, cross-checked against `https://murdoku.fans/en/` plus imported
fan-wiki case data. Royal Inquest's `InquestPredicate` has 19 variants, last caught up against the
narrower P13-book-scan-only catalog in the 2026-08-08/09 "predicate expansion" pass. Diffing both
`predicates.ts` files finds:

1. **18 predicate types present in the engine, absent from Royal Inquest.**
2. **`direction-from` has stale, pre-fix semantics.** Royal Inquest's version requires the subject
   and reference character to already share a row or column before checking direction. On a
   one-per-row/column permutation board that precondition is never true — Royal Inquest's own doc
   admits the predicate is "SHIP CASE NEVER USE AS REAL CLUE THIS REASON," i.e. vacuous. The engine
   fixed exactly this (commit `1a2213a`, "correct cardinal direction-from semantics"): a cardinal
   direction is a loose single-axis comparison, matching the fan glossary's "south of" reading
   ("strictly below, any column"). Porting the fix makes the predicate usable for the first time.

## Predicate additions

Renamed to Royal Inquest's `chamber`/`character` vocabulary (same pattern as the existing
`exact-room` → `exact-chamber`):

```ts
| { type: 'not-on-prop'; characterId: CharacterId; propId: PropAssetId }
| { type: 'not-seated'; characterId: CharacterId }
| { type: 'not-in-corner'; characterId: CharacterId }
| { type: 'not-exact-chamber'; characterId: CharacterId; chamberId: string }
| { type: 'beside-wall'; characterId: CharacterId }
| { type: 'near-prop'; characterId: CharacterId; propId: PropAssetId }
| { type: 'not-near-prop'; characterId: CharacterId; propId: PropAssetId }
| { type: 'prop-in-axis'; characterId: CharacterId; propId: PropAssetId; axis: 'row' | 'column' }
| { type: 'beside-empty-cell'; characterId: CharacterId }
| { type: 'category-on-prop'; category: string; propId: PropAssetId }
| { type: 'prop-in-chamber'; chamberId: string; propId: PropAssetId }
| {
    type: 'axis-offset-from';
    subjectCharacterId: CharacterId;
    referenceCharacterId: CharacterId;
    axis: 'row' | 'column';
    offset: number;
  }
| {
    type: 'category-chamber-count';
    category: string;
    chamberId: string;
    count: number;
  }
| {
    type: 'chamber-rank';
    characterId: CharacterId;
    chamberId: string;
    rank: 'topmost' | 'bottommost' | 'leftmost' | 'rightmost';
  }
| { type: 'one-of'; options: InquestPredicate[] }
| { type: 'all-of'; predicates: InquestPredicate[] }
| {
    type: 'chamber-order-compare';
    subjectCharacterId: CharacterId;
    referenceCharacterId: CharacterId;
    comparator: 'greater' | 'less' | 'immediately-after' | 'immediately-before';
  }
| {
    type: 'shares-prop-category-neighbor';
    firstCharacterId: CharacterId;
    secondCharacterId: CharacterId;
  }
```

Plus two new optional data-model fields:

```ts
// InquestDefinition
chamberOrder?: Record<string, number>;

// manifest.ts
propCategoryByAsset: Record<PropAssetId, string>;
```

### Simple single/pair-character predicates

`not-on-prop`, `not-seated`, `not-in-corner`, `not-exact-chamber`, `beside-wall` are direct
negations of existing predicates (`on-prop`, seated-on-a-seat-prop, `in-corner`, `exact-chamber`,
`not-beside-wall`) — same `'unknown'`-until-placed rule, boolean flipped. `axis-offset-from`
generalizes `offset-from` to a single axis (pins one axis, ignores the other) — same shape as
`direction-from` vs `offset-from`'s relationship.

### `near-prop` / `not-near-prop`

Generic version of `by-window`: `'unknown'` until placed, then orthogonally adjacent to the
(single) cell bearing `propId` **and same `chamberId`** — the fan glossary's "Beside" entry is
adjacency + same region, which is why `by-window` (window sits on the chamber's own edge, adjacency
alone suffices) and `near-prop` (a plant/cabinet/door can sit near a chamber boundary, where
adjacency without the same-chamber check would leak across walls) differ. `not-near-prop` is the
exact negation, `'unknown'` propagates.

### `prop-in-axis`

`'unknown'` until placed; true when any cell sharing the character's row (or column, per `axis`)
bears `propId`. Needs a small `cellsInAxis` helper (new, mirrors the engine's `board.ts` function)
since Royal Inquest has no equivalent today.

### `beside-empty-cell`

`'unknown'` until placed; true once every same-chamber orthogonal open neighbor is checked: if any
remains unoccupied by another character, true; if all are occupied, false; if some neighbors are
still unplaced-into but none are confirmed empty yet, `'unknown'` until every character is placed
(occupancy only grows as more characters place, mirroring the engine's `beside-empty-cell`
comment). Needs a `sameChamberOpenNeighbors` helper.

### `category-on-prop`

Whoever occupies the (single) cell bearing `propId` decides this immediately once someone is placed
there (`suspectIdOnProp`-equivalent), independent of full completion — ports the engine's early-exit
logic via a small `characterIdOnProp` helper.

### `prop-in-chamber`

Pure board-layout fact, no placements involved: true iff the (single) cell bearing `propId` has
`chamberId === predicate.chamberId`. Never `'unknown'`. Names no character.

### `category-chamber-count`

Counts characters whose `category` matches, scoped to one chamber — direct generalization of
`chamber-occupant-count`'s counting pattern, but cast-wide (like `seated-character-count`) rather
than "others besides one named character."

### `chamber-rank`

True when the character is the extreme (topmost/bottommost/leftmost/rightmost) row-or-column value
among everyone else sharing that chamber. Two characters sharing a chamber always have distinct
rows and distinct columns (permutation board), so no tie-break logic is needed — ports directly
from the engine's `room-rank`, using a new `otherCharacterIds` helper.

### `one-of` / `all-of`

Recursive disjunction/conjunction over nested `InquestPredicate[]`. `one-of`: any option `true` →
`true`; else `'unknown'` if any option is `'unknown'`; else `false`. `all-of`: any option `false` →
`false`; else `'unknown'` if any option is `'unknown'`; else `true`. `getPredicateCharacterIds`
recurses (`flatMap`), so the existing victim-name-ban check covers nested predicates for free.
Difficulty is the max of nested options' `effectivePredicateDifficulty`, recursively — see
Validation additions below.

### `chamber-order-compare`

Needs the new `InquestDefinition.chamberOrder?: Record<string, number>` field (optional — only
cases using this predicate set it, mirroring the engine's `Room.order?`). Looks up both
characters' chamber, then that chamber's order number; `'unknown'` unless both resolve. Four
comparators: `greater`, `less`, `immediately-after` (`subjectOrder === referenceOrder + 1`),
`immediately-before` (`subjectOrder === referenceOrder - 1`).

### `shares-prop-category-neighbor`

Needs the new `propCategoryByAsset: Record<PropAssetId, string>` manifest map, grouping asset
variants that are the same "thing" in different skins/environments: `stone-planter`/
`wooden-planter` → `planter`; `dining-table`/`-left`/`-right` → `dining-table`;
`kitchen-worktable`/`-left`/`-right` → `kitchen-worktable`; `bookshelf`/`-left`/`-right` →
`bookshelf`; `wooden-bench`/`-left`/`-right` → `wooden-bench`; `church-pew`/`-left`/`-right` →
`church-pew`; every other asset maps to itself (its own id is already a unique category). True when
both characters are placed and the set of prop categories orthogonally adjacent to each (via a new
`propCategoriesNearPosition` helper) intersects — "X and Y are each beside a plant," not
necessarily the same plant.

## Validation additions

- All 18 new type strings join the `PREDICATE_TYPES` set in `definitionValidation.ts`.
- The difficulty gate switches from a flat `predicateDifficulty[clue.predicate.type]` lookup to a
  new `effectivePredicateDifficulty(predicate)` function in `predicateDifficulty.ts` — identical to
  the table lookup for every existing type, but recurses into `one-of`/`all-of` options and takes
  the max, since those two have no fixed tier.
- `chamberOrder` (when present) is validated as `Record<string, integer>`, keyed only by chamber
  ids that actually exist on the board.
- Any `chamber-order-compare` clue whose subject or reference character's chamber has no entry in
  `chamberOrder` is rejected at author time (`Clue "..." uses chamber-order-compare against a
  chamber with no chamberOrder entry.`) — the engine's version silently evaluates `'unknown'`
  forever in that case (an under-constrained-puzzle footgun); Royal Inquest catches it earlier
  instead, consistent with how `validateInquestDefinition` already catches the swap hazard rather
  than leaving it to runtime.
- `direction-from`'s fix needs no new validation — it stops being vacuous, it doesn't become newly
  invalid for anything that used it before (nothing did, per the "ship case never use" note).
- No new ban rule: none of the 18 additions are vacuous on this board shape, unlike `beside`/
  `not-beside` (already banned) or `exact-row`/`exact-column` (already banned by design).

## `direction-from` fix

Drop the `subject.column === reference.column` (north/south) and `subject.row === reference.row`
(east/west) requirements; keep only the one relevant axis comparison, exactly matching the engine's
`directionHolds`. Update the doc's existing "ALL REQUIRE SUBJECT + REFERENCE SHARE ROW OR
COLUMN... SHIP CASE NEVER USE AS REAL CLUE THIS REASON" caveat to reflect that the predicate is now
real and usable.

## Non-goals

- No `comparator: 'exact' | 'at-least'` field added to any Royal Inquest count predicate
  (`chamber-occupant-count`, `seated-character-count`, `prop-neighbor-count`, `area-occupant-count`,
  and the new `category-chamber-count`) even though the engine's equivalents all take one. Adding
  it would be a breaking change to 4 existing predicate shapes and every level authored against
  them — out of scope for a vocabulary catch-up; tracked as a separate future decision if "at
  least N" phrasing is ever needed.
- No changes to `selectors.ts`, `solver.ts`, or `hints.ts` — none of the new predicates need
  special-cased cell-availability or hint-text logic beyond what `getPredicateCharacterIds` already
  provides generically (same non-goal as the prior expansion pass).
- No new shipped level content using the new predicates — engine-only pass, matching the prior
  expansion's scope.

See `docs/superpowers/plans/2026-08-16-royal-inquest-predicate-catchup-2.md` for the implementation
plan.
