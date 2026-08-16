# Royal Inquest Predicate Catch-Up #2 Plan

Design doc: `docs/superpowers/specs/2026-08-16-royal-inquest-predicate-catchup-2-design.md`.

## Changes

1. **`src/features/royal-inquest/types.ts`** — add the 18 new `InquestPredicate` variants; add
   `chamberOrder?: Record<string, number>` to `InquestDefinition`.
2. **`src/assets/royal-inquest/manifest.ts`** — add `propCategoryByAsset: Record<PropAssetId,
   string>`.
3. **`src/features/royal-inquest/predicates.ts`**:
   - New helpers: `cellsInAxis`, `sameChamberOpenNeighbors`, `characterIdOnProp`,
     `otherCharacterIds`, `propCategoriesNearPosition`.
   - `evaluatePredicate` branch per new type, per the design doc's semantics.
   - Fix `direction-from`: drop the shared-row/shared-column requirement.
   - `getPredicateCharacterIds` branch per new type; `one-of`/`all-of` recurse via `flatMap`.
   - Exhaustive `never` default stays in both switches.
4. **`src/features/royal-inquest/predicateDifficulty.ts`** — add ratings for the 18 new types
   (mirroring `murdoku-logic-engine`'s `PREDICATE_DIFFICULTY` table); add
   `effectivePredicateDifficulty(predicate)` (recursive max over `one-of`/`all-of` options, table
   lookup otherwise).
5. **`src/features/royal-inquest/definitionValidation.ts`**:
   - Add the 18 new type strings to `PREDICATE_TYPES`.
   - Switch the difficulty gate to `effectivePredicateDifficulty(clue.predicate)`.
   - Validate `chamberOrder` (integer values, keys are real chamber ids).
   - Reject any `chamber-order-compare` clue whose subject/reference chamber has no `chamberOrder`
     entry.
6. **`src/features/royal-inquest/predicates.test.ts`** — satisfied/violated/`'unknown'` cases per
   new predicate type; `getPredicateCharacterIds` coverage including `one-of`/`all-of` recursion; a
   regression case proving `direction-from` now holds for an off-row/off-column pair.
7. **`src/features/royal-inquest/definitionValidation.test.ts`** — one accepting case per new
   predicate type; `chamberOrder` structural validation cases; `chamber-order-compare` against an
   order-less chamber rejected.
8. Docs (cave + human pairs, same content each):
   - `docs/royal-inquest/authoring/clues-and-predicates.cave.md` / `.human.md`: one "Predicate
     reference" section per new predicate; extend the difficulty rating table; update the
     `direction-from` entry to drop the vacuity caveat; note in "Predicate idea not yet in engine"
     that Royal Inquest is now at parity with `murdoku-logic-engine`'s full predicate set (minus
     the two deliberately-banned types).
   - `docs/royal-inquest/authoring/board-rooms-props.cave.md` / `.human.md`: document
     `propCategoryByAsset`.
9. This plan + the design doc (already written).

`murdoku-clue-catalog.cave.md`/`.human.md`, `selectors.ts`, `solver.ts`, and `hints.ts` are
unaffected (confirmed in the design doc's non-goals).

## Verification

1. `npm run test:run` — all existing + new tests green.
2. `npm run build` — typecheck + build; exhaustive `never` switches confirm no predicate variant is
   left unhandled.
3. Diff the final `InquestPredicate` type list against `murdoku-logic-engine`'s `MurdokuPredicate`
   list — only remaining non-parity is `beside`/`not-beside` and `exact-row`/`exact-column`, all
   already banned by design (covered by table-driven tests, not a separate manual step).
