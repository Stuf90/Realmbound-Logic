import type { GridPosition } from '../../../shared/geometry';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Generated with murdoku-logic-engine's generatePuzzle/solve (seed 1094, difficulty 1), then
// hand-polished: placeholder ids renamed to case fiction, seat props mapped onto real
// PropAssetIds. See docs/superpowers/plans/... for the murdoku-logic-engine batch this belongs
// to. Board/clue structure (chamber membership + one seat anchor per chamber) is exactly what
// the engine solved as unique — see levels.test.ts for the re-validation.
const cells: InquestCell[] = [
  { position: { row: 0, column: 0 }, chamberId: 'abbey-nave', blocked: false },
  { position: { row: 0, column: 1 }, chamberId: 'abbey-nave', blocked: false },
  { position: { row: 0, column: 2 }, chamberId: 'abbey-nave', blocked: false },
  { position: { row: 0, column: 3 }, chamberId: 'abbey-nave', blocked: false, propId: 'church-pew' },
  { position: { row: 0, column: 4 }, chamberId: 'abbey-nave', blocked: false },
  { position: { row: 1, column: 0 }, chamberId: 'the-vestry', blocked: false, propId: 'simple-chair' },
  { position: { row: 1, column: 1 }, chamberId: 'the-vestry', blocked: false },
  { position: { row: 1, column: 2 }, chamberId: 'the-vestry', blocked: false },
  { position: { row: 1, column: 3 }, chamberId: 'the-scriptorium', blocked: false },
  { position: { row: 1, column: 4 }, chamberId: 'abbey-nave', blocked: false },
  { position: { row: 2, column: 0 }, chamberId: 'the-vestry', blocked: false },
  { position: { row: 2, column: 1 }, chamberId: 'the-vestry', blocked: false },
  { position: { row: 2, column: 2 }, chamberId: 'the-vestry', blocked: false },
  { position: { row: 2, column: 3 }, chamberId: 'the-scriptorium', blocked: false },
  { position: { row: 2, column: 4 }, chamberId: 'abbey-nave', blocked: false },
  { position: { row: 3, column: 0 }, chamberId: 'chapter-house', blocked: false },
  { position: { row: 3, column: 1 }, chamberId: 'chapter-house', blocked: false },
  { position: { row: 3, column: 2 }, chamberId: 'chapter-house', blocked: false },
  { position: { row: 3, column: 3 }, chamberId: 'the-scriptorium', blocked: false, propId: 'wooden-bench' },
  { position: { row: 3, column: 4 }, chamberId: 'the-scriptorium', blocked: false },
  { position: { row: 4, column: 0 }, chamberId: 'chapter-house', blocked: false },
  { position: { row: 4, column: 1 }, chamberId: 'chapter-house', blocked: false },
  { position: { row: 4, column: 2 }, chamberId: 'chapter-house', blocked: false, propId: 'formal-chair' },
  { position: { row: 4, column: 3 }, chamberId: 'the-scriptorium', blocked: false },
  { position: { row: 4, column: 4 }, chamberId: 'the-scriptorium', blocked: false },
];

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'abbey-nave': 'church',
  'the-vestry': 'room',
  'the-scriptorium': 'room',
  'chapter-house': 'royalRoom',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'abbey-nave': 'Abbey Nave',
  'the-vestry': 'The Vestry',
  'the-scriptorium': 'The Scriptorium',
  'chapter-house': 'Chapter House',
};

const solution: Record<CharacterId, GridPosition> = {
  'novice-elara': { row: 2, column: 1 },
  'brother-aldric': { row: 0, column: 3 },
  almoner: { row: 1, column: 0 },
  'the-copyist': { row: 3, column: 4 },
  'the-cellarer': { row: 4, column: 2 },
};

export const thornwickAbbey: InquestDefinition = {
  id: 'thornwick-abbey',
  title: 'The Vestry Confession',
  definitionVersion: 1,
  difficulty: 1,
  rows: 5,
  columns: 5,
  characters: [
    { id: 'brother-aldric', name: 'Brother Aldric', portraitLabel: 'Brother Aldric', avatarId: 'priest' },
    { id: 'almoner', name: 'The Almoner', portraitLabel: 'Almoner', avatarId: 'monk' },
    { id: 'the-copyist', name: 'The Copyist', portraitLabel: 'Copyist', avatarId: 'scholar' },
    { id: 'the-cellarer', name: 'The Cellarer', portraitLabel: 'Cellarer', avatarId: 'steward' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'novice-elara', name: 'Novice Elara', portraitLabel: 'Novice Elara', avatarId: 'maid', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'copyist-scriptorium',
      text: 'The Copyist was seen in the Scriptorium.',
      predicate: { type: 'exact-chamber', characterId: 'the-copyist', chamberId: 'the-scriptorium' },
    },
    {
      id: 'aldric-seated',
      text: 'Brother Aldric was found seated in the Nave pew.',
      predicate: { type: 'on-prop', characterId: 'brother-aldric', propId: 'church-pew' },
    },
    {
      id: 'cellarer-seated',
      text: 'The Cellarer was found seated in Chapter House.',
      predicate: { type: 'on-prop', characterId: 'the-cellarer', propId: 'formal-chair' },
    },
    {
      id: 'almoner-seated',
      text: 'The Almoner was found seated in the Vestry.',
      predicate: { type: 'on-prop', characterId: 'almoner', propId: 'simple-chair' },
    },
  ],
  traitorId: 'almoner',
  solution,
};
