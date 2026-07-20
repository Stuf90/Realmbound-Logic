import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { createInitialInquestState, reduceInquest } from './reducer';
import { getCellState } from './selectors';

describe('getCellState', () => {
  it('keeps manual crosses distinct from derived row and column exclusions', () => {
    const crossed = reduceInquest(
      createInitialInquestState(),
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 1, column: 2 } },
      blackwoodKeep,
    );
    const placed = reduceInquest(
      crossed,
      { type: 'place', characterId: 'envoy', position: { row: 0, column: 1 } },
      blackwoodKeep,
    );

    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 1, column: 2 })).toBe(
      'manual-cross',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 0, column: 3 })).toBe(
      'derived-unavailable',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 2, column: 1 })).toBe(
      'derived-unavailable',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 0, column: 0 })).toBe(
      'blocked',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 0, column: 1 })).toBe(
      'occupied',
    );
  });
});
