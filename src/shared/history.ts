export interface HistoryState<T> { past: T[]; present: T; future: T[] }

export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] };
}

export function commitHistory<T>(history: HistoryState<T>, next: T): HistoryState<T> {
  if (Object.is(history.present, next)) return history;
  return { past: [...history.past, history.present], present: next, future: [] };
}

export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) return history;
  const previous = history.past.at(-1)!;
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) return history;
  const [next, ...future] = history.future;
  return { past: [...history.past, history.present], present: next!, future };
}
