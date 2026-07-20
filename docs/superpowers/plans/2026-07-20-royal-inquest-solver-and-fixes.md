# Royal Inquest — Solver and Fixes Plan

Design doc: `docs/superpowers/specs/2026-07-20-royal-inquest-solver-and-fixes-design.md`.

## Changes

1. **`src/features/royal-inquest/types.ts`** — remove `legalCharacterIds?: CharacterId[]` from
   `InquestCell`; add `on-prop` to `InquestPredicate`.
2. **`src/assets/royal-inquest/manifest.ts`** — add `propKindByAsset: Record<PropAssetId, 'seat' |
   'decorative'>`.
3. **`src/features/royal-inquest/predicates.ts`** — add `evaluatePredicate`/
   `getPredicateCharacterIds` cases for `on-prop` (finds the cell whose `propId` matches, compares
   to the character's placement).
4. **`src/features/royal-inquest/solver.ts`** *(new)* — `solveInquestDefinition` (CSP backtracking,
   reuses `evaluatePredicate` for pruning) and `checkVictimElimination` (solves for every character
   but the victim, asserts exactly one remaining cell whose chamber's only other solved occupant is
   the traitor).
5. **`src/features/royal-inquest/definitionValidation.ts`** — drop the `legalCharacterIds` branch;
   make the prop/blocked check conditional on `propKindByAsset`; reject authored `exact-row`/
   `exact-column` clues; reject any clue naming the victim; run the solver-based
   uniqueness/victim-elimination checks (only once prior structural checks pass).
6. **`src/features/royal-inquest/reducer.ts`** — `isLegalDestination` drops the `legalCharacterIds`
   branch; `toggle-cross` gains a guard so a manual cross can only be removed when its row and
   column both hold zero placed characters.
7. **`src/features/royal-inquest/selectors.ts`** — drop the `legalCharacterIds` branch from
   `getCellState`; rename the row/column-occupied branch's result from `'derived-unavailable'` to
   `'auto-cross'`.
8. **`src/features/royal-inquest/validation.ts`** — drop the `legalCharacterIds` reference in
   `checkInquestProgress`'s illegal-cell check.
9. **`src/features/royal-inquest/definition.ts`** — redesign `blackwoodKeep`: delete
   `legalCharacterIdsByPosition`; full-width `solar` (rows 0-1, all 6 columns) merged with the old
   `great-hall`; four irregular chambers (`guardroom`, `chapel`, `archives`, `crypt`) below it, each
   hosting exactly one non-victim character; reclassify decorative props (`barrel-cluster`,
   `bookshelf`, `dungeon-cage`) at positions chosen to eliminate solver-discovered ties; one seat
   prop (`formal-chair`) at Aldric's solution cell; replace the old exact-row/column clues and the
   victim-naming `solar-witnesses` clue with `exact-chamber` clues for each non-victim character, an
   `on-prop` clue pinning Aldric to the chair, `different-chamber` and `not-beside` flavor clues.

   **Authoring process (solver-driven, not hand-derived)**: after each draft of the clue/prop
   layout, run `solveInquestDefinition(blackwoodKeep)` (a temporary `it.only`/scratch test, removed
   before commit) and inspect how many distinct full solutions it reports and where they differ
   from each other. Each discovered ambiguity was resolved by either adding an `on-prop` clue (for
   the aldric/victim chamber-share tie, which no chamber-only predicate can break) or placing one
   additional decorative blocked cell to eliminate a tied candidate cell. Iterate until
   `solutions.length === 1`, the sole solution matches `blackwoodKeep.solution`, and
   `checkVictimElimination` passes. This iteration is why the shipped chamber shapes are irregular
   and the prop positions look deliberate rather than symmetric — they are the output of this
   process, not an arbitrary choice.
10. **`src/features/royal-inquest/RoyalInquest.tsx`** — carousel prev/next handlers dispatch
    `select-character` alongside updating the carousel index; add transient `conflictCellKey`
    state, set when a `place` attempt no-ops specifically due to a row/column clash, applied as a
    `.conflict` class and auto-cleared; cell render renders `.cell-prop` and `.cell-avatar`
    simultaneously instead of either/or; the `·` glyph condition switches from
    `'derived-unavailable'` to `'auto-cross'`.
11. **`src/app/app.css`** — `.cell-prop` 92% → 96%; add `z-index` ordering so avatar paints over
    prop; rename `.cell.derived-unavailable` → `.cell.auto-cross`; add `.cell.conflict` (red
    highlight with fade transition).
12. **`PUZZLE_IMPLEMENTATION.md`** — document the clue-authoring rules (no `exact-row`/
    `exact-column`, no victim-naming, solver-verified uniqueness), the `on-prop` predicate, the
    seat/decorative prop split, the `auto-cross` rename, and the new `conflict` state.
13. Tests (see below) + this plan + the design doc.

## Tests

- **`definitionValidation.test.ts`** — rewritten: structural happy path against the new 5-chamber
  layout; rejects `exact-row`/`exact-column` clues; rejects a clue naming the victim; rejects a
  seat prop on a blocked cell and a decorative prop on an unblocked cell; rejects a clue set that
  no longer narrows to a unique solution (removing `aldric-seated`).
- **`solver.test.ts`** *(new)* — synthetic 2-character definitions: unique solution when clues pin
  both characters (including via `on-prop`); 2 solutions with no clues; 0 solutions with
  contradictory clues; `checkVictimElimination` passes for the real `blackwoodKeep` and fails for a
  synthetic case with an unconstrained victim.
- **`predicates.test.ts`** — add `on-prop` true/false/unknown cases; update the `beside`-false case
  to use two adjacent-but-different-chamber cells (the old case became same-chamber once `solar`
  merged with `great-hall`).
- **`reducer.test.ts`** — updated blocked/occupied/duplicate-row/column cases to match the new
  layout; new case proving a manual cross can't be removed while its row/column holds a character,
  and can once cleared.
- **`selectors.test.ts`** — `'derived-unavailable'` → `'auto-cross'`; clue-id lists updated to the
  new clue set (victim now has zero clues).
- **`hints.test.ts`** — position expectations updated to the new solution.
- **`visuals.test.ts`** — one wall-boundary test moved to an still-real chamber boundary (the old
  position became internal to the merged `solar`).
- **`validation.test.ts`** — unaffected (already generic).
- **`App.test.tsx`** — chamber-label list drops `'Great Hall'`; the "blocked cell has prop art"
  assertion moves off the now-unused `throne`; clue-brief text assertions updated to the new clue
  text (and the victim's brief now shows the "no witness statement" fallback); wall-right/-bottom
  counts updated to the new layout's actual counts (5 and 13, confirmed by direct count, not
  guessed).

## Verification

1. `npm run test:run` — 83 tests passing across 13 files.
2. `npm run build` — typecheck + production build clean.
3. `npm run dev` — manual pass: solve `blackwoodKeep` end-to-end using only the rewritten clues;
   confirm the red conflict flash on a row/column clash; confirm manual-cross removal is blocked
   once its row/column holds a placement; confirm carousel scroll selects without an extra click;
   confirm the seat cell (Aldric's chair) accepts a character and renders prop+avatar together.
