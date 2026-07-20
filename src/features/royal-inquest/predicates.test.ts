import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { evaluatePredicate, getPredicateCharacterIds } from './predicates';

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
        { envoy: { row: 2, column: 3 }, aldric: { row: 2, column: 4 } },
        blackwoodKeep,
      ),
    ).toBe(false);
  });

  it('evaluates chamber relationships', () => {
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
  });

  it('evaluates exact-chamber placement', () => {
    expect(
      evaluatePredicate(
        { type: 'exact-chamber', characterId: 'edmund', chamberId: 'archives' },
        { edmund: { row: 3, column: 4 } },
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        { type: 'exact-chamber', characterId: 'edmund', chamberId: 'crypt' },
        { edmund: { row: 3, column: 4 } },
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(
        { type: 'exact-chamber', characterId: 'edmund', chamberId: 'archives' },
        {},
        blackwoodKeep,
      ),
    ).toBe('unknown');
  });

  it('requires not-beside characters to avoid adjacency in one chamber', () => {
    const predicate = {
      type: 'not-beside' as const,
      firstCharacterId: 'aldric',
      secondCharacterId: 'edmund',
    };

    expect(
      evaluatePredicate(
        predicate,
        { aldric: { row: 1, column: 0 }, edmund: { row: 5, column: 2 } },
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        predicate,
        { aldric: { row: 0, column: 0 }, edmund: { row: 0, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, blackwoodKeep)).toBe(
      'unknown',
    );
  });

  it('evaluates direction-from relationships for every cardinal direction', () => {
    const placements = {
      beatrice: { row: 2, column: 4 },
      daria: { row: 4, column: 4 },
      cedric: { row: 3, column: 3 },
      edmund: { row: 3, column: 5 },
    };

    expect(
      evaluatePredicate(
        {
          type: 'direction-from',
          subjectCharacterId: 'beatrice',
          referenceCharacterId: 'daria',
          direction: 'north',
        },
        placements,
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        {
          type: 'direction-from',
          subjectCharacterId: 'daria',
          referenceCharacterId: 'beatrice',
          direction: 'south',
        },
        placements,
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        {
          type: 'direction-from',
          subjectCharacterId: 'edmund',
          referenceCharacterId: 'cedric',
          direction: 'east',
        },
        placements,
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        {
          type: 'direction-from',
          subjectCharacterId: 'cedric',
          referenceCharacterId: 'edmund',
          direction: 'west',
        },
        placements,
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        {
          type: 'direction-from',
          subjectCharacterId: 'beatrice',
          referenceCharacterId: 'daria',
          direction: 'south',
        },
        placements,
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(
        {
          type: 'direction-from',
          subjectCharacterId: 'beatrice',
          referenceCharacterId: 'cedric',
          direction: 'north',
        },
        { beatrice: placements.beatrice },
        blackwoodKeep,
      ),
    ).toBe('unknown');
  });

  it('evaluates on-prop against the cell bearing that propId', () => {
    const predicate = { type: 'on-prop' as const, characterId: 'aldric', propId: 'formal-chair' as const };

    expect(evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, blackwoodKeep)).toBe(true);
    expect(evaluatePredicate(predicate, { aldric: { row: 0, column: 0 } }, blackwoodKeep)).toBe(false);
    expect(evaluatePredicate(predicate, {}, blackwoodKeep)).toBe('unknown');
  });
});

describe('getPredicateCharacterIds', () => {
  it('returns the single character id for unary predicates', () => {
    expect(
      getPredicateCharacterIds({ type: 'exact-row', characterId: 'envoy', row: 0 }),
    ).toEqual(['envoy']);
    expect(
      getPredicateCharacterIds({ type: 'exact-chamber', characterId: 'edmund', chamberId: 'archives' }),
    ).toEqual(['edmund']);
  });

  it('returns both character ids for pairwise and direction predicates', () => {
    expect(
      getPredicateCharacterIds({
        type: 'not-beside',
        firstCharacterId: 'aldric',
        secondCharacterId: 'edmund',
      }),
    ).toEqual(['aldric', 'edmund']);
    expect(
      getPredicateCharacterIds({
        type: 'direction-from',
        subjectCharacterId: 'beatrice',
        referenceCharacterId: 'daria',
        direction: 'north',
      }),
    ).toEqual(['beatrice', 'daria']);
  });
});
