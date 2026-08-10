import type { GridPosition } from '../../../shared/geometry';
import type { PropAssetId } from '../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Same chamber shape as the archived template cases (see ../levels/archive/): one full-width top
// chamber hosting the victim + traitor, then four irregular chambers below sized so the
// exact-chamber clues plus the one-per-row/one-per-column rule force every non-victim
// character's cell uniquely — verified by `solveInquestDefinition` in levels.test.ts.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'dungeon-cage',
  '2:2': 'barrel-cluster',
  '2:3': 'dungeon-cage',
  '2:5': 'bookshelf',
  '3:3': 'barrel-cluster',
  '4:1': 'stone-planter',
  '5:1': 'wooden-planter',
  '5:2': 'stone-planter',
  '5:3': 'kitchen-worktable',
  '5:4': 'dining-table',
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
  ['granary-hall', 'granary-hall', 'granary-hall', 'granary-hall', 'granary-hall', 'granary-hall'],
  ['granary-hall', 'granary-hall', 'granary-hall', 'granary-hall', 'granary-hall', 'granary-hall'],
  ['grain-cellar', 'grain-cellar', 'grain-cellar', 'grain-cellar', 'mill-room', 'mill-room'],
  ['grain-cellar', 'threshing-yard', 'threshing-yard', 'mill-room', 'mill-room', 'mill-room'],
  ['threshing-yard', 'threshing-yard', 'threshing-yard', 'weighing-kitchen', 'weighing-kitchen', 'weighing-kitchen'],
  ['threshing-yard', 'threshing-yard', 'threshing-yard', 'weighing-kitchen', 'weighing-kitchen', 'weighing-kitchen'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'granary-hall': 'royalRoom',
  'grain-cellar': 'dungeon',
  'mill-room': 'room',
  'threshing-yard': 'garden',
  'weighing-kitchen': 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'granary-hall': 'Granary Hall',
  'grain-cellar': 'Grain Cellar',
  'mill-room': 'Mill Room',
  'threshing-yard': 'Threshing Yard',
  'weighing-kitchen': 'Weighing Kitchen',
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
  assessor: { row: 0, column: 3 },
  'granary-master': { row: 1, column: 0 },
  cellarman: { row: 2, column: 1 },
  miller: { row: 3, column: 4 },
  'threshing-hand': { row: 4, column: 2 },
  weighmaster: { row: 5, column: 5 },
};

export const duskhollowGranary: InquestDefinition = {
  id: 'duskhollow-granary',
  title: 'The Reckoning at Duskhollow Granary',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'granary-master', name: 'The Granary Master', portraitLabel: 'Granary Master', avatarId: 'steward' },
    { id: 'cellarman', name: 'The Cellarman', portraitLabel: 'Cellarman', avatarId: 'guard-captain' },
    { id: 'miller', name: 'The Miller', portraitLabel: 'Miller', avatarId: 'merchant' },
    { id: 'threshing-hand', name: 'The Threshing Hand', portraitLabel: 'Threshing Hand', avatarId: 'gardener' },
    { id: 'weighmaster', name: 'The Weighmaster', portraitLabel: 'Weighmaster', avatarId: 'cook' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'assessor', name: 'The Grain Assessor', portraitLabel: 'Assessor', avatarId: 'royal-envoy', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'granary-master-granary-hall',
      text: 'The Granary Master was seen in the Granary Hall.',
      predicate: { type: 'exact-chamber', characterId: 'granary-master', chamberId: 'granary-hall' },
    },
    {
      id: 'granary-master-seated',
      text: 'The Granary Master was found seated in the chair.',
      predicate: { type: 'on-prop', characterId: 'granary-master', propId: 'formal-chair' },
    },
    {
      id: 'cellarman-grain-cellar',
      text: 'The Cellarman was seen in the Grain Cellar.',
      predicate: { type: 'exact-chamber', characterId: 'cellarman', chamberId: 'grain-cellar' },
    },
    {
      id: 'miller-mill-room',
      text: 'The Miller was seen in the Mill Room.',
      predicate: { type: 'exact-chamber', characterId: 'miller', chamberId: 'mill-room' },
    },
    {
      id: 'threshing-hand-threshing-yard',
      text: 'The Threshing Hand worked alone in the Threshing Yard.',
      predicate: { type: 'exact-chamber', characterId: 'threshing-hand', chamberId: 'threshing-yard' },
    },
    {
      id: 'weighmaster-weighing-kitchen',
      text: 'The Weighmaster was seen in the Weighing Kitchen.',
      predicate: { type: 'exact-chamber', characterId: 'weighmaster', chamberId: 'weighing-kitchen' },
    },
  ],
  traitorId: 'granary-master',
  solution,
};
