import { positionKey, type GridPosition } from '../../src/shared/geometry';
import { validateInquestDefinition } from '../../src/features/royal-inquest/definitionValidation';
import { checkVictimElimination, solveInquestDefinition } from '../../src/features/royal-inquest/solver';
import type { CharacterId, InquestDefinition } from '../../src/features/royal-inquest/types';

export interface SolveReport {
  id: string;
  issues: string[];
  solutions: Array<Record<CharacterId, GridPosition>>;
  matchesAuthoredSolution: boolean | null;
  victimEliminationOk: boolean | null;
}

/**
 * Wraps the author-time engine (`validateInquestDefinition`, `solveInquestDefinition`,
 * `checkVictimElimination`) into one report. Mirrors `validateInquestDefinition`'s own gate: the
 * solver only runs once structural/predicate checks pass, since a structurally broken definition
 * (bad cells, dangling character ids, ...) isn't safe to backtrack over.
 */
export function buildSolveReport(definition: InquestDefinition): SolveReport {
  const issues = validateInquestDefinition(definition);
  if (issues.length > 0) {
    return { id: definition.id, issues, solutions: [], matchesAuthoredSolution: null, victimEliminationOk: null };
  }

  const { solutions } = solveInquestDefinition(definition);
  const matchesAuthoredSolution =
    solutions.length === 1
      ? definition.characters.every(
          ({ id }) => positionKey(solutions[0]![id]!) === positionKey(definition.solution[id]!),
        )
      : null;
  const { ok: victimEliminationOk } = checkVictimElimination(definition);

  return { id: definition.id, issues: [], solutions, matchesAuthoredSolution, victimEliminationOk };
}
