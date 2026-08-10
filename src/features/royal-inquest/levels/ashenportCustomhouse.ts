import type { GridPosition } from '../../../shared/geometry';
import type { CharacterId, InquestCell, InquestDefinition } from '../types';

// Generated with murdoku-logic-engine's generatePuzzle/solve (seed 3341, difficulty 2), then
// hand-polished: placeholder ids renamed to case fiction, seat props mapped onto real
// PropAssetIds (one distinct seat asset per chamber to keep on-prop lookups unambiguous).
const cells: InquestCell[] = [
  { position: { row: 0, column: 0 }, chamberId: 'weighing-room', blocked: false },
  { position: { row: 0, column: 1 }, chamberId: 'weighing-room', blocked: false, propId: 'simple-chair' },
  { position: { row: 0, column: 2 }, chamberId: 'ledger-hall', blocked: false },
  { position: { row: 0, column: 3 }, chamberId: 'ledger-hall', blocked: false },
  { position: { row: 0, column: 4 }, chamberId: 'harbor-chapel', blocked: false },
  { position: { row: 0, column: 5 }, chamberId: 'harbor-chapel', blocked: false },
  { position: { row: 1, column: 0 }, chamberId: 'weighing-room', blocked: false },
  { position: { row: 1, column: 1 }, chamberId: 'weighing-room', blocked: false },
  { position: { row: 1, column: 2 }, chamberId: 'ledger-hall', blocked: false },
  { position: { row: 1, column: 3 }, chamberId: 'ledger-hall', blocked: false },
  { position: { row: 1, column: 4 }, chamberId: 'ledger-hall', blocked: false, propId: 'wooden-bench' },
  { position: { row: 1, column: 5 }, chamberId: 'harbor-chapel', blocked: false },
  { position: { row: 2, column: 0 }, chamberId: 'weighing-room', blocked: false },
  { position: { row: 2, column: 1 }, chamberId: 'wardens-office', blocked: false },
  { position: { row: 2, column: 2 }, chamberId: 'collectors-office', blocked: false },
  { position: { row: 2, column: 3 }, chamberId: 'ledger-hall', blocked: false },
  { position: { row: 2, column: 4 }, chamberId: 'harbor-chapel', blocked: false },
  { position: { row: 2, column: 5 }, chamberId: 'harbor-chapel', blocked: false, propId: 'church-pew' },
  { position: { row: 3, column: 0 }, chamberId: 'wardens-office', blocked: false },
  { position: { row: 3, column: 1 }, chamberId: 'wardens-office', blocked: false },
  { position: { row: 3, column: 2 }, chamberId: 'collectors-office', blocked: false, propId: 'throne' },
  { position: { row: 3, column: 3 }, chamberId: 'ledger-hall', blocked: false },
  { position: { row: 3, column: 4 }, chamberId: 'harbor-chapel', blocked: false },
  { position: { row: 3, column: 5 }, chamberId: 'harbor-chapel', blocked: false },
  { position: { row: 4, column: 0 }, chamberId: 'wardens-office', blocked: false },
  { position: { row: 4, column: 1 }, chamberId: 'wardens-office', blocked: false },
  { position: { row: 4, column: 2 }, chamberId: 'collectors-office', blocked: false },
  { position: { row: 4, column: 3 }, chamberId: 'ledger-hall', blocked: false },
  { position: { row: 4, column: 4 }, chamberId: 'harbor-chapel', blocked: false },
  { position: { row: 4, column: 5 }, chamberId: 'collectors-office', blocked: false },
  { position: { row: 5, column: 0 }, chamberId: 'wardens-office', blocked: false },
  { position: { row: 5, column: 1 }, chamberId: 'wardens-office', blocked: false, propId: 'formal-chair' },
  { position: { row: 5, column: 2 }, chamberId: 'collectors-office', blocked: false },
  { position: { row: 5, column: 3 }, chamberId: 'collectors-office', blocked: false },
  { position: { row: 5, column: 4 }, chamberId: 'collectors-office', blocked: false },
  { position: { row: 5, column: 5 }, chamberId: 'collectors-office', blocked: false },
];

const chamberEnvironments: InquestDefinition['chamberEnvironments'] = {
  'weighing-room': 'room',
  'ledger-hall': 'room',
  'harbor-chapel': 'church',
  'collectors-office': 'royalRoom',
  'wardens-office': 'royalRoom',
};

const chamberNames: InquestDefinition['chamberNames'] = {
  'weighing-room': 'The Weighing Room',
  'ledger-hall': 'The Ledger Hall',
  'harbor-chapel': 'The Harbor Chapel',
  'collectors-office': "The Collector's Office",
  'wardens-office': "The Warden's Office",
};

const solution: Record<CharacterId, GridPosition> = {
  'customs-officer': { row: 2, column: 5 },
  stevedore: { row: 5, column: 0 },
  clerk: { row: 3, column: 2 },
  harbormaster: { row: 4, column: 4 },
  'tide-warden': { row: 0, column: 1 },
  tallyman: { row: 1, column: 3 },
};

export const ashenportCustomhouse: InquestDefinition = {
  id: 'ashenport-customhouse',
  title: 'The Ledger and the Lantern',
  definitionVersion: 1,
  difficulty: 2,
  rows: 6,
  columns: 6,
  characters: [
    { id: 'customs-officer', name: 'The Customs Officer', portraitLabel: 'Customs Officer', avatarId: 'guard-captain' },
    { id: 'stevedore', name: 'The Stevedore', portraitLabel: 'Stevedore', avatarId: 'prisoner' },
    { id: 'clerk', name: 'The Clerk', portraitLabel: 'Clerk', avatarId: 'scholar' },
    { id: 'tide-warden', name: 'The Tide Warden', portraitLabel: 'Tide Warden', avatarId: 'knight' },
    { id: 'tallyman', name: 'The Tallyman', portraitLabel: 'Tallyman', avatarId: 'merchant' },
    // The victim is always last: no clue names them directly; their cell is derived only by elimination.
    { id: 'harbormaster', name: 'The Harbormaster', portraitLabel: 'Harbormaster', avatarId: 'steward', isVictim: true },
  ],
  cells,
  chamberEnvironments,
  chamberNames,
  clues: [
    {
      id: 'tide-warden-not-with-stevedore',
      text: 'The Tide Warden and the Stevedore were never in the same room.',
      predicate: { type: 'different-chamber', firstCharacterId: 'tide-warden', secondCharacterId: 'stevedore' },
    },
    {
      id: 'clerk-seated',
      text: "The Clerk was found seated on the throne in the Collector's Office.",
      predicate: { type: 'on-prop', characterId: 'clerk', propId: 'throne' },
    },
    {
      id: 'stevedore-corner',
      text: "The Stevedore stood in a corner of the Warden's Office.",
      predicate: { type: 'in-corner', characterId: 'stevedore' },
    },
    {
      id: 'tallyman-interior',
      text: 'The Tallyman kept to the middle of the Ledger Hall, far from any wall.',
      predicate: { type: 'not-beside-wall', characterId: 'tallyman' },
    },
    {
      id: 'stevedore-wardens-office',
      text: "The Stevedore was seen in the Warden's Office.",
      predicate: { type: 'exact-chamber', characterId: 'stevedore', chamberId: 'wardens-office' },
    },
    {
      id: 'tide-warden-not-with-officer',
      text: 'The Tide Warden and the Customs Officer were never in the same room.',
      predicate: { type: 'different-chamber', firstCharacterId: 'tide-warden', secondCharacterId: 'customs-officer' },
    },
    {
      id: 'officer-seated',
      text: 'The Customs Officer was found seated on the pew in the Harbor Chapel.',
      predicate: { type: 'on-prop', characterId: 'customs-officer', propId: 'church-pew' },
    },
  ],
  traitorId: 'customs-officer',
  solution,
};
