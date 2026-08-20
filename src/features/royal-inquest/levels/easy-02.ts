// Source: murdoku-logic-engine example-cases/easy-02.ts (commit 9264e2a623165af9e83382a2cd66fa94fe66bda5)
// — real case name not used elsewhere in this file.
import type { MurdokuDefinition } from 'murdoku-logic-engine';
import type { RoyalInquestSkin } from '../skin';

export const title = 'The Vanished Falconer';

export const definition: MurdokuDefinition = {
  id: 'easy-02',
  version: 1,
  rows: 5,
  columns: 5,
  difficulty: 2,
  suspects: [
    { id: 'A', label: 'A' },
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
    { id: 'D', label: 'D' },
    { id: 'E', label: 'E', isVictim: true },
  ],
  rooms: [
    { id: 'room-1', label: 'Room 1' },
    { id: 'room-2', label: 'Room 2' },
    { id: 'room-3', label: 'Room 3' },
  ],
  props: [
    { id: 'asset-1-1', kind: 'decorative' },
    { id: 'asset-2-1', kind: 'decorative' },
  ],
  cells: [
    { position: { row: 0, column: 0 }, roomId: 'room-3', blocked: true, propId: 'asset-1-1' },
    { position: { row: 0, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 0, column: 2 }, roomId: 'room-3', blocked: false },
    { position: { row: 0, column: 3 }, roomId: 'room-1', blocked: true },
    { position: { row: 0, column: 4 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 0 }, roomId: 'room-3', blocked: true },
    { position: { row: 1, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 1, column: 2 }, roomId: 'room-3', blocked: false },
    { position: { row: 1, column: 3 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 4 }, roomId: 'room-1', blocked: true },
    { position: { row: 2, column: 0 }, roomId: 'room-3', blocked: false },
    { position: { row: 2, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 2, column: 2 }, roomId: 'room-2', blocked: true },
    { position: { row: 2, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 4 }, roomId: 'room-2', blocked: true },
    { position: { row: 3, column: 0 }, roomId: 'room-3', blocked: true },
    { position: { row: 3, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 3, column: 2 }, roomId: 'room-2', blocked: true, propId: 'asset-2-1' },
    { position: { row: 3, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 3, column: 4 }, roomId: 'room-2', blocked: false },
    { position: { row: 4, column: 0 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 2 }, roomId: 'room-2', blocked: false },
    { position: { row: 4, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 4, column: 4 }, roomId: 'room-2', blocked: true },
  ],
  clues: [
    {
      id: 'clue-1',
      text: 'A is in room-1',
      predicate: { type: 'exact-room', suspectId: 'A', roomId: 'room-1' },
    },
    {
      id: 'clue-2',
      text: 'B is beside asset-2-1',
      predicate: { type: 'near-prop', suspectId: 'B', propId: 'asset-2-1' },
    },
    {
      id: 'clue-3',
      text: 'C and B are in different rooms',
      predicate: { type: 'different-room', firstSuspectId: 'C', secondSuspectId: 'B' },
    },
    {
      id: 'clue-4',
      text: 'D is beside asset-1-1',
      predicate: { type: 'near-prop', suspectId: 'D', propId: 'asset-1-1' },
    },
    {
      id: 'clue-5',
      text: '(supplemental) A is in column 3',
      predicate: { type: 'exact-column', suspectId: 'A', column: 3 },
    },
  ],
  murdererId: 'B',
  solution: {
    A: { row: 1, column: 3 },
    B: { row: 4, column: 2 },
    C: { row: 2, column: 0 },
    D: { row: 0, column: 1 },
    E: { row: 3, column: 4 },
  },
};

export const skin: RoyalInquestSkin = {
  suspects: {
    A: { name: 'Lady Elowen', avatarId: 'noblewoman' },
    B: { name: 'Sir Bastian', avatarId: 'knight' },
    C: { name: 'Brother Corwin', avatarId: 'monk' },
    D: { name: 'Mistress Della', avatarId: 'maid' },
    E: { name: 'Constable Edda', avatarId: 'guard-captain' },
  },
  rooms: {
    'room-1': { name: 'the Falconry', environment: 'garden' },
    'room-2': { name: 'the Armory', environment: 'room' },
    'room-3': { name: 'the Cloister Walk', environment: 'room' },
  },
  props: {
    'asset-1-1': { assetId: 'barrel-cluster' },
    'asset-2-1': { assetId: 'bookshelf' },
  },
};
