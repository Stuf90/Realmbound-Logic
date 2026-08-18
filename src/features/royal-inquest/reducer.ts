import { positionKey, type GridPosition } from '../../shared/geometry';
import type { MurdokuDefinition } from 'murdoku-logic-engine';
import type { RoyalInquestAction, RoyalInquestState } from './types';

export function createInitialState(definition: MurdokuDefinition): RoyalInquestState {
  return {
    placements: {},
    drafts: {},
    manualCrosses: {},
    selectedSuspectId: definition.suspects[0]?.id ?? null,
    tool: 'place',
  };
}

function findCell(definition: MurdokuDefinition, position: GridPosition) {
  return definition.cells.find((candidate) => positionKey(candidate.position) === positionKey(position));
}

function isDraftableCell(definition: MurdokuDefinition, suspectId: string, position: GridPosition): boolean {
  if (!definition.suspects.some(({ id }) => id === suspectId)) return false;
  const cell = findCell(definition, position);
  return cell !== undefined && !cell.blocked;
}

export function isLegalDestination(
  definition: MurdokuDefinition,
  state: RoyalInquestState,
  suspectId: string,
  position: GridPosition,
): boolean {
  if (!definition.suspects.some(({ id }) => id === suspectId)) return false;

  const cell = findCell(definition, position);
  if (!cell || cell.blocked) return false;

  return !Object.entries(state.placements).some(
    ([placedSuspectId, placedPosition]) =>
      placedSuspectId !== suspectId &&
      placedPosition !== undefined &&
      (positionKey(placedPosition) === positionKey(position) ||
        placedPosition.row === position.row ||
        placedPosition.column === position.column),
  );
}

export function reduceRoyalInquest(
  state: RoyalInquestState,
  action: RoyalInquestAction,
  definition: MurdokuDefinition,
): RoyalInquestState {
  switch (action.type) {
    case 'select-suspect':
      if (action.suspectId !== null && !definition.suspects.some(({ id }) => id === action.suspectId)) {
        return state;
      }
      return state.selectedSuspectId === action.suspectId ? state : { ...state, selectedSuspectId: action.suspectId };
    case 'set-tool':
      return state.tool === action.tool ? state : { ...state, tool: action.tool };
    case 'place': {
      if (!isLegalDestination(definition, state, action.suspectId, action.position)) return state;
      const current = state.placements[action.suspectId];
      if (current && positionKey(current) === positionKey(action.position)) return state;
      const key = positionKey(action.position);
      const existingDrafts = state.drafts[action.suspectId] ?? [];
      const drafts = existingDrafts.includes(key)
        ? { ...state.drafts, [action.suspectId]: existingDrafts.filter((candidate) => candidate !== key) }
        : state.drafts;
      return {
        ...state,
        placements: { ...state.placements, [action.suspectId]: action.position },
        drafts,
      };
    }
    case 'toggle-draft': {
      if (!isDraftableCell(definition, action.suspectId, action.position)) return state;
      const key = positionKey(action.position);
      const existing = state.drafts[action.suspectId] ?? [];
      const next = existing.includes(key) ? existing.filter((candidate) => candidate !== key) : [...existing, key];
      return { ...state, drafts: { ...state.drafts, [action.suspectId]: next } };
    }
    case 'toggle-cross': {
      if (!definition.suspects.some(({ id }) => id === action.suspectId)) return state;
      const cell = findCell(definition, action.position);
      if (!cell || cell.blocked) return state;

      const key = positionKey(action.position);
      const existing = state.manualCrosses[action.suspectId] ?? [];
      const removing = existing.includes(key);
      if (removing) {
        const rowOrColumnOccupied = Object.values(state.placements).some(
          (placedPosition) =>
            placedPosition && (placedPosition.row === action.position.row || placedPosition.column === action.position.column),
        );
        if (rowOrColumnOccupied) return state;
      }
      const next = removing ? existing.filter((candidate) => candidate !== key) : [...existing, key];
      return { ...state, manualCrosses: { ...state.manualCrosses, [action.suspectId]: next } };
    }
    case 'reset':
      return createInitialState(definition);
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
