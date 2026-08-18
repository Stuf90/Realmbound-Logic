import type { GridPosition } from '../../../shared/geometry';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Generated with murdoku-logic-engine's generatePuzzle/solve (seed 5008, difficulty 3), then
// hand-polished: placeholder ids renamed to case fiction, seat props mapped onto real
// PropAssetIds. `diagonal-from`/`not-diagonal-from` clues below were restricted at generation
// time to the engine's candidate subset that matches Royal Inquest's own (stricter) semantics.
const cells: InquestCell[] = [
  { position: { row: 0, column: 0 }, chamberId: 'guardroom', blocked: false },
  { position: { row: 0, column: 1 }, chamberId: 'wayside-shrine', blocked: false },
  { position: { row: 0, column: 2 }, chamberId: 'weigh-station', blocked: false },
  { position: { row: 0, column: 3 }, chamberId: 'weigh-station', blocked: false },
  { position: { row: 0, column: 4 }, chamberId: 'weigh-station', blocked: false },
  { position: { row: 0, column: 5 }, chamberId: 'weigh-station', blocked: false, propId: 'simple-chair' },
  { position: { row: 1, column: 0 }, chamberId: 'guardroom', blocked: false },
  { position: { row: 1, column: 1 }, chamberId: 'wayside-shrine', blocked: false },
  { position: { row: 1, column: 2 }, chamberId: 'weigh-station', blocked: false },
  { position: { row: 1, column: 3 }, chamberId: 'weigh-station', blocked: false },
  { position: { row: 1, column: 4 }, chamberId: 'weigh-station', blocked: false },
  { position: { row: 1, column: 5 }, chamberId: 'weigh-station', blocked: false },
  { position: { row: 2, column: 0 }, chamberId: 'guardroom', blocked: false, propId: 'wooden-bench' },
  { position: { row: 2, column: 1 }, chamberId: 'wayside-shrine', blocked: false, propId: 'church-pew' },
  { position: { row: 2, column: 2 }, chamberId: 'tollmasters-hall', blocked: false },
  { position: { row: 2, column: 3 }, chamberId: 'tollmasters-hall', blocked: false },
  { position: { row: 2, column: 4 }, chamberId: 'tollmasters-hall', blocked: false },
  { position: { row: 2, column: 5 }, chamberId: 'tollmasters-hall', blocked: false },
  { position: { row: 3, column: 0 }, chamberId: 'guardroom', blocked: false },
  { position: { row: 3, column: 1 }, chamberId: 'wayside-shrine', blocked: false },
  { position: { row: 3, column: 2 }, chamberId: 'wayside-shrine', blocked: false },
  { position: { row: 3, column: 3 }, chamberId: 'tollmasters-hall', blocked: false, propId: 'throne' },
  { position: { row: 3, column: 4 }, chamberId: 'strongbox-room', blocked: false },
  { position: { row: 3, column: 5 }, chamberId: 'tollmasters-hall', blocked: false },
  { position: { row: 4, column: 0 }, chamberId: 'guardroom', blocked: false },
  { position: { row: 4, column: 1 }, chamberId: 'wayside-shrine', blocked: false },
  { position: { row: 4, column: 2 }, chamberId: 'wayside-shrine', blocked: false },
  { position: { row: 4, column: 3 }, chamberId: 'wayside-shrine', blocked: false },
  { position: { row: 4, column: 4 }, chamberId: 'strongbox-room', blocked: false },
  { position: { row: 4, column: 5 }, chamberId: 'strongbox-room', blocked: false },
  { position: { row: 5, column: 0 }, chamberId: 'guardroom', blocked: false },
  { position: { row: 5, column: 1 }, chamberId: 'guardroom', blocked: false },
  { position: { row: 5, column: 2 }, chamberId: 'strongbox-room', blocked: false, propId: 'formal-chair' },
  { position: { row: 5, column: 3 }, chamberId: 'strongbox-room', blocked: false },
  { position: { row: 5, column: 4 }, chamberId: 'strongbox-room', blocked: false },
  { position: { row: 5, column: 5 }, chamberId: 'strongbox-room', blocked: false },
];

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'weigh-station': 'room',
  guardroom: 'room',
  'wayside-shrine': 'church',
  'tollmasters-hall': 'royalRoom',
  'strongbox-room': 'royalRoom',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'weigh-station': 'The Weigh Station',
  guardroom: 'The Guardroom',
  'wayside-shrine': 'The Wayside Shrine',
  'tollmasters-hall': "The Tollmaster's Hall",
  'strongbox-room': 'The Strongbox Room',
};

const solution: Record<CharacterId, GridPosition> = {
  drover: { row: 1, column: 3 },
  'toll-keeper': { row: 0, column: 1 },
  sexton: { row: 3, column: 2 },
  bailiff: { row: 2, column: 4 },
  'wool-trader': { row: 4, column: 0 },
  'coin-clerk': { row: 5, column: 5 },
};

export const gallowmereTollhouse: InquestDefinition = {
  id: 'gallowmere-tollhouse',
  title: 'The Shrine at the Crossing',
  definitionVersion: 1,
  difficulty: 3,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'drover', name: 'The Drover', portraitLabel: 'Drover', avatarId: 'gardener' },
    { id: 'sexton', name: 'The Sexton', portraitLabel: 'Sexton', avatarId: 'monk' },
    { id: 'bailiff', name: 'The Bailiff', portraitLabel: 'Bailiff', avatarId: 'guard-captain' },
    { id: 'wool-trader', name: 'The Wool Trader', portraitLabel: 'Wool Trader', avatarId: 'merchant' },
    { id: 'coin-clerk', name: 'The Coin Clerk', portraitLabel: 'Coin Clerk', avatarId: 'scholar' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'toll-keeper', name: 'The Toll Keeper', portraitLabel: 'Toll Keeper', avatarId: 'steward', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'sexton-not-diagonal-drover',
      text: 'The Sexton was never diagonally adjacent to the Drover.',
      predicate: { type: 'not-diagonal-from', firstCharacterId: 'sexton', secondCharacterId: 'drover' },
    },
    {
      id: 'sexton-wayside-shrine',
      text: 'The Sexton was seen at the Wayside Shrine.',
      predicate: { type: 'exact-chamber', characterId: 'sexton', chamberId: 'wayside-shrine' },
    },
    {
      id: 'sexton-offset-wool-trader',
      text: 'The Sexton sat exactly one row north and two columns east of the Wool Trader.',
      predicate: {
        type: 'offset-from',
        subjectCharacterId: 'sexton',
        referenceCharacterId: 'wool-trader',
        rowOffset: -1,
        columnOffset: 2,
      },
    },
    {
      id: 'bailiff-tollmasters-hall',
      text: "The Bailiff was seen in the Tollmaster's Hall.",
      predicate: { type: 'exact-chamber', characterId: 'bailiff', chamberId: 'tollmasters-hall' },
    },
    {
      id: 'bailiff-diagonal-drover',
      text: 'The Bailiff was diagonally adjacent to the Drover.',
      predicate: { type: 'diagonal-from', firstCharacterId: 'bailiff', secondCharacterId: 'drover' },
    },
    {
      id: 'bailiff-offset-coin-clerk',
      text: 'The Bailiff sat exactly three rows north and one column west of the Coin Clerk.',
      predicate: {
        type: 'offset-from',
        subjectCharacterId: 'bailiff',
        referenceCharacterId: 'coin-clerk',
        rowOffset: -3,
        columnOffset: -1,
      },
    },
  ],
  traitorId: 'sexton',
  solution,
};
