import { describe, expect, it } from 'vitest';
import { validateDefinition } from 'murdoku-logic-engine';
import { royalInquestLevels } from './levels';

describe('Royal Inquest level definitions', () => {
  it('has exactly the 5 levels in ascending board-size order', () => {
    expect(royalInquestLevels.map((level) => level.id)).toEqual(['easy-02', 'easy-13', 'easy-01', 'easy-14', 'easy-04']);
  });

  for (const level of royalInquestLevels) {
    it(`${level.id}: definition passes validateDefinition`, () => {
      const result = validateDefinition(level.definition);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });
  }
});
