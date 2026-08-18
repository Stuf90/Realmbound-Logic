import { positionKey, type GridPosition } from '../../shared/geometry';
import { evaluatePredicate } from './predicates';
import type { CharacterId, InquestDefinition, InquestState } from './types';

// Author-time-only constraint solver: never called at runtime/play. Used by definitionValidation.ts
// to prove a puzzle's clue set narrows to exactly one full placement (and that placement matches the
// authored `solution`), and that the victim's cell is uniquely forced by elimination once every other
// character is placed.

export interface SolveResult {
  solutions: Array<Record<CharacterId, GridPosition>>;
}

/**
 * Backtracking search over `characterIds` (defaults to every character in `definition`). Stops after
 * finding 2 solutions — callers only need to distinguish 0 / exactly 1 / more than 1.
 */
export function solveInquestDefinition(
  definition: InquestDefinition,
  characterIds?: CharacterId[],
): SolveResult {
  const ids = characterIds ?? definition.characters.map(({ id }) => id);
  const candidateCells = definition.cells.filter((cell) => !cell.blocked);
  const solutions: Array<Record<CharacterId, GridPosition>> = [];

  function isRowOrColumnTaken(placements: InquestState['placements'], position: GridPosition): boolean {
    return Object.values(placements).some(
      (placed) => placed && (placed.row === position.row || placed.column === position.column),
    );
  }

  function violatesClue(placements: InquestState['placements']): boolean {
    return definition.clues.some(
      (clue) => evaluatePredicate(clue.predicate, placements, definition) === false,
    );
  }

  function backtrack(index: number, placements: InquestState['placements']): void {
    if (solutions.length >= 2) return;
    if (index === ids.length) {
      solutions.push({ ...placements } as Record<CharacterId, GridPosition>);
      return;
    }
    const characterId = ids[index]!;
    for (const cell of candidateCells) {
      if (isRowOrColumnTaken(placements, cell.position)) continue;
      const nextPlacements = { ...placements, [characterId]: cell.position };
      if (violatesClue(nextPlacements)) continue;
      backtrack(index + 1, nextPlacements);
      if (solutions.length >= 2) return;
    }
  }

  backtrack(0, {});
  return { solutions };
}

export interface VictimEliminationResult {
  ok: boolean;
}

/**
 * Solves for every character except the victim, then asserts that exactly one unblocked cell remains
 * (no shared row/column with any of the others) and that its chamber's only other solved occupant is
 * the traitor — the "one logic space left, in a chamber with one murderer" rule.
 */
export function checkVictimElimination(definition: InquestDefinition): VictimEliminationResult {
  const victim = definition.characters.find(({ isVictim }) => isVictim);
  if (!victim) return { ok: false };

  const otherIds = definition.characters.filter(({ id }) => id !== victim.id).map(({ id }) => id);
  const solved = solveInquestDefinition(definition, otherIds);
  if (solved.solutions.length !== 1) return { ok: false };
  const placements = solved.solutions[0]!;

  const candidateCells = definition.cells.filter((cell) => !cell.blocked);
  const remaining = candidateCells.filter(
    (cell) =>
      !Object.values(placements).some(
        (position) => position.row === cell.position.row || position.column === cell.position.column,
      ),
  );
  if (remaining.length !== 1) return { ok: false };
  const victimCell = remaining[0]!;

  const chamberOccupants = Object.entries(placements).filter(([, position]) => {
    const cell = definition.cells.find((candidate) => positionKey(candidate.position) === positionKey(position));
    return cell?.chamberId === victimCell.chamberId;
  });
  if (chamberOccupants.length !== 1 || chamberOccupants[0]![0] !== definition.traitorId) {
    return { ok: false };
  }

  return { ok: true };
}
