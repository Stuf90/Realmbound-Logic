import { describe, expect, it } from 'vitest';
import { commitHistory, createHistory, redoHistory, undoHistory } from './history';
describe('history', () => { it('undoes, redoes, and clears redo on a new action', () => { const first = commitHistory(createHistory(0), 1); const undone = undoHistory(first); expect(undone.present).toBe(0); expect(redoHistory(undone).present).toBe(1); expect(commitHistory(undone, 2).future).toEqual([]); }); });
