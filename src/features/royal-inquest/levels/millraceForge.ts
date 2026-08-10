import type { GridPosition } from '../../../shared/geometry';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Generated with murdoku-logic-engine's generatePuzzle/solve (seed 2047, difficulty 2), then
// hand-polished: placeholder ids renamed to case fiction, seat prop mapped onto a real
// PropAssetId. Re-validated with npm run inquest:solve after the rename.
const cells: InquestCell[] = [
  { position: { row: 0, column: 0 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 0, column: 1 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 0, column: 2 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 0, column: 3 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 0, column: 4 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 1, column: 0 }, chamberId: 'the-grain-store', blocked: false },
  { position: { row: 1, column: 1 }, chamberId: 'the-grain-store', blocked: false },
  { position: { row: 1, column: 2 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 1, column: 3 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 1, column: 4 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 2, column: 0 }, chamberId: 'the-grain-store', blocked: false },
  { position: { row: 2, column: 1 }, chamberId: 'the-grain-store', blocked: false },
  { position: { row: 2, column: 2 }, chamberId: 'the-grain-store', blocked: false },
  { position: { row: 2, column: 3 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 2, column: 4 }, chamberId: 'the-mill-yard', blocked: false },
  { position: { row: 3, column: 0 }, chamberId: 'the-grain-store', blocked: false },
  { position: { row: 3, column: 1 }, chamberId: 'the-forge-house', blocked: false },
  { position: { row: 3, column: 2 }, chamberId: 'the-forge-house', blocked: false },
  { position: { row: 3, column: 3 }, chamberId: 'the-forge-house', blocked: false },
  { position: { row: 3, column: 4 }, chamberId: 'the-forge-house', blocked: false },
  { position: { row: 4, column: 0 }, chamberId: 'the-grain-store', blocked: false },
  { position: { row: 4, column: 1 }, chamberId: 'the-forge-house', blocked: false },
  { position: { row: 4, column: 2 }, chamberId: 'the-forge-house', blocked: false, propId: 'wooden-bench' },
  { position: { row: 4, column: 3 }, chamberId: 'the-forge-house', blocked: false },
  { position: { row: 4, column: 4 }, chamberId: 'the-forge-house', blocked: false },
];

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'the-mill-yard': 'room',
  'the-forge-house': 'room',
  'the-grain-store': 'kitchen',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'the-mill-yard': 'The Mill Yard',
  'the-forge-house': 'The Forge House',
  'the-grain-store': 'The Grain Store',
};

const solution: Record<CharacterId, GridPosition> = {
  smith: { row: 4, column: 2 },
  'grain-merchant': { row: 1, column: 3 },
  miller: { row: 0, column: 0 },
  reeve: { row: 2, column: 4 },
  'millers-wife': { row: 3, column: 1 },
};

export const millraceForge: InquestDefinition = {
  id: 'millrace-forge',
  title: 'Sparks at the Forge House',
  definitionVersion: 1,
  difficulty: 2,
  rows: 5,
  columns: 5,
  characters: [
    { id: 'smith', name: 'The Smith', portraitLabel: 'Smith', avatarId: 'knight' },
    { id: 'grain-merchant', name: 'The Grain Merchant', portraitLabel: 'Grain Merchant', avatarId: 'merchant' },
    { id: 'miller', name: 'The Miller', portraitLabel: 'Miller', avatarId: 'gardener' },
    { id: 'reeve', name: 'The Reeve', portraitLabel: 'Reeve', avatarId: 'steward' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'millers-wife', name: "The Miller's Wife", portraitLabel: "Miller's Wife", avatarId: 'maid', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'merchant-interior',
      text: 'The Grain Merchant kept to the middle of the Mill Yard, far from any wall.',
      predicate: { type: 'not-beside-wall', characterId: 'grain-merchant' },
    },
    {
      id: 'miller-reeve-same-yard',
      text: 'The Miller and the Reeve were both seen in the Mill Yard.',
      predicate: { type: 'same-chamber', firstCharacterId: 'miller', secondCharacterId: 'reeve' },
    },
    {
      id: 'miller-corner',
      text: 'The Miller stood in a corner of the yard.',
      predicate: { type: 'in-corner', characterId: 'miller' },
    },
    {
      id: 'smith-seated',
      text: 'The Smith was found seated on the bench in the Forge House.',
      predicate: { type: 'on-prop', characterId: 'smith', propId: 'wooden-bench' },
    },
  ],
  traitorId: 'smith',
  solution,
};
