import { positionKey, type GridPosition } from '../../shared/geometry';

export const NORTH = 1, EAST = 2, SOUTH = 4, WEST = 8;
export type NormalMask = 3 | 6 | 12 | 9 | 5 | 10;
export const ROUTE_MASKS: NormalMask[] = [5, 10, 3, 6, 12, 9];
export type SiegeValue = { status: 'undecided' } | { status: 'empty' } | { status: 'route'; mask: NormalMask };
export interface SiegeState { cells: Record<string, SiegeValue> }

export interface SiegeDefinition {
  id: string; title: string; rows: number; columns: number;
  rowCounts: number[]; columnCounts: number[];
  endpoints: Record<string, number>; solution: Record<string, NormalMask>;
}

function solutionMask(row: number, column: number): NormalMask {
  if (row % 2 === 0) {
    if (column === 0 && row > 0) return 6;
    if (column === 6 && row < 6) return 12;
    return 10;
  }
  if (column === 0) return row < 6 ? 3 : 9;
  if (column === 6) return 9;
  return 10;
}

const solution: Record<string, NormalMask> = {};
for (let row = 0; row < 7; row++) for (let column = 0; column < 7; column++) {
  if ((row === 0 && column === 0) || (row === 6 && column === 6)) continue;
  solution[`${row}:${column}`] = solutionMask(row, column);
}

export const highgatePassage: SiegeDefinition = {
  id: 'highgate-passage', title: 'The Highgate Passage', rows: 7, columns: 7,
  rowCounts: Array(7).fill(7), columnCounts: Array(7).fill(7),
  endpoints: { '0:0': EAST, '6:6': WEST }, solution,
};

export function createInitialSiegeState(): SiegeState {
  const cells: Record<string, SiegeValue> = {};
  for (const key of Object.keys(solution)) cells[key] = { status: 'undecided' };
  return { cells };
}

export function editSiegeCell(state: SiegeState, position: GridPosition, action: 'cycle' | 'empty' | 'clear', mask?: NormalMask): SiegeState {
  const key = positionKey(position);
  if (!(key in state.cells)) return state;
  const current = state.cells[key]!;
  let next: SiegeValue;
  if (action === 'empty') next = { status: 'empty' };
  else if (action === 'clear') next = { status: 'undecided' };
  else if (mask) next = { status: 'route', mask };
  else if (current.status !== 'route') next = { status: 'route', mask: ROUTE_MASKS[0]! };
  else {
    const index = ROUTE_MASKS.indexOf(current.mask);
    next = index === ROUTE_MASKS.length - 1 ? { status: 'undecided' } : { status: 'route', mask: ROUTE_MASKS[index + 1]! };
  }
  if (JSON.stringify(current) === JSON.stringify(next)) return state;
  return { cells: { ...state.cells, [key]: next } };
}

export function siegeCounts(definition: SiegeDefinition, state: SiegeState) {
  const rows = Array(definition.rows).fill(0), columns = Array(definition.columns).fill(0);
  for (const key of [...Object.keys(definition.endpoints), ...Object.entries(state.cells).filter(([, value]) => value.status === 'route').map(([key]) => key)]) {
    const [row, column] = key.split(':').map(Number); rows[row!]++; columns[column!]++;
  }
  return { rows, columns };
}

export function checkSiegeProgress(definition: SiegeDefinition, state: SiegeState): string | null {
  const counts = siegeCounts(definition, state);
  const badRow = counts.rows.findIndex((count, index) => count > definition.rowCounts[index]!);
  if (badRow >= 0) return `Row ${badRow + 1} contains too much road.`;
  const empty = Object.values(state.cells).filter((value) => value.status === 'empty').length;
  if (empty) return 'Every square is required by the authored line counts; clear the empty mark.';
  for (const [key, value] of Object.entries(state.cells)) if (value.status === 'route' && value.mask !== solution[key]) return `The road at ${key.replace(':', ', ')} does not connect with the required route.`;
  return null;
}

export function isSiegeComplete(definition: SiegeDefinition, state: SiegeState): boolean {
  return !checkSiegeProgress(definition, state) && Object.entries(solution).every(([key, mask]) => state.cells[key]?.status === 'route' && state.cells[key].mask === mask);
}

export function getSiegeHint(state: SiegeState): { key: string; mask: NormalMask; message: string } | null {
  for (const [key, mask] of Object.entries(solution)) if (state.cells[key]?.status !== 'route' || state.cells[key].mask !== mask) return { key, mask, message: `Continue the road through row ${Number(key[0]) + 1}, column ${Number(key[2]) + 1}.` };
  return null;
}
