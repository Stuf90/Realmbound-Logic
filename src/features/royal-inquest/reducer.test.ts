import { describe, expect, it } from 'vitest';
import { createInitialState, isLegalDestination, reduceRoyalInquest } from './reducer';
import { definition } from './levels/easy-02';

describe('Royal Inquest reducer', () => {
  it('places a suspect on a legal cell', () => {
    const state = createInitialState(definition);
    const next = reduceRoyalInquest(state, { type: 'place', suspectId: 'A', position: { row: 0, column: 1 } }, definition);
    expect(next.placements['A']).toEqual({ row: 0, column: 1 });
  });

  it('rejects placing a second suspect in an occupied row', () => {
    const state = createInitialState(definition);
    const withA = reduceRoyalInquest(state, { type: 'place', suspectId: 'A', position: { row: 0, column: 1 } }, definition);
    const withB = reduceRoyalInquest(withA, { type: 'place', suspectId: 'B', position: { row: 0, column: 3 } }, definition);
    expect(withB).toBe(withA);
    expect(withB.placements['B']).toBeUndefined();
  });

  it('rejects placing a second suspect in an occupied column', () => {
    const state = createInitialState(definition);
    const withA = reduceRoyalInquest(state, { type: 'place', suspectId: 'A', position: { row: 0, column: 1 } }, definition);
    const withB = reduceRoyalInquest(withA, { type: 'place', suspectId: 'B', position: { row: 2, column: 1 } }, definition);
    expect(withB).toBe(withA);
  });

  it('rejects placing on a blocked cell', () => {
    const state = createInitialState(definition);
    // row 4, column 4 is blocked (asset-1-1) in easy-02.
    expect(isLegalDestination(definition, state, 'A', { row: 4, column: 4 })).toBe(false);
    const next = reduceRoyalInquest(state, { type: 'place', suspectId: 'A', position: { row: 4, column: 4 } }, definition);
    expect(next).toBe(state);
  });

  it('toggles a draft note on and off', () => {
    const state = createInitialState(definition);
    const drafted = reduceRoyalInquest(state, { type: 'toggle-draft', suspectId: 'A', position: { row: 1, column: 1 } }, definition);
    expect(drafted.drafts['A']).toEqual(['1:1']);
    const undrafted = reduceRoyalInquest(drafted, { type: 'toggle-draft', suspectId: 'A', position: { row: 1, column: 1 } }, definition);
    expect(undrafted.drafts['A']).toEqual([]);
  });

  it('toggles a manual cross on and off when no placement holds the row/column', () => {
    const state = createInitialState(definition);
    const crossed = reduceRoyalInquest(state, { type: 'toggle-cross', suspectId: 'A', position: { row: 1, column: 1 } }, definition);
    expect(crossed.manualCrosses['A']).toEqual(['1:1']);
    const uncrossed = reduceRoyalInquest(crossed, { type: 'toggle-cross', suspectId: 'A', position: { row: 1, column: 1 } }, definition);
    expect(uncrossed.manualCrosses['A']).toEqual([]);
  });

  it('resets to the initial state', () => {
    const state = createInitialState(definition);
    const placed = reduceRoyalInquest(state, { type: 'place', suspectId: 'A', position: { row: 0, column: 1 } }, definition);
    const reset = reduceRoyalInquest(placed, { type: 'reset' }, definition);
    expect(reset).toEqual(createInitialState(definition));
  });
});
