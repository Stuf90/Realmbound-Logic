import { positionKey } from '../../shared/geometry';
import { getPredicateCharacterIds } from './predicates';
import { checkInquestProgress } from './validation';
import type { CharacterId, InquestDefinition, InquestState } from './types';

export interface InquestHint { message: string; characterId?: CharacterId; position?: { row: number; column: number } }

export function getInquestHint(definition: InquestDefinition, state: InquestState): InquestHint | null {
  const issue = checkInquestProgress(definition, state);
  if (issue) return { message: issue.message, characterId: issue.characterId };
  for (const character of definition.characters) {
    const solution = definition.solution[character.id]!;
    if (state.placements[character.id] && positionKey(state.placements[character.id]!) === positionKey(solution)) continue;
    const clue = definition.clues.find(({ predicate }) =>
      getPredicateCharacterIds(predicate).includes(character.id),
    );
    return { message: clue ? `${clue.text} Place ${character.name} at row ${solution.row + 1}, column ${solution.column + 1}.` : `${character.name} can now be placed at row ${solution.row + 1}, column ${solution.column + 1}.`, characterId: character.id, position: solution };
  }
  return null;
}
