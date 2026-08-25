import { describe, expect, it } from 'vitest';
import { validateDefinition } from 'murdoku-logic-engine';
import { royalInquestLevels } from './levels';

describe('Royal Inquest level definitions', () => {
  it('has exactly the 5 levels in ascending board-size order', () => {
    expect(royalInquestLevels.map((level) => level.id)).toEqual(['easy-02', 'easy-13', 'easy-01', 'easy-14', 'easy-04']);
  });

  // easy-04 and easy-13's real clue sets (after dropping the invented "(supplemental) ..." clues
  // — see murdoku-logic-engine's example-cases/README.md "Real clues only — no invented clues")
  // don't uniquely determine a solution on their own, matching murdoku-logic-engine's own
  // easy-04/easy-13 today. Left invalid rather than patched with a made-up clue, so these two are
  // asserted as known-failing (it.fails) instead of passing validateDefinition outright.
  const KNOWN_NON_UNIQUE = new Set(['easy-04', 'easy-13']);

  for (const level of royalInquestLevels) {
    const test = KNOWN_NON_UNIQUE.has(level.id) ? it.fails : it;
    test(`${level.id}: definition passes validateDefinition`, () => {
      const result = validateDefinition(level.definition);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });
  }
});
