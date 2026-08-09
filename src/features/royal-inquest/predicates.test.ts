import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './levels/archive/blackwoodKeep';
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
    expect(
      evaluatePredicate({ type: 'exact-row', characterId: 'envoy', row: 0 }, {}, blackwoodKeep),
    ).toBe('unknown');
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
    expect(
      evaluatePredicate(predicate, { envoy: { row: 0, column: 0 } }, blackwoodKeep),
    ).toBe('unknown');
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
    expect(
      evaluatePredicate(
        { type: 'same-chamber', firstCharacterId: 'envoy', secondCharacterId: 'beatrice' },
        placements,
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(
        { type: 'different-chamber', firstCharacterId: 'envoy', secondCharacterId: 'aldric' },
        placements,
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(
        { type: 'different-chamber', firstCharacterId: 'envoy', secondCharacterId: 'daria' },
        { envoy: placements.envoy },
        blackwoodKeep,
      ),
    ).toBe('unknown');
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

  it('evaluates diagonal-from as a pure coordinate check, ignoring chamber', () => {
    const predicate = {
      type: 'diagonal-from' as const,
      firstCharacterId: 'aldric',
      secondCharacterId: 'beatrice',
    };

    // aldric (1,0, solar) and beatrice (2,1, guardroom): one row and one column apart, across
    // a chamber boundary — true here despite the different chambers, unlike `beside`.
    expect(
      evaluatePredicate(
        predicate,
        { aldric: { row: 1, column: 0 }, beatrice: { row: 2, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(true);
    // Orthogonally adjacent (same row, one column apart) is not diagonal.
    expect(
      evaluatePredicate(
        predicate,
        { aldric: { row: 1, column: 0 }, beatrice: { row: 1, column: 2 } },
        blackwoodKeep,
      ),
    ).toBe(false);
    // More than one row/column apart is not diagonal.
    expect(
      evaluatePredicate(
        predicate,
        { aldric: { row: 1, column: 0 }, beatrice: { row: 3, column: 2 } },
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, blackwoodKeep),
    ).toBe('unknown');
  });

  it('evaluates not-diagonal-from as the exact negation of diagonal-from', () => {
    const predicate = {
      type: 'not-diagonal-from' as const,
      firstCharacterId: 'aldric',
      secondCharacterId: 'beatrice',
    };

    expect(
      evaluatePredicate(
        predicate,
        { aldric: { row: 1, column: 0 }, beatrice: { row: 2, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(
        predicate,
        { aldric: { row: 1, column: 0 }, beatrice: { row: 1, column: 2 } },
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, blackwoodKeep),
    ).toBe('unknown');
  });

  it('evaluates on-prop against the cell bearing that propId', () => {
    const predicate = { type: 'on-prop' as const, characterId: 'aldric', propId: 'formal-chair' as const };

    expect(evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, blackwoodKeep)).toBe(true);
    expect(evaluatePredicate(predicate, { aldric: { row: 0, column: 0 } }, blackwoodKeep)).toBe(false);
    expect(evaluatePredicate(predicate, {}, blackwoodKeep)).toBe('unknown');
  });

  it('evaluates chamber-occupant-count once every other character is placed', () => {
    const predicate = { type: 'chamber-occupant-count' as const, characterId: 'aldric', count: 1 };

    // Full authored solution: aldric (solar) shares his chamber with only the envoy (also solar).
    expect(evaluatePredicate(predicate, blackwoodKeep.solution, blackwoodKeep)).toBe(true);
    expect(
      evaluatePredicate({ ...predicate, count: 0 }, blackwoodKeep.solution, blackwoodKeep),
    ).toBe(false);
    expect(
      evaluatePredicate(predicate, { aldric: blackwoodKeep.solution.aldric! }, blackwoodKeep),
    ).toBe('unknown');
    // Already 2 others in chamber, target of 1 can never be met, decisive even with others unplaced.
    expect(
      evaluatePredicate(
        { ...predicate, count: 0 },
        { aldric: blackwoodKeep.solution.aldric!, envoy: blackwoodKeep.solution.envoy! },
        blackwoodKeep,
      ),
    ).toBe(false);
  });

  it('evaluates in-corner against the board\'s four corner cells', () => {
    const predicate = { type: 'in-corner' as const, characterId: 'aldric' };

    expect(evaluatePredicate(predicate, { aldric: { row: 0, column: 0 } }, blackwoodKeep)).toBe(true);
    expect(evaluatePredicate(predicate, { aldric: { row: 5, column: 5 } }, blackwoodKeep)).toBe(true);
    expect(evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, blackwoodKeep)).toBe(false);
    expect(evaluatePredicate(predicate, {}, blackwoodKeep)).toBe('unknown');
  });

  it('evaluates seated-character-count across the whole cast, naming no one', () => {
    const predicate = { type: 'seated-character-count' as const, count: 1 };

    // Full authored solution: only the formal-chair cell (aldric's) is a seat-kind prop.
    expect(evaluatePredicate(predicate, blackwoodKeep.solution, blackwoodKeep)).toBe(true);
    expect(
      evaluatePredicate({ ...predicate, count: 0 }, blackwoodKeep.solution, blackwoodKeep),
    ).toBe(false);
    expect(
      evaluatePredicate(
        { ...predicate, count: 0 },
        { aldric: blackwoodKeep.solution.aldric! },
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(
        predicate,
        { beatrice: blackwoodKeep.solution.beatrice! },
        blackwoodKeep,
      ),
    ).toBe('unknown');
  });

  it('evaluates not-beside-wall against chamber/board boundaries', () => {
    const predicate = { type: 'not-beside-wall' as const, characterId: 'aldric' };

    // Solar is only 2 rows tall, so every solar cell touches either the board edge or a
    // different chamber below it.
    expect(evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, blackwoodKeep)).toBe(false);
    expect(evaluatePredicate(predicate, {}, blackwoodKeep)).toBe('unknown');

    const interiorDefinition = {
      ...blackwoodKeep,
      rows: 3,
      columns: 3,
      cells: Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 3 }, (_, column) => ({
          position: { row, column },
          chamberId: 'hall',
          blocked: false,
        })),
      ).flat(),
    };
    expect(
      evaluatePredicate(predicate, { aldric: { row: 1, column: 1 } }, interiorDefinition),
    ).toBe(true);
  });

  it('evaluates category-not-beside-prop, naming no one', () => {
    const definition = {
      ...blackwoodKeep,
      characters: blackwoodKeep.characters.map((character) =>
        character.id === 'beatrice' ? { ...character, category: 'noble' } : character,
      ),
    };
    const predicate = {
      type: 'category-not-beside-prop' as const,
      category: 'noble',
      propId: 'formal-chair' as const,
    };

    // formal-chair sits at (1, 0); (1, 1) is orthogonally adjacent to it.
    expect(evaluatePredicate(predicate, { beatrice: { row: 1, column: 1 } }, definition)).toBe(false);
    expect(evaluatePredicate(predicate, { beatrice: { row: 4, column: 2 } }, definition)).toBe(true);
    expect(evaluatePredicate(predicate, {}, definition)).toBe('unknown');
  });

  it('evaluates shares-prop-neighbor as an existential, unnamed pairing', () => {
    const predicate = {
      type: 'shares-prop-neighbor' as const,
      characterId: 'beatrice',
      propId: 'formal-chair' as const,
    };

    // formal-chair sits at (1, 0). Beatrice at (1, 1) is adjacent; aldric at (0, 0) is also
    // adjacent, so someone else shares the same prop's neighborhood.
    expect(
      evaluatePredicate(
        predicate,
        { beatrice: { row: 1, column: 1 }, aldric: { row: 0, column: 0 } },
        blackwoodKeep,
      ),
    ).toBe(true);
    // Beatrice isn't even near the chair.
    expect(evaluatePredicate(predicate, { beatrice: { row: 4, column: 2 } }, blackwoodKeep)).toBe(false);
    // Beatrice is near it, but not yet known whether anyone else is.
    expect(evaluatePredicate(predicate, { beatrice: { row: 1, column: 1 } }, blackwoodKeep)).toBe(
      'unknown',
    );
  });

  it('evaluates offset-from as an exact row+column vector distance', () => {
    const predicate = {
      type: 'offset-from' as const,
      subjectCharacterId: 'edmund',
      referenceCharacterId: 'beatrice',
      rowOffset: 1,
      columnOffset: 3,
    };

    // edmund (3,4), beatrice (2,1): exactly one row and three columns apart.
    expect(
      evaluatePredicate(
        predicate,
        { edmund: { row: 3, column: 4 }, beatrice: { row: 2, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(true);
    expect(
      evaluatePredicate(
        { ...predicate, columnOffset: 2 },
        { edmund: { row: 3, column: 4 }, beatrice: { row: 2, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(false);
    expect(
      evaluatePredicate(predicate, { edmund: { row: 3, column: 4 } }, blackwoodKeep),
    ).toBe('unknown');
  });

  it('evaluates prop-neighbor-count across the whole cast, naming no one', () => {
    const predicate = { type: 'prop-neighbor-count' as const, propId: 'formal-chair' as const, count: 0 };

    // formal-chair sits at (1,0); none of the authored solution's other placements are
    // orthogonally adjacent to it (aldric sits ON it, which doesn't count as adjacent).
    expect(evaluatePredicate(predicate, blackwoodKeep.solution, blackwoodKeep)).toBe(true);
    expect(
      evaluatePredicate({ ...predicate, count: 1 }, blackwoodKeep.solution, blackwoodKeep),
    ).toBe(false);
    expect(
      evaluatePredicate(
        { ...predicate, count: 1 },
        { aldric: blackwoodKeep.solution.aldric! },
        blackwoodKeep,
      ),
    ).toBe('unknown');
    // beatrice at (0,0) is adjacent to the chair; already exceeds a target of 0, decisive early.
    expect(
      evaluatePredicate(predicate, { beatrice: { row: 0, column: 0 } }, blackwoodKeep),
    ).toBe(false);
  });

  it('evaluates area-occupant-count as chamber-occupant-count when no cell sets areaId', () => {
    const predicate = { type: 'area-occupant-count' as const, characterId: 'aldric', count: 1 };

    expect(evaluatePredicate(predicate, blackwoodKeep.solution, blackwoodKeep)).toBe(true);
    expect(
      evaluatePredicate({ ...predicate, count: 0 }, blackwoodKeep.solution, blackwoodKeep),
    ).toBe(false);
    expect(
      evaluatePredicate(predicate, { aldric: blackwoodKeep.solution.aldric! }, blackwoodKeep),
    ).toBe('unknown');
  });

  it('scopes area-occupant-count to a tagged sub-area smaller than the whole chamber', () => {
    const definition = {
      ...blackwoodKeep,
      cells: blackwoodKeep.cells.map((cell) =>
        cell.position.row === 0 && cell.position.column === 3 ? { ...cell, areaId: 'stand' } : cell,
      ),
    };
    const predicate = { type: 'area-occupant-count' as const, characterId: 'envoy', count: 0 };

    // envoy (0,3) is the only solar cell tagged "stand"; aldric also sits in the solar chamber
    // (1,0, untagged) but that no longer counts once scoped to the area instead of the chamber.
    expect(evaluatePredicate(predicate, blackwoodKeep.solution, definition)).toBe(true);
    expect(
      evaluatePredicate({ ...predicate, count: 1 }, blackwoodKeep.solution, definition),
    ).toBe(false);
    expect(
      evaluatePredicate(predicate, { envoy: blackwoodKeep.solution.envoy! }, definition),
    ).toBe('unknown');
  });

  it('evaluates by-window against orthogonal adjacency to the propId cell', () => {
    const definition = {
      ...blackwoodKeep,
      cells: blackwoodKeep.cells.map((cell) =>
        cell.position.row === 0 && cell.position.column === 0
          ? { ...cell, propId: 'window' as const }
          : cell,
      ),
    };
    const predicate = { type: 'by-window' as const, characterId: 'aldric', propId: 'window' as const };

    // window sits at (0,0); aldric at (1,0) is orthogonally adjacent.
    expect(evaluatePredicate(predicate, { aldric: { row: 1, column: 0 } }, definition)).toBe(true);
    expect(evaluatePredicate(predicate, { aldric: { row: 5, column: 5 } }, definition)).toBe(false);
    expect(evaluatePredicate(predicate, {}, definition)).toBe('unknown');
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
    expect(
      getPredicateCharacterIds({
        type: 'diagonal-from',
        firstCharacterId: 'aldric',
        secondCharacterId: 'beatrice',
      }),
    ).toEqual(['aldric', 'beatrice']);
    expect(
      getPredicateCharacterIds({
        type: 'not-diagonal-from',
        firstCharacterId: 'aldric',
        secondCharacterId: 'beatrice',
      }),
    ).toEqual(['aldric', 'beatrice']);
  });

  it('returns the single character id for chamber-occupant-count, in-corner, not-beside-wall, and shares-prop-neighbor', () => {
    expect(
      getPredicateCharacterIds({ type: 'chamber-occupant-count', characterId: 'aldric', count: 1 }),
    ).toEqual(['aldric']);
    expect(getPredicateCharacterIds({ type: 'in-corner', characterId: 'aldric' })).toEqual(['aldric']);
    expect(getPredicateCharacterIds({ type: 'not-beside-wall', characterId: 'aldric' })).toEqual([
      'aldric',
    ]);
    expect(
      getPredicateCharacterIds({
        type: 'shares-prop-neighbor',
        characterId: 'aldric',
        propId: 'formal-chair',
      }),
    ).toEqual(['aldric']);
  });

  it('names no character for the global/category quantifiers', () => {
    expect(getPredicateCharacterIds({ type: 'seated-character-count', count: 1 })).toEqual([]);
    expect(
      getPredicateCharacterIds({
        type: 'category-not-beside-prop',
        category: 'noble',
        propId: 'formal-chair',
      }),
    ).toEqual([]);
    expect(
      getPredicateCharacterIds({ type: 'prop-neighbor-count', propId: 'formal-chair', count: 1 }),
    ).toEqual([]);
  });

  it('returns both character ids for offset-from', () => {
    expect(
      getPredicateCharacterIds({
        type: 'offset-from',
        subjectCharacterId: 'edmund',
        referenceCharacterId: 'beatrice',
        rowOffset: 1,
        columnOffset: 3,
      }),
    ).toEqual(['edmund', 'beatrice']);
  });

  it('returns the single character id for area-occupant-count and by-window', () => {
    expect(
      getPredicateCharacterIds({ type: 'area-occupant-count', characterId: 'aldric', count: 1 }),
    ).toEqual(['aldric']);
    expect(
      getPredicateCharacterIds({ type: 'by-window', characterId: 'aldric', propId: 'window' }),
    ).toEqual(['aldric']);
  });
});
