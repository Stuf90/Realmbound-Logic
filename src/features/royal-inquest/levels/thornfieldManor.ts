import type { GridPosition } from '../../../shared/geometry';
import type { PropAssetId } from '../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Same chamber shape as Blackwood Keep (see ../definition.ts): one full-width top chamber
// hosting the victim + traitor, then four irregular chambers below sized so the
// exact-chamber clues plus the one-per-row/one-per-column rule force every non-victim
// character's cell uniquely — verified by `solveInquestDefinition` in levels.test.ts.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'kitchen-worktable',
  '2:5': 'bookshelf',
  '5:4': 'barrel-cluster',
  '5:3': 'barrel-cluster',
  '3:3': 'dining-table',
  '2:3': 'kitchen-worktable-right',
};

// Seat prop sits on a legal/solution cell: a character can be placed on it (the prop
// renders under the avatar), doubling as a positional hint ("seated in the chair").
const seatPropsByPosition: Record<string, PropAssetId> = {
  '1:0': 'simple-chair',
};

// Plain impassable cells with no prop art.
const blockedNoPropCells = new Set(['5:2', '4:1', '5:1']);

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set([...Object.keys(decorativePropsByPosition), ...blockedNoPropCells]);

const chamberByPosition = [
  ['hall', 'hall', 'hall', 'hall', 'hall', 'hall'],
  ['hall', 'hall', 'hall', 'hall', 'hall', 'hall'],
  ['kitchen', 'kitchen', 'kitchen', 'kitchen', 'parlor', 'parlor'],
  ['kitchen', 'garden', 'garden', 'parlor', 'parlor', 'parlor'],
  ['garden', 'garden', 'garden', 'larder', 'larder', 'larder'],
  ['garden', 'garden', 'garden', 'larder', 'larder', 'larder'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  hall: 'room',
  kitchen: 'kitchen',
  parlor: 'room',
  garden: 'garden',
  larder: 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  hall: 'The Great Hall',
  kitchen: 'Kitchen',
  parlor: 'Parlor',
  garden: 'Garden',
  larder: 'Larder',
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
  physician: { row: 0, column: 3 },
  steward: { row: 1, column: 0 },
  cook: { row: 2, column: 1 },
  maid: { row: 3, column: 4 },
  gardener: { row: 4, column: 2 },
  merchant: { row: 5, column: 5 },
};

export const thornfieldManor: InquestDefinition = {
  id: 'thornfield-manor',
  title: 'The Vanishing at Thornfield Manor',
  definitionVersion: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'steward', name: 'The Steward', portraitLabel: 'Steward', avatarId: 'steward' },
    { id: 'cook', name: 'The Cook', portraitLabel: 'Cook', avatarId: 'cook' },
    { id: 'gardener', name: 'The Gardener', portraitLabel: 'Gardener', avatarId: 'gardener' },
    { id: 'merchant', name: 'The Merchant', portraitLabel: 'Merchant', avatarId: 'merchant' },
    { id: 'maid', name: 'The Maid', portraitLabel: 'Maid', avatarId: 'maid' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'physician', name: 'The Traveling Physician', portraitLabel: 'Physician', avatarId: 'court-physician', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'steward-hall',
      text: 'The Steward was seen in the Great Hall.',
      predicate: { type: 'exact-chamber', characterId: 'steward', chamberId: 'hall' },
    },
    {
      id: 'steward-seated',
      text: 'The Steward was found seated in the chair.',
      predicate: { type: 'on-prop', characterId: 'steward', propId: 'simple-chair' },
    },
    {
      id: 'cook-kitchen',
      text: 'The Cook was seen in the Kitchen.',
      predicate: { type: 'exact-chamber', characterId: 'cook', chamberId: 'kitchen' },
    },
    {
      id: 'maid-parlor',
      text: 'The Maid was seen among the Parlor.',
      predicate: { type: 'exact-chamber', characterId: 'maid', chamberId: 'parlor' },
    },
    {
      id: 'gardener-garden',
      text: 'The Gardener tended alone in the Garden.',
      predicate: { type: 'exact-chamber', characterId: 'gardener', chamberId: 'garden' },
    },
    {
      id: 'merchant-larder',
      text: 'The Merchant searched the Larder.',
      predicate: { type: 'exact-chamber', characterId: 'merchant', chamberId: 'larder' },
    },
    {
      id: 'cook-apart-from-gardener',
      text: 'The Cook and the Gardener were in different chambers.',
      predicate: {
        type: 'different-chamber',
        firstCharacterId: 'cook',
        secondCharacterId: 'gardener',
      },
    },
    {
      id: 'steward-not-beside-maid',
      text: 'The Steward was never seen beside the Maid.',
      predicate: {
        type: 'not-beside',
        firstCharacterId: 'steward',
        secondCharacterId: 'maid',
      },
    },
  ],
  traitorId: 'steward',
  solution,
};
