import type { InquestPredicate } from './types';

// Fixed authoring-time difficulty weight per predicate type, on a 1-3 scale:
//  1 = trivial/foundational (single-character or simple pairwise facts)
//  2 = moderate (counting/positional reasoning)
//  3 = hard (requires simultaneous multi-axis or existential/negative reasoning)
// `InquestDefinition.difficulty` must be >= the highest weight among its clues, enforced by
// `validateInquestDefinition`.
export const predicateDifficulty: Record<InquestPredicate['type'], number> = {
  'exact-row': 1,
  'exact-column': 1,
  'exact-chamber': 1,
  'same-chamber': 1,
  'different-chamber': 1,
  'on-prop': 1,
  'direction-from': 2,
  'beside': 2,
  'not-beside': 2,
  'chamber-occupant-count': 2,
  'in-corner': 2,
  'seated-character-count': 2,
  'not-beside-wall': 2,
  'category-not-beside-prop': 3,
  'shares-prop-neighbor': 3,
  'diagonal-from': 3,
  'not-diagonal-from': 3,
};
