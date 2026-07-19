import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { evaluatePredicate } from './predicates';

describe('evaluatePredicate', () => {
  it('returns unknown until every referenced character is placed', () => {
    expect(
      evaluatePredicate(
        { type: 'same-chamber', firstCharacterId: 'envoy', secondCharacterId: 'aldric' },
        { envoy: { row: 0, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe('unknown');
  });

  it('evaluates exact rows and columns', () => {
    const placements = { envoy: { row: 0, column: 1 } };

    expect(
      evaluatePredicate({ type: 'exact-row', characterId: 'envoy', row: 0 }, placements, blackwoodKeep),
    ).toBe(true);
    expect(
      evaluatePredicate(
        { type: 'exact-column', characterId: 'envoy', column: 2 },
        placements,
        blackwoodKeep,
      ),
    ).toBe(false);
  });

  it('requires beside characters to be orthogonally adjacent in one chamber', () => {
    const predicate = {
      type: 'beside' as const,
      firstCharacterId: 'envoy',
      secondCharacterId: 'aldric',
    };

    expect(
      evaluatePredicate(
        predicate,
        { envoy: { row: 0, column: 0 }, aldric: { row: 0, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        predicate,
        { envoy: { row: 0, column: 1 }, aldric: { row: 0, column: 2 } },
        blackwoodKeep,
      ),
    ).toBe(false);
  });

  it('evaluates chamber and north-of relationships', () => {
    const placements = {
      envoy: { row: 0, column: 1 },
      aldric: { row: 1, column: 0 },
      beatrice: { row: 2, column: 4 },
      daria: { row: 4, column: 4 },
    };

    expect(
      evaluatePredicate(
        { type: 'same-chamber', firstCharacterId: 'envoy', secondCharacterId: 'aldric' },
        placements,
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        { type: 'different-chamber', firstCharacterId: 'envoy', secondCharacterId: 'beatrice' },
        placements,
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        { type: 'north-of', subjectCharacterId: 'beatrice', referenceCharacterId: 'daria' },
        placements,
        blackwoodKeep,
      ),
    ).toBe(true);
  });
});
