# Royal Inquest Predicate Expansion Plan

Design doc: `docs/superpowers/specs/2026-08-08-royal-inquest-predicate-expansion-design.md`.

## Changes

1. **`src/features/royal-inquest/types.ts`** — add `offset-from`, `prop-neighbor-count`,
   `area-occupant-count`, `by-window` to `InquestPredicate`; add optional `areaId?: string` to
   `InquestCell`.
2. **`src/features/royal-inquest/predicates.ts`** — add `areaKeyAt` helper next to `chamberAt`; add
   matching `evaluatePredicate` cases for all 4 new types (reusing `isAdjacent` for
   `prop-neighbor-count`/`by-window`, the same early-exit-count pattern as
   `chamber-occupant-count`/`seated-character-count` for `prop-neighbor-count`/
   `area-occupant-count`); add matching `getPredicateCharacterIds` cases. The exhaustive `never`
   default in both switches enforces completeness at compile time.
3. **`src/features/royal-inquest/predicateDifficulty.ts`** — add ratings: `offset-from: 3`,
   `prop-neighbor-count: 3`, `area-occupant-count: 2`, `by-window: 2`.
4. **`src/features/royal-inquest/definitionValidation.ts`** — add the 4 new type strings to
   `PREDICATE_TYPES`; add the window-edge-only rule to the existing per-cell prop loop.
5. **`src/assets/royal-inquest/manifest.ts`** — add `window` to `PropAssetId`,
   `propKindByAsset` (`'decorative'`), every `propsByEnvironment` list, and
   `royalInquestAssets.props` (placeholder texture reusing `stonePlanter`, `// TODO(art)` comment).
6. **`src/features/royal-inquest/predicates.test.ts`** — new true/false/`'unknown'` cases per new
   predicate type, plus `getPredicateCharacterIds` coverage for all 4.
7. **`src/features/royal-inquest/definitionValidation.test.ts`** — window-on-edge accepted,
   window-off-edge rejected; one case proving each new predicate type is accepted by
   `validateInquestDefinition`'s `PREDICATE_TYPES`/difficulty gate.
8. Docs (cave + human pairs, same content each):
   - `docs/royal-inquest/authoring/clues-and-predicates.cave.md` / `.human.md`: add 4 new
     "Predicate reference" sections; move the 4 predicates into the canonical difficulty table;
     update the 4 relevant "Murdoku book glossary" gap rows (`NOT IMPLEMENTED` → real predicate
     name, clear the now-redundant gap-only rating); rewrite "Predicate idea not yet in engine" to
     drop the 4 newly-closed items and the 6 previously-stale "already implemented" items (leaving
     only #10 no-empty-room, which isn't a clue predicate); add the 4 new types to the "Write clue"
     step-2 allow-list.
   - `docs/royal-inquest/authoring/board-rooms-props.cave.md` / `.human.md`: update the window
     entry in "Asset idea not yet built" — edge-only validation + placeholder texture now exist,
     real two-cell-span art is the remaining open item.
9. This plan + the design doc (already written).

`murdoku-clue-catalog.cave.md`/`.human.md`, `selectors.ts`, `solver.ts`, and `hints.ts` are
unaffected (confirmed in the design doc's non-goals).

## Verification

1. `npm run test:run` — all existing + new tests green.
2. `npm run build` — typecheck + build; exhaustive `never` switches confirm no predicate variant is
   left unhandled.
3. Manually trace one small fixture placement through `evaluatePredicate` for each of the 4 new
   types to confirm true/false/`'unknown'` behave as designed (covered by step 6/7's tests, not a
   separate manual step).
