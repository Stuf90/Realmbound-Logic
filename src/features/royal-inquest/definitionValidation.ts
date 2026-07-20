import { positionKey, type GridPosition } from '../../shared/geometry';
import { propsByEnvironment, type PropAssetId } from '../../assets/royal-inquest/manifest';
import type { InquestCell, InquestCharacter, InquestDefinition } from './types';

const PROP_IDS = new Set<string>(Object.values(propsByEnvironment).flat());

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPosition(value: unknown): value is GridPosition {
  return (
    isRecord(value) &&
    Number.isInteger(value.row) &&
    Number.isInteger(value.column)
  );
}

function isCharacter(value: unknown): value is InquestCharacter {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.portraitLabel === 'string' &&
    (value.isVictim === undefined || typeof value.isVictim === 'boolean')
  );
}

function isCell(value: unknown): value is InquestCell {
  return (
    isRecord(value) &&
    isPosition(value.position) &&
    typeof value.chamberId === 'string' &&
    typeof value.blocked === 'boolean' &&
    (value.legalCharacterIds === undefined ||
      (Array.isArray(value.legalCharacterIds) &&
        value.legalCharacterIds.every((id) => typeof id === 'string')))
  );
}

export function validateInquestDefinition(definition: unknown): string[] {
  if (!isRecord(definition)) return ['Definition must be an object.'];

  const issues: string[] = [];
  const rawRows = definition.rows;
  const rawColumns = definition.columns;
  const characters = Array.isArray(definition.characters)
    ? definition.characters.filter(isCharacter)
    : [];
  const cells = Array.isArray(definition.cells) ? definition.cells.filter(isCell) : [];
  const solution = isRecord(definition.solution) ? definition.solution : {};

  if (
    typeof rawRows !== 'number' ||
    typeof rawColumns !== 'number' ||
    !Number.isInteger(rawRows) ||
    !Number.isInteger(rawColumns)
  ) {
    issues.push('Rows and columns must be integers.');
    return issues;
  }
  const rows = rawRows;
  const columns = rawColumns;
  if (definition.definitionVersion !== 1) issues.push('Definition version must be 1.');
  if (!Array.isArray(definition.characters) || characters.length !== definition.characters.length) {
    issues.push('Every character must be structurally valid.');
  }
  if (characters.length !== 6) issues.push('Definition must contain six characters.');
  if (new Set(characters.map(({ id }) => id)).size !== characters.length) {
    issues.push('Character IDs must be unique.');
  }
  if (characters.filter(({ isVictim }) => isVictim).length !== 1) {
    issues.push('Definition must contain exactly one victim.');
  }
  if (!Array.isArray(definition.cells) || cells.length !== definition.cells.length) {
    issues.push('Every cell must be structurally valid.');
  }
  if (cells.length !== rows * columns) issues.push('Definition must contain one cell per board position.');

  const cellKeys = cells.map(({ position }) => positionKey(position));
  if (new Set(cellKeys).size !== cellKeys.length) issues.push('Cell positions must be unique.');
  if (
    cells.some(
      ({ position }) =>
        position.row < 0 ||
        position.row >= rows ||
        position.column < 0 ||
        position.column >= columns,
    )
  ) {
    issues.push('Cell positions must be within the board.');
  }

  const chamberNames = isRecord(definition.chamberNames) ? definition.chamberNames : {};
  const chamberEnvironments = isRecord(definition.chamberEnvironments) ? definition.chamberEnvironments : {};
  const chamberIds = new Set(cells.map(({ chamberId }) => chamberId));
  for (const chamberId of chamberIds) {
    if (typeof chamberNames[chamberId] !== 'string' || typeof chamberEnvironments[chamberId] !== 'string') {
      issues.push(`Chamber "${chamberId}" must have a name and an environment.`);
    }
  }

  const chamberSizes = new Map<string, number>();
  for (const { chamberId } of cells) {
    chamberSizes.set(chamberId, (chamberSizes.get(chamberId) ?? 0) + 1);
  }
  for (const [chamberId, size] of chamberSizes) {
    if (size < 5) issues.push(`Chamber "${chamberId}" must contain at least 5 tiles.`);
  }

  for (const cell of cells) {
    if (cell.propId === undefined) continue;
    const environment = chamberEnvironments[cell.chamberId];
    if (!PROP_IDS.has(cell.propId)) {
      issues.push(`Prop "${cell.propId}" is not a known prop asset.`);
    } else if (
      typeof environment !== 'string' ||
      !propsByEnvironment[environment as keyof typeof propsByEnvironment]?.includes(cell.propId as PropAssetId)
    ) {
      issues.push(`Prop "${cell.propId}" is not permitted in a "${environment}" chamber.`);
    }
  }

  const characterIds = new Set(characters.map(({ id }) => id));
  const solutionEntries = Object.entries(solution);
  if (
    solutionEntries.length !== characters.length ||
    solutionEntries.some(([id, position]) => !characterIds.has(id) || !isPosition(position))
  ) {
    issues.push('Solution must place every character exactly once.');
  }

  const validSolutionEntries = solutionEntries.filter(
    (entry): entry is [string, GridPosition] => isPosition(entry[1]),
  );
  const solutionRows = validSolutionEntries.map(([, position]) => position.row);
  const solutionColumns = validSolutionEntries.map(([, position]) => position.column);
  if (new Set(solutionRows).size !== solutionRows.length) issues.push('Solution rows must be unique.');
  if (new Set(solutionColumns).size !== solutionColumns.length) {
    issues.push('Solution columns must be unique.');
  }

  for (const [characterId, position] of validSolutionEntries) {
    const cell = cells.find((candidate) => positionKey(candidate.position) === positionKey(position));
    if (
      !cell ||
      cell.blocked ||
      (cell.legalCharacterIds !== undefined && !cell.legalCharacterIds.includes(characterId))
    ) {
      issues.push(`Solution for ${characterId} must use a legal, unblocked cell.`);
    }
  }

  const victim = characters.find(({ isVictim }) => isVictim);
  const traitorId = typeof definition.traitorId === 'string' ? definition.traitorId : '';
  if (!characterIds.has(traitorId) || traitorId === victim?.id) {
    issues.push('Traitor must be a non-victim character.');
  } else if (victim) {
    const victimPosition = solution[victim.id];
    const traitorPosition = solution[traitorId];
    if (!isPosition(victimPosition) || !isPosition(traitorPosition)) return issues;

    const chamberFor = (position: GridPosition) =>
      cells.find((cell) => positionKey(cell.position) === positionKey(position))?.chamberId;
    const victimChamber = chamberFor(victimPosition);
    const chamberOccupants = validSolutionEntries.filter(
      ([, position]) => chamberFor(position) === victimChamber,
    );
    if (
      !victimChamber ||
      chamberFor(traitorPosition) !== victimChamber ||
      chamberOccupants.length !== 2
    ) {
      issues.push('Victim and traitor must be the only two solution occupants of their chamber.');
    }
  }

  return issues;
}

export function assertValidInquestDefinition(
  definition: unknown,
): asserts definition is InquestDefinition {
  const issues = validateInquestDefinition(definition);
  if (issues.length > 0) throw new Error(issues.join('\n'));
}
