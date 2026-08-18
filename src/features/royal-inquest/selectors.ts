import { positionKey, type GridPosition } from '../../shared/geometry';
import { evaluatePredicate, getPredicateSuspectIds } from 'murdoku-logic-engine';
import type { Clue, MurdokuDefinition, Placements } from 'murdoku-logic-engine';
import type { RoyalInquestState } from './types';

export type ClueState = 'satisfied' | 'violated' | 'undetermined';

export function getClueState(clue: Clue, placements: Placements, definition: MurdokuDefinition): ClueState {
  const result = evaluatePredicate(clue.predicate, placements, definition);
  if (result === true) return 'satisfied';
  if (result === false) return 'violated';
  return 'undetermined';
}

export function getAllClueStates(definition: MurdokuDefinition, placements: Placements): Record<string, ClueState> {
  const states: Record<string, ClueState> = {};
  for (const clue of definition.clues) {
    states[clue.id] = getClueState(clue, placements, definition);
  }
  return states;
}

export function getCluesForSuspect(definition: MurdokuDefinition, suspectId: string): Clue[] {
  return definition.clues.filter((clue) => getPredicateSuspectIds(clue.predicate).includes(suspectId));
}

export type CellState = 'blocked' | 'manual-cross' | 'auto-cross' | 'occupied' | 'available';

export function getCellState(
  definition: MurdokuDefinition,
  state: RoyalInquestState,
  suspectId: string,
  position: GridPosition,
): CellState {
  const key = positionKey(position);
  const cell = definition.cells.find((candidate) => positionKey(candidate.position) === key);
  if (!cell || cell.blocked) return 'blocked';

  if (Object.values(state.placements).some((placedPosition) => placedPosition && positionKey(placedPosition) === key)) {
    return 'occupied';
  }
  if ((state.manualCrosses[suspectId] ?? []).includes(key)) return 'manual-cross';
  if (
    Object.entries(state.placements).some(
      ([placedSuspectId, placedPosition]) =>
        placedSuspectId !== suspectId &&
        placedPosition !== undefined &&
        (placedPosition.row === position.row || placedPosition.column === position.column),
    )
  ) {
    return 'auto-cross';
  }
  return 'available';
}

export function isRoyalInquestComplete(definition: MurdokuDefinition, placements: Placements): boolean {
  return definition.suspects.every((suspect) => {
    const placed = placements[suspect.id];
    const solved = definition.solution[suspect.id];
    return placed !== undefined && solved !== undefined && placed.row === solved.row && placed.column === solved.column;
  });
}
