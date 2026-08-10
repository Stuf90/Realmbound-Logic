import { propKindByAsset, propsByEnvironment, type PropAssetId } from '../../src/assets/royal-inquest/manifest';
import type { ChamberLayout } from './chamberLayout';
import { pick, randInt, shuffle, type Rng } from './rng';

export interface PropPlacement {
  /** `"row:column"` -> asset id, for every cell (blocked or seat) that carries a prop. */
  propByPosition: Map<string, PropAssetId>;
  /** `"row:column"` set of every blocked (decorative-prop) cell. */
  blockedPositions: Set<string>;
}

function keyOf(row: number, column: number): string {
  return `${row}:${column}`;
}

// `-left`/`-right` variants are a two-cell-span object (see board-rooms-props.cave.md), which needs
// its own adjacency bookkeeping to place correctly (always as a matched pair, never alone). Out of
// scope for this generator - always use the plain base asset instead. See the generator design doc
// for this deliberate scope cut.
function isSpanVariant(id: string): boolean {
  return id.endsWith('-left') || id.endsWith('-right');
}

/**
 * For each chamber: forces a seat prop onto `seatPositionByChamber`'s cell for that chamber (the
 * exact cell `chooseChamberAssignment`/`buildCastAndSolution` already decided will hold that
 * chamber's anchored occupant — see `solutionAndCast.ts`), using a `PropAssetId` not already used by
 * another chamber so the later `on-prop` clue can identify it uniquely by asset id (bounded by
 * `chamberLayout.ts`'s `SEAT_CAPACITY`, which keeps this always satisfiable for the environments this
 * generator uses). Then blocks 0-2 OTHER cells per chamber for decorative props (never touching a
 * position in `reservedPositions` — every assignment cell, including the pair chamber's un-anchored
 * victim cell, must stay unblocked), avoiding the same `PropAssetId` on two orthogonally-adjacent
 * cells.
 */
export function generatePropPlacement(
  rng: Rng,
  layout: ChamberLayout,
  seatPositionByChamber: Map<string, { row: number; column: number }>,
  reservedPositions: ReadonlySet<string>,
): PropPlacement {
  const { rows, columns, chamberByPosition, chamberIds, chamberEnvironments } = layout;
  const cellsByChamber = new Map<string, Array<{ row: number; column: number }>>();
  for (const chamberId of chamberIds) cellsByChamber.set(chamberId, []);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cellsByChamber.get(chamberByPosition[row]![column]!)!.push({ row, column });
    }
  }

  const propByPosition = new Map<string, PropAssetId>();
  const blockedPositions = new Set<string>();
  const usedSeatIds = new Set<PropAssetId>();

  function hasAdjacentSameProp(row: number, column: number, propId: PropAssetId): boolean {
    const neighbors: Array<[number, number]> = [
      [row - 1, column],
      [row + 1, column],
      [row, column - 1],
      [row, column + 1],
    ];
    return neighbors.some(([r, c]) => propByPosition.get(keyOf(r, c)) === propId);
  }

  for (const chamberId of chamberIds) {
    const cells = cellsByChamber.get(chamberId)!;
    const environment = chamberEnvironments[chamberId]!;
    const legalProps = propsByEnvironment[environment].filter((id) => !isSpanVariant(id));
    const decorativeChoices = legalProps.filter((id) => propKindByAsset[id] === 'decorative');
    const seatChoices = legalProps.filter((id) => propKindByAsset[id] === 'seat');

    const seatPosition = seatPositionByChamber.get(chamberId);
    if (seatPosition && seatChoices.length > 0) {
      const unusedSeatChoices = seatChoices.filter((id) => !usedSeatIds.has(id));
      const seatId = pick(rng, unusedSeatChoices.length > 0 ? unusedSeatChoices : seatChoices);
      usedSeatIds.add(seatId);
      propByPosition.set(keyOf(seatPosition.row, seatPosition.column), seatId);
    }

    const blockable = shuffle(rng, cells).filter((cell) => !reservedPositions.has(keyOf(cell.row, cell.column)));
    const maxBlocked = Math.max(0, Math.min(2, cells.length - 3));
    const blockedTarget = decorativeChoices.length > 0 ? randInt(rng, 0, maxBlocked) : 0;

    let blocked = 0;
    for (const cell of blockable) {
      if (blocked >= blockedTarget) break;
      const isEdge = cell.row === 0 || cell.row === rows - 1 || cell.column === 0 || cell.column === columns - 1;
      // `window` is edge-only (validator-enforced); only offer it as a candidate on edge cells.
      const options = decorativeChoices.filter((id) => id !== 'window' || isEdge);
      if (options.length === 0) continue;

      let candidate = pick(rng, options);
      let attempts = 0;
      while (hasAdjacentSameProp(cell.row, cell.column, candidate) && attempts < 5 && options.length > 1) {
        candidate = pick(rng, options);
        attempts += 1;
      }
      propByPosition.set(keyOf(cell.row, cell.column), candidate);
      blockedPositions.add(keyOf(cell.row, cell.column));
      blocked += 1;
    }
  }

  return { propByPosition, blockedPositions };
}
