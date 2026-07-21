import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { createInitialInquestState, reduceInquest } from './reducer';
import { getCellState, getCluesForCharacter } from './selectors';

describe('getCellState', () => {
  it('keeps manual crosses distinct from auto-crossed row and column exclusions', () => {
    const crossed = reduceInquest(
      createInitialInquestState(),
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 2, column: 4 } },
      blackwoodKeep,
    );
    const placed = reduceInquest(
      crossed,
      { type: 'place', characterId: 'envoy', position: { row: 0, column: 1 } },
      blackwoodKeep,
    );

    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 2, column: 4 })).toBe(
      'manual-cross',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 0, column: 4 })).toBe(
      'auto-cross',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 2, column: 1 })).toBe(
      'auto-cross',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 3, column: 0 })).toBe(
      'blocked',
    );
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 0, column: 1 })).toBe(
      'occupied',
    );
  });
});

describe('getCluesForCharacter', () => {
  it('includes solo predicates that name the character directly', () => {
    const ids = getCluesForCharacter(blackwoodKeep, 'daria').map((clue) => clue.id);
    expect(ids).toEqual(['daria-crypt']);
  });

  it('gives the victim no clues at all (their cell is derived only by elimination)', () => {
    const ids = getCluesForCharacter(blackwoodKeep, 'envoy').map((clue) => clue.id);
    expect(ids).toEqual([]);
  });

  it('matches a character referenced only as the second participant in a pair', () => {
    const ids = getCluesForCharacter(blackwoodKeep, 'aldric').map((clue) => clue.id);
    expect(ids).toEqual(['aldric-solar', 'aldric-seated', 'aldric-not-beside-edmund']);
  });
});
