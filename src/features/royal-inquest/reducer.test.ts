import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { createInitialInquestState, reduceInquest } from './reducer';

describe('reduceInquest', () => {
  it('places, moves, and clears characters immutably', () => {
    const initial = createInitialInquestState();
    const placed = reduceInquest(
      initial,
      { type: 'place', characterId: 'envoy', position: { row: 0, column: 1 } },
      blackwoodKeep,
    );
    const moved = reduceInquest(
      placed,
      { type: 'place', characterId: 'envoy', position: { row: 0, column: 2 } },
      blackwoodKeep,
    );
    const cleared = reduceInquest(
      moved,
      { type: 'clear-placement', characterId: 'envoy' },
      blackwoodKeep,
    );

    expect(initial.placements).toEqual({});
    expect(placed.placements.envoy).toEqual({ row: 0, column: 1 });
    expect(moved.placements.envoy).toEqual({ row: 0, column: 2 });
    expect(cleared.placements.envoy).toBeUndefined();
  });

  it('rejects blocked, restricted, occupied, and duplicate-line destinations by identity', () => {
    const initial = createInitialInquestState();
    const withEnvoy = reduceInquest(
      initial,
      { type: 'place', characterId: 'envoy', position: { row: 0, column: 1 } },
      blackwoodKeep,
    );
    const withAldric = reduceInquest(
      withEnvoy,
      { type: 'place', characterId: 'aldric', position: { row: 1, column: 0 } },
      blackwoodKeep,
    );

    expect(
      reduceInquest(
        initial,
        { type: 'place', characterId: 'envoy', position: { row: 0, column: 0 } },
        blackwoodKeep,
      ),
    ).toBe(initial);
    expect(
      reduceInquest(
        initial,
        { type: 'place', characterId: 'envoy', position: { row: 1, column: 0 } },
        blackwoodKeep,
      ),
    ).toBe(initial);
    expect(
      reduceInquest(
        withAldric,
        { type: 'place', characterId: 'beatrice', position: { row: 0, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(withAldric);
    expect(
      reduceInquest(
        withAldric,
        { type: 'place', characterId: 'beatrice', position: { row: 0, column: 3 } },
        blackwoodKeep,
      ),
    ).toBe(withAldric);
    expect(
      reduceInquest(
        withAldric,
        { type: 'place', characterId: 'beatrice', position: { row: 2, column: 0 } },
        blackwoodKeep,
      ),
    ).toBe(withAldric);
  });

  it('toggles character-specific manual crosses', () => {
    const initial = createInitialInquestState();
    const crossed = reduceInquest(
      initial,
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 1, column: 2 } },
      blackwoodKeep,
    );
    const uncrossed = reduceInquest(
      crossed,
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 1, column: 2 } },
      blackwoodKeep,
    );

    expect(crossed.manualCrosses.beatrice).toEqual(['1:2']);
    expect(uncrossed.manualCrosses.beatrice).toEqual([]);
  });

  it('toggles character-specific drafts on and off, rejecting blocked or restricted cells', () => {
    const initial = createInitialInquestState();
    const drafted = reduceInquest(
      initial,
      { type: 'toggle-draft', characterId: 'beatrice', position: { row: 1, column: 2 } },
      blackwoodKeep,
    );
    const undrafted = reduceInquest(
      drafted,
      { type: 'toggle-draft', characterId: 'beatrice', position: { row: 1, column: 2 } },
      blackwoodKeep,
    );

    expect(drafted.drafts.beatrice).toEqual(['1:2']);
    expect(undrafted.drafts.beatrice).toEqual([]);

    // (0,0) is a blocked prop cell; (0,1) is restricted to envoy only.
    expect(
      reduceInquest(initial, { type: 'toggle-draft', characterId: 'beatrice', position: { row: 0, column: 0 } }, blackwoodKeep),
    ).toBe(initial);
    expect(
      reduceInquest(initial, { type: 'toggle-draft', characterId: 'beatrice', position: { row: 0, column: 1 } }, blackwoodKeep),
    ).toBe(initial);
  });

  it('drops the draft mark for a tile once a character is placed there', () => {
    const initial = createInitialInquestState();
    const drafted = reduceInquest(
      initial,
      { type: 'toggle-draft', characterId: 'envoy', position: { row: 0, column: 1 } },
      blackwoodKeep,
    );
    const placed = reduceInquest(
      drafted,
      { type: 'place', characterId: 'envoy', position: { row: 0, column: 1 } },
      blackwoodKeep,
    );

    expect(drafted.drafts.envoy).toEqual(['0:1']);
    expect(placed.drafts.envoy).toEqual([]);
  });
});
