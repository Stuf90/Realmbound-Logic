import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { validateInquestDefinition } from './definitionValidation';
import type { InquestDefinition } from './types';

describe('Blackwood Keep definition', () => {
  it('contains a structurally valid six-character inquest', () => {
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
      expect(cell?.legalCharacterIds ?? [characterId]).toContain(characterId);
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
    malformed.cells[1]!.blocked = true;

    expect(validateInquestDefinition(malformed)).toContain(
      'Solution for envoy must use a legal, unblocked cell.',
    );
  });
});
