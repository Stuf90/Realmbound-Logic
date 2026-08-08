import type { GridPosition } from '../../../shared/geometry';
import type { PropAssetId } from '../../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Same chamber shape as Blackwood Keep (see ../definition.ts): one full-width top chamber
// hosting the victim + traitor, then four irregular chambers below sized so the
// exact-chamber clues plus the one-per-row/one-per-column rule force every non-victim
// character's cell uniquely — verified by `solveInquestDefinition` in levels.test.ts.
// Same-asset props are never placed in two orthogonally-adjacent cells — `5:3`/`5:4` use two
// different (but equally environment-legal) decorative assets instead of stamping `dungeon-cage`
// twice in a row, without changing which cells are blocked (that shape is load-bearing for
// `solveInquestDefinition`'s uniqueness proof). Likewise `4:1`/`5:2` alternate between the two
// dungeon-legal assets so they don't visually repeat across the `5:1` cell between them.
// `bookshelf-left`/`dining-table-left` have no adjacent same-chamber cell free of a solution cell or
// another prop to pair with here, so they use the non-split base asset instead of rendering half an
// object (see docs/royal-inquest/authoring/board-rooms-props.human.md).
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'bookshelf',
  '2:5': 'bookshelf',
  '5:4': 'dungeon-cage',
  '5:3': 'barrel-cluster',
  '3:3': 'dining-table',
  '2:3': 'barrel-cluster',
  '4:1': 'dungeon-cage',
  '5:1': 'barrel-cluster',
  '5:2': 'dungeon-cage',
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
  ['sanctuary', 'sanctuary', 'sanctuary', 'sanctuary', 'sanctuary', 'sanctuary'],
  ['sanctuary', 'sanctuary', 'sanctuary', 'sanctuary', 'sanctuary', 'sanctuary'],
  ['scriptorium', 'scriptorium', 'scriptorium', 'scriptorium', 'cloister', 'cloister'],
  ['scriptorium', 'crypt', 'crypt', 'cloister', 'cloister', 'cloister'],
  ['crypt', 'crypt', 'crypt', 'cellar', 'cellar', 'cellar'],
  ['crypt', 'crypt', 'crypt', 'cellar', 'cellar', 'cellar'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  sanctuary: 'church',
  scriptorium: 'room',
  cloister: 'room',
  crypt: 'dungeon',
  cellar: 'dungeon',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  sanctuary: 'The Sanctuary',
  scriptorium: 'Scriptorium',
  cloister: 'Cloister',
  crypt: 'The Crypt',
  cellar: 'Cellar',
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
  penitent: { row: 0, column: 3 },
  prior: { row: 1, column: 0 },
  scholar: { row: 2, column: 1 },
  monk: { row: 3, column: 4 },
  knight: { row: 4, column: 2 },
  captain: { row: 5, column: 5 },
};

export const ravensholtAbbey: InquestDefinition = {
  id: 'ravensholt-abbey',
  title: 'The Reckoning at Ravensholt Abbey',
  definitionVersion: 1,
  difficulty: 2,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'prior', name: 'The Prior', portraitLabel: 'Prior', avatarId: 'priest' },
    { id: 'scholar', name: 'The Scholar', portraitLabel: 'Scholar', avatarId: 'scholar' },
    { id: 'knight', name: 'The Knight', portraitLabel: 'Knight', avatarId: 'knight' },
    { id: 'captain', name: 'The Captain', portraitLabel: 'Captain', avatarId: 'guard-captain' },
    { id: 'monk', name: 'The Monk', portraitLabel: 'Monk', avatarId: 'monk' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'penitent', name: 'The Penitent Pilgrim', portraitLabel: 'Pilgrim', avatarId: 'prisoner', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'prior-sanctuary',
      text: 'The Prior was seen in the Sanctuary.',
      predicate: { type: 'exact-chamber', characterId: 'prior', chamberId: 'sanctuary' },
    },
    {
      id: 'prior-seated',
      text: 'The Prior was found seated in the pew.',
      predicate: { type: 'on-prop', characterId: 'prior', propId: 'church-pew' },
    },
    {
      id: 'scholar-scriptorium',
      text: 'The Scholar was seen in the Scriptorium.',
      predicate: { type: 'exact-chamber', characterId: 'scholar', chamberId: 'scriptorium' },
    },
    {
      id: 'monk-cloister',
      text: 'The Monk walked alone in the Cloister.',
      predicate: { type: 'exact-chamber', characterId: 'monk', chamberId: 'cloister' },
    },
    {
      id: 'knight-crypt',
      text: 'The Knight searched the Crypt.',
      predicate: { type: 'exact-chamber', characterId: 'knight', chamberId: 'crypt' },
    },
    {
      id: 'captain-cellar',
      text: 'The Captain was seen in the Cellar.',
      predicate: { type: 'exact-chamber', characterId: 'captain', chamberId: 'cellar' },
    },
  ],
  traitorId: 'prior',
  solution,
};
