import { positionKey, type GridPosition } from '../../shared/geometry';
import type {
  CharacterId,
  InquestAction,
  InquestDefinition,
  InquestState,
} from './types';

export function createInitialInquestState(): InquestState {
  return {
    placements: {},
    manualCrosses: {},
    selectedCharacterId: null,
    tool: 'place',
  };
}

export function isLegalDestination(
  definition: InquestDefinition,
  state: InquestState,
  characterId: CharacterId,
  position: GridPosition,
): boolean {
  if (!definition.characters.some(({ id }) => id === characterId)) return false;

  const cell = definition.cells.find(
    (candidate) => positionKey(candidate.position) === positionKey(position),
  );
  if (!cell || cell.blocked) return false;

  return !Object.entries(state.placements).some(
    ([placedCharacterId, placedPosition]) =>
      placedCharacterId !== characterId &&
      placedPosition !== undefined &&
      (positionKey(placedPosition) === positionKey(position) ||
        placedPosition.row === position.row ||
        placedPosition.column === position.column),
  );
}

export function reduceInquest(
  state: InquestState,
  action: InquestAction,
  definition: InquestDefinition,
): InquestState {
  switch (action.type) {
    case 'select-character':
      if (
        action.characterId !== null &&
        !definition.characters.some(({ id }) => id === action.characterId)
      ) {
        return state;
      }
      return state.selectedCharacterId === action.characterId
        ? state
        : { ...state, selectedCharacterId: action.characterId };
    case 'set-tool':
      return state.tool === action.tool ? state : { ...state, tool: action.tool };
    case 'place': {
      if (!isLegalDestination(definition, state, action.characterId, action.position)) return state;
      const current = state.placements[action.characterId];
      if (current && positionKey(current) === positionKey(action.position)) return state;
      return {
        ...state,
        placements: { ...state.placements, [action.characterId]: action.position },
      };
    }
    case 'toggle-cross': {
      if (!definition.characters.some(({ id }) => id === action.characterId)) return state;
      const cell = definition.cells.find(
        (candidate) => positionKey(candidate.position) === positionKey(action.position),
      );
      if (!cell || cell.blocked) return state;

      const key = positionKey(action.position);
      const existing = state.manualCrosses[action.characterId] ?? [];
      const removing = existing.includes(key);
      if (removing) {
        const rowOrColumnOccupied = Object.values(state.placements).some(
          (placedPosition) =>
            placedPosition &&
            (placedPosition.row === action.position.row ||
              placedPosition.column === action.position.column),
        );
        if (rowOrColumnOccupied) return state;
      }
      const next = removing
        ? existing.filter((candidate) => candidate !== key)
        : [...existing, key];
      return {
        ...state,
        manualCrosses: { ...state.manualCrosses, [action.characterId]: next },
      };
    }
    case 'clear-placement': {
      if (!state.placements[action.characterId]) return state;
      const placements = { ...state.placements };
      delete placements[action.characterId];
      return { ...state, placements };
    }
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
