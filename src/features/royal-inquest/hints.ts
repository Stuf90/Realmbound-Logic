import { evaluatePredicate } from 'murdoku-logic-engine';
import type { GridPosition, MurdokuDefinition, Placements } from 'murdoku-logic-engine';
import { resolveClueText, type RoyalInquestSkin } from './skin';

export interface RoyalInquestHint {
  message: string;
  suspectId?: string;
  position?: GridPosition;
}

function hasDuplicateRowOrColumn(placements: Placements): boolean {
  const rows = new Set<number>();
  const columns = new Set<number>();
  for (const position of Object.values(placements)) {
    if (!position) continue;
    if (rows.has(position.row) || columns.has(position.column)) return true;
    rows.add(position.row);
    columns.add(position.column);
  }
  return false;
}

/**
 * Cells that remain legal for an unplaced suspect: unblocked, not in a row/column another
 * suspect already occupies, and not one where placing them there would immediately break a
 * clue (checked via a hypothetical placement).
 */
function candidateCells(definition: MurdokuDefinition, placements: Placements, suspectId: string): GridPosition[] {
  const occupiedRows = new Set<number>();
  const occupiedColumns = new Set<number>();
  for (const [id, position] of Object.entries(placements)) {
    if (id === suspectId || !position) continue;
    occupiedRows.add(position.row);
    occupiedColumns.add(position.column);
  }

  return definition.cells
    .filter((cell) => !cell.blocked && !occupiedRows.has(cell.position.row) && !occupiedColumns.has(cell.position.column))
    .map((cell) => cell.position)
    .filter((position) => {
      const hypothetical: Placements = { ...placements, [suspectId]: position };
      return !definition.clues.some((clue) => evaluatePredicate(clue.predicate, hypothetical, definition) === false);
    });
}

/**
 * Two-tier hint: first report an existing contradiction (duplicate row/column, a clue already
 * violated, or a suspect with no remaining legal cell). Only once the board is contradiction-free
 * does it look for a suspect with exactly one remaining legal cell and offer to place them there.
 */
export function getRoyalInquestHint(
  definition: MurdokuDefinition,
  placements: Placements,
  skin: RoyalInquestSkin,
): RoyalInquestHint | null {
  const suspectName = (suspectId: string): string => {
    const suspect = definition.suspects.find(({ id }) => id === suspectId);
    return skin.suspects[suspectId]?.name ?? suspect?.label ?? suspectId;
  };

  if (hasDuplicateRowOrColumn(placements)) {
    return { message: 'Two witnesses already share a row or column. Undo a placement to continue.' };
  }

  const violatedClue = definition.clues.find((clue) => evaluatePredicate(clue.predicate, placements, definition) === false);
  if (violatedClue) {
    return {
      message: `A testimony has already been broken: "${resolveClueText(violatedClue, skin, definition)}". Undo a placement to continue.`,
    };
  }

  for (const suspect of definition.suspects) {
    if (placements[suspect.id]) continue;
    if (candidateCells(definition, placements, suspect.id).length === 0) {
      return { message: `${suspectName(suspect.id)} has no remaining legal cell. Undo a placement to continue.`, suspectId: suspect.id };
    }
  }

  for (const suspect of definition.suspects) {
    if (placements[suspect.id]) continue;
    const cells = candidateCells(definition, placements, suspect.id);
    if (cells.length === 1) {
      const [position] = cells;
      return {
        message: `${suspectName(suspect.id)} can only be at row ${position!.row + 1}, column ${position!.column + 1}.`,
        suspectId: suspect.id,
        position,
      };
    }
  }

  return null;
}
