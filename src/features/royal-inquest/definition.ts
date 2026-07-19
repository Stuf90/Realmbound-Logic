import type { GridPosition } from '../../shared/geometry';
import type { CharacterId, InquestCell, InquestDefinition } from './types';

const blockedCells = new Set(['0:5', '1:4', '2:2', '3:4', '4:1', '5:4']);

const chamberByPosition = [
  ['solar', 'solar', 'west-gallery', 'west-gallery', 'east-gallery', 'east-gallery'],
  ['solar', 'solar', 'west-gallery', 'west-gallery', 'east-gallery', 'east-gallery'],
  ['guardroom', 'guardroom', 'great-hall', 'great-hall', 'gallery', 'gallery'],
  ['guardroom', 'guardroom', 'great-hall', 'great-hall', 'gallery', 'gallery'],
  ['chapel', 'chapel', 'archives', 'archives', 'chapel', 'chapel'],
  ['crypt', 'crypt', 'archives', 'archives', 'crypt', 'crypt'],
] as const;

const legalCharacterIdsByPosition: Record<string, CharacterId[]> = {
  '0:1': ['envoy'],
  '1:0': ['aldric'],
  '2:4': ['beatrice'],
  '3:3': ['cedric'],
  '4:5': ['daria'],
  '5:2': ['edmund'],
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
    };
  }),
);

const solution: Record<CharacterId, GridPosition> = {
  envoy: { row: 0, column: 1 },
  aldric: { row: 1, column: 0 },
  beatrice: { row: 2, column: 4 },
  cedric: { row: 3, column: 3 },
  daria: { row: 4, column: 5 },
  edmund: { row: 5, column: 2 },
};

export const blackwoodKeep: InquestDefinition = {
  id: 'blackwood-keep',
  title: 'The Treason at Blackwood Keep',
  definitionVersion: 1,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'envoy', name: 'The Royal Envoy', portraitLabel: 'Royal Envoy', isVictim: true },
    { id: 'aldric', name: 'Lord Aldric', portraitLabel: 'Aldric' },
    { id: 'beatrice', name: 'Lady Beatrice', portraitLabel: 'Beatrice' },
    { id: 'cedric', name: 'Sir Cedric', portraitLabel: 'Cedric' },
    { id: 'daria', name: 'Dame Daria', portraitLabel: 'Daria' },
    { id: 'edmund', name: 'Brother Edmund', portraitLabel: 'Edmund' },
  ],
  cells,
  clues: [
    {
      id: 'envoy-first-row',
      text: 'The envoy was seen along the northern wall.',
      predicate: { type: 'exact-row', characterId: 'envoy', row: 0 },
    },
    {
      id: 'envoy-second-column',
      text: 'The envoy stood in the second column.',
      predicate: { type: 'exact-column', characterId: 'envoy', column: 1 },
    },
    {
      id: 'aldric-first-column',
      text: 'Aldric kept to the western edge of the Solar.',
      predicate: { type: 'exact-column', characterId: 'aldric', column: 0 },
    },
    {
      id: 'beatrice-fifth-column',
      text: 'Beatrice occupied the fifth column.',
      predicate: { type: 'exact-column', characterId: 'beatrice', column: 4 },
    },
    {
      id: 'cedric-fourth-column',
      text: 'Cedric kept watch in the fourth column.',
      predicate: { type: 'exact-column', characterId: 'cedric', column: 3 },
    },
    {
      id: 'daria-fifth-row',
      text: 'Daria searched the fifth row.',
      predicate: { type: 'exact-row', characterId: 'daria', row: 4 },
    },
    {
      id: 'edmund-sixth-row',
      text: 'Edmund descended to the sixth row.',
      predicate: { type: 'exact-row', characterId: 'edmund', row: 5 },
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
  ],
  traitorId: 'aldric',
  solution,
};
