export interface PuzzleSave<T> {
  schemaVersion: 1;
  puzzleId: string;
  state: T;
  elapsedSeconds: number;
  completed: boolean;
  hintsUsed: number;
  checksUsed: number;
}

export function loadPuzzle<T>(puzzleId: string): PuzzleSave<T> | null {
  try {
    const raw = localStorage.getItem(`realmbound:${puzzleId}`);
    if (!raw) return null;
    const save = JSON.parse(raw) as PuzzleSave<T>;
    if (save.schemaVersion !== 1 || save.puzzleId !== puzzleId || !save.state) throw new Error();
    return save;
  } catch {
    localStorage.removeItem(`realmbound:${puzzleId}`);
    return null;
  }
}

export function savePuzzle<T>(save: PuzzleSave<T>): void {
  localStorage.setItem(`realmbound:${save.puzzleId}`, JSON.stringify(save));
}
