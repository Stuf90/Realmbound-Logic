import type { GridPosition } from '../../shared/geometry';
import type { PropAssetId } from '../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from './types';

// The Solar spans the full top two rows (all 6 columns) so it can host both the envoy and the
// traitor without squeezing every other chamber below it into a single shared column. The remaining
// four rows are split into four irregular chambers (not a uniform 2x2 grid) so that, combined with
// the exact-chamber clues below and the one-per-row/one-per-column rule, each non-victim character's
// cell is uniquely forced — verified by `solveInquestDefinition` in definitionValidation.test.ts.
// Same-asset props are never placed in two orthogonally-adjacent cells — `5:3`/`5:4` and `2:3`/`3:3`
// each use two different (but equally environment-legal) decorative assets instead of stamping the
// same one twice in a row, without changing which cells are blocked (that shape is load-bearing for
// `solveInquestDefinition`'s uniqueness proof — see the comment above).
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '3:0': 'barrel-cluster',
  '2:5': 'bookshelf',
  '5:4': 'dungeon-cage',
  '5:3': 'barrel-cluster',
  '3:3': 'dining-table',
  '2:3': 'barrel-cluster',
  '4:1': 'candle-stand',
  '5:1': 'offering-chest',
  '5:2': 'candle-stand',
};

// Seat props sit on a legal/solution cell instead of a blocked one: a character can be placed on
// them (the prop renders under the avatar), so they can double as a positional hint ("seated in
// the chair") rather than only decorating an impassable tile.
const seatPropsByPosition: Record<string, PropAssetId> = {
  '1:0': 'formal-chair',
};

const propsByPosition: Record<string, PropAssetId> = {
  ...decorativePropsByPosition,
  ...seatPropsByPosition,
};

const blockedCells = new Set(Object.keys(decorativePropsByPosition));

const chamberByPosition = [
  ['solar', 'solar', 'solar', 'solar', 'solar', 'solar'],
  ['solar', 'solar', 'solar', 'solar', 'solar', 'solar'],
  ['guardroom', 'guardroom', 'guardroom', 'guardroom', 'archives', 'archives'],
  ['guardroom', 'chapel', 'chapel', 'archives', 'archives', 'archives'],
  ['chapel', 'chapel', 'chapel', 'crypt', 'crypt', 'crypt'],
  ['chapel', 'chapel', 'chapel', 'crypt', 'crypt', 'crypt'],
] as const;

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  solar: 'royalRoom',
  guardroom: 'room',
  archives: 'room',
  chapel: 'church',
  crypt: 'dungeon',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  solar: 'The Solar',
  guardroom: 'Guardroom',
  chapel: 'Chapel',
  archives: 'Archives',
  crypt: 'The Crypt',
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
  envoy: { row: 0, column: 3 },
  aldric: { row: 1, column: 0 },
  beatrice: { row: 2, column: 1 },
  edmund: { row: 3, column: 4 },
  cedric: { row: 4, column: 2 },
  daria: { row: 5, column: 5 },
};

export const blackwoodKeep: InquestDefinition = {
  id: 'blackwood-keep',
  title: 'The Treason at Blackwood Keep',
  definitionVersion: 1,
  difficulty: 2,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'aldric', name: 'Lord Aldric', portraitLabel: 'Aldric', avatarId: 'nobleman' },
    { id: 'beatrice', name: 'Lady Beatrice', portraitLabel: 'Beatrice', avatarId: 'noblewoman' },
    { id: 'cedric', name: 'Sir Cedric', portraitLabel: 'Cedric', avatarId: 'knight' },
    // No dedicated "Dame" avatar exists in the pack; guard-captain is the nearest fit for an authority figure who searched the keep.
    { id: 'daria', name: 'Dame Daria', portraitLabel: 'Daria', avatarId: 'guard-captain' },
    { id: 'edmund', name: 'Brother Edmund', portraitLabel: 'Edmund', avatarId: 'monk' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'envoy', name: 'The Royal Envoy', portraitLabel: 'Royal Envoy', avatarId: 'royal-envoy', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'aldric-solar',
      text: 'Aldric was seen in the Solar.',
      predicate: { type: 'exact-chamber', characterId: 'aldric', chamberId: 'solar' },
    },
    {
      id: 'aldric-seated',
      text: 'Aldric was found seated in the chair.',
      predicate: { type: 'on-prop', characterId: 'aldric', propId: 'formal-chair' },
    },
    {
      id: 'beatrice-guardroom',
      text: 'Beatrice was seen in the Guardroom.',
      predicate: { type: 'exact-chamber', characterId: 'beatrice', chamberId: 'guardroom' },
    },
    {
      id: 'cedric-chapel',
      text: 'Cedric prayed alone in the Chapel.',
      predicate: { type: 'exact-chamber', characterId: 'cedric', chamberId: 'chapel' },
    },
    {
      id: 'edmund-archives',
      text: 'Edmund was seen among the Archives.',
      predicate: { type: 'exact-chamber', characterId: 'edmund', chamberId: 'archives' },
    },
    {
      id: 'daria-crypt',
      text: 'Daria searched the Crypt.',
      predicate: { type: 'exact-chamber', characterId: 'daria', chamberId: 'crypt' },
    },
    {
      id: 'aldric-not-beside-edmund',
      text: 'Aldric was never seen beside Edmund.',
      predicate: {
        type: 'not-beside',
        firstCharacterId: 'aldric',
        secondCharacterId: 'edmund',
      },
    },
  ],
  traitorId: 'aldric',
  solution,
};
