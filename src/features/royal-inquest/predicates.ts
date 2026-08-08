import { positionKey, type GridPosition } from '../../shared/geometry';
import { propKindByAsset } from '../../assets/royal-inquest/manifest';
import type {
  CharacterId,
  InquestDefinition,
  InquestPredicate,
  InquestState,
} from './types';

export type PredicateResult = true | false | 'unknown';

function chamberAt(definition: InquestDefinition, position: GridPosition): string | undefined {
  return definition.cells.find((cell) => positionKey(cell.position) === positionKey(position))
    ?.chamberId;
}

function isAdjacent(first: GridPosition, second: GridPosition): boolean {
  return Math.abs(first.row - second.row) + Math.abs(first.column - second.column) === 1;
}

export function evaluatePredicate(
  predicate: InquestPredicate,
  placements: InquestState['placements'],
  definition: InquestDefinition,
): PredicateResult {
  switch (predicate.type) {
    case 'exact-row': {
      const position = placements[predicate.characterId];
      return position ? position.row === predicate.row : 'unknown';
    }
    case 'exact-column': {
      const position = placements[predicate.characterId];
      return position ? position.column === predicate.column : 'unknown';
    }
    case 'exact-chamber': {
      const position = placements[predicate.characterId];
      return position ? chamberAt(definition, position) === predicate.chamberId : 'unknown';
    }
    case 'same-chamber':
    case 'different-chamber': {
      const first = placements[predicate.firstCharacterId];
      const second = placements[predicate.secondCharacterId];
      if (!first || !second) return 'unknown';
      const same = chamberAt(definition, first) === chamberAt(definition, second);
      return predicate.type === 'same-chamber' ? same : !same;
    }
    case 'direction-from': {
      const subject = placements[predicate.subjectCharacterId];
      const reference = placements[predicate.referenceCharacterId];
      if (!subject || !reference) return 'unknown';
      switch (predicate.direction) {
        case 'north':
          return subject.column === reference.column && subject.row < reference.row;
        case 'south':
          return subject.column === reference.column && subject.row > reference.row;
        case 'east':
          return subject.row === reference.row && subject.column > reference.column;
        case 'west':
          return subject.row === reference.row && subject.column < reference.column;
      }
    }
    case 'beside':
    case 'not-beside': {
      const first = placements[predicate.firstCharacterId];
      const second = placements[predicate.secondCharacterId];
      if (!first || !second) return 'unknown';
      const distance = Math.abs(first.row - second.row) + Math.abs(first.column - second.column);
      const adjacentSameChamber =
        distance === 1 && chamberAt(definition, first) === chamberAt(definition, second);
      return predicate.type === 'beside' ? adjacentSameChamber : !adjacentSameChamber;
    }
    case 'on-prop': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const propCell = definition.cells.find((cell) => cell.propId === predicate.propId);
      return propCell !== undefined && positionKey(propCell.position) === positionKey(position);
    }
    case 'chamber-occupant-count': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const ownChamber = chamberAt(definition, position);
      const otherIds = definition.characters
        .map(({ id }) => id)
        .filter((id) => id !== predicate.characterId);
      let placedOthersInChamber = 0;
      let placedOthersTotal = 0;
      for (const id of otherIds) {
        const otherPosition = placements[id];
        if (!otherPosition) continue;
        placedOthersTotal += 1;
        if (chamberAt(definition, otherPosition) === ownChamber) placedOthersInChamber += 1;
      }
      if (placedOthersInChamber > predicate.count) return false;
      if (placedOthersTotal < otherIds.length) return 'unknown';
      return placedOthersInChamber === predicate.count;
    }
    case 'in-corner': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const edgeRow = position.row === 0 || position.row === definition.rows - 1;
      const edgeColumn = position.column === 0 || position.column === definition.columns - 1;
      return edgeRow && edgeColumn;
    }
    case 'seated-character-count': {
      const allIds = definition.characters.map(({ id }) => id);
      let seated = 0;
      let placedTotal = 0;
      for (const id of allIds) {
        const position = placements[id];
        if (!position) continue;
        placedTotal += 1;
        const cell = definition.cells.find(
          (candidate) => positionKey(candidate.position) === positionKey(position),
        );
        if (cell?.propId && propKindByAsset[cell.propId] === 'seat') seated += 1;
      }
      if (seated > predicate.count) return false;
      if (placedTotal < allIds.length) return 'unknown';
      return seated === predicate.count;
    }
    case 'not-beside-wall': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const ownChamber = chamberAt(definition, position);
      const neighbors: GridPosition[] = [
        { row: position.row - 1, column: position.column },
        { row: position.row + 1, column: position.column },
        { row: position.row, column: position.column - 1 },
        { row: position.row, column: position.column + 1 },
      ];
      return neighbors.every((neighbor) => {
        if (
          neighbor.row < 0 ||
          neighbor.row >= definition.rows ||
          neighbor.column < 0 ||
          neighbor.column >= definition.columns
        ) {
          return false;
        }
        return chamberAt(definition, neighbor) === ownChamber;
      });
    }
    case 'category-not-beside-prop': {
      const propCell = definition.cells.find((cell) => cell.propId === predicate.propId);
      if (!propCell) return true;
      const relevant = definition.characters.filter(({ category }) => category === predicate.category);
      const placedRelevant = relevant.filter(({ id }) => placements[id]);
      const violated = placedRelevant.some(({ id }) => isAdjacent(placements[id]!, propCell.position));
      if (violated) return false;
      if (placedRelevant.length < relevant.length) return 'unknown';
      return true;
    }
    case 'shares-prop-neighbor': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const propCell = definition.cells.find((cell) => cell.propId === predicate.propId);
      if (!propCell) return false;
      if (!isAdjacent(position, propCell.position)) return false;
      const otherIds = definition.characters
        .map(({ id }) => id)
        .filter((id) => id !== predicate.characterId);
      const someoneElseNearby = otherIds.some((id) => {
        const otherPosition = placements[id];
        return otherPosition !== undefined && isAdjacent(otherPosition, propCell.position);
      });
      if (someoneElseNearby) return true;
      const allOthersPlaced = otherIds.every((id) => placements[id]);
      return allOthersPlaced ? false : 'unknown';
    }
    default: {
      const exhaustive: never = predicate;
      return exhaustive;
    }
  }
}

export function getPredicateCharacterIds(predicate: InquestPredicate): CharacterId[] {
  switch (predicate.type) {
    case 'exact-row':
    case 'exact-column':
    case 'exact-chamber':
    case 'on-prop':
    case 'chamber-occupant-count':
    case 'in-corner':
    case 'not-beside-wall':
    case 'shares-prop-neighbor':
      return [predicate.characterId];
    case 'same-chamber':
    case 'different-chamber':
    case 'beside':
    case 'not-beside':
      return [predicate.firstCharacterId, predicate.secondCharacterId];
    case 'direction-from':
      return [predicate.subjectCharacterId, predicate.referenceCharacterId];
    case 'seated-character-count':
    case 'category-not-beside-prop':
      return [];
    default: {
      const exhaustive: never = predicate;
      return exhaustive;
    }
  }
}
