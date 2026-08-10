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
  ['priory-hall', 'priory-hall', 'priory-hall', 'priory-hall', 'priory-hall', 'priory-hall'],
  ['priory-hall', 'priory-hall', 'priory-hall', 'priory-hall', 'priory-hall', 'priory-hall'],
  ['bone-crypt', 'bone-crypt', 'bone-crypt', 'bone-crypt', 'scriptorium', 'scriptorium'],
  ['bone-crypt', 'herb-cloister', 'herb-cloister', 'scriptorium', 'scriptorium', 'scriptorium'],
  ['herb-cloister', 'herb-cloister', 'herb-cloister', 'priory-kitchen', 'priory-kitchen', 'priory-kitchen'],
  ['herb-cloister', 'herb-cloister', 'herb-cloister', 'priory-kitchen', 'priory-kitchen', 'priory-kitchen'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'priory-hall': 'church',
  'bone-crypt': 'dungeon',
  scriptorium: 'room',
  'herb-cloister': 'garden',
  'priory-kitchen': 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'priory-hall': 'Priory Hall',
  'bone-crypt': 'Bone Crypt',
  scriptorium: 'Scriptorium',
  'herb-cloister': 'Herb Cloister',
  'priory-kitchen': 'Priory Kitchen',
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
  almswoman: { row: 0, column: 3 },
  prioress: { row: 1, column: 0 },
  gravekeeper: { row: 2, column: 1 },
  copyist: { row: 3, column: 4 },
  'herbalist-sister': { row: 4, column: 2 },
  kitchener: { row: 5, column: 5 },
};

export const graywickPriory: InquestDefinition = {
  id: 'graywick-priory',
  title: 'Blood on the Priory Stones',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'prioress', name: 'The Prioress', portraitLabel: 'Prioress', avatarId: 'priest' },
    { id: 'gravekeeper', name: 'The Gravekeeper', portraitLabel: 'Gravekeeper', avatarId: 'monk' },
    { id: 'copyist', name: 'The Copyist', portraitLabel: 'Copyist', avatarId: 'scholar' },
    { id: 'herbalist-sister', name: 'The Herbalist Sister', portraitLabel: 'Herbalist Sister', avatarId: 'gardener' },
    { id: 'kitchener', name: 'The Kitchener', portraitLabel: 'Kitchener', avatarId: 'cook' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'almswoman', name: 'The Wandering Almswoman', portraitLabel: 'Almswoman', avatarId: 'maid', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'prioress-priory-hall',
      text: 'The Prioress was seen in the Priory Hall.',
      predicate: { type: 'exact-chamber', characterId: 'prioress', chamberId: 'priory-hall' },
    },
    {
      id: 'prioress-seated',
      text: 'The Prioress was found seated in the pew.',
      predicate: { type: 'on-prop', characterId: 'prioress', propId: 'church-pew' },
    },
    {
      id: 'gravekeeper-bone-crypt',
      text: 'The Gravekeeper was seen in the Bone Crypt.',
      predicate: { type: 'exact-chamber', characterId: 'gravekeeper', chamberId: 'bone-crypt' },
    },
    {
      id: 'copyist-scriptorium',
      text: 'The Copyist was seen in the Scriptorium.',
      predicate: { type: 'exact-chamber', characterId: 'copyist', chamberId: 'scriptorium' },
    },
    {
      id: 'herbalist-sister-herb-cloister',
      text: 'The Herbalist Sister tended alone in the Herb Cloister.',
      predicate: { type: 'exact-chamber', characterId: 'herbalist-sister', chamberId: 'herb-cloister' },
    },
    {
      id: 'kitchener-priory-kitchen',
      text: 'The Kitchener was seen in the Priory Kitchen.',
      predicate: { type: 'exact-chamber', characterId: 'kitchener', chamberId: 'priory-kitchen' },
    },
  ],
  traitorId: 'prioress',
  solution,
};
