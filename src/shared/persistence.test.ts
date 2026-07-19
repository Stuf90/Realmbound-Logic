import { beforeEach, describe, expect, it } from 'vitest';
import { deletePuzzle, loadPuzzle, savePuzzle } from './persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());

  it('restores valid saves and isolates corrupt data', () => {
    savePuzzle({ schemaVersion: 1, puzzleId: 'case', state: { value: 2 }, elapsedSeconds: 3, completed: false, hintsUsed: 0, checksUsed: 0 });
    expect(loadPuzzle<{ value: number }>('case')?.state.value).toBe(2);
    localStorage.setItem('realmbound:bad', '{');
    expect(loadPuzzle('bad')).toBeNull();
    expect(localStorage.getItem('realmbound:bad')).toBeNull();
  });

  it('deletes only the selected puzzle save', () => {
    savePuzzle({ schemaVersion: 1, puzzleId: 'blackwood-keep', state: {}, elapsedSeconds: 125, completed: true, hintsUsed: 0, checksUsed: 1 });
    savePuzzle({ schemaVersion: 1, puzzleId: 'highgate-passage', state: {}, elapsedSeconds: 70, completed: true, hintsUsed: 1, checksUsed: 0 });

    deletePuzzle('blackwood-keep');

    expect(loadPuzzle('blackwood-keep')).toBeNull();
    expect(loadPuzzle('highgate-passage')).not.toBeNull();
  });
});
