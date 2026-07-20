import { describe, expect, it } from 'vitest';

import { blackwoodKeep } from './definition';
import { checkVictimElimination, solveInquestDefinition } from './solver';
import type { InquestDefinition } from './types';

function makeSyntheticDefinition(overrides: Partial<InquestDefinition> = {}): InquestDefinition {
  const cells = [
    { position: { row: 0, column: 0 }, chamberId: 'a', blocked: false },
    { position: { row: 0, column: 1 }, chamberId: 'a', blocked: false },
    { position: { row: 1, column: 0 }, chamberId: 'b', blocked: false },
    { position: { row: 1, column: 1 }, chamberId: 'b', blocked: false },
  ];
  return {
    id: 'synthetic',
    title: 'Synthetic',
    definitionVersion: 1,
    rows: 2,
    columns: 2,
    characters: [
      { id: 'x', name: 'X', portraitLabel: 'X', avatarId: 'monarch' },
      { id: 'y', name: 'Y', portraitLabel: 'Y', avatarId: 'monarch' },
    ],
    cells,
    clues: [],
    traitorId: 'x',
    solution: { x: { row: 0, column: 0 }, y: { row: 1, column: 1 } },
    chamberEnvironments: { a: 'room', b: 'room' },
    chamberNames: { a: 'A', b: 'B' },
    ...overrides,
  };
}

describe('solveInquestDefinition', () => {
  it('finds exactly one solution when clues pin both characters to distinct cells', () => {
    const definition = makeSyntheticDefinition({
      clues: [
        { id: 'x-cell', text: 'X seated', predicate: { type: 'on-prop', characterId: 'x', propId: 'throne' } },
        { id: 'y-b', text: 'Y in B', predicate: { type: 'exact-chamber', characterId: 'y', chamberId: 'b' } },
      ],
      cells: [
        { position: { row: 0, column: 0 }, chamberId: 'a', blocked: false, propId: 'throne' },
        { position: { row: 0, column: 1 }, chamberId: 'a', blocked: false },
        { position: { row: 1, column: 0 }, chamberId: 'b', blocked: false },
        { position: { row: 1, column: 1 }, chamberId: 'b', blocked: false },
      ],
    });
    const result = solveInquestDefinition(definition);
    expect(result.solutions).toEqual([{ x: { row: 0, column: 0 }, y: { row: 1, column: 1 } }]);
  });

  it('reports more than one solution when the clue set is ambiguous', () => {
    const definition = makeSyntheticDefinition({ clues: [] });
    const result = solveInquestDefinition(definition);
    expect(result.solutions.length).toBe(2);
  });

  it('reports zero solutions when clues are mutually contradictory', () => {
    const definition = makeSyntheticDefinition({
      clues: [
        { id: 'x-a', text: 'X in A', predicate: { type: 'exact-chamber', characterId: 'x', chamberId: 'a' } },
        { id: 'x-b', text: 'X in B', predicate: { type: 'exact-chamber', characterId: 'x', chamberId: 'b' } },
      ],
    });
    const result = solveInquestDefinition(definition);
    expect(result.solutions.length).toBe(0);
  });
});

describe('checkVictimElimination', () => {
  it('passes for the real blackwoodKeep definition', () => {
    expect(checkVictimElimination(blackwoodKeep).ok).toBe(true);
  });

  it('fails when the victim would have more than one remaining cell', () => {
    const definition = makeSyntheticDefinition({
      characters: [
        { id: 'x', name: 'X', portraitLabel: 'X', avatarId: 'monarch' },
        { id: 'victim', name: 'Victim', portraitLabel: 'Victim', avatarId: 'monarch', isVictim: true },
      ],
      clues: [],
      traitorId: 'x',
      solution: { x: { row: 0, column: 0 }, victim: { row: 1, column: 1 } },
    });
    expect(checkVictimElimination(definition).ok).toBe(false);
  });
});
