import { propKindByAsset, propsByEnvironment, type TileEnvironment } from '../../src/assets/royal-inquest/manifest';
import { pick, randInt, shuffle, type Rng } from './rng';

function isSpanVariant(id: string): boolean {
  return id.endsWith('-left') || id.endsWith('-right');
}

// How many chambers of a given environment can each get a DISTINCT seat `PropAssetId` (excluding
// `-left`/`-right` two-cell-span variants, which the generator never places - see
// `propPlacement.ts`). `on-prop` clues (`clueGeneration.ts`) only anchor a character when their
// seat's asset id is unique across the WHOLE board - reusing the same seat id on two different
// chambers (e.g. `church` has only one non-span seat asset, `church-pew`) silently breaks that
// anchor for both chambers' occupants. Capping how many times an environment can be picked (by its
// real seat-asset supply) at layout time avoids ever reaching that state, rather than discovering it
// as a clue-generation failure much later in the pipeline.
const SEAT_CAPACITY: Record<TileEnvironment, number> = Object.fromEntries(
  (Object.keys(propsByEnvironment) as TileEnvironment[]).map((environment) => [
    environment,
    propsByEnvironment[environment].filter((id) => !isSpanVariant(id) && propKindByAsset[id] === 'seat').length,
  ]),
) as Record<TileEnvironment, number>;

export interface GridPos {
  row: number;
  column: number;
}

export interface ChamberLayout {
  rows: number;
  columns: number;
  /** `chamberByPosition[row][column] = chamberId`. */
  chamberByPosition: string[][];
  chamberIds: string[];
  chamberEnvironments: Record<string, TileEnvironment>;
}

const MIN_CHAMBER_SIZE = 5;

// Deliberately restricted to environments that have at least one SEAT-kind prop
// (`propKindByAsset`), per `propsByEnvironment`: `room` (simple-chair/wooden-bench), `church`
// (church-pew), `royalRoom` (throne/formal-chair). `garden`/`kitchen`/`dungeon` have decorative
// props only - a character placed there could never get an `on-prop` anchor, and `hallway`'s
// allow-list is effectively empty altogether ("passage stays clear" per board-rooms-props.cave.md).
// This matters a lot more here than it would for hand-authoring: `solutionAndCast.ts` relies on
// every chamber having a seat cell to anchor its occupant to an exact, difficulty-1-legal `on-prop`
// clue (see that file's docstring) - without a seat, a chamber's occupant is often unpinnable by any
// difficulty-1/2 predicate, since chamber membership alone never narrows below the chamber's cell
// count. A human hand-authoring on top of generator output can still use any environment freely;
// this restriction is generator-only.
const GENERATABLE_ENVIRONMENTS: readonly TileEnvironment[] = ['room', 'church', 'royalRoom'];

function keyOf(position: GridPos): string {
  return `${position.row}:${position.column}`;
}

function neighborsOf(position: GridPos, rows: number, columns: number): GridPos[] {
  const candidates = [
    { row: position.row - 1, column: position.column },
    { row: position.row + 1, column: position.column },
    { row: position.row, column: position.column - 1 },
    { row: position.row, column: position.column + 1 },
  ];
  return candidates.filter((c) => c.row >= 0 && c.row < rows && c.column >= 0 && c.column < columns);
}

/**
 * Randomized chamber partition: seeded region-growth (BFS frontier growth) from `chamberCount`
 * random seed cells across the grid, repeatedly picking a random still-growable chamber and
 * extending it into a random unassigned orthogonal neighbor, until every cell is assigned. Any
 * chamber that ends up under `MIN_CHAMBER_SIZE` cells is merged into an adjacent chamber.
 */
export function generateChamberLayout(rng: Rng, rows: number, columns: number, chamberCount: number): ChamberLayout {
  const grid: (string | null)[][] = Array.from({ length: rows }, () => new Array<string | null>(columns).fill(null));
  const chamberIds = Array.from({ length: chamberCount }, (_, i) => `chamber-${i}`);

  const allCells: GridPos[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) allCells.push({ row, column });
  }
  const seeds = shuffle(rng, allCells).slice(0, chamberCount);

  const frontiers = new Map<string, GridPos[]>();
  seeds.forEach((cell, index) => {
    const chamberId = chamberIds[index]!;
    grid[cell.row]![cell.column] = chamberId;
    frontiers.set(chamberId, neighborsOf(cell, rows, columns));
  });

  let unassigned = rows * columns - seeds.length;
  let active = [...chamberIds];

  while (unassigned > 0 && active.length > 0) {
    const activeIndex = randInt(rng, 0, active.length - 1);
    const chamberId = active[activeIndex]!;
    const frontier = frontiers.get(chamberId)!;

    let grew = false;
    while (frontier.length > 0) {
      const frontierIndex = randInt(rng, 0, frontier.length - 1);
      const candidate = frontier[frontierIndex]!;
      frontier.splice(frontierIndex, 1);
      if (grid[candidate.row]![candidate.column] !== null) continue;
      grid[candidate.row]![candidate.column] = chamberId;
      unassigned -= 1;
      frontier.push(...neighborsOf(candidate, rows, columns));
      grew = true;
      break;
    }
    if (!grew) active.splice(activeIndex, 1);
  }

  // Fallback safety net: region growth from orthogonally-connected seeds on a fully connected grid
  // always reaches every cell, but guard against a leftover null (e.g. chamberCount 0) by dumping
  // any stragglers into the first chamber.
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (grid[row]![column] === null) grid[row]![column] = chamberIds[0]!;
    }
  }

  mergeSmallChambers(grid, rows, columns, chamberIds);

  const finalIds = Array.from(new Set(grid.flat() as string[]));
  const chamberEnvironments = assignEnvironments(rng, finalIds, grid, rows, columns);

  return { rows, columns, chamberByPosition: grid as string[][], chamberIds: finalIds, chamberEnvironments };
}

function chamberCells(grid: (string | null)[][], rows: number, columns: number): Map<string, GridPos[]> {
  const map = new Map<string, GridPos[]>();
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const chamberId = grid[row]![column]!;
      if (!map.has(chamberId)) map.set(chamberId, []);
      map.get(chamberId)!.push({ row, column });
    }
  }
  return map;
}

function adjacentChamberIds(grid: (string | null)[][], rows: number, columns: number, chamberId: string, cells: GridPos[]): string[] {
  const neighbors = new Set<string>();
  for (const cell of cells) {
    for (const neighbor of neighborsOf(cell, rows, columns)) {
      const neighborChamber = grid[neighbor.row]![neighbor.column]!;
      if (neighborChamber !== chamberId) neighbors.add(neighborChamber);
    }
  }
  return Array.from(neighbors);
}

function mergeSmallChambers(grid: (string | null)[][], rows: number, columns: number, chamberIds: string[]): void {
  // Repeat: a merge can shrink the pool of chambers, so re-scan until every remaining chamber is
  // at or above the floor (or only one chamber remains, in which case there is nothing left to
  // merge into).
  let guard = chamberIds.length + 5;
  while (guard > 0) {
    guard -= 1;
    const cellsByChamber = chamberCells(grid, rows, columns);
    const small = Array.from(cellsByChamber.entries()).find(([, cells]) => cells.length < MIN_CHAMBER_SIZE);
    if (!small) return;
    if (cellsByChamber.size <= 1) return;
    const [chamberId, cells] = small;
    const neighborIds = adjacentChamberIds(grid, rows, columns, chamberId, cells);
    const targetId = neighborIds[0] ?? Array.from(cellsByChamber.keys()).find((id) => id !== chamberId)!;
    for (const cell of cells) grid[cell.row]![cell.column] = targetId;
  }
}

function assignEnvironments(
  rng: Rng,
  chamberIds: string[],
  grid: (string | null)[][],
  rows: number,
  columns: number,
): Record<string, TileEnvironment> {
  const environments: Record<string, TileEnvironment> = {};
  const usedCount: Record<string, number> = {};
  const cellsByChamber = chamberCells(grid, rows, columns);
  for (const chamberId of chamberIds) {
    const neighborIds = adjacentChamberIds(grid, rows, columns, chamberId, cellsByChamber.get(chamberId) ?? []);
    const neighborEnvs = new Set(neighborIds.map((id) => environments[id]).filter((env): env is TileEnvironment => !!env));
    // Never exceed an environment's real seat-asset supply (see `SEAT_CAPACITY` above) - a hard
    // constraint, unlike the neighbor-repeat bias below. Falls back to whatever isn't yet at
    // capacity; if every environment is (only possible once the chamber count exceeds the combined
    // seat supply, which `generate.ts` already keeps within `MAX_CHAMBER_COUNT`), allows a repeat
    // rather than crashing - a later stage will simply fail to anchor that chamber and the caller
    // retries the whole layout.
    const withinCapacity = GENERATABLE_ENVIRONMENTS.filter((env) => (usedCount[env] ?? 0) < SEAT_CAPACITY[env]);
    const capacityPool = withinCapacity.length > 0 ? withinCapacity : GENERATABLE_ENVIRONMENTS;
    // Bias against repeating an already-assigned neighbor's environment, without hard-forbidding it
    // (small boards can run out of distinct options).
    const preferred = capacityPool.filter((env) => !neighborEnvs.has(env));
    const pool = preferred.length > 0 ? preferred : capacityPool;
    const chosen = pick(rng, pool);
    environments[chamberId] = chosen;
    usedCount[chosen] = (usedCount[chosen] ?? 0) + 1;
  }
  return environments;
}
