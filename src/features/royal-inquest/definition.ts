import type { GridPosition } from '../../shared/geometry';
import type { PropAssetId } from '../../assets/royal-inquest/manifest';
import type { CharacterId, InquestCell, InquestDefinition } from './types';

// Every chamber below is a 2-row x 3-column block (>= 5-tile minimum), so blocked cells double as
// prop anchors without ever colliding with a solution/legal cell. Board is square (6x6) so future
// levels can scale up (8x8, 10x10, ...) while keeping the same board-fit CSS contract.
const decorativePropsByPosition: Record<string, PropAssetId> = {
  '0:0': 'throne',
  '0:3': 'formal-chair',
  '3:0': 'barrel-cluster',
  '2:5': 'bookshelf',
  '4:0': 'church-pew',
  '5:4': 'dungeon-cage',
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
  ['solar', 'solar', 'solar', 'great-hall', 'great-hall', 'great-hall'],
  ['solar', 'solar', 'solar', 'great-hall', 'great-hall', 'great-hall'],
  ['guardroom', 'guardroom', 'guardroom', 'archives', 'archives', 'archives'],
  ['guardroom', 'guardroom', 'guardroom', 'archives', 'archives', 'archives'],
  ['chapel', 'chapel', 'chapel', 'crypt', 'crypt', 'crypt'],
  ['chapel', 'chapel', 'chapel', 'crypt', 'crypt', 'crypt'],
] as const;

const legalCharacterIdsByPosition: Record<string, CharacterId[]> = {
  '0:1': ['envoy'],
  '1:0': ['aldric'],
  '2:2': ['beatrice'],
  '3:4': ['edmund'],
  '4:3': ['cedric'],
  '5:5': ['daria'],
};

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  solar: 'royalRoom',
  'great-hall': 'royalRoom',
  guardroom: 'room',
  archives: 'room',
  chapel: 'church',
  crypt: 'dungeon',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  solar: 'The Solar',
  guardroom: 'Guardroom',
  'great-hall': 'Great Hall',
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
      ...(legalCharacterIdsByPosition[key]
        ? { legalCharacterIds: legalCharacterIdsByPosition[key] }
        : {}),
      ...(propsByPosition[key] ? { propId: propsByPosition[key] } : {}),
    };
  }),
);

const solution: Record<CharacterId, GridPosition> = {
  envoy: { row: 0, column: 1 },
  aldric: { row: 1, column: 0 },
  beatrice: { row: 2, column: 2 },
  edmund: { row: 3, column: 4 },
  cedric: { row: 4, column: 3 },
  daria: { row: 5, column: 5 },
};

export const blackwoodKeep: InquestDefinition = {
  id: 'blackwood-keep',
  title: 'The Treason at Blackwood Keep',
  definitionVersion: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'aldric', name: 'Lord Aldric', portraitLabel: 'Aldric', avatarId: 'nobleman' },
    { id: 'beatrice', name: 'Lady Beatrice', portraitLabel: 'Beatrice', avatarId: 'noblewoman' },
    { id: 'cedric', name: 'Sir Cedric', portraitLabel: 'Cedric', avatarId: 'knight' },
    // No dedicated "Dame" avatar exists in the pack; guard-captain is the nearest fit for an authority figure who searched the keep.
    { id: 'daria', name: 'Dame Daria', portraitLabel: 'Daria', avatarId: 'guard-captain' },
    { id: 'edmund', name: 'Brother Edmund', portraitLabel: 'Edmund', avatarId: 'monk' },
    // The victim is always last: the only clue naming them is the one placing them with their killer.
    { id: 'envoy', name: 'The Royal Envoy', portraitLabel: 'Royal Envoy', avatarId: 'royal-envoy', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'aldric-first-column',
      text: 'Aldric was seated in a chair against the western wall of the Solar.',
      predicate: { type: 'exact-column', characterId: 'aldric', column: 0 },
    },
    {
      id: 'beatrice-third-column',
      text: 'Beatrice occupied the third column.',
      predicate: { type: 'exact-column', characterId: 'beatrice', column: 2 },
    },
    {
      id: 'cedric-fourth-column',
      text: 'Cedric kept watch in the fourth column.',
      predicate: { type: 'exact-column', characterId: 'cedric', column: 3 },
    },
    {
      id: 'daria-sixth-row',
      text: 'Daria searched the sixth row.',
      predicate: { type: 'exact-row', characterId: 'daria', row: 5 },
    },
    {
      id: 'edmund-fourth-row',
      text: 'Edmund descended to the fourth row.',
      predicate: { type: 'exact-row', characterId: 'edmund', row: 3 },
    },
    {
      id: 'solar-witnesses',
      text: 'Only Aldric remained in the envoy’s chamber.',
      predicate: {
        type: 'same-chamber',
        firstCharacterId: 'aldric',
        secondCharacterId: 'envoy',
      },
    },
    {
      id: 'beatrice-apart-from-cedric',
      text: 'Beatrice and Cedric were in different chambers.',
      predicate: {
        type: 'different-chamber',
        firstCharacterId: 'beatrice',
        secondCharacterId: 'cedric',
      },
    },
    {
      id: 'edmund-archives',
      text: 'Edmund was seen among the Archives.',
      predicate: { type: 'exact-chamber', characterId: 'edmund', chamberId: 'archives' },
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
