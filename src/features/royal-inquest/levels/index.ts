import { blackwoodKeep } from '../definition';
import { thornfieldManor } from './thornfieldManor';
import { ravensholtAbbey } from './ravensholtAbbey';
import type { InquestDefinition } from '../types';

export const royalInquestLevels: InquestDefinition[] = [blackwoodKeep, thornfieldManor, ravensholtAbbey];

export function getRoyalInquestLevel(id: string): InquestDefinition {
  const level = royalInquestLevels.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown Royal Inquest level: ${id}`);
  return level;
}
