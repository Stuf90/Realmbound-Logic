// Source: murdoku-logic-engine example-cases/easy-13.ts (commit 4d816cd07a2ee79ccda6e4d7bc61cc13397ef570)
// — real case name not used elsewhere in this file.
import type { MurdokuDefinition } from 'murdoku-logic-engine';
import type { RoyalInquestSkin } from '../skin';

export const title = 'The Silent Sonata';

// difficulty 2 (not 1): near-prop, axis-offset-from and direction-from are tier-2 predicates,
// which the engine's difficulty gate rejects at difficulty 1.
export const definition: MurdokuDefinition = {
  id: 'easy-13',
  version: 1,
  rows: 6,
  columns: 6,
  difficulty: 2,
  suspects: [
    { id: 'A', label: 'A' },
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
    { id: 'D', label: 'D' },
    { id: 'E', label: 'E' },
    { id: 'F', label: 'F', isVictim: true },
  ],
  rooms: [
    { id: 'room-1', label: 'Room 1' },
    { id: 'room-2', label: 'Room 2' },
    { id: 'room-3', label: 'Room 3' },
    { id: 'room-4', label: 'Room 4' },
  ],
  props: [
    { id: 'asset-1-1', kind: 'decorative' },
    { id: 'asset-2-1', kind: 'decorative' },
    { id: 'asset-3*-1', kind: 'seat' },
    { id: 'asset-4*-1', kind: 'seat' },
  ],
  cells: [
    { position: { row: 0, column: 0 }, roomId: 'room-1', blocked: false },
    { position: { row: 0, column: 1 }, roomId: 'room-1', blocked: false },
    { position: { row: 0, column: 2 }, roomId: 'room-1', blocked: false },
    { position: { row: 0, column: 3 }, roomId: 'room-1', blocked: true, propId: 'asset-1-1' },
    { position: { row: 0, column: 4 }, roomId: 'room-1', blocked: false },
    { position: { row: 0, column: 5 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 0 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 1 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 2 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 3 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 4 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 5 }, roomId: 'room-1', blocked: false },
    { position: { row: 2, column: 0 }, roomId: 'room-2', blocked: false, propId: 'asset-4*-1' },
    { position: { row: 2, column: 1 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 2 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 4 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 5 }, roomId: 'room-2', blocked: false, propId: 'asset-3*-1' },
    { position: { row: 3, column: 0 }, roomId: 'room-2', blocked: false },
    { position: { row: 3, column: 1 }, roomId: 'room-2', blocked: false },
    { position: { row: 3, column: 2 }, roomId: 'room-2', blocked: false },
    { position: { row: 3, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 3, column: 4 }, roomId: 'room-2', blocked: false },
    { position: { row: 3, column: 5 }, roomId: 'room-2', blocked: false },
    { position: { row: 4, column: 0 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 1 }, roomId: 'room-3', blocked: true, propId: 'asset-2-1' },
    { position: { row: 4, column: 2 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 3 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 4 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 5 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 0 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 1 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 2 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 3 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 4 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 5 }, roomId: 'room-4', blocked: false },
  ],
  clues: [
    {
      id: 'clue-1',
      text: 'A is in room-4',
      predicate: { type: 'exact-room', suspectId: 'A', roomId: 'room-4' },
    },
    {
      id: 'clue-2',
      text: 'B is beside asset-2-1',
      predicate: { type: 'near-prop', suspectId: 'B', propId: 'asset-2-1' },
    },
    {
      id: 'clue-3',
      text: 'C is beside asset-1-1',
      predicate: { type: 'near-prop', suspectId: 'C', propId: 'asset-1-1' },
    },
    {
      id: 'clue-4',
      text: 'D is exactly 1 row north of C',
      predicate: { type: 'axis-offset-from', subjectSuspectId: 'D', referenceSuspectId: 'C', axis: 'row', offset: -1 },
    },
    {
      id: 'clue-3b',
      text: 'Someone is in the same room as C and north of C',
      predicate: {
        type: 'one-of',
        options: [
          {
            type: 'all-of',
            predicates: [
              { type: 'same-room', firstSuspectId: 'A', secondSuspectId: 'C' },
              { type: 'direction-from', subjectSuspectId: 'A', referenceSuspectId: 'C', direction: 'north' },
            ],
          },
          {
            type: 'all-of',
            predicates: [
              { type: 'same-room', firstSuspectId: 'B', secondSuspectId: 'C' },
              { type: 'direction-from', subjectSuspectId: 'B', referenceSuspectId: 'C', direction: 'north' },
            ],
          },
          {
            type: 'all-of',
            predicates: [
              { type: 'same-room', firstSuspectId: 'D', secondSuspectId: 'C' },
              { type: 'direction-from', subjectSuspectId: 'D', referenceSuspectId: 'C', direction: 'north' },
            ],
          },
          {
            type: 'all-of',
            predicates: [
              { type: 'same-room', firstSuspectId: 'E', secondSuspectId: 'C' },
              { type: 'direction-from', subjectSuspectId: 'E', referenceSuspectId: 'C', direction: 'north' },
            ],
          },
        ],
      },
    },
    {
      id: 'clue-5',
      text: 'E is on asset-4*-1',
      predicate: { type: 'on-prop', suspectId: 'E', propId: 'asset-4*-1' },
    },
    {
      id: 'clue-6',
      text: '(supplemental) A is in column 5',
      predicate: { type: 'exact-column', suspectId: 'A', column: 5 },
    },
    {
      id: 'clue-7',
      text: '(supplemental) D is in column 1',
      predicate: { type: 'exact-column', suspectId: 'D', column: 1 },
    },
  ],
  murdererId: 'E',
  solution: {
    A: { row: 5, column: 5 },
    B: { row: 4, column: 2 },
    C: { row: 1, column: 3 },
    D: { row: 0, column: 1 },
    E: { row: 2, column: 0 },
    F: { row: 3, column: 4 },
  },
};

export const skin: RoyalInquestSkin = {
  suspects: {
    A: { name: 'Lady Annora', avatarId: 'noblewoman' },
    B: { name: 'Sir Boren', avatarId: 'knight' },
    C: { name: 'Sister Clarimond', avatarId: 'monk' },
    D: { name: 'Steward Dorian', avatarId: 'steward' },
    E: { name: 'Handmaiden Evaine', avatarId: 'maid' },
    F: { name: 'Lady Vada', avatarId: 'royal-consort' },
  },
  rooms: {
    'room-1': { name: 'the Grand Hall', environment: 'hallway' },
    'room-2': { name: 'the Music Room', environment: 'room' },
    'room-3': { name: 'the Foyer', environment: 'royalRoom' },
    'room-4': { name: 'the Wardrobe', environment: 'room' },
  },
  props: {
    'asset-1-1': { assetId: 'bookshelf' },
    'asset-2-1': { assetId: 'stone-planter' },
    'asset-3*-1': { assetId: 'simple-chair' },
    'asset-4*-1': { assetId: 'formal-chair' },
  },
};
