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
  'not-on-prop': 1,
  'not-seated': 1,
  'not-in-corner': 2,
  'not-exact-chamber': 1,
  'beside-wall': 2,
  'near-prop': 2,
  'not-near-prop': 2,
  'prop-in-axis': 2,
  'beside-empty-cell': 2,
  'category-on-prop': 2,
  'prop-in-chamber': 1,
  'axis-offset-from': 2,
  'category-chamber-count': 2,
  'chamber-rank': 2,
  'chamber-order-compare': 3,
  'shares-prop-category-neighbor': 2,
  // Placeholder only: one-of/all-of are as hard as their hardest nested option, so
  // effectivePredicateDifficulty is authoritative for these two types.
  'one-of': 1,
  'all-of': 1,
};

/**
 * Tier of a concrete predicate instance. Identical to the table lookup except for `one-of`/
 * `all-of`, whose difficulty is the maximum of their (possibly nested) options rather than a
 * fixed value. Mirrors murdoku-logic-engine's `effectivePredicateDifficulty`.
 */
export function effectivePredicateDifficulty(predicate: InquestPredicate): number {
  const nested =
    predicate.type === 'one-of' ? predicate.options : predicate.type === 'all-of' ? predicate.predicates : undefined;
  if (nested === undefined) return predicateDifficulty[predicate.type];
  let max = 1;
  for (const option of nested) {
    const rating = effectivePredicateDifficulty(option);
    if (rating > max) max = rating;
  }
  return max;
}
