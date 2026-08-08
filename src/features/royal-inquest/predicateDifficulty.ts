import type { InquestPredicate } from './types';

// Fixed authoring-time difficulty rating per predicate type, on a 1-3 scale. This is not a
// stacking weight - it's a tier label: a clue rated N is usable by any puzzle whose declared
// `InquestDefinition.difficulty` is N or higher, enforced by `validateInquestDefinition`.
//  1 = trivial/foundational (single-character or simple pairwise facts)
//  2 = moderate (counting/positional reasoning)
//  3 = hard (requires simultaneous multi-axis or existential/negative reasoning)
// Canonical source for these ratings: docs/royal-inquest/authoring/clues-and-predicates.human.md
// #predicate-difficulty-rating - update the doc first, then mirror the numbers here.
export const predicateDifficulty: Record<InquestPredicate['type'], number> = {
  'exact-row': 1,
  'exact-column': 1,
  'exact-chamber': 1,
  'same-chamber': 1,
  'different-chamber': 1,
  'on-prop': 1,
  'beside': 1,
  'not-beside': 1,
  'seated-character-count': 1,
  'direction-from': 2,
  'chamber-occupant-count': 2,
  'in-corner': 2,
  'not-beside-wall': 2,
  'shares-prop-neighbor': 2,
  'category-not-beside-prop': 3,
  'diagonal-from': 3,
  'not-diagonal-from': 3,
  'area-occupant-count': 2,
  'by-window': 2,
  'offset-from': 3,
  'prop-neighbor-count': 3,
};
