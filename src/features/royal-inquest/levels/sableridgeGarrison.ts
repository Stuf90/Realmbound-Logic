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
  '3:3': 'dining-table',
  '4:1': 'stone-planter',
  '5:1': 'wooden-planter',
  '5:2': 'stone-planter',
  '5:3': 'kitchen-worktable',
  '5:4': 'dining-table',
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
  ['garrison-chapel', 'garrison-chapel', 'garrison-chapel', 'garrison-chapel', 'garrison-chapel', 'garrison-chapel'],
  ['garrison-chapel', 'garrison-chapel', 'garrison-chapel', 'garrison-chapel', 'garrison-chapel', 'garrison-chapel'],
  ['powder-vault', 'powder-vault', 'powder-vault', 'powder-vault', 'officer-quarters', 'officer-quarters'],
  ['powder-vault', 'drill-yard', 'drill-yard', 'officer-quarters', 'officer-quarters', 'officer-quarters'],
  ['drill-yard', 'drill-yard', 'drill-yard', 'garrison-mess', 'garrison-mess', 'garrison-mess'],
  ['drill-yard', 'drill-yard', 'drill-yard', 'garrison-mess', 'garrison-mess', 'garrison-mess'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'garrison-chapel': 'church',
  'powder-vault': 'dungeon',
  'officer-quarters': 'room',
  'drill-yard': 'garden',
  'garrison-mess': 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'garrison-chapel': 'Garrison Chapel',
  'powder-vault': 'Powder Vault',
  'officer-quarters': "Officer's Quarters",
  'drill-yard': 'Drill Yard',
  'garrison-mess': 'Garrison Mess',
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
  chaplain: { row: 0, column: 3 },
  sergeant: { row: 1, column: 0 },
  powderman: { row: 2, column: 1 },
  lieutenant: { row: 3, column: 4 },
  quartermaster: { row: 4, column: 2 },
  cook: { row: 5, column: 5 },
};

export const sableridgeGarrison: InquestDefinition = {
  id: 'sableridge-garrison',
  title: 'Mutiny at Sableridge Garrison',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'sergeant', name: 'The Watch-Sergeant', portraitLabel: 'Sergeant', avatarId: 'guard-captain' },
    { id: 'powderman', name: 'The Powderman', portraitLabel: 'Powderman', avatarId: 'steward' },
    { id: 'lieutenant', name: 'The Lieutenant', portraitLabel: 'Lieutenant', avatarId: 'knight' },
    { id: 'quartermaster', name: 'The Quartermaster', portraitLabel: 'Quartermaster', avatarId: 'merchant' },
    { id: 'cook', name: 'The Cook', portraitLabel: 'Cook', avatarId: 'cook' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'chaplain', name: 'The Garrison Chaplain', portraitLabel: 'Chaplain', avatarId: 'priest', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'sergeant-garrison-chapel',
      text: 'The Sergeant was seen in the Garrison Chapel.',
      predicate: { type: 'exact-chamber', characterId: 'sergeant', chamberId: 'garrison-chapel' },
    },
    {
      id: 'sergeant-seated',
      text: 'The Sergeant was found seated in the pew.',
      predicate: { type: 'on-prop', characterId: 'sergeant', propId: 'church-pew' },
    },
    {
      id: 'powderman-powder-vault',
      text: 'The Powderman was seen in the Powder Vault.',
      predicate: { type: 'exact-chamber', characterId: 'powderman', chamberId: 'powder-vault' },
    },
    {
      id: 'lieutenant-officer-quarters',
      text: "The Lieutenant was seen in the Officer's Quarters.",
      predicate: { type: 'exact-chamber', characterId: 'lieutenant', chamberId: 'officer-quarters' },
    },
    {
      id: 'quartermaster-drill-yard',
      text: 'The Quartermaster drilled alone in the Drill Yard.',
      predicate: { type: 'exact-chamber', characterId: 'quartermaster', chamberId: 'drill-yard' },
    },
    {
      id: 'cook-garrison-mess',
      text: 'The Cook was seen in the Garrison Mess.',
      predicate: { type: 'exact-chamber', characterId: 'cook', chamberId: 'garrison-mess' },
    },
  ],
  traitorId: 'sergeant',
  solution,
};
