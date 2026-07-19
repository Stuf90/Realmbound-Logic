import { beforeEach, describe, expect, it } from 'vitest';
import { loadPuzzle, savePuzzle } from './persistence';
describe('persistence', () => { beforeEach(() => localStorage.clear()); it('restores valid saves and isolates corrupt data', () => { savePuzzle({ schemaVersion:1,puzzleId:'case',state:{ value:2 },elapsedSeconds:3,completed:false,hintsUsed:0,checksUsed:0 }); expect(loadPuzzle<{value:number}>('case')?.state.value).toBe(2); localStorage.setItem('realmbound:bad','{'); expect(loadPuzzle('bad')).toBeNull(); expect(localStorage.getItem('realmbound:bad')).toBeNull(); }); });
