import type { GridPosition } from '../../../shared/geometry';
import type { PropAssetId } from '../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Same chamber shape as the archived template cases (see ../levels/archive/): one full-width top
// chamber hosting the victim + traitor, then four irregular chambers below sized so the
// exact-chamber clues plus the one-per-row/one-per-column rule force every non-victim
// character's cell uniquely — verified by `solveInquestDefinition` in levels.test.ts.
// `2:2`/`2:3` alternate decorative assets so they don't stamp the same one twice in a row.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'kitchen-worktable',
  '2:5': 'stone-planter',
  '5:4': 'candle-stand',
  '5:3': 'offering-chest',
  '3:3': 'wooden-planter',
  '2:2': 'dining-table',
  '4:1': 'dungeon-cage',
  '5:1': 'barrel-cluster',
  '5:2': 'dungeon-cage',
  '2:3': 'kitchen-worktable',
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
  ['drawing-room', 'drawing-room', 'drawing-room', 'drawing-room', 'drawing-room', 'drawing-room'],
  ['drawing-room', 'drawing-room', 'drawing-room', 'drawing-room', 'drawing-room', 'drawing-room'],
  ['scullery', 'scullery', 'scullery', 'scullery', 'conservatory', 'conservatory'],
  ['scullery', 'cellar', 'cellar', 'conservatory', 'conservatory', 'conservatory'],
  ['cellar', 'cellar', 'cellar', 'chapel', 'chapel', 'chapel'],
  ['cellar', 'cellar', 'cellar', 'chapel', 'chapel', 'chapel'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'drawing-room': 'room',
  scullery: 'kitchen',
  conservatory: 'garden',
  cellar: 'dungeon',
  chapel: 'church',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'drawing-room': 'The Drawing Room',
  scullery: 'Scullery',
  conservatory: 'Conservatory',
  cellar: 'Wine Cellar',
  chapel: 'Family Chapel',
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
  solicitor: { row: 0, column: 3 },
  butler: { row: 1, column: 0 },
  'scullery-maid': { row: 2, column: 1 },
  botanist: { row: 3, column: 4 },
  vintner: { row: 4, column: 2 },
  chaplain: { row: 5, column: 5 },
};

export const ashwellManor: InquestDefinition = {
  id: 'ashwell-manor',
  title: 'The Reckoning at Ashwell Manor',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'butler', name: 'The Butler', portraitLabel: 'Butler', avatarId: 'steward' },
    { id: 'scullery-maid', name: 'The Scullery Maid', portraitLabel: 'Scullery Maid', avatarId: 'maid' },
    { id: 'botanist', name: 'The Botanist', portraitLabel: 'Botanist', avatarId: 'scholar' },
    { id: 'vintner', name: 'The Vintner', portraitLabel: 'Vintner', avatarId: 'merchant' },
    { id: 'chaplain', name: 'The Chaplain', portraitLabel: 'Chaplain', avatarId: 'priest' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'solicitor', name: 'The Solicitor', portraitLabel: 'Solicitor', avatarId: 'royal-envoy', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'butler-drawing-room',
      text: 'The Butler was seen in the Drawing Room.',
      predicate: { type: 'exact-chamber', characterId: 'butler', chamberId: 'drawing-room' },
    },
    {
      id: 'butler-seated',
      text: 'The Butler was found seated on the bench.',
      predicate: { type: 'on-prop', characterId: 'butler', propId: 'wooden-bench' },
    },
    {
      id: 'scullery-maid-scullery',
      text: 'The Scullery Maid was seen in the Scullery.',
      predicate: { type: 'exact-chamber', characterId: 'scullery-maid', chamberId: 'scullery' },
    },
    {
      id: 'botanist-conservatory',
      text: 'The Botanist was seen in the Conservatory.',
      predicate: { type: 'exact-chamber', characterId: 'botanist', chamberId: 'conservatory' },
    },
    {
      id: 'vintner-cellar',
      text: 'The Vintner searched the Wine Cellar alone.',
      predicate: { type: 'exact-chamber', characterId: 'vintner', chamberId: 'cellar' },
    },
    {
      id: 'chaplain-chapel',
      text: 'The Chaplain was seen in the Family Chapel.',
      predicate: { type: 'exact-chamber', characterId: 'chaplain', chamberId: 'chapel' },
    },
    {
      id: 'butler-not-beside-botanist',
      text: 'The Butler was never seen beside the Botanist.',
      predicate: {
        type: 'not-beside',
        firstCharacterId: 'butler',
        secondCharacterId: 'botanist',
      },
    },
  ],
  traitorId: 'butler',
  solution,
};
