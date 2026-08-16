import { positionKey, type GridPosition } from '../../shared/geometry';
import { propCategoryByAsset, propKindByAsset } from '../../assets/royal-inquest/manifest';
import type {
  CharacterId,
  InquestCell,
  InquestDefinition,
  InquestPredicate,
  InquestState,
} from './types';

export type PredicateResult = true | false | 'unknown';

function cellAt(definition: InquestDefinition, position: GridPosition): InquestCell | undefined {
  return definition.cells.find((cell) => positionKey(cell.position) === positionKey(position));
}

function chamberAt(definition: InquestDefinition, position: GridPosition): string | undefined {
  return cellAt(definition, position)?.chamberId;
}

function areaKeyAt(definition: InquestDefinition, position: GridPosition): string | undefined {
  const cell = cellAt(definition, position);
  return cell ? `${cell.chamberId}:${cell.areaId ?? ''}` : undefined;
}

function isAdjacent(first: GridPosition, second: GridPosition): boolean {
  return Math.abs(first.row - second.row) + Math.abs(first.column - second.column) === 1;
}

function isDiagonal(first: GridPosition, second: GridPosition): boolean {
  return Math.abs(first.row - second.row) === 1 && Math.abs(first.column - second.column) === 1;
}

function otherCharacterIds(definition: InquestDefinition, characterId: CharacterId): CharacterId[] {
  return definition.characters.map(({ id }) => id).filter((id) => id !== characterId);
}

function allCharactersPlaced(definition: InquestDefinition, placements: InquestState['placements']): boolean {
  return definition.characters.every(({ id }) => placements[id] !== undefined);
}

function cellForProp(definition: InquestDefinition, propId: string): InquestCell | undefined {
  return definition.cells.find((cell) => cell.propId === propId);
}

function cellsInAxis(
  definition: InquestDefinition,
  position: GridPosition,
  axis: 'row' | 'column',
): InquestCell[] {
  return definition.cells.filter(
    (cell) =>
      positionKey(cell.position) !== positionKey(position) &&
      (axis === 'row' ? cell.position.row === position.row : cell.position.column === position.column),
  );
}

function isOnBoard(definition: InquestDefinition, position: GridPosition): boolean {
  return (
    position.row >= 0 &&
    position.row < definition.rows &&
    position.column >= 0 &&
    position.column < definition.columns
  );
}

function orthogonalNeighbors(position: GridPosition): GridPosition[] {
  return [
    { row: position.row - 1, column: position.column },
    { row: position.row + 1, column: position.column },
    { row: position.row, column: position.column - 1 },
    { row: position.row, column: position.column + 1 },
  ];
}

function sameChamberOpenNeighbors(definition: InquestDefinition, position: GridPosition): InquestCell[] {
  const ownChamber = chamberAt(definition, position);
  return orthogonalNeighbors(position)
    .filter((neighbor) => isOnBoard(definition, neighbor))
    .map((neighbor) => cellAt(definition, neighbor))
    .filter((cell): cell is InquestCell => cell !== undefined && !cell.blocked && cell.chamberId === ownChamber);
}

function characterIdOnProp(
  definition: InquestDefinition,
  placements: InquestState['placements'],
  propId: string,
): CharacterId | undefined {
  const propCell = cellForProp(definition, propId);
  if (!propCell) return undefined;
  return definition.characters.find((character) => {
    const position = placements[character.id];
    return position !== undefined && positionKey(position) === positionKey(propCell.position);
  })?.id;
}

function propCategoriesNearPosition(definition: InquestDefinition, position: GridPosition): Set<string> {
  const ownChamber = chamberAt(definition, position);
  const categories = new Set<string>();
  for (const neighbor of orthogonalNeighbors(position)) {
    if (!isOnBoard(definition, neighbor)) continue;
    const cell = cellAt(definition, neighbor);
    if (!cell || cell.chamberId !== ownChamber || cell.propId === undefined) continue;
    categories.add(propCategoryByAsset[cell.propId]);
  }
  return categories;
}

function evaluateNearProp(
  definition: InquestDefinition,
  placements: InquestState['placements'],
  characterId: CharacterId,
  propId: string,
): PredicateResult {
  const position = placements[characterId];
  if (!position) return 'unknown';
  const propCell = cellForProp(definition, propId);
  if (!propCell) return false;
  if (!isAdjacent(position, propCell.position)) return false;
  return chamberAt(definition, position) === propCell.chamberId;
}

function chamberOrderOf(
  definition: InquestDefinition,
  placements: InquestState['placements'],
  characterId: CharacterId,
): number | undefined {
  const position = placements[characterId];
  if (!position) return undefined;
  const chamberId = chamberAt(definition, position);
  if (chamberId === undefined) return undefined;
  return definition.chamberOrder?.[chamberId];
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
          return subject.row < reference.row;
        case 'south':
          return subject.row > reference.row;
        case 'east':
          return subject.column > reference.column;
        case 'west':
          return subject.column < reference.column;
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
    case 'diagonal-from':
    case 'not-diagonal-from': {
      const first = placements[predicate.firstCharacterId];
      const second = placements[predicate.secondCharacterId];
      if (!first || !second) return 'unknown';
      const diagonal = isDiagonal(first, second);
      return predicate.type === 'diagonal-from' ? diagonal : !diagonal;
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
    case 'offset-from': {
      const subject = placements[predicate.subjectCharacterId];
      const reference = placements[predicate.referenceCharacterId];
      if (!subject || !reference) return 'unknown';
      return (
        subject.row - reference.row === predicate.rowOffset &&
        subject.column - reference.column === predicate.columnOffset
      );
    }
    case 'prop-neighbor-count': {
      const propCell = definition.cells.find((cell) => cell.propId === predicate.propId);
      if (!propCell) return false;
      const allIds = definition.characters.map(({ id }) => id);
      let nearby = 0;
      let placedTotal = 0;
      for (const id of allIds) {
        const position = placements[id];
        if (!position) continue;
        placedTotal += 1;
        if (isAdjacent(position, propCell.position)) nearby += 1;
      }
      if (nearby > predicate.count) return false;
      if (placedTotal < allIds.length) return 'unknown';
      return nearby === predicate.count;
    }
    case 'area-occupant-count': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const ownArea = areaKeyAt(definition, position);
      const otherIds = definition.characters
        .map(({ id }) => id)
        .filter((id) => id !== predicate.characterId);
      let placedOthersInArea = 0;
      let placedOthersTotal = 0;
      for (const id of otherIds) {
        const otherPosition = placements[id];
        if (!otherPosition) continue;
        placedOthersTotal += 1;
        if (areaKeyAt(definition, otherPosition) === ownArea) placedOthersInArea += 1;
      }
      if (placedOthersInArea > predicate.count) return false;
      if (placedOthersTotal < otherIds.length) return 'unknown';
      return placedOthersInArea === predicate.count;
    }
    case 'by-window': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const propCell = definition.cells.find((cell) => cell.propId === predicate.propId);
      if (!propCell) return false;
      return isAdjacent(position, propCell.position);
    }
    case 'not-on-prop': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      return cellAt(definition, position)?.propId !== predicate.propId;
    }
    case 'not-seated': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const cell = cellAt(definition, position);
      if (cell?.propId === undefined) return true;
      return propKindByAsset[cell.propId] !== 'seat';
    }
    case 'not-in-corner': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const edgeRow = position.row === 0 || position.row === definition.rows - 1;
      const edgeColumn = position.column === 0 || position.column === definition.columns - 1;
      return !(edgeRow && edgeColumn);
    }
    case 'not-exact-chamber': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      return chamberAt(definition, position) !== predicate.chamberId;
    }
    case 'beside-wall': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const ownChamber = chamberAt(definition, position);
      return orthogonalNeighbors(position).some(
        (neighbor) => !isOnBoard(definition, neighbor) || chamberAt(definition, neighbor) !== ownChamber,
      );
    }
    case 'near-prop':
      return evaluateNearProp(definition, placements, predicate.characterId, predicate.propId);
    case 'not-near-prop': {
      const near = evaluateNearProp(definition, placements, predicate.characterId, predicate.propId);
      return near === 'unknown' ? 'unknown' : !near;
    }
    case 'prop-in-axis': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      return cellsInAxis(definition, position, predicate.axis).some((cell) => cell.propId === predicate.propId);
    }
    case 'beside-empty-cell': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      const neighbors = sameChamberOpenNeighbors(definition, position);
      if (neighbors.length === 0) return false;
      const others = otherCharacterIds(definition, predicate.characterId);
      const occupied = neighbors.filter((neighbor) =>
        others.some((id) => {
          const otherPosition = placements[id];
          return otherPosition !== undefined && positionKey(otherPosition) === positionKey(neighbor.position);
        }),
      ).length;
      if (occupied === neighbors.length) return false;
      return allCharactersPlaced(definition, placements) ? true : 'unknown';
    }
    case 'category-on-prop': {
      const occupantId = characterIdOnProp(definition, placements, predicate.propId);
      if (occupantId === undefined) {
        return allCharactersPlaced(definition, placements) ? false : 'unknown';
      }
      return definition.characters.find(({ id }) => id === occupantId)?.category === predicate.category;
    }
    case 'prop-in-chamber': {
      const propCell = definition.cells.find((cell) => cell.propId === predicate.propId);
      return propCell !== undefined && propCell.chamberId === predicate.chamberId;
    }
    case 'axis-offset-from': {
      const subject = placements[predicate.subjectCharacterId];
      const reference = placements[predicate.referenceCharacterId];
      if (!subject || !reference) return 'unknown';
      return predicate.axis === 'row'
        ? subject.row - reference.row === predicate.offset
        : subject.column - reference.column === predicate.offset;
    }
    case 'category-chamber-count': {
      const matching = definition.characters.filter(({ category }) => category === predicate.category);
      const currentCount = matching.filter(({ id }) => {
        const position = placements[id];
        return position !== undefined && chamberAt(definition, position) === predicate.chamberId;
      }).length;
      if (currentCount > predicate.count) return false;
      const allPlaced = matching.every(({ id }) => placements[id] !== undefined);
      if (!allPlaced) return 'unknown';
      return currentCount === predicate.count;
    }
    case 'chamber-rank': {
      const position = placements[predicate.characterId];
      if (!position) return 'unknown';
      if (chamberAt(definition, position) !== predicate.chamberId) return false;
      const axis = predicate.rank === 'topmost' || predicate.rank === 'bottommost' ? 'row' : 'column';
      const wantsMin = predicate.rank === 'topmost' || predicate.rank === 'leftmost';
      const subjectValue = axis === 'row' ? position.row : position.column;
      for (const id of otherCharacterIds(definition, predicate.characterId)) {
        const otherPosition = placements[id];
        if (!otherPosition || chamberAt(definition, otherPosition) !== predicate.chamberId) continue;
        const otherValue = axis === 'row' ? otherPosition.row : otherPosition.column;
        const subjectIsExtreme = wantsMin ? subjectValue < otherValue : subjectValue > otherValue;
        if (!subjectIsExtreme) return false;
      }
      return allCharactersPlaced(definition, placements) ? true : 'unknown';
    }
    case 'one-of': {
      let anyUnknown = false;
      for (const option of predicate.options) {
        const result = evaluatePredicate(option, placements, definition);
        if (result === true) return true;
        if (result === 'unknown') anyUnknown = true;
      }
      return anyUnknown ? 'unknown' : false;
    }
    case 'all-of': {
      let anyUnknown = false;
      for (const option of predicate.predicates) {
        const result = evaluatePredicate(option, placements, definition);
        if (result === false) return false;
        if (result === 'unknown') anyUnknown = true;
      }
      return anyUnknown ? 'unknown' : true;
    }
    case 'chamber-order-compare': {
      const subjectOrder = chamberOrderOf(definition, placements, predicate.subjectCharacterId);
      const referenceOrder = chamberOrderOf(definition, placements, predicate.referenceCharacterId);
      if (subjectOrder === undefined || referenceOrder === undefined) return 'unknown';
      switch (predicate.comparator) {
        case 'greater':
          return subjectOrder > referenceOrder;
        case 'less':
          return subjectOrder < referenceOrder;
        case 'immediately-after':
          return subjectOrder === referenceOrder + 1;
        case 'immediately-before':
          return subjectOrder === referenceOrder - 1;
      }
    }
    case 'shares-prop-category-neighbor': {
      const first = placements[predicate.firstCharacterId];
      const second = placements[predicate.secondCharacterId];
      if (!first || !second) return 'unknown';
      const firstCategories = propCategoriesNearPosition(definition, first);
      const secondCategories = propCategoriesNearPosition(definition, second);
      return [...firstCategories].some((category) => secondCategories.has(category));
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
    case 'area-occupant-count':
    case 'by-window':
    case 'not-on-prop':
    case 'not-seated':
    case 'not-in-corner':
    case 'not-exact-chamber':
    case 'beside-wall':
    case 'near-prop':
    case 'not-near-prop':
    case 'prop-in-axis':
    case 'beside-empty-cell':
    case 'chamber-rank':
      return [predicate.characterId];
    case 'same-chamber':
    case 'different-chamber':
    case 'beside':
    case 'not-beside':
    case 'diagonal-from':
    case 'not-diagonal-from':
    case 'shares-prop-category-neighbor':
      return [predicate.firstCharacterId, predicate.secondCharacterId];
    case 'direction-from':
    case 'offset-from':
    case 'axis-offset-from':
    case 'chamber-order-compare':
      return [predicate.subjectCharacterId, predicate.referenceCharacterId];
    case 'one-of':
      return predicate.options.flatMap(getPredicateCharacterIds);
    case 'all-of':
      return predicate.predicates.flatMap(getPredicateCharacterIds);
    case 'seated-character-count':
    case 'category-not-beside-prop':
    case 'prop-neighbor-count':
    case 'category-on-prop':
    case 'prop-in-chamber':
    case 'category-chamber-count':
      return [];
    default: {
      const exhaustive: never = predicate;
      return exhaustive;
    }
  }
}
