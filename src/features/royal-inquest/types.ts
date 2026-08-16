import type { GridPosition } from '../../shared/geometry';
import type { AvatarAssetId, PropAssetId, TileEnvironment } from '../../assets/royal-inquest/manifest';

export type CharacterId = string;

export interface InquestCharacter {
  id: CharacterId;
  name: string;
  portraitLabel: string;
  avatarId: AvatarAssetId;
  isVictim?: boolean;
  // Optional attribute group (e.g. a gender) a category-scoped predicate can reference without
  // naming the character directly — see `category-not-beside-prop`.
  category?: string;
}

export interface InquestCell {
  position: GridPosition;
  chamberId: string;
  blocked: boolean;
  propId?: PropAssetId;
  // Optional finer-grained tag within a chamber (e.g. "stand") a predicate can scope to instead of
  // the whole chamber — see `area-occupant-count`.
  areaId?: string;
}

export type InquestPredicate =
  | { type: 'exact-row'; characterId: CharacterId; row: number }
  | { type: 'exact-column'; characterId: CharacterId; column: number }
  | { type: 'exact-chamber'; characterId: CharacterId; chamberId: string }
  | { type: 'same-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | { type: 'different-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | {
      type: 'direction-from';
      subjectCharacterId: CharacterId;
      referenceCharacterId: CharacterId;
      direction: 'north' | 'east' | 'south' | 'west';
    }
  | { type: 'beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | { type: 'not-beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  // Pure coordinate relationship, like `direction-from` — true when the two characters sit
  // exactly one row AND one column apart, with no same-chamber requirement (unlike `beside`).
  | { type: 'diagonal-from'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | { type: 'not-diagonal-from'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
  | { type: 'on-prop'; characterId: CharacterId; propId: PropAssetId }
  // True when exactly `count` OTHER characters (besides `characterId`) share its chamber in the
  // completed solution. Subsumes "was alone" (count: 0); combine with `same-chamber` to say
  // "alone with a specific named character" (same-chamber(a, b) + chamber-occupant-count(a, 1)).
  | { type: 'chamber-occupant-count'; characterId: CharacterId; count: number }
  // True when `characterId`'s cell is one of the board's four corners (row 0 or rows-1, AND
  // column 0 or columns-1) — a disjunctive "one of a set of cells" clue, not a single exact cell.
  | { type: 'in-corner'; characterId: CharacterId }
  // Global (cast-wide) quantifier: true when exactly `count` characters, across the WHOLE cast,
  // occupy a seat-kind prop cell in the completed solution. Unlike every other predicate here,
  // this names no specific character — see `getPredicateCharacterIds`.
  | { type: 'seated-character-count'; count: number }
  // True when NONE of `characterId`'s four orthogonal neighbor cells are off-board or in a
  // different chamber — i.e. the cell is fully interior to its chamber. Relates to the chamber
  // boundary itself, not another character.
  | { type: 'not-beside-wall'; characterId: CharacterId }
  // Global/category quantifier: true when no character whose `category` matches is orthogonally
  // adjacent to the (single) cell bearing `propId`. Names no specific character.
  | { type: 'category-not-beside-prop'; category: string; propId: PropAssetId }
  // Existential pairing: true when `characterId` is orthogonally adjacent to the (single) cell
  // bearing `propId` AND at least one OTHER (unnamed) character is also adjacent to that same
  // cell — "someone else was beside the same prop" without saying who.
  | { type: 'shares-prop-neighbor'; characterId: CharacterId; propId: PropAssetId }
  // Pure coordinate relationship, like `diagonal-from`, but an exact vector distance rather than a
  // fixed shape — true when `subject.row - reference.row === rowOffset` AND
  // `subject.column - reference.column === columnOffset` (south/east positive). No same-row/column
  // requirement, so it stays satisfiable against a full row/column permutation solution whenever
  // both offsets are nonzero.
  | {
      type: 'offset-from';
      subjectCharacterId: CharacterId;
      referenceCharacterId: CharacterId;
      rowOffset: number;
      columnOffset: number;
    }
  // Global (cast-wide) quantifier, like `seated-character-count`: true when exactly `count`
  // characters, across the WHOLE cast, are orthogonally adjacent to the (single) cell bearing
  // `propId` in the completed solution. Names no specific character.
  | { type: 'prop-neighbor-count'; propId: PropAssetId; count: number }
  // Generalizes `chamber-occupant-count`: true when exactly `count` OTHER characters share
  // `characterId`'s combined chamber+area tag (see `InquestCell.areaId`). When no cell in a
  // definition sets `areaId`, this collapses to plain chamber comparison.
  | { type: 'area-occupant-count'; characterId: CharacterId; count: number }
  // True when `characterId` is orthogonally adjacent to the (single) cell bearing `propId` —
  // same adjacency check as `shares-prop-neighbor`'s first half, but without requiring a second
  // (unnamed) character nearby. Intended for edge-anchored props like `window`.
  | { type: 'by-window'; characterId: CharacterId; propId: PropAssetId }
  | { type: 'not-on-prop'; characterId: CharacterId; propId: PropAssetId }
  | { type: 'not-seated'; characterId: CharacterId }
  | { type: 'not-in-corner'; characterId: CharacterId }
  | { type: 'not-exact-chamber'; characterId: CharacterId; chamberId: string }
  // Exact negation of `not-beside-wall`: true when at least one orthogonal neighbor is off-board
  // or in a different chamber.
  | { type: 'beside-wall'; characterId: CharacterId }
  // Generic version of `by-window`: orthogonal adjacency to the (single) cell bearing `propId`
  // AND same chamber as that cell — unlike `by-window`, which never needed the chamber check
  // because a window sits on the chamber's own edge cell.
  | { type: 'near-prop'; characterId: CharacterId; propId: PropAssetId }
  | { type: 'not-near-prop'; characterId: CharacterId; propId: PropAssetId }
  // True when some cell sharing `characterId`'s row (or column, per `axis`) bears `propId`.
  // `characterId`'s own cell doesn't count.
  | { type: 'prop-in-axis'; characterId: CharacterId; propId: PropAssetId; axis: 'row' | 'column' }
  // True when at least one of `characterId`'s same-chamber orthogonal open (unblocked) neighbor
  // cells ends up unoccupied by another character.
  | { type: 'beside-empty-cell'; characterId: CharacterId }
  // Whoever occupies the (single) cell bearing `propId` belongs to `category` — names no specific
  // character, works for an unnamed "a man was in it" clue shape.
  | { type: 'category-on-prop'; category: string; propId: PropAssetId }
  // Pure board-layout fact: true when the (single) cell bearing `propId` sits in `chamberId`.
  // Never placement-dependent, never `'unknown'`, names no character.
  | { type: 'prop-in-chamber'; chamberId: string; propId: PropAssetId }
  // Generalizes `offset-from` to a single axis, like `direction-from` generalizes to a direction
  // without distance: true when `subject.<axis> - reference.<axis> === offset`.
  | {
      type: 'axis-offset-from';
      subjectCharacterId: CharacterId;
      referenceCharacterId: CharacterId;
      axis: 'row' | 'column';
      offset: number;
    }
  // Cast-wide quantifier, like `seated-character-count`, but scoped to one chamber and counted by
  // `InquestCharacter.category` rather than seat occupancy.
  | {
      type: 'category-chamber-count';
      category: string;
      chamberId: string;
      count: number;
    }
  // True when `characterId` is the topmost/bottommost/leftmost/rightmost of `chamberId`'s
  // occupants by row or column. Two characters sharing a chamber always have distinct rows and
  // distinct columns (permutation board), so no tie handling is needed.
  | {
      type: 'chamber-rank';
      characterId: CharacterId;
      chamberId: string;
      rank: 'topmost' | 'bottommost' | 'leftmost' | 'rightmost';
    }
  // Disjunction over nested predicates — true if any option is true, `'unknown'` if none are true
  // but at least one is `'unknown'`, else false.
  | { type: 'one-of'; options: InquestPredicate[] }
  // Conjunction over nested predicates — false if any option is false, `'unknown'` if none are
  // false but at least one is `'unknown'`, else true. Mainly useful nested inside a `one-of`.
  | { type: 'all-of'; predicates: InquestPredicate[] }
  // Compares two characters' chambers by `InquestDefinition.chamberOrder` (golf holes, bus stops,
  // course order, ...). `'unknown'` unless both chambers have a `chamberOrder` entry.
  | {
      type: 'chamber-order-compare';
      subjectCharacterId: CharacterId;
      referenceCharacterId: CharacterId;
      comparator: 'greater' | 'less' | 'immediately-after' | 'immediately-before';
    }
  // True when both characters are placed and the set of prop categories (see
  // `propCategoryByAsset`) orthogonally adjacent to each of them intersects — "X and Y are each
  // beside a plant," not necessarily the same plant.
  | {
      type: 'shares-prop-category-neighbor';
      firstCharacterId: CharacterId;
      secondCharacterId: CharacterId;
    };

export interface InquestClue {
  id: string;
  text: string;
  predicate: InquestPredicate;
}

export interface InquestDefinition {
  id: string;
  title: string;
  definitionVersion: number;
  // 1-3 authoring-time rating: gates which predicate types this case's clues may use, see
  // `predicateDifficulty.ts`.
  difficulty: number;
  rows: number;
  columns: number;
  characters: InquestCharacter[];
  cells: InquestCell[];
  clues: InquestClue[];
  traitorId: CharacterId;
  solution: Record<CharacterId, GridPosition>;
  chamberEnvironments: Record<string, TileEnvironment>;
  chamberNames: Record<string, string>;
  // Optional ordering fact per chamber (golf holes, bus stops, course order, ...) — only chambers
  // referenced by a `chamber-order-compare` clue need an entry.
  chamberOrder?: Record<string, number>;
}

export interface InquestState {
  placements: Partial<Record<CharacterId, GridPosition>>;
  drafts: Partial<Record<CharacterId, string[]>>;
  manualCrosses: Partial<Record<CharacterId, string[]>>;
  selectedCharacterId: CharacterId | null;
  tool: 'place' | 'draft' | 'cross';
}

export type InquestAction =
  | { type: 'select-character'; characterId: CharacterId | null }
  | { type: 'set-tool'; tool: InquestState['tool'] }
  | { type: 'place'; characterId: CharacterId; position: GridPosition }
  | { type: 'toggle-draft'; characterId: CharacterId; position: GridPosition }
  | { type: 'toggle-cross'; characterId: CharacterId; position: GridPosition }
  | { type: 'clear-placement'; characterId: CharacterId };
