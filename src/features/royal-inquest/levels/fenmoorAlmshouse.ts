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
  '2:5': 'kitchen-worktable',
  '3:3': 'dining-table',
  '4:1': 'stone-planter',
  '5:1': 'wooden-planter',
  '5:2': 'stone-planter',
  '5:3': 'candle-stand',
  '5:4': 'offering-chest',
};

// Seat prop sits on a legal/solution cell: a character can be placed on it (the prop
// renders under the avatar), doubling as a positional hint ("seated on the bench").
const seatPropsByPosition: Record<string, PropAssetId> = {
  '1:0': 'wooden-bench',
};

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set(Object.keys(decorativePropsByPosition));

const chamberByPosition = [
  ['almshouse-hall', 'almshouse-hall', 'almshouse-hall', 'almshouse-hall', 'almshouse-hall', 'almshouse-hall'],
  ['almshouse-hall', 'almshouse-hall', 'almshouse-hall', 'almshouse-hall', 'almshouse-hall', 'almshouse-hall'],
  ['root-cellar', 'root-cellar', 'root-cellar', 'root-cellar', 'kitchen-yard', 'kitchen-yard'],
  ['root-cellar', 'physic-garden', 'physic-garden', 'kitchen-yard', 'kitchen-yard', 'kitchen-yard'],
  ['physic-garden', 'physic-garden', 'physic-garden', 'almshouse-chapel', 'almshouse-chapel', 'almshouse-chapel'],
  ['physic-garden', 'physic-garden', 'physic-garden', 'almshouse-chapel', 'almshouse-chapel', 'almshouse-chapel'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'almshouse-hall': 'room',
  'root-cellar': 'dungeon',
  'kitchen-yard': 'kitchen',
  'physic-garden': 'garden',
  'almshouse-chapel': 'church',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'almshouse-hall': 'Almshouse Hall',
  'root-cellar': 'Root Cellar',
  'kitchen-yard': 'Kitchen Yard',
  'physic-garden': 'Physic Garden',
  'almshouse-chapel': 'Almshouse Chapel',
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
  ward: { row: 0, column: 3 },
  warden: { row: 1, column: 0 },
  cellarer: { row: 2, column: 1 },
  cook: { row: 3, column: 4 },
  'herb-woman': { row: 4, column: 2 },
  deacon: { row: 5, column: 5 },
};

export const fenmoorAlmshouse: InquestDefinition = {
  id: 'fenmoor-almshouse',
  title: 'The Almshouse Reckoning',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'warden', name: 'The Almshouse Warden', portraitLabel: 'Warden', avatarId: 'steward' },
    { id: 'cellarer', name: 'The Cellarer', portraitLabel: 'Cellarer', avatarId: 'monk' },
    { id: 'cook', name: 'The Cook', portraitLabel: 'Cook', avatarId: 'cook' },
    { id: 'herb-woman', name: 'The Herb-Woman', portraitLabel: 'Herb-Woman', avatarId: 'gardener' },
    { id: 'deacon', name: 'The Deacon', portraitLabel: 'Deacon', avatarId: 'priest' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'ward', name: 'The Orphaned Ward', portraitLabel: 'Ward', avatarId: 'prisoner', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'warden-almshouse-hall',
      text: 'The Warden was seen in the Almshouse Hall.',
      predicate: { type: 'exact-chamber', characterId: 'warden', chamberId: 'almshouse-hall' },
    },
    {
      id: 'warden-seated',
      text: 'The Warden was found seated on the bench.',
      predicate: { type: 'on-prop', characterId: 'warden', propId: 'wooden-bench' },
    },
    {
      id: 'cellarer-root-cellar',
      text: 'The Cellarer was seen in the Root Cellar.',
      predicate: { type: 'exact-chamber', characterId: 'cellarer', chamberId: 'root-cellar' },
    },
    {
      id: 'cook-kitchen-yard',
      text: 'The Cook was seen in the Kitchen Yard.',
      predicate: { type: 'exact-chamber', characterId: 'cook', chamberId: 'kitchen-yard' },
    },
    {
      id: 'herb-woman-physic-garden',
      text: 'The Herb-Woman tended alone in the Physic Garden.',
      predicate: { type: 'exact-chamber', characterId: 'herb-woman', chamberId: 'physic-garden' },
    },
    {
      id: 'deacon-almshouse-chapel',
      text: 'The Deacon was seen in the Almshouse Chapel.',
      predicate: { type: 'exact-chamber', characterId: 'deacon', chamberId: 'almshouse-chapel' },
    },
  ],
  traitorId: 'warden',
  solution,
};
