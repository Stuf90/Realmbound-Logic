import type { MurdokuDefinition, Placements } from 'murdoku-logic-engine';
import type { RoyalInquestSkin } from './skin';

export interface RoyalInquestLevel {
  id: string;
  title: string;
  definition: MurdokuDefinition;
  skin: RoyalInquestSkin;
}

export type RoyalInquestTool = 'place' | 'draft' | 'cross';

export interface RoyalInquestState {
  placements: Placements;
  /** suspectId -> list of "row:column" position keys drafted as candidates. */
  drafts: Record<string, string[]>;
  /** suspectId -> list of "row:column" position keys manually crossed out. */
  manualCrosses: Record<string, string[]>;
  selectedSuspectId: string | null;
  tool: RoyalInquestTool;
}

export type RoyalInquestAction =
  | { type: 'select-suspect'; suspectId: string | null }
  | { type: 'set-tool'; tool: RoyalInquestTool }
  | { type: 'place'; suspectId: string; position: { row: number; column: number } }
  | { type: 'toggle-draft'; suspectId: string; position: { row: number; column: number } }
  | { type: 'toggle-cross'; suspectId: string; position: { row: number; column: number } }
  | { type: 'reset' };
