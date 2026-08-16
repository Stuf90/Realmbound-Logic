import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './levels/archive/blackwoodKeep';
import { validateInquestDefinition } from './definitionValidation';
import type { InquestDefinition } from './types';

describe('Blackwood Keep definition', () => {
  it('contains a structurally valid six-character inquest with a unique, clue-derivable solution', () => {
    expect(validateInquestDefinition(blackwoodKeep)).toEqual([]);
    expect(blackwoodKeep.cells).toHaveLength(36);
    expect(blackwoodKeep.characters).toHaveLength(6);

    const solutionPositions = Object.values(blackwoodKeep.solution);
    expect(new Set(solutionPositions.map(({ row }) => row))).toHaveLength(6);
    expect(new Set(solutionPositions.map(({ column }) => column))).toHaveLength(6);
    expect(blackwoodKeep.characters.filter(({ isVictim }) => isVictim)).toHaveLength(1);

    for (const [characterId, position] of Object.entries(blackwoodKeep.solution)) {
      const cell = blackwoodKeep.cells.find(
        ({ position: candidate }) =>
          candidate.row === position.row && candidate.column === position.column,
      );

      expect(cell, `${characterId} solution cell`).toBeDefined();
      expect(cell?.blocked).toBe(false);
    }

    const victim = blackwoodKeep.characters.find(({ isVictim }) => isVictim);
    const victimPosition = blackwoodKeep.solution[victim!.id];
    const victimChamber = blackwoodKeep.cells.find(
      ({ position }) =>
        position.row === victimPosition.row && position.column === victimPosition.column,
    )!.chamberId;
    const chamberOccupants = Object.entries(blackwoodKeep.solution).filter(([, position]) =>
      blackwoodKeep.cells.some(
        (cell) =>
          cell.chamberId === victimChamber &&
          cell.position.row === position.row &&
          cell.position.column === position.column,
      ),
    );

    expect(chamberOccupants.map(([id]) => id).sort()).toEqual(['aldric', 'envoy']);
    expect(blackwoodKeep.traitorId).toBe('aldric');
  });

  it('rejects a solution that repeats a row', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.solution.aldric = { row: 0, column: 0 };

    expect(validateInquestDefinition(malformed)).toContain('Solution rows must be unique.');
  });

  it('rejects a solution placed on a blocked cell', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    const blockedCell = malformed.cells.find((cell) => cell.blocked)!;
    malformed.solution.envoy = blockedCell.position;

    expect(validateInquestDefinition(malformed)).toContain(
      'Solution for envoy must use a legal, unblocked cell.',
    );
  });

  it('rejects a chamber with fewer than 5 tiles', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    // Shrink the guardroom chamber by donating its lone row-3 cell to archives.
    for (const cell of malformed.cells) {
      if (cell.position.row === 3 && cell.position.column === 0) {
        cell.chamberId = 'archives';
      }
    }

    expect(validateInquestDefinition(malformed)).toContain('Chamber "guardroom" must contain at least 5 tiles.');
  });

  it('rejects a prop placed in a chamber environment it is not permitted in', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    // solar is a royalRoom; a bookshelf belongs in a study/archive room, not a throne room.
    const solarCell = malformed.cells.find((cell) => cell.chamberId === 'solar')!;
    solarCell.propId = 'bookshelf';
    solarCell.blocked = true;

    expect(validateInquestDefinition(malformed)).toContain(
      'Prop "bookshelf" is not permitted in a "royalRoom" chamber.',
    );
  });

  it('rejects fewer than two characters', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.characters = malformed.characters.slice(0, 1);

    expect(validateInquestDefinition(malformed)).toContain(
      'Definition must contain at least two characters.',
    );
  });

  it('rejects more characters than the board has rows or columns', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.characters = [
      ...malformed.characters,
      { id: 'extra', name: 'Extra', portraitLabel: 'Extra', avatarId: 'merchant' },
      { id: 'extra-2', name: 'Extra Two', portraitLabel: 'Extra Two', avatarId: 'scholar' },
    ];

    expect(validateInquestDefinition(malformed)).toContain(
      'Definition must not contain more characters than rows or columns, since every character needs a unique row and column.',
    );
  });

  it('rejects a seat prop placed on a blocked cell', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    const seatCell = malformed.cells.find((cell) => cell.propId === 'formal-chair')!;
    seatCell.blocked = true;

    expect(validateInquestDefinition(malformed)).toContain(
      'Seat prop "formal-chair" must be on an unblocked cell so a character can use it.',
    );
  });

  it('rejects a decorative prop placed on an unblocked cell', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    const decorativeCell = malformed.cells.find((cell) => cell.propId === 'bookshelf')!;
    decorativeCell.blocked = false;

    expect(validateInquestDefinition(malformed)).toContain(
      'Decorative prop "bookshelf" must be placed on a blocked cell.',
    );
  });

  it('allows a seat prop on an unblocked, legal cell (a character can be placed there)', () => {
    const seatCell = blackwoodKeep.cells.find(
      (cell) => cell.position.row === 1 && cell.position.column === 0,
    )!;

    expect(seatCell.propId).toBe('formal-chair');
    expect(seatCell.blocked).toBe(false);
    expect(validateInquestDefinition(blackwoodKeep)).toEqual([]);
  });

  it('rejects a clue that uses exact-row or exact-column', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.clues.push({
      id: 'bad-row-clue',
      text: 'Daria stood in the sixth row.',
      predicate: { type: 'exact-row', characterId: 'daria', row: 5 },
    });

    expect(validateInquestDefinition(malformed)).toContain(
      'Clue "bad-row-clue" may not use exact-row/exact-column; use exact-chamber, direction-from, same-chamber, or different-chamber instead.',
    );
  });

  it('rejects a clue that uses beside or not-beside between two characters', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.clues.push({
      id: 'bad-beside-clue',
      text: 'Aldric was never seen beside Edmund.',
      predicate: { type: 'not-beside', firstCharacterId: 'aldric', secondCharacterId: 'edmund' },
    });

    expect(validateInquestDefinition(malformed)).toContain(
      'Clue "bad-beside-clue" may not use beside/not-beside between two characters; placement rules guarantee two characters never share a row or column, so a character-pair beside/not-beside clue is always vacuously true and conveys no information. Use not-beside-wall, category-not-beside-prop, by-window, shares-prop-neighbor, or prop-neighbor-count for wall/asset adjacency instead.',
    );
  });

  it('rejects a clue that names the victim directly', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.clues.push({
      id: 'bad-victim-clue',
      text: 'The envoy was seen in the Solar.',
      predicate: { type: 'exact-chamber', characterId: 'envoy', chamberId: 'solar' },
    });

    expect(validateInquestDefinition(malformed)).toContain(
      'Clue "bad-victim-clue" names the victim directly; the victim\'s position must be derived only from other witnesses.',
    );
  });

  it('rejects a difficulty outside the 1-3 range', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.difficulty = 0;

    expect(validateInquestDefinition(malformed)).toContain(
      'Difficulty must be an integer between 1 and 3.',
    );
  });

  it('rejects a clue whose predicate exceeds the case\'s declared difficulty', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.difficulty = 1;
    malformed.clues.push({
      id: 'aldric-in-corner',
      text: 'Aldric was seen in a corner.',
      predicate: { type: 'in-corner', characterId: 'aldric' },
    });

    expect(validateInquestDefinition(malformed)).toContain(
      'Clue "aldric-in-corner" uses a difficulty-2 predicate ("in-corner"), which exceeds this case\'s declared difficulty of 1.',
    );
  });

  it('accepts a diagonal-from clue as structurally valid', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.difficulty = 3;
    malformed.clues.push({
      id: 'aldric-diagonal-beatrice',
      text: 'Aldric was glimpsed diagonally across from Beatrice.',
      predicate: { type: 'diagonal-from', firstCharacterId: 'aldric', secondCharacterId: 'beatrice' },
    });

    const issues = validateInquestDefinition(malformed);
    expect(issues).not.toContain('Every clue must be structurally valid.');
    expect(issues.some((issue) => issue.includes('diagonal-from'))).toBe(false);
  });

  it('rejects a clue set that does not narrow to a unique solution', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.clues = malformed.clues.filter((clue) => clue.id !== 'aldric-seated');

    const issues = validateInquestDefinition(malformed);
    expect(issues).toContain('The clue set does not narrow the puzzle to a unique solution.');
  });

  it('accepts a clue using a newly added predicate type (in-corner)', () => {
    const augmented = structuredClone(blackwoodKeep) as InquestDefinition;
    // Daria's authored solution cell, (5, 5), is genuinely the board's bottom-right corner.
    augmented.clues.push({
      id: 'daria-corner',
      text: 'Daria was found in the far corner of the keep.',
      predicate: { type: 'in-corner', characterId: 'daria' },
    });

    expect(validateInquestDefinition(augmented)).toEqual([]);
  });

  it('accepts a clue using a newly added predicate type (area-occupant-count)', () => {
    const augmented = structuredClone(blackwoodKeep) as InquestDefinition;
    // No cell sets areaId, so this behaves exactly like the already-true chamber-occupant-count(aldric, 1).
    augmented.clues.push({
      id: 'aldric-area-alone-with-envoy',
      text: 'Aldric shared his corner of the keep with exactly one other soul.',
      predicate: { type: 'area-occupant-count', characterId: 'aldric', count: 1 },
    });

    expect(validateInquestDefinition(augmented)).toEqual([]);
  });

  it('accepts a clue using a newly added predicate type (by-window), with the window on the board edge', () => {
    const augmented = structuredClone(blackwoodKeep) as InquestDefinition;
    const cornerCell = augmented.cells.find(
      (cell) => cell.position.row === 0 && cell.position.column === 0,
    )!;
    cornerCell.propId = 'window';
    cornerCell.blocked = true;
    augmented.clues.push({
      id: 'aldric-by-window',
      text: 'Aldric stood in front of a window.',
      predicate: { type: 'by-window', characterId: 'aldric', propId: 'window' },
    });

    // Window at (0,0) is on the board's outer edge; aldric's solution cell (1,0) is adjacent to it.
    expect(validateInquestDefinition(augmented)).toEqual([]);
  });

  it("rejects a window prop not placed on the board's outer edge", () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    const interiorCell = malformed.cells.find(
      (cell) => cell.position.row === 2 && cell.position.column === 2,
    )!;
    interiorCell.propId = 'window';
    interiorCell.blocked = true;

    expect(validateInquestDefinition(malformed)).toContain(
      'Prop "window" must sit on the board\'s outer edge.',
    );
  });

  it('accepts clues using the two newly added rating-3 predicate types (offset-from, prop-neighbor-count)', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.difficulty = 3;
    malformed.clues.push(
      {
        id: 'edmund-offset-from-beatrice',
        text: 'Edmund was one row and three columns from Beatrice.',
        predicate: {
          type: 'offset-from',
          subjectCharacterId: 'edmund',
          referenceCharacterId: 'beatrice',
          rowOffset: 1,
          columnOffset: 3,
        },
      },
      {
        id: 'nobody-beside-the-chair',
        text: 'Nobody else stood beside the chair.',
        predicate: { type: 'prop-neighbor-count', propId: 'formal-chair', count: 0 },
      },
    );

    const issues = validateInquestDefinition(malformed);
    expect(issues).not.toContain('Every clue must be structurally valid.');
    expect(issues.some((issue) => issue.includes('offset-from'))).toBe(false);
    expect(issues.some((issue) => issue.includes('prop-neighbor-count'))).toBe(false);
  });

  it('accepts clues using the negation and wall/prop-adjacency predicate types added in the catch-up pass', () => {
    const augmented = structuredClone(blackwoodKeep) as InquestDefinition;
    augmented.difficulty = 3;
    augmented.clues.push(
      { id: 'aldric-not-on-bookshelf', text: '', predicate: { type: 'not-on-prop', characterId: 'aldric', propId: 'bookshelf' } },
      { id: 'beatrice-not-seated', text: '', predicate: { type: 'not-seated', characterId: 'beatrice' } },
      { id: 'aldric-not-in-corner', text: '', predicate: { type: 'not-in-corner', characterId: 'aldric' } },
      { id: 'aldric-not-guardroom', text: '', predicate: { type: 'not-exact-chamber', characterId: 'aldric', chamberId: 'guardroom' } },
      { id: 'aldric-beside-wall', text: '', predicate: { type: 'beside-wall', characterId: 'aldric' } },
      { id: 'edmund-near-table', text: '', predicate: { type: 'near-prop', characterId: 'edmund', propId: 'dining-table' } },
      { id: 'aldric-not-near-table', text: '', predicate: { type: 'not-near-prop', characterId: 'aldric', propId: 'dining-table' } },
      { id: 'beatrice-prop-in-row', text: '', predicate: { type: 'prop-in-axis', characterId: 'beatrice', propId: 'barrel-cluster', axis: 'row' } },
      { id: 'aldric-beside-empty', text: '', predicate: { type: 'beside-empty-cell', characterId: 'aldric' } },
    );

    const issues = validateInquestDefinition(augmented);
    expect(issues).toEqual([]);
  });

  it('accepts clues using the count/rank/board-fact predicate types added in the catch-up pass', () => {
    const augmented = structuredClone(blackwoodKeep) as InquestDefinition;
    augmented.difficulty = 3;
    augmented.characters = augmented.characters.map((character) =>
      character.id === 'aldric' ? { ...character, category: 'noble' } : character,
    );
    augmented.clues.push(
      { id: 'noble-on-chair', text: '', predicate: { type: 'category-on-prop', category: 'noble', propId: 'formal-chair' } },
      { id: 'table-in-archives', text: '', predicate: { type: 'prop-in-chamber', chamberId: 'archives', propId: 'dining-table' } },
      {
        id: 'edmund-axis-offset-beatrice',
        text: '',
        predicate: { type: 'axis-offset-from', subjectCharacterId: 'edmund', referenceCharacterId: 'beatrice', axis: 'row', offset: 1 },
      },
      { id: 'one-noble-in-solar', text: '', predicate: { type: 'category-chamber-count', category: 'noble', chamberId: 'solar', count: 1 } },
      { id: 'daria-alone-topmost-crypt', text: '', predicate: { type: 'chamber-rank', characterId: 'daria', chamberId: 'crypt', rank: 'topmost' } },
      {
        id: 'aldric-solar-or-guardroom',
        text: '',
        predicate: {
          type: 'one-of',
          options: [
            { type: 'exact-chamber', characterId: 'aldric', chamberId: 'solar' },
            { type: 'exact-chamber', characterId: 'aldric', chamberId: 'guardroom' },
          ],
        },
      },
      {
        id: 'aldric-solar-and-seated',
        text: '',
        predicate: {
          type: 'all-of',
          predicates: [
            { type: 'exact-chamber', characterId: 'aldric', chamberId: 'solar' },
            { type: 'on-prop', characterId: 'aldric', propId: 'formal-chair' },
          ],
        },
      },
    );

    const issues = validateInquestDefinition(augmented);
    expect(issues).toEqual([]);
  });

  it('accepts a chamber-order-compare clue backed by a valid chamberOrder map', () => {
    const augmented = structuredClone(blackwoodKeep) as InquestDefinition;
    augmented.difficulty = 3;
    augmented.chamberOrder = { solar: 1, guardroom: 2, archives: 3, chapel: 4, crypt: 5 };
    augmented.clues.push({
      id: 'aldric-before-beatrice',
      text: '',
      predicate: {
        type: 'chamber-order-compare',
        subjectCharacterId: 'aldric',
        referenceCharacterId: 'beatrice',
        comparator: 'less',
      },
    });

    expect(validateInquestDefinition(augmented)).toEqual([]);
  });

  it('rejects a chamberOrder with a non-integer value or an unknown chamber id', () => {
    const nonInteger = structuredClone(blackwoodKeep) as InquestDefinition;
    nonInteger.chamberOrder = { solar: 1.5 };
    expect(validateInquestDefinition(nonInteger)).toContain('chamberOrder["solar"] must be an integer.');

    const unknownChamber = structuredClone(blackwoodKeep) as InquestDefinition;
    unknownChamber.chamberOrder = { nonexistent: 1 };
    expect(validateInquestDefinition(unknownChamber)).toContain(
      'chamberOrder references unknown chamber "nonexistent".',
    );
  });

  it('rejects a chamber-order-compare clue against a chamber with no chamberOrder entry', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.clues.push({
      id: 'aldric-before-beatrice',
      text: '',
      predicate: {
        type: 'chamber-order-compare',
        subjectCharacterId: 'aldric',
        referenceCharacterId: 'beatrice',
        comparator: 'less',
      },
    });

    expect(validateInquestDefinition(malformed)).toContain(
      'Clue "aldric-before-beatrice" uses chamber-order-compare against character "aldric", whose chamber has no chamberOrder entry.',
    );
  });

  it('accepts a shares-prop-category-neighbor clue naming two different instances of the same prop category', () => {
    const augmented = structuredClone(blackwoodKeep) as InquestDefinition;
    augmented.difficulty = 3;
    // Two separate window instances, both on the board's outer edge, each adjacent to a different
    // already-placed character — same category ("window"), not the same prop cell.
    for (const cell of augmented.cells) {
      if (cell.position.row === 0 && cell.position.column === 0) {
        cell.propId = 'window';
        cell.blocked = true;
      }
      if (cell.position.row === 4 && cell.position.column === 5) {
        cell.propId = 'window';
        cell.blocked = true;
      }
    }
    augmented.clues.push({
      id: 'aldric-and-daria-each-by-a-window',
      text: '',
      predicate: {
        type: 'shares-prop-category-neighbor',
        firstCharacterId: 'aldric',
        secondCharacterId: 'daria',
      },
    });

    expect(validateInquestDefinition(augmented)).toEqual([]);
  });
});
