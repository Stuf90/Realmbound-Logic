import type { GridPosition } from '../../../shared/geometry';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Generated with murdoku-logic-engine's generatePuzzle/solve (seed 4004, difficulty 3), then
// hand-polished: placeholder ids renamed to case fiction, seat props mapped onto real
// PropAssetIds. `diagonal-from`/`offset-from` clues below were restricted at generation time to
// the engine's candidate subset that matches Royal Inquest's own (stricter) predicate semantics
// — see the murdoku-logic-engine batch script this case came from.
const cells: InquestCell[] = [
  { position: { row: 0, column: 0 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 0, column: 1 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 0, column: 2 }, chamberId: 'map-vault', blocked: false, propId: 'simple-chair' },
  { position: { row: 0, column: 3 }, chamberId: 'map-vault', blocked: false },
  { position: { row: 0, column: 4 }, chamberId: 'map-vault', blocked: false },
  { position: { row: 0, column: 5 }, chamberId: 'map-vault', blocked: false },
  { position: { row: 1, column: 0 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 1, column: 1 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 1, column: 2 }, chamberId: 'map-vault', blocked: false },
  { position: { row: 1, column: 3 }, chamberId: 'map-vault', blocked: false },
  { position: { row: 1, column: 4 }, chamberId: 'map-vault', blocked: false },
  { position: { row: 1, column: 5 }, chamberId: 'map-vault', blocked: false },
  { position: { row: 2, column: 0 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 2, column: 1 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 2, column: 2 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 2, column: 3 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 2, column: 4 }, chamberId: 'restricted-shelf', blocked: false },
  { position: { row: 2, column: 5 }, chamberId: 'restricted-shelf', blocked: false },
  { position: { row: 3, column: 0 }, chamberId: 'copyists-nook', blocked: false },
  { position: { row: 3, column: 1 }, chamberId: 'copyists-nook', blocked: false },
  { position: { row: 3, column: 2 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 3, column: 3 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 3, column: 4 }, chamberId: 'restricted-shelf', blocked: false },
  { position: { row: 3, column: 5 }, chamberId: 'restricted-shelf', blocked: false },
  { position: { row: 4, column: 0 }, chamberId: 'copyists-nook', blocked: false },
  { position: { row: 4, column: 1 }, chamberId: 'copyists-nook', blocked: false },
  { position: { row: 4, column: 2 }, chamberId: 'copyists-nook', blocked: false },
  { position: { row: 4, column: 3 }, chamberId: 'reading-room', blocked: false, propId: 'wooden-bench' },
  { position: { row: 4, column: 4 }, chamberId: 'restricted-shelf', blocked: false },
  { position: { row: 4, column: 5 }, chamberId: 'restricted-shelf', blocked: false, propId: 'formal-chair' },
  { position: { row: 5, column: 0 }, chamberId: 'copyists-nook', blocked: false },
  { position: { row: 5, column: 1 }, chamberId: 'copyists-nook', blocked: false, propId: 'church-pew' },
  { position: { row: 5, column: 2 }, chamberId: 'copyists-nook', blocked: false },
  { position: { row: 5, column: 3 }, chamberId: 'reading-room', blocked: false },
  { position: { row: 5, column: 4 }, chamberId: 'restricted-shelf', blocked: false },
  { position: { row: 5, column: 5 }, chamberId: 'restricted-shelf', blocked: false },
];

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'reading-room': 'room',
  'map-vault': 'room',
  'restricted-shelf': 'royalRoom',
  'copyists-nook': 'church',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'reading-room': 'The Reading Room',
  'map-vault': 'The Map Vault',
  'restricted-shelf': 'The Restricted Shelf',
  'copyists-nook': "The Copyist's Nook",
};

const solution: Record<CharacterId, GridPosition> = {
  'apprentice-archivist': { row: 2, column: 4 },
  'chief-archivist': { row: 5, column: 5 },
  cartographer: { row: 1, column: 1 },
  'court-historian': { row: 3, column: 3 },
  bookbinder: { row: 4, column: 2 },
  registrar: { row: 0, column: 0 },
};

export const vellumArchive: InquestDefinition = {
  id: 'vellum-archive',
  title: 'A Theft From the Restricted Shelf',
  definitionVersion: 1,
  difficulty: 3,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'chief-archivist', name: 'The Chief Archivist', portraitLabel: 'Chief Archivist', avatarId: 'scholar' },
    { id: 'cartographer', name: 'The Cartographer', portraitLabel: 'Cartographer', avatarId: 'merchant' },
    { id: 'court-historian', name: 'The Court Historian', portraitLabel: 'Court Historian', avatarId: 'nobleman' },
    { id: 'bookbinder', name: 'The Bookbinder', portraitLabel: 'Bookbinder', avatarId: 'steward' },
    { id: 'registrar', name: 'The Registrar', portraitLabel: 'Registrar', avatarId: 'court-physician' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'apprentice-archivist', name: 'The Apprentice Archivist', portraitLabel: 'Apprentice Archivist', avatarId: 'maid', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'cartographer-registrar-same-room',
      text: 'The Cartographer and the Registrar were both seen in the Reading Room.',
      predicate: { type: 'same-chamber', firstCharacterId: 'cartographer', secondCharacterId: 'registrar' },
    },
    {
      id: 'archivist-offset-cartographer',
      text: 'The Chief Archivist sat exactly four rows south and four columns east of the Cartographer.',
      predicate: {
        type: 'offset-from',
        subjectCharacterId: 'chief-archivist',
        referenceCharacterId: 'cartographer',
        rowOffset: 4,
        columnOffset: 4,
      },
    },
    {
      id: 'archivist-corner',
      text: 'The Chief Archivist was seen in a corner of the Restricted Shelf.',
      predicate: { type: 'in-corner', characterId: 'chief-archivist' },
    },
    {
      id: 'historian-offset-archivist',
      text: 'The Court Historian sat exactly two rows north and two columns west of the Chief Archivist.',
      predicate: {
        type: 'offset-from',
        subjectCharacterId: 'court-historian',
        referenceCharacterId: 'chief-archivist',
        rowOffset: -2,
        columnOffset: -2,
      },
    },
    {
      id: 'historian-reading-room',
      text: 'The Court Historian was seen in the Reading Room.',
      predicate: { type: 'exact-chamber', characterId: 'court-historian', chamberId: 'reading-room' },
    },
    {
      id: 'bookbinder-copyists-nook',
      text: "The Bookbinder was seen in the Copyist's Nook.",
      predicate: { type: 'exact-chamber', characterId: 'bookbinder', chamberId: 'copyists-nook' },
    },
    {
      id: 'registrar-reading-room',
      text: 'The Registrar was seen in the Reading Room.',
      predicate: { type: 'exact-chamber', characterId: 'registrar', chamberId: 'reading-room' },
    },
    {
      id: 'registrar-corner',
      text: 'The Registrar was seen in a corner of the Reading Room.',
      predicate: { type: 'in-corner', characterId: 'registrar' },
    },
    {
      id: 'cartographer-diagonal-registrar',
      text: 'The Cartographer was diagonally adjacent to the Registrar.',
      predicate: { type: 'diagonal-from', firstCharacterId: 'cartographer', secondCharacterId: 'registrar' },
    },
    {
      id: 'bookbinder-diagonal-historian',
      text: 'The Bookbinder was diagonally adjacent to the Court Historian.',
      predicate: { type: 'diagonal-from', firstCharacterId: 'bookbinder', secondCharacterId: 'court-historian' },
    },
  ],
  traitorId: 'chief-archivist',
  solution,
};
