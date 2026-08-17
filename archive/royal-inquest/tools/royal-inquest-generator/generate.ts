import { positionKey } from '../../src/shared/geometry';
import { validateInquestDefinition } from '../../src/features/royal-inquest/definitionValidation';
import type { InquestCell, InquestDefinition } from '../../src/features/royal-inquest/types';
import { generateChamberLayout } from './chamberLayout';
import { generateClues } from './clueGeneration';
import { generatePropPlacement } from './propPlacement';
import { createRng, pick, randInt, shuffle, type Rng } from './rng';
import { buildCastAndSolution, chooseChamberAssignment } from './solutionAndCast';
import { CASE_TITLE_PLACES, CASE_TITLE_PREFIXES, CHAMBER_NAME_FRAGMENTS, CHARACTER_TEMPLATES } from './wordBanks';

export interface GenerateOptions {
  difficulty: number;
  seed?: number;
}

export interface GenerateResult {
  definition: InquestDefinition;
  seed: number;
}

// Chamber count is picked first, in [MIN_CHAMBER_COUNT, MAX_CHAMBER_COUNT], then board size AND
// cast size are BOTH derived as `chamberCount + 1` (a square board, one seat-anchored occupant per
// chamber plus the victim sharing the pair chamber - see `solutionAndCast.ts`'s docstring). This is
// what makes the victim (and every other character) pinnable by elimination using only
// difficulty-1-legal predicates: with cast size EQUAL to the board's full row/column count, every
// row and every column is used by exactly one character, so once all non-victim characters are
// placed, exactly one row and one column remain - forcing the victim's cell uniquely - mirroring how
// the shipped hand-authored levels rely on a full-board permutation, never a partial-quota cast.
// MAX_CHAMBER_COUNT is capped at 5 (giving board sizes 5-6, not the full 5-7 a partial-quota cast
// could otherwise reach) because that's the total number of distinct non-span seat `PropAssetId`s
// across the three seat-capable environments this generator uses (`room`: 2, `church`: 1,
// `royalRoom`: 2 - see `chamberLayout.ts`'s `SEAT_CAPACITY`) - one more chamber than that and at
// least one chamber's seat id would have to repeat, breaking its occupant's `on-prop` anchor. A
// deliberate, documented scope cut from a literal "rows/columns randomly 5-7, cast size
// independently 4-7" reading of the brief, made for solver-verified correctness.
const MIN_CHAMBER_COUNT = 4;
const MAX_CHAMBER_COUNT = 5;
const MAX_ATTEMPTS = 50;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function assignChamberNames(rng: Rng, chamberIds: string[], chamberEnvironments: Record<string, string>): Record<string, string> {
  const byEnvironment = new Map<string, string[]>();
  for (const chamberId of chamberIds) {
    const environment = chamberEnvironments[chamberId]!;
    if (!byEnvironment.has(environment)) byEnvironment.set(environment, []);
    byEnvironment.get(environment)!.push(chamberId);
  }
  const names: Record<string, string> = {};
  for (const [environment, ids] of byEnvironment) {
    const fragments = shuffle(rng, CHAMBER_NAME_FRAGMENTS[environment as keyof typeof CHAMBER_NAME_FRAGMENTS] ?? ['Room']);
    ids.forEach((chamberId, index) => {
      const base = fragments[index % fragments.length]!;
      names[chamberId] = index < fragments.length ? base : `${base} ${Math.floor(index / fragments.length) + 1}`;
    });
  }
  return names;
}

/**
 * Orchestrates the full pipeline (chamber layout -> props -> cast/solution -> clues), retrying the
 * whole thing up to `MAX_ATTEMPTS` times whenever any stage can't converge (e.g. no victim+traitor
 * pair chamber, or the clue generator can't reach a unique solution). The final gate is
 * `validateInquestDefinition` itself - on success this function never returns a definition that
 * fails it.
 */
export function generateInquestDefinition(options: GenerateOptions): GenerateResult {
  const { difficulty } = options;
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) {
    throw new Error(`difficulty must be an integer 1-3, got ${difficulty}.`);
  }
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = createRng(seed);

  const errors: string[] = [];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const chamberCountTarget = randInt(rng, MIN_CHAMBER_COUNT, MAX_CHAMBER_COUNT);
    const size = chamberCountTarget + 1;
    const rows = size;
    const columns = size;

    const layout = generateChamberLayout(rng, rows, columns, chamberCountTarget);
    const actualChamberCount = layout.chamberIds.length;

    // `chamberLayout.ts`'s minimum-size merge can reduce the chamber count below what was
    // requested (e.g. two tiny seed regions merge into one) - when that happens, the board is no
    // longer sized to exactly `chamberCount + 1`, so the full-permutation trick above doesn't hold;
    // retry the whole layout rather than trying to patch it.
    const castSize = actualChamberCount + 1;
    if (castSize !== size) {
      errors.push(`attempt ${attempt}: chamber merge reduced count to ${actualChamberCount}, no longer matching board size ${size}.`);
      continue;
    }

    // Decide WHERE everyone sits (a full permutation, grouped by chamber so exactly one chamber
    // gets two occupants) before placing any props, so props can be placed to match the solution
    // rather than hoping a solution happens to land on wherever props ended up - see
    // `solutionAndCast.ts`'s docstring.
    const assignment = chooseChamberAssignment(rng, layout, size);
    if (!assignment) {
      errors.push(`attempt ${attempt}: could not find a chamber assignment shape (one pair chamber, rest singletons) for this layout.`);
      continue;
    }
    const reservedPositions = new Set<string>(
      [...assignment.anchorByChamber.values(), assignment.extraPosition].map((position) => positionKey(position)),
    );

    const propPlacement = generatePropPlacement(rng, layout, assignment.anchorByChamber, reservedPositions);

    const cells: InquestCell[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const key = `${row}:${column}`;
        const propId = propPlacement.propByPosition.get(key);
        cells.push({
          position: { row, column },
          chamberId: layout.chamberByPosition[row]![column]!,
          blocked: propPlacement.blockedPositions.has(key),
          ...(propId ? { propId } : {}),
        });
      }
    }

    const castAndSolution = buildCastAndSolution(rng, cells, assignment, CHARACTER_TEMPLATES);
    if (!castAndSolution) {
      errors.push(`attempt ${attempt}: could not label the chosen assignment with a cast (unique avatars exhausted?).`);
      continue;
    }

    const chamberNames = assignChamberNames(rng, layout.chamberIds, layout.chamberEnvironments);

    const clues = generateClues(rng, {
      rows,
      columns,
      cells,
      characters: castAndSolution.characters,
      chamberEnvironments: layout.chamberEnvironments,
      chamberNames,
      solution: castAndSolution.solution,
      victimId: castAndSolution.victimId,
      traitorId: castAndSolution.traitorId,
      difficulty,
    });
    if (!clues) {
      errors.push(`attempt ${attempt}: clue generation could not converge on a unique, victim-eliminable solution.`);
      continue;
    }

    const place = pick(rng, CASE_TITLE_PLACES);
    const prefix = pick(rng, CASE_TITLE_PREFIXES);
    const id = `${slugify(place)}-${seed}`;
    const title = `${prefix} ${place}`;

    const definition: InquestDefinition = {
      id,
      title,
      definitionVersion: 1,
      difficulty,
      rows,
      columns,
      characters: castAndSolution.characters,
      cells,
      clues,
      traitorId: castAndSolution.traitorId,
      solution: castAndSolution.solution,
      chamberEnvironments: layout.chamberEnvironments,
      chamberNames,
    };

    const issues = validateInquestDefinition(definition);
    if (issues.length > 0) {
      errors.push(`attempt ${attempt}: validation failed:\n  ${issues.join('\n  ')}`);
      continue;
    }

    return { definition, seed };
  }

  throw new Error(
    `generateInquestDefinition: exhausted ${MAX_ATTEMPTS} attempts for seed ${seed}, difficulty ${difficulty}.\n${errors.slice(-5).join('\n')}`,
  );
}
