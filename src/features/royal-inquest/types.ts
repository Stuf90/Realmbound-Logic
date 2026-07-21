import type { GridPosition } from '../../shared/geometry';
import type { AvatarAssetId, PropAssetId, TileEnvironment } from '../../assets/royal-inquest/manifest';

export type CharacterId = string;

export interface InquestCharacter {
  id: CharacterId;
  name: string;
  portraitLabel: string;
  avatarId: AvatarAssetId;
  isVictim?: boolean;
}

export interface InquestCell {
  position: GridPosition;
  chamberId: string;
  blocked: boolean;
  propId?: PropAssetId;
}

export type InquestPredicate =
  | { type: 'exact-row'; characterId: CharacterId; row: number }
  | { type: 'exact-column'; characterId: CharacterId; column: number }
  | { type: 'exact-chamber'; characterId: CharacterId; chamberId: string }
  | { type: 'same-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | { type: 'different-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | {
      type: 'direction-from';
      subjectCharacterId: CharacterId;
      referenceCharacterId: CharacterId;
      direction: 'north' | 'east' | 'south' | 'west';
    }
  | { type: 'beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | { type: 'not-beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | { type: 'on-prop'; characterId: CharacterId; propId: PropAssetId };

export interface InquestClue {
  id: string;
  text: string;
  predicate: InquestPredicate;
}

export interface InquestDefinition {
  id: string;
  title: string;
  definitionVersion: number;
  rows: number;
  columns: number;
  characters: InquestCharacter[];
  cells: InquestCell[];
  clues: InquestClue[];
  traitorId: CharacterId;
  solution: Record<CharacterId, GridPosition>;
  chamberEnvironments: Record<string, TileEnvironment>;
  chamberNames: Record<string, string>;
}

export interface InquestState {
  placements: Partial<Record<CharacterId, GridPosition>>;
  drafts: Partial<Record<CharacterId, string[]>>;
  manualCrosses: Partial<Record<CharacterId, string[]>>;
  selectedCharacterId: CharacterId | null;
  tool: 'place' | 'draft' | 'cross';
}

export type InquestAction =
  | { type: 'select-character'; characterId: CharacterId | null }
  | { type: 'set-tool'; tool: InquestState['tool'] }
  | { type: 'place'; characterId: CharacterId; position: GridPosition }
  | { type: 'toggle-draft'; characterId: CharacterId; position: GridPosition }
  | { type: 'toggle-cross'; characterId: CharacterId; position: GridPosition }
  | { type: 'clear-placement'; characterId: CharacterId };
