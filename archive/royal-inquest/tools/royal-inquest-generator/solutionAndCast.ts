import type { GridPosition } from '../../src/shared/geometry';
import { positionKey } from '../../src/shared/geometry';
import type { CharacterId, InquestCell, InquestCharacter } from '../../src/features/royal-inquest/types';
import type { ChamberLayout } from './chamberLayout';
import type { CharacterTemplate } from './wordBanks';
import { shuffle, type Rng } from './rng';

export interface ChamberAssignment {
  /** One "anchor" cell per chamber (the character who will get a seat + `on-prop` clue there). */
  anchorByChamber: Map<string, GridPosition>;
  /** The chamber holding both the anchor occupant (-> traitor) and the extra occupant (-> victim). */
  pairChamberId: string;
  /** The pair chamber's second cell — becomes the victim's cell, never named by any clue. */
  extraPosition: GridPosition;
}

/**
 * Searches for a full row/column permutation (one cell per row, `size` rows == `size` columns)
 * whose chamber grouping is EXACTLY "every chamber gets one cell, except one chamber which gets
 * two" — the shape needed for a victim+traitor pair chamber with everyone else singly anchored.
 * This is a pure combinatorial search over `layout.chamberByPosition` (no props/cast involved yet),
 * and empirically converges in a handful of attempts once `layout`'s chamber count already matches
 * `size - 1` (checked by the caller, `generate.ts`) — see `docs/royal-inquest/authoring/
 * level-generator.human.md` for why a full-board permutation (not a partial-quota cast) is what
 * makes the victim pinnable by elimination using only difficulty-1-legal predicates.
 */
export function chooseChamberAssignment(rng: Rng, layout: ChamberLayout, size: number, maxAttempts = 2000): ChamberAssignment | null {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const columns = shuffle(rng, Array.from({ length: size }, (_, i) => i));
    const positions: GridPosition[] = Array.from({ length: size }, (_, row) => ({ row, column: columns[row]! }));

    const byChamber = new Map<string, GridPosition[]>();
    for (const position of positions) {
      const chamberId = layout.chamberByPosition[position.row]![position.column]!;
      if (!byChamber.has(chamberId)) byChamber.set(chamberId, []);
      byChamber.get(chamberId)!.push(position);
    }
    if (byChamber.size !== layout.chamberIds.length) continue;

    const pairEntry = Array.from(byChamber.entries()).find(([, cells]) => cells.length === 2);
    const singles = Array.from(byChamber.entries()).filter(([, cells]) => cells.length === 1);
    if (!pairEntry || singles.length !== byChamber.size - 1) continue;

    const [pairChamberId, pairCells] = pairEntry;
    const [anchorCell, extraCell] = shuffle(rng, pairCells) as [GridPosition, GridPosition];

    const anchorByChamber = new Map<string, GridPosition>();
    anchorByChamber.set(pairChamberId, anchorCell);
    for (const [chamberId, cells] of singles) anchorByChamber.set(chamberId, cells[0]!);

    return { anchorByChamber, pairChamberId, extraPosition: extraCell };
  }
  return null;
}

function slugify(title: string): CharacterId {
  return title
    .replace(/^The\s+/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickUniqueTemplates(rng: Rng, templates: readonly CharacterTemplate[], count: number): CharacterTemplate[] | null {
  const shuffled = shuffle(rng, templates);
  const seenAvatars = new Set<string>();
  const result: CharacterTemplate[] = [];
  for (const template of shuffled) {
    if (seenAvatars.has(template.avatarId)) continue;
    seenAvatars.add(template.avatarId);
    result.push(template);
    if (result.length === count) return result;
  }
  return null;
}

export interface CastAndSolution {
  characters: InquestCharacter[];
  solution: Record<CharacterId, GridPosition>;
  traitorId: CharacterId;
  victimId: CharacterId;
}

/**
 * Turns an already-chosen `ChamberAssignment` (positions decided) into a labeled cast: assigns a
 * unique name/avatar per occupant, marks the pair chamber's anchor occupant as traitor and its extra
 * occupant as victim. `cells` is only used to sanity-check every assigned position is unblocked —
 * `generatePropPlacement` is responsible for never blocking an assignment position (see
 * `propPlacement.ts`'s `reservedPositions` parameter).
 */
export function buildCastAndSolution(
  rng: Rng,
  cells: InquestCell[],
  assignment: ChamberAssignment,
  characterTemplates: readonly CharacterTemplate[],
): CastAndSolution | null {
  const unblockedByKey = new Map(cells.filter((cell) => !cell.blocked).map((cell) => [positionKey(cell.position), cell]));

  const chamberEntries = Array.from(assignment.anchorByChamber.entries());
  const positions: GridPosition[] = [...chamberEntries.map(([, position]) => position), assignment.extraPosition];
  if (positions.some((position) => !unblockedByKey.has(positionKey(position)))) return null;

  const castSize = positions.length;
  const templates = pickUniqueTemplates(rng, characterTemplates, castSize);
  if (!templates) return null;

  const characterIds: CharacterId[] = [];
  const solution: Record<CharacterId, GridPosition> = {};
  const usedIds = new Set<string>();
  for (let i = 0; i < castSize; i += 1) {
    const template = templates[i]!;
    let id = slugify(template.title);
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugify(template.title)}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    characterIds.push(id);
    solution[id] = positions[i]!;
  }

  const idAt = (position: GridPosition): CharacterId =>
    characterIds.find((id) => positionKey(solution[id]!) === positionKey(position))!;
  const traitorAnchor = assignment.anchorByChamber.get(assignment.pairChamberId)!;
  const traitorId = idAt(traitorAnchor);
  const victimId = idAt(assignment.extraPosition);

  const characters: InquestCharacter[] = characterIds.map((id, i) => {
    const template = templates[i]!;
    return {
      id,
      name: template.title,
      portraitLabel: template.title.replace(/^The\s+/i, ''),
      avatarId: template.avatarId,
      category: template.category,
      ...(id === victimId ? { isVictim: true } : {}),
    };
  });
  // Victim last, matching the shipped levels' convention (see hollowmereLodge.ts): no clue names
  // them, and readers of the level file see it called out by position, not just the flag.
  characters.sort((a, b) => (a.isVictim === b.isVictim ? 0 : a.isVictim ? 1 : -1));

  return { characters, solution, traitorId, victimId };
}
