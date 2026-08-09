import type { GridPosition } from '../../../shared/geometry';
import type { PropAssetId } from '../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Same chamber shape as the archived template cases (see ../levels/archive/): one full-width top
// chamber hosting the victim + traitor, then four irregular chambers below sized so the
// exact-chamber clues plus the one-per-row/one-per-column rule force every non-victim
// character's cell uniquely — verified by `solveInquestDefinition` in levels.test.ts.
// `2:2`/`2:3` alternate decorative assets so they don't stamp the same one twice in a row.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'stone-planter',
  '2:5': 'kitchen-worktable',
  '5:4': 'dungeon-cage',
  '5:3': 'barrel-cluster',
  '3:3': 'dining-table',
  '2:2': 'wooden-planter',
  '4:1': 'bookshelf',
  '5:1': 'dining-table',
  '5:2': 'bookshelf',
  '2:3': 'stone-planter',
};

// Seat prop sits on a legal/solution cell: a character can be placed on it (the prop
// renders under the avatar), doubling as a positional hint ("seated in the chair").
const seatPropsByPosition: Record<string, PropAssetId> = {
  '1:0': 'formal-chair',
};

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set(Object.keys(decorativePropsByPosition));

const chamberByPosition = [
  ['lodge-hall', 'lodge-hall', 'lodge-hall', 'lodge-hall', 'lodge-hall', 'lodge-hall'],
  ['lodge-hall', 'lodge-hall', 'lodge-hall', 'lodge-hall', 'lodge-hall', 'lodge-hall'],
  ['kennel-yard', 'kennel-yard', 'kennel-yard', 'kennel-yard', 'larder', 'larder'],
  ['kennel-yard', 'study', 'study', 'larder', 'larder', 'larder'],
  ['study', 'study', 'study', 'trophy-cellar', 'trophy-cellar', 'trophy-cellar'],
  ['study', 'study', 'study', 'trophy-cellar', 'trophy-cellar', 'trophy-cellar'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'lodge-hall': 'royalRoom',
  'kennel-yard': 'garden',
  larder: 'kitchen',
  study: 'room',
  'trophy-cellar': 'dungeon',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'lodge-hall': 'Hunting Lodge Hall',
  'kennel-yard': 'Kennel Yard',
  larder: 'Larder',
  study: 'Study',
  'trophy-cellar': 'Trophy Cellar',
};

const cells: InquestCell[] = chamberByPosition.flatMap((row, rowIndex) =>
  row.map((chamberId, columnIndex) => {
    const key = `${rowIndex}:${columnIndex}`;
    return {
      position: { row: rowIndex, column: columnIndex },
      chamberId,
      blocked: blockedCells.has(key),
      ...(propsByPosition[key] ? { propId: propsByPosition[key] } : {}),
    };
  }),
);

const solution: Record<CharacterId, GridPosition> = {
  'game-warden': { row: 0, column: 3 },
  'lodge-keeper': { row: 1, column: 0 },
  kennelman: { row: 2, column: 1 },
  cook: { row: 3, column: 4 },
  taxidermist: { row: 4, column: 2 },
  scholar: { row: 5, column: 5 },
};

export const hollowmereLodge: InquestDefinition = {
  id: 'hollowmere-lodge',
  title: 'Whispers at Hollowmere Lodge',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'lodge-keeper', name: 'The Lodge-Keeper', portraitLabel: 'Lodge-Keeper', avatarId: 'steward' },
    { id: 'kennelman', name: 'The Kennelman', portraitLabel: 'Kennelman', avatarId: 'gardener' },
    { id: 'cook', name: 'The Cook', portraitLabel: 'Cook', avatarId: 'cook' },
    { id: 'taxidermist', name: 'The Taxidermist', portraitLabel: 'Taxidermist', avatarId: 'merchant' },
    { id: 'scholar', name: 'The Scholar', portraitLabel: 'Scholar', avatarId: 'scholar' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'game-warden', name: 'The Game Warden', portraitLabel: 'Game Warden', avatarId: 'royal-envoy', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'lodge-keeper-lodge-hall',
      text: 'The Lodge-Keeper was seen in the Hunting Lodge Hall.',
      predicate: { type: 'exact-chamber', characterId: 'lodge-keeper', chamberId: 'lodge-hall' },
    },
    {
      id: 'lodge-keeper-seated',
      text: 'The Lodge-Keeper was found seated in the chair.',
      predicate: { type: 'on-prop', characterId: 'lodge-keeper', propId: 'formal-chair' },
    },
    {
      id: 'kennelman-kennel-yard',
      text: 'The Kennelman was seen in the Kennel Yard.',
      predicate: { type: 'exact-chamber', characterId: 'kennelman', chamberId: 'kennel-yard' },
    },
    {
      id: 'cook-larder',
      text: 'The Cook was seen in the Larder.',
      predicate: { type: 'exact-chamber', characterId: 'cook', chamberId: 'larder' },
    },
    {
      id: 'taxidermist-study',
      text: 'The Taxidermist worked alone in the Study.',
      predicate: { type: 'exact-chamber', characterId: 'taxidermist', chamberId: 'study' },
    },
    {
      id: 'scholar-trophy-cellar',
      text: 'The Scholar was seen in the Trophy Cellar.',
      predicate: { type: 'exact-chamber', characterId: 'scholar', chamberId: 'trophy-cellar' },
    },
  ],
  traitorId: 'lodge-keeper',
  solution,
};
