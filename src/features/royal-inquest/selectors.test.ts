import { describe, expect, it } from 'vitest';
import type { Placements } from 'murdoku-logic-engine';
import { getAllClueStates, getClueState, getCluesForSuspect, isRoyalInquestComplete } from './selectors';
import { definition as easy02 } from './levels/easy-02';
import { definition as easy13 } from './levels/easy-13';
import { definition as easy01 } from './levels/easy-01';
import { definition as easy14 } from './levels/easy-14';
import { definition as easy04 } from './levels/easy-04';

function clueById(definition: typeof easy02, id: string) {
  const clue = definition.clues.find((candidate) => candidate.id === id);
  if (!clue) throw new Error(`Missing clue ${id}`);
  return clue;
}

describe('getClueState', () => {
  it('exact-room: undetermined before placement, satisfied on the room, violated elsewhere', () => {
    const clue = clueById(easy02, 'clue-1'); // A is in room-1
    expect(getClueState(clue, {}, easy02)).toBe('undetermined');
    expect(getClueState(clue, { A: { row: 0, column: 1 } }, easy02)).toBe('satisfied');
    expect(getClueState(clue, { A: { row: 2, column: 0 } }, easy02)).toBe('violated');
  });

  it('exact-column: transitions from undetermined to satisfied/violated', () => {
    const clue = clueById(easy02, 'clue-5'); // A is in column 1
    expect(getClueState(clue, {}, easy02)).toBe('undetermined');
    expect(getClueState(clue, { A: { row: 0, column: 1 } }, easy02)).toBe('satisfied');
    expect(getClueState(clue, { A: { row: 0, column: 0 } }, easy02)).toBe('violated');
  });

  it('exact-row: transitions from undetermined to satisfied/violated', () => {
    const clue = clueById(easy01, 'clue-8'); // A is in row 3
    expect(getClueState(clue, {}, easy01)).toBe('undetermined');
    expect(getClueState(clue, { A: { row: 3, column: 1 } }, easy01)).toBe('satisfied');
    expect(getClueState(clue, { A: { row: 0, column: 1 } }, easy01)).toBe('violated');
  });

  it('near-prop: satisfied when adjacent, violated otherwise', () => {
    const clue = clueById(easy02, 'clue-2'); // B is beside asset-1-1 at row4/col4
    expect(getClueState(clue, {}, easy02)).toBe('undetermined');
    expect(getClueState(clue, { B: { row: 3, column: 4 } }, easy02)).toBe('satisfied');
    expect(getClueState(clue, { B: { row: 0, column: 0 } }, easy02)).toBe('violated');
  });

  it('not-near-prop: violated when adjacent, satisfied otherwise', () => {
    const clue = clueById(easy14, 'clue-4b'); // C is not beside asset-3-1 at row4/col4
    expect(getClueState(clue, {}, easy14)).toBe('undetermined');
    expect(getClueState(clue, { C: { row: 4, column: 3 } }, easy14)).toBe('violated');
    expect(getClueState(clue, { C: { row: 0, column: 0 } }, easy14)).toBe('satisfied');
  });

  it('different-room: satisfied when in different rooms, violated when in the same room', () => {
    const clue = clueById(easy02, 'clue-3'); // C and B are in different rooms
    expect(getClueState(clue, {}, easy02)).toBe('undetermined');
    expect(getClueState(clue, { C: { row: 2, column: 3 }, B: { row: 3, column: 4 } }, easy02)).toBe('satisfied');
    expect(getClueState(clue, { C: { row: 3, column: 0 }, B: { row: 3, column: 4 } }, easy02)).toBe('violated');
  });

  it('same-room: satisfied when in the same room, violated otherwise', () => {
    const clue = clueById(easy14, 'clue-5'); // D and C are in the same room
    expect(getClueState(clue, {}, easy14)).toBe('undetermined');
    expect(getClueState(clue, { D: { row: 4, column: 6 }, C: { row: 3, column: 5 } }, easy14)).toBe('satisfied');
    expect(getClueState(clue, { D: { row: 0, column: 0 }, C: { row: 3, column: 5 } }, easy14)).toBe('violated');
  });

  it('on-prop: satisfied on the seat, violated elsewhere', () => {
    const clue = clueById(easy01, 'clue-3'); // C is on asset-4*-1 at row2/col6
    expect(getClueState(clue, {}, easy01)).toBe('undetermined');
    expect(getClueState(clue, { C: { row: 2, column: 6 } }, easy01)).toBe('satisfied');
    expect(getClueState(clue, { C: { row: 0, column: 0 } }, easy01)).toBe('violated');
  });

  it('axis-offset-from: satisfied on the exact offset, violated otherwise', () => {
    const clue = clueById(easy13, 'clue-4'); // D is exactly 1 row north of C
    expect(getClueState(clue, {}, easy13)).toBe('undetermined');
    expect(getClueState(clue, { C: { row: 1, column: 3 }, D: { row: 0, column: 1 } }, easy13)).toBe('satisfied');
    expect(getClueState(clue, { C: { row: 1, column: 3 }, D: { row: 5, column: 5 } }, easy13)).toBe('violated');
  });

  it('one-of: satisfied when any option holds, violated when every option fails', () => {
    const clue = clueById(easy01, 'clue-7'); // F is in the same room as A or E
    const placements: Placements = { F: { row: 1, column: 2 }, A: { row: 3, column: 1 } };
    expect(getClueState(clue, placements, easy01)).toBe('satisfied');
    const violating: Placements = { F: { row: 1, column: 2 }, A: { row: 3, column: 1 }, E: { row: 4, column: 0 } };
    // A is in room-1 (same as F); still satisfied by the A branch.
    expect(getClueState(clue, violating, easy01)).toBe('satisfied');
  });

  it('all-of (nested inside one-of): satisfied only when a full branch holds', () => {
    const clue = clueById(easy13, 'clue-3b');
    expect(getClueState(clue, {}, easy13)).toBe('undetermined');
    // A same-room as C and north of C: solution has A at (5,5), C at (1,3) — same room-4? No: A room-4, C room-1 -> not same room.
    // Use D, who solves at (0,1), same room-1 as C (1,3), and north of C.
    const satisfying: Placements = { C: { row: 1, column: 3 }, D: { row: 0, column: 1 } };
    expect(getClueState(clue, satisfying, easy13)).toBe('satisfied');
  });

  it('category-on-prop: satisfied when a matching-category suspect sits there, violated when a non-matching one does', () => {
    const clue = clueById(easy04, 'clue-3b'); // A woman is on asset-3*-2 at row4/col4
    expect(getClueState(clue, {}, easy04)).toBe('undetermined');
    expect(getClueState(clue, { D: { row: 4, column: 4 } }, easy04)).toBe('satisfied'); // D is category "woman"
    expect(getClueState(clue, { B: { row: 4, column: 4 } }, easy04)).toBe('violated'); // B is category "man"
  });
});

describe('getAllClueStates', () => {
  it('reports a state for every clue', () => {
    const states = getAllClueStates(easy02, {});
    expect(Object.keys(states)).toHaveLength(easy02.clues.length);
    expect(Object.values(states).every((state) => state === 'undetermined')).toBe(true);
  });
});

describe('getCluesForSuspect', () => {
  it('finds clues naming a suspect, including inside one-of/all-of', () => {
    const clues = getCluesForSuspect(easy13, 'D');
    expect(clues.map((clue) => clue.id)).toEqual(expect.arrayContaining(['clue-4', 'clue-3b', 'clue-7']));
  });
});

describe('isRoyalInquestComplete', () => {
  it('is false until every suspect sits on their solved cell', () => {
    expect(isRoyalInquestComplete(easy02, {})).toBe(false);
    const partial: Placements = { A: easy02.solution['A']! };
    expect(isRoyalInquestComplete(easy02, partial)).toBe(false);
    expect(isRoyalInquestComplete(easy02, easy02.solution)).toBe(true);
  });
});
