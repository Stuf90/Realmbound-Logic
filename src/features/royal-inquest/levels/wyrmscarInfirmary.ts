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
  '2:5': 'stone-planter',
  '3:3': 'wooden-planter',
  '4:1': 'candle-stand',
  '5:1': 'offering-chest',
  '5:2': 'candle-stand',
  '5:3': 'kitchen-worktable',
  '5:4': 'dining-table',
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
  ['infirmary-ward', 'infirmary-ward', 'infirmary-ward', 'infirmary-ward', 'infirmary-ward', 'infirmary-ward'],
  ['infirmary-ward', 'infirmary-ward', 'infirmary-ward', 'infirmary-ward', 'infirmary-ward', 'infirmary-ward'],
  ['bone-store', 'bone-store', 'bone-store', 'bone-store', 'herb-store', 'herb-store'],
  ['bone-store', 'chapel-corner', 'chapel-corner', 'herb-store', 'herb-store', 'herb-store'],
  ['chapel-corner', 'chapel-corner', 'chapel-corner', 'infirmary-kitchen', 'infirmary-kitchen', 'infirmary-kitchen'],
  ['chapel-corner', 'chapel-corner', 'chapel-corner', 'infirmary-kitchen', 'infirmary-kitchen', 'infirmary-kitchen'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'infirmary-ward': 'room',
  'bone-store': 'dungeon',
  'herb-store': 'garden',
  'chapel-corner': 'church',
  'infirmary-kitchen': 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'infirmary-ward': 'Infirmary Ward',
  'bone-store': 'Bone Store',
  'herb-store': 'Herb Store',
  'chapel-corner': 'Chapel Corner',
  'infirmary-kitchen': 'Infirmary Kitchen',
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
  noble: { row: 0, column: 3 },
  physician: { row: 1, column: 0 },
  bonesetter: { row: 2, column: 1 },
  herbalist: { row: 3, column: 4 },
  'infirmary-chaplain': { row: 4, column: 2 },
  'ward-cook': { row: 5, column: 5 },
};

export const wyrmscarInfirmary: InquestDefinition = {
  id: 'wyrmscar-infirmary',
  title: 'Fever at Wyrmscar Infirmary',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'physician', name: 'The Chief Physician', portraitLabel: 'Physician', avatarId: 'court-physician' },
    { id: 'bonesetter', name: 'The Bonesetter', portraitLabel: 'Bonesetter', avatarId: 'monk' },
    { id: 'herbalist', name: 'The Herbalist', portraitLabel: 'Herbalist', avatarId: 'gardener' },
    { id: 'infirmary-chaplain', name: 'The Infirmary Chaplain', portraitLabel: 'Chaplain', avatarId: 'priest' },
    { id: 'ward-cook', name: 'The Ward Cook', portraitLabel: 'Ward Cook', avatarId: 'cook' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'noble', name: 'The Bedridden Noble', portraitLabel: 'Noble', avatarId: 'nobleman', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'physician-infirmary-ward',
      text: 'The Physician was seen in the Infirmary Ward.',
      predicate: { type: 'exact-chamber', characterId: 'physician', chamberId: 'infirmary-ward' },
    },
    {
      id: 'physician-seated',
      text: 'The Physician was found seated in the chair.',
      predicate: { type: 'on-prop', characterId: 'physician', propId: 'simple-chair' },
    },
    {
      id: 'bonesetter-bone-store',
      text: 'The Bonesetter was seen in the Bone Store.',
      predicate: { type: 'exact-chamber', characterId: 'bonesetter', chamberId: 'bone-store' },
    },
    {
      id: 'herbalist-herb-store',
      text: 'The Herbalist was seen in the Herb Store.',
      predicate: { type: 'exact-chamber', characterId: 'herbalist', chamberId: 'herb-store' },
    },
    {
      id: 'infirmary-chaplain-chapel-corner',
      text: 'The Chaplain prayed alone in the Chapel Corner.',
      predicate: { type: 'exact-chamber', characterId: 'infirmary-chaplain', chamberId: 'chapel-corner' },
    },
    {
      id: 'ward-cook-infirmary-kitchen',
      text: 'The Ward Cook was seen in the Infirmary Kitchen.',
      predicate: { type: 'exact-chamber', characterId: 'ward-cook', chamberId: 'infirmary-kitchen' },
    },
  ],
  traitorId: 'physician',
  solution,
};
