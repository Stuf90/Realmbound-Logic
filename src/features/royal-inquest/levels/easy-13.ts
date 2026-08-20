// Source: murdoku-logic-engine example-cases/easy-13.ts (commit 9264e2a623165af9e83382a2cd66fa94fe66bda5)
// — real case name not used elsewhere in this file.
import type { MurdokuDefinition } from 'murdoku-logic-engine';
import type { RoyalInquestSkin } from '../skin';

export const title = 'The Silent Sonata';

// difficulty 2 (not 1): near-prop and direction-from (nested inside the one-of/all-of below) are
// tier-2 predicates, which the engine's difficulty gate rejects at difficulty 1.
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
    { id: 'asset-3*-2', kind: 'seat' },
    { id: 'asset-3*-3', kind: 'seat' },
    { id: 'asset-3*-4', kind: 'seat' },
    { id: 'asset-3*-5', kind: 'seat' },
    { id: 'asset-4*-1', kind: 'seat' },
    { id: 'asset-4*-2', kind: 'seat' },
    { id: 'asset-4*-3', kind: 'seat' },
  ],
  cells: [
    { position: { row: 0, column: 0 }, roomId: 'room-2', blocked: false, propId: 'asset-4*-1' },
    { position: { row: 0, column: 1 }, roomId: 'room-2', blocked: false },
    { position: { row: 0, column: 2 }, roomId: 'room-2', blocked: true, propId: 'asset-1-1' },
    { position: { row: 0, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 0, column: 4 }, roomId: 'room-2', blocked: false },
    { position: { row: 0, column: 5 }, roomId: 'room-1', blocked: false },
    { position: { row: 1, column: 0 }, roomId: 'room-2', blocked: false },
    { position: { row: 1, column: 1 }, roomId: 'room-2', blocked: false, propId: 'asset-3*-1' },
    { position: { row: 1, column: 2 }, roomId: 'room-2', blocked: false, propId: 'asset-3*-2' },
    { position: { row: 1, column: 3 }, roomId: 'room-2', blocked: false, propId: 'asset-3*-3' },
    { position: { row: 1, column: 4 }, roomId: 'room-2', blocked: false },
    { position: { row: 1, column: 5 }, roomId: 'room-1', blocked: false },
    { position: { row: 2, column: 0 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 1 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 2 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 4 }, roomId: 'room-2', blocked: false, propId: 'asset-4*-2' },
    { position: { row: 2, column: 5 }, roomId: 'room-1', blocked: false },
    { position: { row: 3, column: 0 }, roomId: 'room-4', blocked: false },
    { position: { row: 3, column: 1 }, roomId: 'room-4', blocked: false },
    { position: { row: 3, column: 2 }, roomId: 'room-1', blocked: false, propId: 'asset-4*-3' },
    { position: { row: 3, column: 3 }, roomId: 'room-1', blocked: false },
    { position: { row: 3, column: 4 }, roomId: 'room-1', blocked: false },
    { position: { row: 3, column: 5 }, roomId: 'room-1', blocked: false },
    { position: { row: 4, column: 0 }, roomId: 'room-4', blocked: false },
    { position: { row: 4, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 2 }, roomId: 'room-3', blocked: true, propId: 'asset-2-1' },
    { position: { row: 4, column: 3 }, roomId: 'room-3', blocked: false, propId: 'asset-3*-4' },
    { position: { row: 4, column: 4 }, roomId: 'room-3', blocked: false, propId: 'asset-3*-5' },
    { position: { row: 4, column: 5 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 0 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 2 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 3 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 4 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 5 }, roomId: 'room-3', blocked: false },
  ],
  // Daryl's "she was exactly one row north of someone beside the piano" is dropped: on the real board
  // (piano at room-2/(0,2)) the only suspect ever adjacent to the piano's cell is F, the victim, so
  // this real clue has no expressible non-victim referent on the actual diagram.
  // The case's board-wide "there was exactly one person on a carpet" is dropped: the real board has
  // five carpet cells (asset-3*-1..5), so it's no longer a trivial existential, but no predicate in
  // the vocabulary counts occupancy restricted to one prop type's instances specifically.
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
      id: 'clue-4',
      text: 'E is on asset-4*-2',
      predicate: { type: 'on-prop', suspectId: 'E', propId: 'asset-4*-2' },
    },
    {
      id: 'clue-5',
      text: '(supplemental) A is in row 4',
      predicate: { type: 'exact-row', suspectId: 'A', row: 3 },
    },
    {
      id: 'clue-6',
      text: '(supplemental) A is in column 1',
      predicate: { type: 'exact-column', suspectId: 'A', column: 0 },
    },
    {
      id: 'clue-7',
      text: '(supplemental) B is in row 5',
      predicate: { type: 'exact-row', suspectId: 'B', row: 4 },
    },
    {
      id: 'clue-8',
      text: '(supplemental) B is in column 2',
      predicate: { type: 'exact-column', suspectId: 'B', column: 1 },
    },
    {
      id: 'clue-9',
      text: '(supplemental) C is in row 6',
      predicate: { type: 'exact-row', suspectId: 'C', row: 5 },
    },
    {
      id: 'clue-10',
      text: '(supplemental) C is in column 4',
      predicate: { type: 'exact-column', suspectId: 'C', column: 3 },
    },
    {
      id: 'clue-11',
      text: '(supplemental) D is in row 1',
      predicate: { type: 'exact-row', suspectId: 'D', row: 0 },
    },
    {
      id: 'clue-12',
      text: '(supplemental) D is in column 6',
      predicate: { type: 'exact-column', suspectId: 'D', column: 5 },
    },
  ],
  murdererId: 'E',
  solution: {
    A: { row: 3, column: 0 },
    B: { row: 4, column: 1 },
    C: { row: 5, column: 3 },
    D: { row: 0, column: 5 },
    E: { row: 2, column: 4 },
    F: { row: 1, column: 2 },
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
    'room-1': { name: 'the Grand Hall', environment: 'room' },
    'room-2': { name: 'the Music Room', environment: 'room' },
    'room-3': { name: 'the Foyer', environment: 'room' },
    'room-4': { name: 'the Wardrobe', environment: 'room' },
  },
  props: {
    'asset-1-1': { assetId: 'bookshelf' },
    'asset-2-1': { assetId: 'barrel-cluster' },
    'asset-3*-1': { assetId: 'simple-chair' },
    'asset-3*-2': { assetId: 'wooden-bench' },
    'asset-3*-3': { assetId: 'simple-chair' },
    'asset-3*-4': { assetId: 'wooden-bench' },
    'asset-3*-5': { assetId: 'simple-chair' },
    'asset-4*-1': { assetId: 'wooden-bench' },
    'asset-4*-2': { assetId: 'simple-chair' },
    'asset-4*-3': { assetId: 'simple-chair' },
  },
};
