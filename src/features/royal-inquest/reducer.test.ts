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

  it('rejects blocked, occupied, and duplicate-line destinations by identity', () => {
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

    // Blocked cell (barrel-cluster).
    expect(
      reduceInquest(
        initial,
        { type: 'place', characterId: 'envoy', position: { row: 3, column: 0 } },
        blackwoodKeep,
      ),
    ).toBe(initial);
    // Already occupied by another character.
    expect(
      reduceInquest(
        withAldric,
        { type: 'place', characterId: 'beatrice', position: { row: 0, column: 1 } },
        blackwoodKeep,
      ),
    ).toBe(withAldric);
    // Same row as an already-placed character.
    expect(
      reduceInquest(
        withAldric,
        { type: 'place', characterId: 'beatrice', position: { row: 0, column: 4 } },
        blackwoodKeep,
      ),
    ).toBe(withAldric);
    // Same column as an already-placed character.
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
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 4, column: 4 } },
      blackwoodKeep,
    );
    const uncrossed = reduceInquest(
      crossed,
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 4, column: 4 } },
      blackwoodKeep,
    );

    expect(crossed.manualCrosses.beatrice).toEqual(['4:4']);
    expect(uncrossed.manualCrosses.beatrice).toEqual([]);
  });

  it('refuses to remove a manual cross while its row or column still holds a placed character', () => {
    const withEnvoy = reduceInquest(
      createInitialInquestState(),
      { type: 'place', characterId: 'envoy', position: { row: 0, column: 1 } },
      blackwoodKeep,
    );
    const crossed = reduceInquest(
      withEnvoy,
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 2, column: 1 } },
      blackwoodKeep,
    );

    // Column 1 still holds the envoy, so the cross cannot be removed.
    const uncrossAttempt = reduceInquest(
      crossed,
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 2, column: 1 } },
      blackwoodKeep,
    );
    expect(uncrossAttempt).toBe(crossed);

    // Once the envoy is cleared, the same cross can be removed.
    const cleared = reduceInquest(crossed, { type: 'clear-placement', characterId: 'envoy' }, blackwoodKeep);
    const uncrossed = reduceInquest(
      cleared,
      { type: 'toggle-cross', characterId: 'beatrice', position: { row: 2, column: 1 } },
      blackwoodKeep,
    );
    expect(uncrossed.manualCrosses.beatrice).toEqual([]);
  });

  it('toggles character-specific drafts on and off, rejecting blocked cells', () => {
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

    // (3,0) is a blocked prop cell (barrel-cluster).
    expect(
      reduceInquest(initial, { type: 'toggle-draft', characterId: 'beatrice', position: { row: 3, column: 0 } }, blackwoodKeep),
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
