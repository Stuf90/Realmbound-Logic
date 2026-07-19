import { positionKey } from '../../shared/geometry';
import { evaluatePredicate } from './predicates';
import { getCellState } from './selectors';
import type { CharacterId, InquestDefinition, InquestState } from './types';

export interface InquestIssue { kind: string; message: string; characterId?: CharacterId }

export function checkInquestProgress(definition: InquestDefinition, state: InquestState): InquestIssue | null {
  for (const [characterId, position] of Object.entries(state.placements)) {
    const cell = definition.cells.find((candidate) => positionKey(candidate.position) === positionKey(position!));
    if (!cell || cell.blocked || (cell.legalCharacterIds && !cell.legalCharacterIds.includes(characterId)))
      return { kind: 'illegal', characterId, message: `${characterId} occupies an illegal cell.` };
  }
  const entries = Object.entries(state.placements).filter((entry): entry is [string, NonNullable<typeof entry[1]>] => !!entry[1]);
  for (const [id, position] of entries) {
    if (entries.some(([other, candidate]) => other !== id && candidate.row === position.row)) return { kind: 'row', characterId: id, message: 'Two characters cannot share a row.' };
    if (entries.some(([other, candidate]) => other !== id && candidate.column === position.column)) return { kind: 'column', characterId: id, message: 'Two characters cannot share a column.' };
  }
  for (const clue of definition.clues) if (evaluatePredicate(clue.predicate, state.placements, definition) === false) return { kind: 'clue', message: `Contradiction: ${clue.text}` };
  for (const character of definition.characters) {
    if (state.placements[character.id]) continue;
    const possible = definition.cells.some((cell) => getCellState(definition, state, character.id, cell.position) === 'available');
    if (!possible) return { kind: 'no-position', characterId: character.id, message: `${character.name} has no legal position remaining.` };
  }
  return null;
}

export function isInquestComplete(definition: InquestDefinition, state: InquestState): boolean {
  if (checkInquestProgress(definition, state)) return false;
  return definition.characters.every(({ id }) => {
    const actual = state.placements[id];
    return actual && positionKey(actual) === positionKey(definition.solution[id]!);
  });
}
