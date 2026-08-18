import type { GridPosition } from '../../../../shared/geometry';
import type { PropAssetId } from '../../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../../types';

// 90-degree-counterclockwise rotation of the Marrowfen Chapel template (see ../levels/archive/ and
// marrowfenChapel.ts): the victim + traitor chamber runs as a full-height LEFT column instead of a
// top row (mirrored the opposite way from Ashwell Manor's transpose), with four irregular chambers
// to its right. A 90-degree rotation of a proven layout preserves the one-per-row/one-per-column
// solvability guarantee exactly (row/column distinctness survives any rotation/reflection) —
// verified fresh by `solveInquestDefinition` in levels.test.ts.
// `2:2`/`3:2` alternate decorative assets so they don't stamp the same one twice in a row.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '5:3': 'stone-planter',
  '0:2': 'kitchen-worktable',
  '1:5': 'dungeon-cage',
  '2:5': 'barrel-cluster',
  '2:3': 'dining-table',
  '3:2': 'wooden-planter',
  '4:4': 'bookshelf',
  '4:5': 'dining-table',
  '3:5': 'bookshelf',
  '2:2': 'stone-planter',
};

// Seat prop sits on a legal/solution cell: a character can be placed on it (the prop
// renders under the avatar), doubling as a positional hint ("seated in the chair").
const seatPropsByPosition: Record<string, PropAssetId> = {
  '5:1': 'formal-chair',
};

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set(Object.keys(decorativePropsByPosition));

const chamberByPosition = [
  ['lodge-hall', 'lodge-hall', 'larder', 'larder', 'trophy-cellar', 'trophy-cellar'],
  ['lodge-hall', 'lodge-hall', 'larder', 'larder', 'trophy-cellar', 'trophy-cellar'],
  ['lodge-hall', 'lodge-hall', 'kennel-yard', 'larder', 'trophy-cellar', 'trophy-cellar'],
  ['lodge-hall', 'lodge-hall', 'kennel-yard', 'study', 'study', 'study'],
  ['lodge-hall', 'lodge-hall', 'kennel-yard', 'study', 'study', 'study'],
  ['lodge-hall', 'lodge-hall', 'kennel-yard', 'kennel-yard', 'study', 'study'],
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
  'game-warden': { row: 2, column: 0 },
  'lodge-keeper': { row: 5, column: 1 },
  kennelman: { row: 4, column: 2 },
  cook: { row: 1, column: 3 },
  taxidermist: { row: 3, column: 4 },
  scholar: { row: 0, column: 5 },
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
