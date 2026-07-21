import { positionKey, type GridPosition } from '../../shared/geometry';
import { propKindByAsset, propsByEnvironment, type PropAssetId } from '../../assets/royal-inquest/manifest';
import { getPredicateCharacterIds } from './predicates';
import { solveInquestDefinition, checkVictimElimination } from './solver';
import type { InquestCell, InquestCharacter, InquestClue, InquestDefinition } from './types';

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

const PREDICATE_TYPES = new Set([
  'exact-row',
  'exact-column',
  'exact-chamber',
  'same-chamber',
  'different-chamber',
  'direction-from',
  'beside',
  'not-beside',
  'on-prop',
]);

function isClue(value: unknown): value is InquestClue {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.text !== 'string') return false;
  const predicate = value.predicate;
  return isRecord(predicate) && typeof predicate.type === 'string' && PREDICATE_TYPES.has(predicate.type);
}

function isCell(value: unknown): value is InquestCell {
  return (
    isRecord(value) &&
    isPosition(value.position) &&
    typeof value.chamberId === 'string' &&
    typeof value.blocked === 'boolean'
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
  if (characters.length < 2) issues.push('Definition must contain at least two characters.');
  if (characters.length > rows || characters.length > columns) {
    issues.push('Definition must not contain more characters than rows or columns, since every character needs a unique row and column.');
  }
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
      continue;
    }
    const kind = propKindByAsset[cell.propId as PropAssetId];
    if (kind === 'seat' && cell.blocked) {
      issues.push(`Seat prop "${cell.propId}" must be on an unblocked cell so a character can use it.`);
    } else if (kind === 'decorative' && !cell.blocked) {
      issues.push(`Decorative prop "${cell.propId}" must be placed on a blocked cell.`);
    }
    if (
      typeof environment !== 'string' ||
      !propsByEnvironment[environment as keyof typeof propsByEnvironment]?.includes(cell.propId as PropAssetId)
    ) {
      issues.push(`Prop "${cell.propId}" is not permitted in a "${environment}" chamber.`);
    }
  }

  const clues = Array.isArray(definition.clues) ? definition.clues.filter(isClue) : [];
  if (!Array.isArray(definition.clues) || clues.length !== definition.clues.length) {
    issues.push('Every clue must be structurally valid.');
  }
  for (const clue of clues) {
    if (clue.predicate.type === 'exact-row' || clue.predicate.type === 'exact-column') {
      issues.push(
        `Clue "${clue.id}" may not use exact-row/exact-column; use exact-chamber, direction-from, beside, not-beside, same-chamber, or different-chamber instead.`,
      );
    }
  }
  const victimId = characters.find(({ isVictim }) => isVictim)?.id;
  if (victimId) {
    for (const clue of clues) {
      if (getPredicateCharacterIds(clue.predicate).includes(victimId)) {
        issues.push(
          `Clue "${clue.id}" names the victim directly; the victim's position must be derived only from other witnesses.`,
        );
      }
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
    if (!cell || cell.blocked) {
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

  if (issues.length === 0) {
    const solved = solveInquestDefinition(definition as unknown as InquestDefinition);
    if (solved.solutions.length === 0) {
      issues.push('The clue set has no valid solution.');
    } else if (solved.solutions.length > 1) {
      issues.push('The clue set does not narrow the puzzle to a unique solution.');
    } else {
      const [found] = solved.solutions;
      const matches = characters.every(
        ({ id }) => positionKey(found![id]!) === positionKey((definition as unknown as InquestDefinition).solution[id]!),
      );
      if (!matches) issues.push('The clue set\'s unique solution does not match the authored solution.');
    }

    const victim = characters.find(({ isVictim }) => isVictim);
    const traitorId = typeof definition.traitorId === 'string' ? definition.traitorId : '';
    if (victim && traitorId) {
      const elimination = checkVictimElimination(definition as unknown as InquestDefinition);
      if (!elimination.ok) {
        issues.push(
          `Victim ${victim.id} must have exactly one legal cell once every other character is placed, in a chamber occupied solely by the traitor.`,
        );
      }
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
