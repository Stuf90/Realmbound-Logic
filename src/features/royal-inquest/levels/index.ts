import { graywickPriory } from './graywickPriory';
import { fenmoorAlmshouse } from './fenmoorAlmshouse';
import { duskhollowGranary } from './duskhollowGranary';
import { sableridgeGarrison } from './sableridgeGarrison';
import { wyrmscarInfirmary } from './wyrmscarInfirmary';
import type { InquestDefinition } from '../types';

export const royalInquestLevels: InquestDefinition[] = [
  graywickPriory,
  fenmoorAlmshouse,
  duskhollowGranary,
  sableridgeGarrison,
  wyrmscarInfirmary,
];

export function getRoyalInquestLevel(id: string): InquestDefinition {
  const level = royalInquestLevels.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown Royal Inquest level: ${id}`);
  return level;
}
