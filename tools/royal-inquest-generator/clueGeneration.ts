import { positionKey, type GridPosition } from '../../src/shared/geometry';
import { propKindByAsset, type PropAssetId } from '../../src/assets/royal-inquest/manifest';
import { evaluatePredicate, getPredicateCharacterIds } from '../../src/features/royal-inquest/predicates';
import { predicateDifficulty } from '../../src/features/royal-inquest/predicateDifficulty';
import { checkVictimElimination, solveInquestDefinition } from '../../src/features/royal-inquest/solver';
import type {
  CharacterId,
  InquestCell,
  InquestCharacter,
  InquestClue,
  InquestDefinition,
  InquestPredicate,
} from '../../src/features/royal-inquest/types';
import type { TileEnvironment } from '../../src/assets/royal-inquest/manifest';
import { CLUE_TEMPLATES } from './wordBanks';
import { pick, weightedPick, type Rng } from './rng';

export interface ClueGenInput {
  rows: number;
  columns: number;
  cells: InquestCell[];
  characters: InquestCharacter[];
  chamberEnvironments: Record<string, TileEnvironment>;
  chamberNames: Record<string, string>;
  solution: Record<CharacterId, GridPosition>;
  victimId: CharacterId;
  traitorId: CharacterId;
  difficulty: number;
}

interface Candidate {
  tag: string;
  weight: number;
  predicate: InquestPredicate;
}

function isAdjacent(a: GridPosition, b: GridPosition): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.column - b.column) === 1;
}

function isDiagonal(a: GridPosition, b: GridPosition): boolean {
  return Math.abs(a.row - b.row) === 1 && Math.abs(a.column - b.column) === 1;
}

function isCorner(position: GridPosition, rows: number, columns: number): boolean {
  return (position.row === 0 || position.row === rows - 1) && (position.column === 0 || position.column === columns - 1);
}

function humanizePropLabel(propId: PropAssetId): string {
  return `the ${propId.replace(/-/g, ' ')}`;
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/**
 * Builds a full, validator-legal clue set for an already-decided board+cast+solution. Returns null
 * if it can't converge within `maxRepairAttempts` (caller should regenerate the outer layout).
 *
 * Every candidate predicate is constructed with parameters read directly off `input.solution` (the
 * authored placement), then double-checked with `evaluatePredicate` before being added - so every
 * clue in the returned set is true against the authored solution by construction. That guarantees
 * `solveInquestDefinition` can never find zero solutions, and that a unique solution (once found)
 * automatically matches the authored one - the only real failure mode left is *under-constraint*
 * (more than one solution, or victim elimination failing), which the repair loop fixes by adding
 * more true clues.
 */
export function generateClues(rng: Rng, input: ClueGenInput, maxRepairAttempts = 80): InquestClue[] | null {
  const { rows, columns, cells, characters, chamberNames, solution, victimId, traitorId, difficulty } = input;
  const nonVictimIds = characters.filter((c) => c.id !== victimId).map((c) => c.id);
  const cellByKey = new Map(cells.map((cell) => [positionKey(cell.position), cell]));
  const chamberOf = (id: CharacterId): string => cellByKey.get(positionKey(solution[id]!))!.chamberId;
  const nameOf = (id: CharacterId): string => characters.find((c) => c.id === id)!.name;

  const propCellCounts = new Map<PropAssetId, number>();
  for (const cell of cells) {
    if (cell.propId) propCellCounts.set(cell.propId, (propCellCounts.get(cell.propId) ?? 0) + 1);
  }
  const uniquePropCell = (propId: PropAssetId): InquestCell | undefined =>
    propCellCounts.get(propId) === 1 ? cells.find((cell) => cell.propId === propId) : undefined;

  const draftBase: InquestDefinition = {
    id: 'draft',
    title: 'Draft',
    definitionVersion: 1,
    difficulty,
    rows,
    columns,
    characters,
    cells,
    clues: [],
    traitorId,
    solution,
    chamberEnvironments: input.chamberEnvironments,
    chamberNames,
  };

  function isAllowed(predicate: InquestPredicate): boolean {
    if (predicateDifficulty[predicate.type] > difficulty) return false;
    if (getPredicateCharacterIds(predicate).includes(victimId)) return false;
    return evaluatePredicate(predicate, solution, draftBase) === true;
  }

  function buildText(tag: string, predicate: InquestPredicate): string {
    const templates = CLUE_TEMPLATES[tag] ?? CLUE_TEMPLATES['exact-chamber']!;
    const template = pick(rng, templates);
    switch (predicate.type) {
      case 'exact-chamber':
        return fillTemplate(template, { name: nameOf(predicate.characterId), chamber: chamberNames[predicate.chamberId]! });
      case 'on-prop':
        return fillTemplate(template, { name: nameOf(predicate.characterId), prop: humanizePropLabel(predicate.propId) });
      case 'same-chamber':
        return fillTemplate(template, { name: nameOf(predicate.firstCharacterId), other: nameOf(predicate.secondCharacterId) });
      case 'different-chamber':
        return fillTemplate(template, { name: nameOf(predicate.firstCharacterId), other: nameOf(predicate.secondCharacterId) });
      case 'chamber-occupant-count':
        return predicate.count === 0
          ? fillTemplate(pick(rng, CLUE_TEMPLATES['chamber-occupant-count-zero']!), { name: nameOf(predicate.characterId) })
          : fillTemplate(template, { name: nameOf(predicate.characterId), count: predicate.count });
      case 'in-corner':
        return fillTemplate(template, { name: nameOf(predicate.characterId) });
      case 'not-beside-wall':
        return fillTemplate(template, { name: nameOf(predicate.characterId) });
      case 'category-not-beside-prop':
        return fillTemplate(template, { category: `${predicate.category}s`, prop: humanizePropLabel(predicate.propId) });
      case 'shares-prop-neighbor':
        return fillTemplate(template, { name: nameOf(predicate.characterId), prop: humanizePropLabel(predicate.propId) });
      case 'diagonal-from':
        return fillTemplate(template, { name: nameOf(predicate.firstCharacterId), other: nameOf(predicate.secondCharacterId) });
      case 'offset-from':
        return fillTemplate(template, {
          name: nameOf(predicate.subjectCharacterId),
          other: nameOf(predicate.referenceCharacterId),
          rowOffset: Math.abs(predicate.rowOffset),
          columnOffset: Math.abs(predicate.columnOffset),
        });
      case 'by-window':
        return fillTemplate(template, { name: nameOf(predicate.characterId) });
      case 'seated-character-count':
        return fillTemplate(template, { count: predicate.count });
      case 'prop-neighbor-count':
        return fillTemplate(template, { count: predicate.count, prop: humanizePropLabel(predicate.propId) });
      default:
        return template;
    }
  }

  function candidatesForCharacter(characterId: CharacterId): Candidate[] {
    const position = solution[characterId]!;
    const chamberId = chamberOf(characterId);
    const cell = cellByKey.get(positionKey(position))!;
    const others = nonVictimIds.filter((id) => id !== characterId);
    const list: Candidate[] = [];

    list.push({ tag: 'exact-chamber', weight: 2, predicate: { type: 'exact-chamber', characterId, chamberId } });

    if (cell.propId && propKindByAsset[cell.propId] === 'seat' && propCellCounts.get(cell.propId) === 1) {
      list.push({ tag: 'on-prop', weight: 3, predicate: { type: 'on-prop', characterId, propId: cell.propId } });
    }

    // One candidate per possible partner (not just one random pick) - gives the repair loop real
    // room to add a second/third same-/different-chamber clue for the same character against a
    // different partner once the first is used up.
    for (const partner of others) {
      const sameChamber = chamberOf(partner) === chamberId;
      list.push({
        tag: sameChamber ? 'same-chamber' : 'different-chamber',
        weight: 3,
        predicate: sameChamber
          ? { type: 'same-chamber', firstCharacterId: characterId, secondCharacterId: partner }
          : { type: 'different-chamber', firstCharacterId: characterId, secondCharacterId: partner },
      });
    }

    const occupantCount = characters.filter((c) => c.id !== characterId && chamberOf(c.id) === chamberId).length;
    list.push({ tag: 'chamber-occupant-count', weight: 3, predicate: { type: 'chamber-occupant-count', characterId, count: occupantCount } });

    if (isCorner(position, rows, columns)) {
      list.push({ tag: 'in-corner', weight: 2, predicate: { type: 'in-corner', characterId } });
    }

    const neighbors: GridPosition[] = [
      { row: position.row - 1, column: position.column },
      { row: position.row + 1, column: position.column },
      { row: position.row, column: position.column - 1 },
      { row: position.row, column: position.column + 1 },
    ];
    const interior = neighbors.every(
      (n) => n.row >= 0 && n.row < rows && n.column >= 0 && n.column < columns && cellByKey.get(positionKey(n))?.chamberId === chamberId,
    );
    if (interior) {
      list.push({ tag: 'not-beside-wall', weight: 2, predicate: { type: 'not-beside-wall', characterId } });
    }

    for (const [propId, count] of propCellCounts) {
      if (count !== 1) continue;
      const propCell = uniquePropCell(propId);
      if (!propCell || !isAdjacent(position, propCell.position)) continue;
      const othersNearby = characters.some((c) => c.id !== characterId && isAdjacent(solution[c.id]!, propCell.position));
      if (othersNearby) {
        list.push({ tag: 'shares-prop-neighbor', weight: 2, predicate: { type: 'shares-prop-neighbor', characterId, propId } });
      }
      if (propId === 'window') {
        list.push({ tag: 'by-window', weight: 2, predicate: { type: 'by-window', characterId, propId: 'window' } });
      }
    }

    for (const partner of others.filter((id) => isDiagonal(position, solution[id]!))) {
      list.push({
        tag: 'diagonal-from',
        weight: 2,
        predicate: { type: 'diagonal-from', firstCharacterId: characterId, secondCharacterId: partner },
      });
    }

    // One candidate per possible reference character - `offset-from` is always satisfiable (any
    // two distinct characters have a well-defined row/column offset on a permutation solution), so
    // this is the main source of repair-loop headroom at difficulty 3.
    for (const reference of others) {
      const refPosition = solution[reference]!;
      list.push({
        tag: 'offset-from',
        weight: 4,
        predicate: {
          type: 'offset-from',
          subjectCharacterId: characterId,
          referenceCharacterId: reference,
          rowOffset: position.row - refPosition.row,
          columnOffset: position.column - refPosition.column,
        },
      });
    }

    return list.filter((candidate) => isAllowed(candidate.predicate));
  }

  function globalCandidates(): Candidate[] {
    const list: Candidate[] = [];

    const seatedCount = characters.filter((c) => {
      const cell = cellByKey.get(positionKey(solution[c.id]!))!;
      return cell.propId && propKindByAsset[cell.propId] === 'seat';
    }).length;
    list.push({ tag: 'seated-character-count', weight: 1, predicate: { type: 'seated-character-count', count: seatedCount } });

    for (const [propId, count] of propCellCounts) {
      if (count !== 1) continue;
      const propCell = uniquePropCell(propId as PropAssetId);
      if (!propCell) continue;
      const nearby = characters.filter((c) => isAdjacent(solution[c.id]!, propCell.position)).length;
      list.push({ tag: 'prop-neighbor-count', weight: 1, predicate: { type: 'prop-neighbor-count', propId: propId as PropAssetId, count: nearby } });
    }

    const categories = Array.from(new Set(characters.map((c) => c.category).filter((c): c is string => !!c)));
    for (const category of categories) {
      for (const [propId, count] of propCellCounts) {
        if (count !== 1) continue;
        const propCell = uniquePropCell(propId as PropAssetId);
        if (!propCell) continue;
        list.push({
          tag: 'category-not-beside-prop',
          weight: 1,
          predicate: { type: 'category-not-beside-prop', category, propId: propId as PropAssetId },
        });
      }
    }

    return list.filter((candidate) => isAllowed(candidate.predicate));
  }

  const clues: InquestClue[] = [];
  const usedPredicateKeys = new Set<string>();
  let clueSeq = 0;

  function predicateKey(predicate: InquestPredicate): string {
    return JSON.stringify(predicate);
  }

  // Dedup is by exact predicate value, not by predicate "tag" - so the repair loop can add a
  // second same-chamber/different-chamber/offset-from/diagonal-from clue for a character that
  // already has one, as long as it names a different partner (a genuinely new fact), while still
  // never repeating an identical clue (e.g. exact-chamber, which has only one possible value per
  // character and would otherwise just be re-added pointlessly).
  function addFromPool(pool: Candidate[]): boolean {
    const remaining = pool.filter((c) => !usedPredicateKeys.has(predicateKey(c.predicate)));
    if (remaining.length === 0) return false;
    const chosen = weightedPick(rng, remaining.map((c) => [c, c.weight] as const));
    clueSeq += 1;
    const text = buildText(chosen.tag, chosen.predicate);
    clues.push({ id: `clue-${clueSeq}-${chosen.tag}`, text, predicate: chosen.predicate });
    usedPredicateKeys.add(predicateKey(chosen.predicate));
    return true;
  }

  function tryAddForCharacter(characterId: CharacterId): boolean {
    return addFromPool(candidatesForCharacter(characterId));
  }

  // Initial pass: one anchoring clue per non-victim character. `exact-chamber` is always in the
  // pool and always legal, so this can only fail if `candidatesForCharacter` itself is broken.
  for (const characterId of nonVictimIds) {
    if (!tryAddForCharacter(characterId)) return null;
  }

  for (let attempt = 0; attempt < maxRepairAttempts; attempt += 1) {
    const draft: InquestDefinition = { ...draftBase, clues };
    const solved = solveInquestDefinition(draft);
    if (solved.solutions.length === 0) return null; // should be unreachable; every clue is true against `solution`.
    if (solved.solutions.length === 1) {
      const elimination = checkVictimElimination(draft);
      if (elimination.ok) return clues;
    }

    let added = false;
    const order = [...nonVictimIds].sort(() => rng() - 0.5);
    for (const characterId of order) {
      if (tryAddForCharacter(characterId)) {
        added = true;
        break;
      }
    }
    if (!added) added = addFromPool(globalCandidates());
    if (!added) return null;
  }

  return null;
}
