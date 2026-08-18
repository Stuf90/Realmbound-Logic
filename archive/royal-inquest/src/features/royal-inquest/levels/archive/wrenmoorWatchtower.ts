import type { GridPosition } from '../../../../shared/geometry';
import type { PropAssetId } from '../../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../../types';

// 90-degree-clockwise rotation of the Marrowfen Chapel template (see ../levels/archive/ and
// marrowfenChapel.ts): the victim + traitor chamber runs as a full-height RIGHT column instead of
// a top row, with four irregular chambers to its left. A 90-degree rotation of a proven layout
// preserves the one-per-row/one-per-column solvability guarantee exactly (row/column distinctness
// survives any rotation/reflection) — verified fresh by `solveInquestDefinition` in levels.test.ts.
// `2:3`/`3:3` alternate decorative assets so they don't stamp the same one twice in a row.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '0:2': 'dungeon-cage',
  '5:3': 'bookshelf',
  '4:0': 'barrel-cluster',
  '3:0': 'kitchen-worktable',
  '3:2': 'dining-table',
  '2:3': 'barrel-cluster',
  '1:1': 'stone-planter',
  '1:0': 'wooden-planter',
  '2:0': 'stone-planter',
  '3:3': 'dungeon-cage',
};

// Seat prop sits on a legal/solution cell: a character can be placed on it (the prop
// renders under the avatar), doubling as a positional hint ("seated in the pew").
const seatPropsByPosition: Record<string, PropAssetId> = {
  '0:4': 'church-pew',
};

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set(Object.keys(decorativePropsByPosition));

const chamberByPosition = [
  ['terrace', 'terrace', 'powder-store', 'powder-store', 'signal-chapel', 'signal-chapel'],
  ['terrace', 'terrace', 'terrace', 'powder-store', 'signal-chapel', 'signal-chapel'],
  ['terrace', 'terrace', 'terrace', 'powder-store', 'signal-chapel', 'signal-chapel'],
  ['mess-hall', 'mess-hall', 'quarters', 'powder-store', 'signal-chapel', 'signal-chapel'],
  ['mess-hall', 'mess-hall', 'quarters', 'quarters', 'signal-chapel', 'signal-chapel'],
  ['mess-hall', 'mess-hall', 'quarters', 'quarters', 'signal-chapel', 'signal-chapel'],
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
  courier: { row: 3, column: 5 },
  'watch-captain': { row: 0, column: 4 },
  powderman: { row: 1, column: 3 },
  lieutenant: { row: 4, column: 2 },
  herbalist: { row: 2, column: 1 },
  cook: { row: 5, column: 0 },
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
