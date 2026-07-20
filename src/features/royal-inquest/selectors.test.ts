import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { createInitialInquestState, reduceInquest } from './reducer';
import { getCellState, getCluesForCharacter } from './selectors';

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
    expect(getCellState(blackwoodKeep, placed, 'beatrice', { row: 0, column: 2 })).toBe(
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

describe('getCluesForCharacter', () => {
  it('includes solo predicates that name the character directly', () => {
    const ids = getCluesForCharacter(blackwoodKeep, 'daria').map((clue) => clue.id);
    expect(ids).toEqual(['daria-sixth-row']);
  });

  it('gives the victim only the same-chamber clue that names their killer', () => {
    const ids = getCluesForCharacter(blackwoodKeep, 'envoy').map((clue) => clue.id);
    expect(ids).toEqual(['solar-witnesses']);
  });

  it('matches a character referenced only as the second participant in a pair', () => {
    const ids = getCluesForCharacter(blackwoodKeep, 'aldric').map((clue) => clue.id);
    expect(ids).toEqual(['aldric-first-column', 'solar-witnesses', 'aldric-not-beside-edmund']);
  });
});
