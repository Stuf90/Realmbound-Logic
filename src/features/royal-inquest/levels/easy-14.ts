// Source: murdoku-logic-engine example-cases/easy-14.ts (commit 9264e2a623165af9e83382a2cd66fa94fe66bda5)
// — real case name not used elsewhere in this file.
import type { MurdokuDefinition } from 'murdoku-logic-engine';
import type { RoyalInquestSkin } from '../skin';

export const title = "The Coachman's Corner";

// difficulty 2 (not 1): axis-offset-from is a tier-2 predicate, which the engine's difficulty gate
// rejects at difficulty 1.
// Board re-derived from the source diagram. The real board also labels a "Convenience Store" area
// (bookshelf-lined tiled floor, between Yard and Sidewalk); no suspect ever occupies it in this
// case's authored solution, so it isn't modeled as its own room — its cells are folded into
// Sidewalk instead. Every real prop in that area (the three bookshelves, plus a decorative board)
// is still modeled at its true cell.
export const definition: MurdokuDefinition = {
  id: 'easy-14',
  version: 1,
  rows: 7,
  columns: 7,
  difficulty: 2,
  suspects: [
    { id: 'A', label: 'A' },
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
    { id: 'D', label: 'D' },
    { id: 'E', label: 'E' },
    { id: 'F', label: 'F' },
    { id: 'G', label: 'G', isVictim: true },
  ],
  rooms: [
    { id: 'room-1', label: 'Room 1' },
    { id: 'room-2', label: 'Room 2' },
    { id: 'room-3', label: 'Room 3' },
    { id: 'room-4', label: 'Room 4' },
  ],
  props: [
    { id: 'asset-1*-1', kind: 'seat' },
    { id: 'asset-2*-1', kind: 'seat' },
    { id: 'asset-3-1', kind: 'decorative' },
    { id: 'asset-3-2', kind: 'decorative' },
    { id: 'asset-3-3', kind: 'decorative' },
    { id: 'asset-4*-1', kind: 'seat' },
    { id: 'asset-4*-2', kind: 'seat' },
    { id: 'asset-5-1', kind: 'decorative' },
    { id: 'asset-6-1', kind: 'decorative' },
    { id: 'asset-6-2', kind: 'decorative' },
    { id: 'asset-6-3', kind: 'decorative' },
  ],
  cells: [
    { position: { row: 0, column: 0 }, roomId: 'room-2', blocked: false },
    { position: { row: 0, column: 1 }, roomId: 'room-2', blocked: false },
    { position: { row: 0, column: 2 }, roomId: 'room-2', blocked: true, propId: 'asset-3-1' },
    { position: { row: 0, column: 3 }, roomId: 'room-2', blocked: false },
    { position: { row: 0, column: 4 }, roomId: 'room-4', blocked: false },
    { position: { row: 0, column: 5 }, roomId: 'room-4', blocked: true, propId: 'asset-5-1' },
    { position: { row: 0, column: 6 }, roomId: 'room-4', blocked: false },
    { position: { row: 1, column: 0 }, roomId: 'room-2', blocked: false },
    { position: { row: 1, column: 1 }, roomId: 'room-2', blocked: false },
    { position: { row: 1, column: 2 }, roomId: 'room-2', blocked: false },
    { position: { row: 1, column: 3 }, roomId: 'room-4', blocked: true, propId: 'asset-6-1' },
    { position: { row: 1, column: 4 }, roomId: 'room-4', blocked: false },
    { position: { row: 1, column: 5 }, roomId: 'room-4', blocked: false },
    { position: { row: 1, column: 6 }, roomId: 'room-4', blocked: false },
    { position: { row: 2, column: 0 }, roomId: 'room-2', blocked: true, propId: 'asset-3-2' },
    { position: { row: 2, column: 1 }, roomId: 'room-2', blocked: false },
    { position: { row: 2, column: 2 }, roomId: 'room-2', blocked: true, propId: 'asset-3-3' },
    { position: { row: 2, column: 3 }, roomId: 'room-4', blocked: false },
    { position: { row: 2, column: 4 }, roomId: 'room-4', blocked: false },
    { position: { row: 2, column: 5 }, roomId: 'room-4', blocked: true, propId: 'asset-6-2' },
    { position: { row: 2, column: 6 }, roomId: 'room-4', blocked: false },
    { position: { row: 3, column: 0 }, roomId: 'room-3', blocked: false, propId: 'asset-2*-1' },
    { position: { row: 3, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 3, column: 2 }, roomId: 'room-2', blocked: false },
    { position: { row: 3, column: 3 }, roomId: 'room-4', blocked: false },
    { position: { row: 3, column: 4 }, roomId: 'room-4', blocked: false },
    { position: { row: 3, column: 5 }, roomId: 'room-4', blocked: true, propId: 'asset-6-3' },
    { position: { row: 3, column: 6 }, roomId: 'room-4', blocked: false },
    { position: { row: 4, column: 0 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 4, column: 2 }, roomId: 'room-4', blocked: false },
    { position: { row: 4, column: 3 }, roomId: 'room-4', blocked: false },
    { position: { row: 4, column: 4 }, roomId: 'room-4', blocked: false },
    { position: { row: 4, column: 5 }, roomId: 'room-4', blocked: false },
    { position: { row: 4, column: 6 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 0 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 1 }, roomId: 'room-3', blocked: false },
    { position: { row: 5, column: 2 }, roomId: 'room-3', blocked: false, propId: 'asset-1*-1' },
    { position: { row: 5, column: 3 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 4 }, roomId: 'room-4', blocked: false },
    { position: { row: 5, column: 5 }, roomId: 'room-4', blocked: false, propId: 'asset-4*-1' },
    { position: { row: 5, column: 6 }, roomId: 'room-4', blocked: false },
    { position: { row: 6, column: 0 }, roomId: 'room-1', blocked: false },
    { position: { row: 6, column: 1 }, roomId: 'room-1', blocked: false },
    { position: { row: 6, column: 2 }, roomId: 'room-1', blocked: false },
    { position: { row: 6, column: 3 }, roomId: 'room-1', blocked: false },
    { position: { row: 6, column: 4 }, roomId: 'room-1', blocked: false, propId: 'asset-4*-2' },
    { position: { row: 6, column: 5 }, roomId: 'room-1', blocked: false },
    { position: { row: 6, column: 6 }, roomId: 'room-1', blocked: false },
  ],
  // Adonis's clue names an unidentified person inside a car; F is the car's real occupant on the
  // source board, so F is pinned to it to give the axis-offset clue a referent.
  clues: [
    {
      id: 'clue-1',
      text: 'F is on asset-4*-2',
      predicate: { type: 'on-prop', suspectId: 'F', propId: 'asset-4*-2' },
    },
    {
      id: 'clue-2',
      text: 'A is exactly 1 column east of F',
      predicate: { type: 'axis-offset-from', subjectSuspectId: 'A', referenceSuspectId: 'F', axis: 'column', offset: 1 },
    },
    {
      id: 'clue-3',
      text: 'B is on asset-1*-1',
      predicate: { type: 'on-prop', suspectId: 'B', propId: 'asset-1*-1' },
    },
    {
      id: 'clue-4',
      text: 'C is in room-2',
      predicate: { type: 'exact-room', suspectId: 'C', roomId: 'room-2' },
    },
    {
      id: 'clue-4b',
      text: 'C is not beside a tree',
      predicate: {
        type: 'all-of',
        predicates: [
          { type: 'not-near-prop', suspectId: 'C', propId: 'asset-3-1' },
          { type: 'not-near-prop', suspectId: 'C', propId: 'asset-3-2' },
          { type: 'not-near-prop', suspectId: 'C', propId: 'asset-3-3' },
        ],
      },
    },
    {
      id: 'clue-5',
      text: 'D and C are in the same room',
      predicate: { type: 'same-room', firstSuspectId: 'D', secondSuspectId: 'C' },
    },
    {
      id: 'clue-6',
      text: 'E is on asset-2*-1',
      predicate: { type: 'on-prop', suspectId: 'E', propId: 'asset-2*-1' },
    },
    {
      id: 'clue-7',
      text: 'F and A are in different rooms',
      predicate: { type: 'different-room', firstSuspectId: 'F', secondSuspectId: 'A' },
    },
    {
      id: 'clue-8',
      text: '(supplemental) C is in row 1',
      predicate: { type: 'exact-row', suspectId: 'C', row: 1 },
    },
    {
      id: 'clue-9',
      text: '(supplemental) C is in column 1',
      predicate: { type: 'exact-column', suspectId: 'C', column: 1 },
    },
    {
      id: 'clue-10',
      text: '(supplemental) D is in row 0',
      predicate: { type: 'exact-row', suspectId: 'D', row: 0 },
    },
    {
      id: 'clue-11',
      text: '(supplemental) D is in column 3',
      predicate: { type: 'exact-column', suspectId: 'D', column: 3 },
    },
    {
      id: 'clue-12',
      text: '(supplemental) A is in row 4',
      predicate: { type: 'exact-row', suspectId: 'A', row: 4 },
    },
  ],
  murdererId: 'A',
  solution: {
    A: { row: 4, column: 5 },
    B: { row: 5, column: 2 },
    C: { row: 1, column: 1 },
    D: { row: 0, column: 3 },
    E: { row: 3, column: 0 },
    F: { row: 6, column: 4 },
    G: { row: 2, column: 6 },
  },
};

export const skin: RoyalInquestSkin = {
  suspects: {
    A: { name: 'Squire Adonis', avatarId: 'knight' },
    B: { name: 'Briar the Gardener', avatarId: 'gardener' },
    C: { name: 'Colby the Scholar', avatarId: 'scholar' },
    D: { name: 'Merchant Don', avatarId: 'merchant' },
    E: { name: 'Elliot the Cook', avatarId: 'cook' },
    F: { name: 'Lady Giovanna', avatarId: 'noblewoman' },
    G: { name: 'Lady Vala', avatarId: 'royal-consort' },
  },
  rooms: {
    'room-1': { name: 'the Coach Road', environment: 'room' },
    'room-2': { name: 'the Stable Yard', environment: 'garden' },
    'room-3': { name: "the Provisioner's Stall", environment: 'room' },
    'room-4': { name: 'the Market Walk', environment: 'room' },
  },
  props: {
    'asset-1*-1': { assetId: 'wooden-bench' },
    'asset-2*-1': { assetId: 'simple-chair' },
    'asset-3-1': { assetId: 'wooden-planter' },
    'asset-3-2': { assetId: 'wooden-planter' },
    'asset-3-3': { assetId: 'wooden-planter' },
    'asset-4*-1': { assetId: 'wooden-bench' },
    'asset-4*-2': { assetId: 'wooden-bench' },
    'asset-5-1': { assetId: 'bookshelf' },
    'asset-6-1': { assetId: 'bookshelf' },
    'asset-6-2': { assetId: 'bookshelf' },
    'asset-6-3': { assetId: 'barrel-cluster' },
  },
};
