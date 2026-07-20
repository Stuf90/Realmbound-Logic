import { positionKey, type GridPosition } from '../../shared/geometry';
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
      return [predicate.characterId];
    case 'same-chamber':
    case 'different-chamber':
    case 'beside':
    case 'not-beside':
      return [predicate.firstCharacterId, predicate.secondCharacterId];
    case 'direction-from':
      return [predicate.subjectCharacterId, predicate.referenceCharacterId];
    default: {
      const exhaustive: never = predicate;
      return exhaustive;
    }
  }
}
