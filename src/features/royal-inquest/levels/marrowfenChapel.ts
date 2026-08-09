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
  ['nave', 'nave', 'nave', 'nave', 'nave', 'nave'],
  ['nave', 'nave', 'nave', 'nave', 'nave', 'nave'],
  ['vault', 'vault', 'vault', 'vault', 'vestry', 'vestry'],
  ['vault', 'cloister', 'cloister', 'vestry', 'vestry', 'vestry'],
  ['cloister', 'cloister', 'cloister', 'almonry', 'almonry', 'almonry'],
  ['cloister', 'cloister', 'cloister', 'almonry', 'almonry', 'almonry'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  nave: 'church',
  vault: 'dungeon',
  vestry: 'room',
  cloister: 'garden',
  almonry: 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  nave: 'Chapel Nave',
  vault: 'Charnel Vault',
  vestry: 'Vestry',
  cloister: 'Cloister Garden',
  almonry: 'Almonry Kitchen',
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
  pilgrim: { row: 0, column: 3 },
  sexton: { row: 1, column: 0 },
  gravedigger: { row: 2, column: 1 },
  curate: { row: 3, column: 4 },
  novice: { row: 4, column: 2 },
  almoner: { row: 5, column: 5 },
};

export const marrowfenChapel: InquestDefinition = {
  id: 'marrowfen-chapel',
  title: 'Blight at Marrowfen Chapel',
  definitionVersion: 1,
  difficulty: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'sexton', name: 'The Sexton', portraitLabel: 'Sexton', avatarId: 'priest' },
    { id: 'gravedigger', name: 'The Gravedigger', portraitLabel: 'Gravedigger', avatarId: 'monk' },
    { id: 'curate', name: 'The Curate', portraitLabel: 'Curate', avatarId: 'scholar' },
    { id: 'novice', name: 'The Novice', portraitLabel: 'Novice', avatarId: 'gardener' },
    { id: 'almoner', name: 'The Almoner', portraitLabel: 'Almoner', avatarId: 'cook' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'pilgrim', name: 'The Pilgrim Envoy', portraitLabel: 'Pilgrim', avatarId: 'prisoner', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'sexton-nave',
      text: 'The Sexton was seen in the Nave.',
      predicate: { type: 'exact-chamber', characterId: 'sexton', chamberId: 'nave' },
    },
    {
      id: 'sexton-seated',
      text: 'The Sexton was found seated in the pew.',
      predicate: { type: 'on-prop', characterId: 'sexton', propId: 'church-pew' },
    },
    {
      id: 'gravedigger-vault',
      text: 'The Gravedigger was seen in the Charnel Vault.',
      predicate: { type: 'exact-chamber', characterId: 'gravedigger', chamberId: 'vault' },
    },
    {
      id: 'curate-vestry',
      text: 'The Curate was seen in the Vestry.',
      predicate: { type: 'exact-chamber', characterId: 'curate', chamberId: 'vestry' },
    },
    {
      id: 'novice-cloister',
      text: 'The Novice walked alone in the Cloister Garden.',
      predicate: { type: 'exact-chamber', characterId: 'novice', chamberId: 'cloister' },
    },
    {
      id: 'almoner-almonry',
      text: 'The Almoner was seen in the Almonry Kitchen.',
      predicate: { type: 'exact-chamber', characterId: 'almoner', chamberId: 'almonry' },
    },
  ],
  traitorId: 'sexton',
  solution,
};
