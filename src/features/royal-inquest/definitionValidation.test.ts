import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
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
      'Clue "bad-row-clue" may not use exact-row/exact-column; use exact-chamber, direction-from, beside, not-beside, same-chamber, or different-chamber instead.',
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

  it('rejects a clue set that does not narrow to a unique solution', () => {
    const malformed = structuredClone(blackwoodKeep) as InquestDefinition;
    malformed.clues = malformed.clues.filter((clue) => clue.id !== 'aldric-seated');

    const issues = validateInquestDefinition(malformed);
    expect(issues).toContain('The clue set does not narrow the puzzle to a unique solution.');
  });
});
