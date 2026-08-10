import { describe, expect, it } from 'vitest';
import { validateInquestDefinition } from '../../src/features/royal-inquest/definitionValidation';
import { generateInquestDefinition } from './generate';

const SEED_COUNT = 24;

describe('generateInquestDefinition', () => {
  it('produces a validator-clean definition for every seed, across difficulties', () => {
    for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
      const difficulty = ((seed - 1) % 3) + 1;
      const { definition } = generateInquestDefinition({ difficulty, seed });
      const issues = validateInquestDefinition(definition);
      expect(issues, `seed ${seed} difficulty ${difficulty}:\n${issues.join('\n')}`).toEqual([]);
    }
  });

  it('varies board dimensions across seeds instead of always shipping a fixed size', () => {
    const dims = new Set<string>();
    for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
      const { definition } = generateInquestDefinition({ difficulty: 2, seed });
      dims.add(`${definition.rows}x${definition.columns}`);
    }
    expect(dims.size).toBeGreaterThan(1);
  });

  it('varies chamber count/shape across seeds instead of a fixed skeleton', () => {
    const chamberCounts = new Set<number>();
    for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
      const { definition } = generateInquestDefinition({ difficulty: 2, seed });
      chamberCounts.add(Object.keys(definition.chamberEnvironments).length);
    }
    expect(chamberCounts.size).toBeGreaterThan(1);
  });

  it('uses more than just exact-chamber/on-prop across a run of seeds', () => {
    const predicateTypes = new Set<string>();
    for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
      const difficulty = ((seed - 1) % 3) + 1;
      const { definition } = generateInquestDefinition({ difficulty, seed });
      for (const clue of definition.clues) predicateTypes.add(clue.predicate.type);
    }
    const extras = Array.from(predicateTypes).filter((type) => type !== 'exact-chamber' && type !== 'on-prop');
    expect(extras.length).toBeGreaterThan(0);
  });

  it('is deterministic for a given seed', () => {
    const first = generateInquestDefinition({ difficulty: 2, seed: 777 });
    const second = generateInquestDefinition({ difficulty: 2, seed: 777 });
    expect(first.definition).toEqual(second.definition);
  });

  it('rejects an out-of-range difficulty', () => {
    expect(() => generateInquestDefinition({ difficulty: 4, seed: 1 })).toThrow();
    expect(() => generateInquestDefinition({ difficulty: 0, seed: 1 })).toThrow();
  });
});
