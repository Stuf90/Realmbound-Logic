# Royal Inquest Predicate Rules Plan

Design doc: `docs/superpowers/specs/2026-07-20-royal-inquest-predicate-rules-design.md`.

## Changes

1. **`src/features/royal-inquest/types.ts`** — add `exact-chamber`, `not-beside`, `direction-from` to
   `InquestPredicate`; remove `north-of` (replaced by `direction-from`).
2. **`src/features/royal-inquest/predicates.ts`** — add matching `evaluatePredicate` cases (reusing
   `chamberAt` for `exact-chamber`, the existing `beside` distance/chamber computation negated for
   `not-beside`, a switch on `direction` for `direction-from`) and matching `getPredicateCharacterIds`
   cases. The exhaustive `never` default in both switches enforces completeness.
3. **`src/features/royal-inquest/hints.ts`** — replace the `'characterId' in predicate` clue lookup with
   `getPredicateCharacterIds(predicate).includes(character.id)`, imported from `./predicates`.
4. **`src/features/royal-inquest/definition.ts`** — add `edmund-archives` (`exact-chamber`) and
   `aldric-not-beside-edmund` (`not-beside`) clues to `blackwoodKeep`.
5. **`src/features/royal-inquest/predicates.test.ts`** — new cases per new predicate type
   (true/false/`'unknown'`, including "unknown until both placed" for pairwise ones); update the
   existing `north-of` case to `direction-from` with `direction: 'north'`; add coverage of
   `getPredicateCharacterIds` across representative predicate types.
6. **`src/features/royal-inquest/hints.test.ts`** — regression case proving a pairwise-predicate clue
   (e.g. `not-beside`) now surfaces its clue text instead of the generic fallback message.
7. Docs: this plan + the design doc.

`definitionValidation.test.ts` and `selectors.ts` are unaffected (confirmed in the design doc).

## Verification

1. `npm run test:run -- royal-inquest` — all existing + new tests green.
2. `npm run build` — typecheck + build; exhaustive `never` switches confirm no predicate variant is left
   unhandled after the `north-of` → `direction-from` rename.
3. Confirm every clue in `blackwoodKeep.clues` (including the two new ones) evaluates `true` against
   `blackwoodKeep.solution`.
