import { graywickPriory } from './graywickPriory';
import { fenmoorAlmshouse } from './fenmoorAlmshouse';
import { duskhollowGranary } from './duskhollowGranary';
import { sableridgeGarrison } from './sableridgeGarrison';
import { wyrmscarInfirmary } from './wyrmscarInfirmary';
import { thornwickAbbey } from './thornwickAbbey';
import { millraceForge } from './millraceForge';
import { ashenportCustomhouse } from './ashenportCustomhouse';
import { vellumArchive } from './vellumArchive';
import { gallowmereTollhouse } from './gallowmereTollhouse';
import type { InquestDefinition } from '../types';

export const royalInquestLevels: InquestDefinition[] = [
  graywickPriory,
  fenmoorAlmshouse,
  duskhollowGranary,
  sableridgeGarrison,
  wyrmscarInfirmary,
  thornwickAbbey,
  millraceForge,
  ashenportCustomhouse,
  vellumArchive,
  gallowmereTollhouse,
];

export function getRoyalInquestLevel(id: string): InquestDefinition {
  const level = royalInquestLevels.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown Royal Inquest level: ${id}`);
  return level;
}
