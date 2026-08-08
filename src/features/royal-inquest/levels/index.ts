import { marrowfenChapel } from './marrowfenChapel';
import { ashwellManor } from './ashwellManor';
import { thistledownMarket } from './thistledownMarket';
import { wrenmoorWatchtower } from './wrenmoorWatchtower';
import { hollowmereLodge } from './hollowmereLodge';
import type { InquestDefinition } from '../types';

export const royalInquestLevels: InquestDefinition[] = [
  marrowfenChapel,
  ashwellManor,
  thistledownMarket,
  wrenmoorWatchtower,
  hollowmereLodge,
];

export function getRoyalInquestLevel(id: string): InquestDefinition {
  const level = royalInquestLevels.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown Royal Inquest level: ${id}`);
  return level;
}
