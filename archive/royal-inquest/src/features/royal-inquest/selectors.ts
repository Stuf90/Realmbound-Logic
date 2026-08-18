import { positionKey, type GridPosition } from '../../shared/geometry';
import { getPredicateCharacterIds } from './predicates';
import type { CharacterId, InquestClue, InquestDefinition, InquestState } from './types';

export type CellState =
  | 'blocked'
  | 'manual-cross'
  | 'auto-cross'
  | 'occupied'
  | 'available';

export function getCellState(
  definition: InquestDefinition,
  state: InquestState,
  characterId: CharacterId,
  position: GridPosition,
): CellState {
  const key = positionKey(position);
  const cell = definition.cells.find((candidate) => positionKey(candidate.position) === key);
  if (!cell || cell.blocked) return 'blocked';

  if (
    Object.values(state.placements).some(
      (placedPosition) => placedPosition && positionKey(placedPosition) === key,
    )
  ) {
    return 'occupied';
  }
  if ((state.manualCrosses[characterId] ?? []).includes(key)) return 'manual-cross';
  if (
    Object.entries(state.placements).some(
      ([placedCharacterId, placedPosition]) =>
        placedCharacterId !== characterId &&
        placedPosition !== undefined &&
        (placedPosition.row === position.row || placedPosition.column === position.column),
    )
  ) {
    return 'auto-cross';
  }
  return 'available';
}

export function getCluesForCharacter(
  definition: InquestDefinition,
  characterId: CharacterId,
): InquestClue[] {
  return definition.clues.filter((clue) =>
    getPredicateCharacterIds(clue.predicate).includes(characterId),
  );
}
