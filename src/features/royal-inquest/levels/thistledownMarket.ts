import type { GridPosition } from '../../../shared/geometry';
import type { PropAssetId } from '../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Same chamber shape as the archived template cases (see ../levels/archive/): one full-width top
// chamber hosting the victim + traitor, then four irregular chambers below sized so the
// exact-chamber clues plus the one-per-row/one-per-column rule force every non-victim
// character's cell uniquely — verified by `solveInquestDefinition` in levels.test.ts.
// `2:2`/`2:3` alternate decorative assets so they don't stamp the same one twice in a row.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'dining-table',
  '2:5': 'wooden-planter',
  '5:4': 'offering-chest',
  '5:3': 'candle-stand',
  '3:3': 'stone-planter',
  '2:2': 'kitchen-worktable',
  '4:1': 'dungeon-cage',
  '5:1': 'barrel-cluster',
  '5:2': 'dungeon-cage',
  '2:3': 'dining-table',
};

// Seat prop sits on a legal/solution cell: a character can be placed on it (the prop
// renders under the avatar), doubling as a positional hint ("seated in the chair").
const seatPropsByPosition: Record<string, PropAssetId> = {
  '1:0': 'simple-chair',
};

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set(Object.keys(decorativePropsByPosition));

const chamberByPosition = [
  ['market-hall', 'market-hall', 'market-hall', 'market-hall', 'market-hall', 'market-hall'],
  ['market-hall', 'market-hall', 'market-hall', 'market-hall', 'market-hall', 'market-hall'],
  ['spice-stall', 'spice-stall', 'spice-stall', 'spice-stall', 'flower-stall', 'flower-stall'],
  ['spice-stall', 'storage-vault', 'storage-vault', 'flower-stall', 'flower-stall', 'flower-stall'],
  ['storage-vault', 'storage-vault', 'storage-vault', 'shrine-corner', 'shrine-corner', 'shrine-corner'],
  ['storage-vault', 'storage-vault', 'storage-vault', 'shrine-corner', 'shrine-corner', 'shrine-corner'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'market-hall': 'room',
  'spice-stall': 'kitchen',
  'flower-stall': 'garden',
  'storage-vault': 'dungeon',
  'shrine-corner': 'church',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'market-hall': 'Market Hall',
  'spice-stall': 'Spice Stall',
  'flower-stall': 'Flower Stall',
  'storage-vault': 'Storage Vault',
  'shrine-corner': 'Shrine Corner',
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
  stallmaster: { row: 1, column: 0 },
  'spice-merchant': { row: 2, column: 1 },
  florist: { row: 3, column: 4 },
  'vault-keeper': { row: 4, column: 2 },
  'shrine-keeper': { row: 5, column: 5 },
};

export const thistledownMarket: InquestDefinition = {
  id: 'thistledown-market',
  title: 'Shadows over Thistledown Market',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'stallmaster', name: 'The Stallmaster', portraitLabel: 'Stallmaster', avatarId: 'merchant' },
    { id: 'spice-merchant', name: 'The Spice Merchant', portraitLabel: 'Spice Merchant', avatarId: 'cook' },
    { id: 'florist', name: 'The Florist', portraitLabel: 'Florist', avatarId: 'maid' },
    { id: 'vault-keeper', name: 'The Vault Keeper', portraitLabel: 'Vault Keeper', avatarId: 'guard-captain' },
    { id: 'shrine-keeper', name: 'The Shrine Keeper', portraitLabel: 'Shrine Keeper', avatarId: 'monk' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'assessor', name: 'The Assessor', portraitLabel: 'Assessor', avatarId: 'royal-envoy', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'stallmaster-market-hall',
      text: 'The Stallmaster was seen in the Market Hall.',
      predicate: { type: 'exact-chamber', characterId: 'stallmaster', chamberId: 'market-hall' },
    },
    {
      id: 'stallmaster-seated',
      text: 'The Stallmaster was found seated in the chair.',
      predicate: { type: 'on-prop', characterId: 'stallmaster', propId: 'simple-chair' },
    },
    {
      id: 'spice-merchant-spice-stall',
      text: 'The Spice Merchant was seen at the Spice Stall.',
      predicate: { type: 'exact-chamber', characterId: 'spice-merchant', chamberId: 'spice-stall' },
    },
    {
      id: 'florist-flower-stall',
      text: 'The Florist was seen at the Flower Stall.',
      predicate: { type: 'exact-chamber', characterId: 'florist', chamberId: 'flower-stall' },
    },
    {
      id: 'vault-keeper-storage-vault',
      text: 'The Vault Keeper watched alone over the Storage Vault.',
      predicate: { type: 'exact-chamber', characterId: 'vault-keeper', chamberId: 'storage-vault' },
    },
    {
      id: 'shrine-keeper-shrine-corner',
      text: 'The Shrine Keeper was seen at the Shrine Corner.',
      predicate: { type: 'exact-chamber', characterId: 'shrine-keeper', chamberId: 'shrine-corner' },
    },
  ],
  traitorId: 'stallmaster',
  solution,
};
