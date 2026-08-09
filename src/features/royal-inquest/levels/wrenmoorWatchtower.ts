import type { GridPosition } from '../../../shared/geometry';
import type { PropAssetId } from '../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Same chamber shape as the archived template cases (see ../levels/archive/): one full-width top
// chamber hosting the victim + traitor, then four irregular chambers below sized so the
// exact-chamber clues plus the one-per-row/one-per-column rule force every non-victim
// character's cell uniquely — verified by `solveInquestDefinition` in levels.test.ts.
// `2:2`/`2:3` alternate decorative assets so they don't stamp the same one twice in a row.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'dungeon-cage',
  '2:5': 'bookshelf',
  '5:4': 'barrel-cluster',
  '5:3': 'kitchen-worktable',
  '3:3': 'dining-table',
  '2:2': 'barrel-cluster',
  '4:1': 'stone-planter',
  '5:1': 'wooden-planter',
  '5:2': 'stone-planter',
  '2:3': 'dungeon-cage',
};

// Seat prop sits on a legal/solution cell: a character can be placed on it (the prop
// renders under the avatar), doubling as a positional hint ("seated in the pew").
const seatPropsByPosition: Record<string, PropAssetId> = {
  '1:0': 'church-pew',
};

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set(Object.keys(decorativePropsByPosition));

const chamberByPosition = [
  ['signal-chapel', 'signal-chapel', 'signal-chapel', 'signal-chapel', 'signal-chapel', 'signal-chapel'],
  ['signal-chapel', 'signal-chapel', 'signal-chapel', 'signal-chapel', 'signal-chapel', 'signal-chapel'],
  ['powder-store', 'powder-store', 'powder-store', 'powder-store', 'quarters', 'quarters'],
  ['powder-store', 'terrace', 'terrace', 'quarters', 'quarters', 'quarters'],
  ['terrace', 'terrace', 'terrace', 'mess-hall', 'mess-hall', 'mess-hall'],
  ['terrace', 'terrace', 'terrace', 'mess-hall', 'mess-hall', 'mess-hall'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'signal-chapel': 'church',
  'powder-store': 'dungeon',
  quarters: 'room',
  terrace: 'garden',
  'mess-hall': 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'signal-chapel': 'Signal Chapel',
  'powder-store': 'Powder Store',
  quarters: "Officer's Quarters",
  terrace: 'Herb Terrace',
  'mess-hall': 'Mess Hall',
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
  courier: { row: 0, column: 3 },
  'watch-captain': { row: 1, column: 0 },
  powderman: { row: 2, column: 1 },
  lieutenant: { row: 3, column: 4 },
  herbalist: { row: 4, column: 2 },
  cook: { row: 5, column: 5 },
};

export const wrenmoorWatchtower: InquestDefinition = {
  id: 'wrenmoor-watchtower',
  title: 'The Vigil at Wrenmoor Watchtower',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'watch-captain', name: 'The Watch-Captain', portraitLabel: 'Watch-Captain', avatarId: 'guard-captain' },
    { id: 'powderman', name: 'The Powderman', portraitLabel: 'Powderman', avatarId: 'steward' },
    { id: 'lieutenant', name: 'The Lieutenant', portraitLabel: 'Lieutenant', avatarId: 'knight' },
    { id: 'herbalist', name: 'The Herbalist', portraitLabel: 'Herbalist', avatarId: 'gardener' },
    { id: 'cook', name: 'The Cook', portraitLabel: 'Cook', avatarId: 'cook' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'courier', name: 'The Courier', portraitLabel: 'Courier', avatarId: 'royal-envoy', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'watch-captain-signal-chapel',
      text: 'The Watch-Captain was seen in the Signal Chapel.',
      predicate: { type: 'exact-chamber', characterId: 'watch-captain', chamberId: 'signal-chapel' },
    },
    {
      id: 'watch-captain-seated',
      text: 'The Watch-Captain was found seated in the pew.',
      predicate: { type: 'on-prop', characterId: 'watch-captain', propId: 'church-pew' },
    },
    {
      id: 'powderman-powder-store',
      text: 'The Powderman was seen in the Powder Store.',
      predicate: { type: 'exact-chamber', characterId: 'powderman', chamberId: 'powder-store' },
    },
    {
      id: 'lieutenant-quarters',
      text: "The Lieutenant was seen in the Officer's Quarters.",
      predicate: { type: 'exact-chamber', characterId: 'lieutenant', chamberId: 'quarters' },
    },
    {
      id: 'herbalist-terrace',
      text: 'The Herbalist tended alone on the Herb Terrace.',
      predicate: { type: 'exact-chamber', characterId: 'herbalist', chamberId: 'terrace' },
    },
    {
      id: 'cook-mess-hall',
      text: 'The Cook was seen in the Mess Hall.',
      predicate: { type: 'exact-chamber', characterId: 'cook', chamberId: 'mess-hall' },
    },
  ],
  traitorId: 'watch-captain',
  solution,
};
