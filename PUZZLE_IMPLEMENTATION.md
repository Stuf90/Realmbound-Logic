# Realmbound Logic: Puzzle Implementation Design

## Status and authority

- **Document type:** implementation design
- **Current release:** playable local-web MVP
- **Current puzzle families:** The Royal Inquest and Siege Lines
- **Platform:** responsive local web application
- **Stack:** React, TypeScript, Vite, CSS, Vitest, and Testing Library
- **Persistence:** browser localStorage; no backend
- **Approved gameplay design:** [docs/superpowers/specs/2026-07-19-realmbound-logic-mvp-design.md](docs/superpowers/specs/2026-07-19-realmbound-logic-mvp-design.md)

The Royal Inquest and Siege Lines are the main puzzles and the only puzzle families in
the current MVP. Leyline Weaving, Celestial Binding, and Living Laws are retained in the
**Post-MVP Roadmap** at the end of this document. They must not affect MVP estimates,
acceptance, navigation, or architecture unless a shared abstraction is already justified
by the two MVP puzzles.

The medieval presentation changes names, fiction, and visual treatment only. The Royal
Inquest preserves spatial Murdoku-style placement mechanics. Siege Lines preserves
canonical Train Tracks mechanics.

## 1. MVP goals

Build a polished local vertical slice containing:

1. **The King's Ledger**, a commission index.
2. **The Treason at Blackwood Keep**, one complete Royal Inquest case.
3. **The Highgate Passage**, one complete Siege Lines map.

Both puzzles must be playable, automatically validated, responsive, accessible, and
saved locally. The MVP supports:

- deterministic, platform-independent puzzle rules;
- immutable player state;
- Undo and Redo;
- Reset with confirmation;
- Check Progress without exposing unrelated solution cells;
- one-step contextual hints that explain a deduction before applying it;
- automatic completion detection;
- save and resume after reload;
- elapsed active time without time pressure;
- keyboard, mouse, and touch input;
- reduced-motion and non-color state cues;
- automated rule-engine, persistence, accessibility, and interaction tests.

## 2. MVP non-goals

The following are explicitly deferred:

- accounts, cloud synchronization, or backend services;
- procedural generation or puzzle-authoring tools;
- campaign progression, daily puzzles, and multiple difficulty levels;
- more cases or maps than the two bundled commissions;
- multiplayer, leaderboards, monetization, and analytics;
- external artwork or audio dependencies;
- Leyline Weaving, Celestial Binding, and Living Laws;
- abstractions built only for possible post-MVP families.

## 3. Experience structure

The application opens as **The King's Ledger**, with two commission cards:

1. **The Treason at Blackwood Keep** — play as Grand Investigator.
2. **The Highgate Passage** — play as Royal Architect.

Each commission follows:

```text
Ledger -> Briefing -> Play -> Automatic validation -> Resolution
```

Players may return to the ledger without losing progress. In-progress state and
completion are stored independently for each commission. Completion preserves the solved
board, reports elapsed time and hint/check use, and presents a narrative resolution.

## 4. MVP architecture

### 4.1 Application areas

Keep four independent areas:

1. **App shell** — routing, ledger, briefings, resolutions, settings, persistence notices,
   and shared controls.
2. **Royal Inquest module** — definitions, placements, exclusions, predicates,
   validation, hints, completion, and board presentation.
3. **Siege Lines module** — definitions, tile state, masks, counts, connectivity,
   validation, hints, completion, and board presentation.
4. **Shared services** — history, active timer, persistence, announcements, settings,
   and reusable controls.

The two puzzle modules must not import from each other. Small neutral types such as
`GridPosition` live in `shared/geometry.ts`. Rule engines, validators, and selectors
remain pure TypeScript and do not depend on React components, DOM dimensions, CSS
animation state, or localStorage.

### 4.2 Recommended source layout

```text
src/
  app/
  components/
  features/
    royal-inquest/
      definition.ts
      types.ts
      reducer.ts
      selectors.ts
      validation.ts
      hints.ts
      RoyalInquestBoard.tsx
    siege-lines/
      definition.ts
      types.ts
      reducer.ts
      selectors.ts
      validation.ts
      hints.ts
      SiegeLinesBoard.tsx
  shared/
    geometry.ts
    history.ts
    persistence.ts
    timer.ts
    accessibility.ts
  styles/
  test/
```

### 4.3 Data flow

For every meaningful player action:

1. Load immutable authored puzzle data and the newest valid save.
2. Translate input into a family-specific typed action.
3. Run the family reducer to produce a new immutable state.
4. Derive exclusions, counts, contradictions, and completion through pure selectors.
5. Record the transition in shared history.
6. Serialize the newest session.
7. Render React UI from state and derived results.

Rejected actions do not change state, increment move counts, or enter history. Starting
a new action after Undo clears Redo. Automatic consequences of one player action belong
to the same history entry.

### 4.4 Shared session

```ts
export interface PuzzleSession<State> {
  puzzleId: string;
  schemaVersion: number;
  definitionVersion: number;
  present: State;
  past: State[];
  future: State[];
  elapsedActiveMs: number;
  hintsUsed: number;
  checksUsed: number;
  completedAt?: string;
}
```

Use family-specific state and actions rather than one untyped puzzle payload. Apply a
conservative history cap by discarding only the oldest snapshots.

### 4.5 Persistence

Store each puzzle under an independent namespaced localStorage key. Persist the puzzle
and definition versions, family discriminator, family state, capped history, elapsed
time, hint/check usage, and completion state.

Save after every meaningful action without blocking input. Force a final save when the
document becomes hidden. Do not serialize pointer, focus, animation, or measured-pixel
state.

If a save is missing, corrupt, or incompatible, discard only that puzzle save, restore
its authored state, and display a non-blocking recovery message. A bad Inquest save must
not affect Siege Lines, or vice versa.

## 5. The Royal Inquest implementation

### 5.1 Rules and content

The MVP case is **The Treason at Blackwood Keep**. It uses a 6x6 spatial floor plan with
six characters, including the slain royal envoy. Chambers are authored independently
from cell boundaries, and some cells are blocked.

Canonical rules:

1. Exactly one character occupies each row.
2. Exactly one character occupies each column.
3. A character occupies only a legal, unblocked cell.
4. Every authored spatial clue is satisfied.
5. “Beside” means orthogonally adjacent and inside the same chamber.
6. The traitor is the only non-victim character sharing the envoy's chamber when no
   third character is present.

This is a spatial placement puzzle, not a category-matching matrix, crest assignment, or
transitive relationship grid.

Authoring rules for clues (enforced by `definitionValidation.ts`, not just convention):

- No clue may use `exact-row`/`exact-column` — those predicate types remain in the engine
  for internal use, but a clue must be phrased in terms of a chamber name (`exact-chamber`),
  a chamber relationship (`same-chamber`/`different-chamber`), an on-prop fact, or a
  cardinal/adjacency fact — never a bare row or column index.
- No clue may name the victim character as an operand of any predicate. The victim's cell
  is never stated; it is the one cell forced by elimination once every other character is
  placed, inside a chamber whose only other occupant is the traitor. `solveInquestDefinition`
  and `checkVictimElimination` (`solver.ts`) prove this at validation time — a definition
  that doesn't derive to a unique, victim-elimination-satisfying solution fails validation.
- On a full row/column-permutation board, two distinct characters never share a row or a
  column, so `beside`/`direction-from` between two different characters can never be
  authored `true` (they're only meaningful as always-false negative flavor, e.g.
  `not-beside`). Chamber-relationship clues and `on-prop` (a character is on the cell
  bearing a specific prop, e.g. "seated in the chair") are the load-bearing predicates.

### 5.2 Definition model

```ts
export interface GridPosition {
  row: number;
  column: number;
}

export interface InquestCharacter {
  id: string;
  name: string;
  portraitLabel: string;
  isVictim?: boolean;
}

export interface InquestCell {
  position: GridPosition;
  chamberId: string;
  blocked: boolean;
  propId?: PropAssetId;
}

// Naming below matches the shipped engine (`types.ts`), not this illustrative sketch's
// earlier camelCase draft. A prop's `propId` classifies as `seat` (character may occupy the
// cell, `blocked` must be false) or `decorative` (impassable, `blocked` must be true) — see
// `propKindByAsset` in `src/assets/royal-inquest/manifest.ts`.
export type InquestPredicate =
  | { type: "exact-row"; characterId: string; row: number } // engine-only; never authored on a clue
  | { type: "exact-column"; characterId: string; column: number } // engine-only; never authored on a clue
  | { type: "exact-chamber"; characterId: string; chamberId: string }
  | { type: "same-chamber"; firstCharacterId: string; secondCharacterId: string }
  | { type: "different-chamber"; firstCharacterId: string; secondCharacterId: string }
  | { type: "beside"; firstCharacterId: string; secondCharacterId: string }
  | { type: "not-beside"; firstCharacterId: string; secondCharacterId: string }
  | {
      type: "direction-from";
      subjectCharacterId: string;
      referenceCharacterId: string;
      direction: "north" | "east" | "south" | "west";
    }
  | { type: "on-prop"; characterId: string; propId: PropAssetId };

export interface InquestClue {
  id: string;
  text: string;
  predicate: InquestPredicate;
}

export interface RoyalInquestDefinition {
  id: string;
  version: number;
  rows: 6;
  columns: 6;
  characters: InquestCharacter[];
  cells: InquestCell[];
  clues: InquestClue[];
  traitorId: string;
  solution: Record<string, GridPosition>;
}
```

Structured predicates are the validation source of truth. Display text is never parsed
to determine validity.

### 5.3 State and actions

```ts
export interface RoyalInquestState {
  placements: Partial<Record<string, GridPosition>>;
  manualCrosses: string[];
  selectedCharacterId?: string;
  activeTool: "place" | "cross";
  moveCount: number;
}

export type RoyalInquestAction =
  | { type: "selectCharacter"; characterId: string }
  | { type: "placeCharacter"; characterId: string; position: GridPosition }
  | { type: "toggleManualCross"; position: GridPosition }
  | { type: "clearCharacter"; characterId: string }
  | { type: "setTool"; tool: "place" | "cross" };
```

Selection and tool changes do not create history. Placements, moves, clears, and
manual-cross changes do. Use canonical reversible cell keys such as `row:column`.

### 5.4 Exclusions and predicates

Auto-crossed cells (`CellState = 'auto-cross'`) are selectors, not persisted player marks.
Derive them live from rows or columns already occupied by another character. Manual
crosses remain a separate, persisted, per-character mark and are never erased when
auto-crossed cells change; a manual cross may only be removed while its row and column
both hold zero placed characters (`reducer.ts`'s `toggle-cross` enforces this).

A `conflict` cell state is distinct from both: a brief, non-persisted highlight applied
to the attempted cell when a placement is rejected specifically because its row or
column is already taken by another character (as opposed to being blocked or otherwise
illegal). It clears itself after a short timeout or on the next action.

Every predicate returns:

```ts
type ConstraintResult = "satisfied" | "violated" | "undetermined";
```

Partial placements return `undetermined` when a clue cannot be decided. Check Progress
reports only definite violations. “Beside” requires Manhattan distance one and the same
chamber. Coordinates increase from top to bottom and left to right. A north/south
predicate requires the same column and a lower/higher row respectively; an east/west
predicate requires the same row and a higher/lower column respectively.

### 5.5 Check Progress and hints

Check Progress evaluates in deterministic order:

1. illegal or blocked placements;
2. duplicate occupied rows;
3. duplicate occupied columns;
4. definitely violated clues;
5. a character with no remaining legal cell;
6. an invalid completed envoy/traitor chamber.

Return an explanation and affected character, cell, clue, or chamber without revealing
an unrelated correct destination.

Hints return existing contradictions first. Otherwise, select one deterministic
deduction from the bundled case, explain its rule or clue, and optionally offer one
placement or cross. Applying a hint is one normal history entry and increments hint
usage once.

### 5.6 Completion, presentation, and acceptance

The case completes only when all six characters are legally placed, row and column
uniqueness holds, all clues are satisfied, the traitor condition holds, and every
character occupies the authored solution cell. Structural rules are checked even though
a stored solution exists.

Interaction selects a portrait and then a legal cell. Scrolling the character carousel
(prev/next) immediately selects the newly-focused character for placement, without a
separate portrait click. The cross tool toggles a manual impossible mark. Fixed scenery
is not selectable unless it carries a seat prop, in which case a character may be placed
there (the prop renders under the avatar). Selected, focused, occupied, manually
crossed, auto-crossed, conflict, and invalid states are each visually distinct — conflict
uses a red highlight, the rest are distinguished without color. Keyboard controls support
portrait selection, cell navigation, placement, crossing, clearing, Undo, and Redo.

Acceptance requires:

- table-tested row/column, blocked-cell, chamber, and predicate rules;
- manual crosses that survive derived-exclusion changes;
- satisfied, violated, and undetermined tests for every predicate;
- deterministic contradiction and hint ordering;
- a replayable bundled solution fixture;
- completion rejection for every structural violation;
- Undo, Redo, Reset, save, reload, keyboard, touch, and accessible announcements.

## 6. Siege Lines implementation

### 6.1 Rules and content

The MVP map is **The Highgate Passage**. It uses a 7x7 grid, two fixed border endpoints,
an occupied-cell count for each row and column, fixed pieces, and editable cells.

Canonical rules:

1. The endpoints connect through one continuous route.
2. Every occupied non-endpoint cell has two orthogonal connections.
3. Each endpoint has one inward connection.
4. Adjacent route edges match.
5. The route does not branch or cross itself.
6. The route contains no separate loop.
7. No occupied segment is disconnected.
8. Every row matches its occupied-cell count.
9. Every column matches its occupied-cell count.

Roads and gates are a visual reskin only. Validation implements canonical Train Tracks.

### 6.2 Direction masks and definition

```ts
export const NORTH = 1;
export const EAST = 2;
export const SOUTH = 4;
export const WEST = 8;

export type NormalRouteMask = 3 | 6 | 12 | 9 | 5 | 10;
export type EndpointMask = 1 | 2 | 4 | 8;
export type RouteMask = NormalRouteMask | EndpointMask;

export interface SiegeCellDefinition {
  position: GridPosition;
  kind: "editable" | "fixed" | "endpoint";
  fixedMask?: RouteMask;
}

export interface SiegeLinesDefinition {
  id: string;
  version: number;
  rows: 7;
  columns: 7;
  rowCounts: number[];
  columnCounts: number[];
  cells: SiegeCellDefinition[];
  solution: Array<RouteMask | "empty">;
}
```

Normal masks represent four curves and two straights. Pure helpers implement opposite
direction, neighboring position, bit count, and compatibility.

Definition validation rejects invalid count lengths, out-of-bounds or duplicate cells,
missing endpoints, invalid fixed masks, outward-pointing endpoint masks, and an authored
solution that fails a public rule.

### 6.3 State, actions, and interaction

```ts
export type EditableSiegeCell =
  | { status: "undecided" }
  | { status: "empty" }
  | { status: "route"; mask: NormalRouteMask };

export interface SiegeLinesState {
  editableCells: Record<string, EditableSiegeCell>;
  selectedTool: "route" | "empty" | "clear";
  moveCount: number;
}

export type SiegeLinesAction =
  | { type: "cycleRoute"; position: GridPosition }
  | { type: "setRoute"; position: GridPosition; mask: NormalRouteMask }
  | { type: "markEmpty"; position: GridPosition }
  | { type: "clearCell"; position: GridPosition }
  | { type: "setTool"; tool: "route" | "empty" | "clear" };
```

Selecting an undecided cell with the route tool places the first orientation. Repeated
selection cycles through all six normal masks and returns to undecided. Empty marks a
cell definitively unused. Clear restores undecided. An explicit orientation picker
supports precise keyboard and touch input. Fixed pieces and endpoints reject edits.

Tool changes do not enter history. Editing creates one entry only when the logical cell
value changes. The cycle order is one documented constant covered by reducer tests.

### 6.4 Counts and compatibility

Row and column occupancy includes fixed pieces, in-grid endpoints, and editable route
cells. Empty and undecided cells are not occupied.

For each connection:

1. reject an edge outside the grid;
2. reject an edge entering a definitively empty cell;
3. require an occupied neighbor's opposite bit;
4. treat an undecided neighbor as unresolved, not immediately invalid.

Validation distinguishes contradiction from incompleteness.

### 6.5 Connectivity and completion

For a complete board:

1. verify exact row and column counts;
2. verify degree one at endpoints;
3. verify degree two at normal occupied cells;
4. traverse matching connections from one endpoint;
5. require the traversal to end at the other endpoint;
6. require every occupied cell to be visited exactly once.

These checks reject branches, crossings, separate loops, and disconnected components.
Connecting endpoints alone is not sufficient.

### 6.6 Check Progress and hints

Check Progress evaluates:

1. exceeded row or column counts;
2. counts unreachable with remaining undecided cells;
3. out-of-bounds edges;
4. edges entering empty cells;
5. mismatched occupied neighbors;
6. invalid endpoint or normal-cell degree;
7. a closed component excluding an endpoint;
8. a component that can no longer join the route.

Hints prioritize satisfied-line elimination, remaining-space completion, required
continuation, neighbor orientation elimination, loop prevention, and connectivity
preservation. Each explains one deduction before offering to apply it.

### 6.7 Presentation and acceptance

Current occupancy appears beside authored counts. Every cell announces coordinates,
fixed/editable status, route shape or empty mark, and contradiction state. Geometry,
labels, and shape distinguish focus, fixed state, counts, routes, and errors without
color. Reduced-motion users receive a static completion treatment; others may receive
one short, skippable CSS messenger traversal.

Acceptance requires:

- table-tested masks, opposite directions, compatibility, and boundaries;
- cycling through six masks and back to undecided;
- immutable rejection of edits to fixed pieces and endpoints;
- correct occupancy counts;
- rejection of branches, loops, mismatches, and disconnected segments;
- bundled definition validation and a replayable solution fixture;
- Check Progress that distinguishes contradiction from incompleteness;
- Undo, Redo, Reset, save, reload, keyboard, touch, and accessible announcements.

## 7. Shared UI and accessibility

Use the approved **Illuminated Ledger** direction:

- warm parchment as the primary surface;
- dark brown ink for text, borders, rooms, and puzzle geometry;
- deep crimson for primary actions, selections, and royal seals;
- burnt gold for completion and heraldic accents;
- optional midnight blue for secondary regions or Siege Lines features;
- restrained ornament around functional boards;
- CSS-generated texture beneath a solid readability layer;
- no external artwork or audio dependency.

Desktop layouts prioritize the board with a dossier beside it. Mobile layouts place
briefing and clues above a full-width board, with large wrapping controls below.

All actions work with keyboard, mouse, and touch. Functional colors meet WCAG 2.2 AA.
Targets are at least 44x44 CSS pixels where layout permits. The app remains usable at
200% zoom, respects `prefers-reduced-motion`, follows visible focus order, announces
status through live regions, and never relies only on color, texture, sound, or motion.

## 8. Error handling and testing

Invalid saves are isolated and replaced safely. Impossible actions leave state unchanged
and produce an accessible explanation. Malformed bundled definitions fail tests and
development startup. Completion and Check Progress verify public rules rather than
trusting only hidden solutions.

Unit tests cover both rule engines, reducers, validators, hints, completion, history,
serialization, recovery, and timer behavior. Component tests cover all input methods,
dialogs, announcements, Check Progress, hints, completion, and reload restoration.
Responsive smoke tests cover desktop, tablet, narrow mobile, 200% zoom, and reduced
motion. The production build must pass without TypeScript or console errors.

## 9. MVP delivery plan

### Phase 0: Foundation and Royal Inquest vertical slice

- Scaffold React, TypeScript, Vite, CSS, Vitest, and Testing Library.
- Implement the app shell and King's Ledger.
- Add shared history, timer, persistence, dialogs, and announcements.
- Add Royal Inquest definition validation and pure rule logic.
- Complete Blackwood Keep from briefing through resolution.

**Exit condition:** Royal Inquest can be completed, undone, redone, reset, saved,
restored, checked, hinted, and replayed with keyboard and pointer input.

### Phase 1: Siege Lines

- Add mask helpers and definition validation.
- Implement editing, counts, compatibility, and connectivity.
- Add Check Progress and deterministic hints.
- Add scalable rendering and precise orientation input.
- Complete Highgate Passage from briefing through resolution.

**Exit condition:** Siege Lines passes its solution fixture and all canonical Train
Tracks validation, persistence, input, and accessibility tests.

### Phase 2: MVP polish and acceptance

- Complete responsive Illuminated Ledger styling.
- Verify independent commission persistence and recovery.
- Complete keyboard, touch, zoom, contrast, and reduced-motion checks.
- Run the full automated suite and production build.

**Exit condition:** both commissions satisfy the approved MVP on desktop and mobile
without a backend or external asset dependency.

## 10. Recommended first engineering task

Implement **The Treason at Blackwood Keep** as an end-to-end vertical slice:

1. Add its definition and validator.
2. Implement placement, exclusion, predicates, contradiction, hint, and completion logic.
3. Add board and portrait interactions.
4. Connect Undo, Redo, Reset, timer, and persistence.
5. Complete Check Progress, hints, completion, and resolution.
6. Verify keyboard, touch, reload, reduced motion, and non-color cues.

This validates the React architecture and shared session services before the second
puzzle engine is introduced.

---

# Post-MVP Roadmap — Not Current Release Scope

Everything below this boundary is retained for later releases. It is **not part of the
current MVP**, must not block MVP acceptance, and must not be included in current release
estimates. Platform, navigation, rewards, progression, content counts, and delivery dates
remain provisional until a separate post-MVP design is approved.

Do not pre-build generalized grammar, graph, generation, campaign, currency, lore, or
mobile-native systems during the MVP.

## 11. Future family overview

| Puzzle family | Discipline | Primary reasoning | Content model |
|---|---|---|---|
| Leyline Weaving | Runecraft | connectivity and spatial rotation | generated and handcrafted |
| Celestial Binding | Astromancy | graph traversal and route planning | primarily handcrafted |
| Living Laws | True Naming | rule construction and state transformation | handcrafted only |

Provisional targets are 20 Leyline levels, 12 Celestial levels, and 8 Living Laws
levels. These are roadmap ideas, not release commitments.

## 12. Leyline Weaving

Players rotate rune tiles until all required tiles connect to a magical source through
reciprocal cardinal edges. Store an authored four-bit mask separately from a normalized
rotation. After an accepted rotation, compute effective masks, breadth-first search from
sources, derive powered tiles, and evaluate completion.

Future challenge generation may create a spanning tree, add controlled loops, randomize
rotations, reject solved starts, and analyze difficulty. Store the seed for
reproducibility. Campaign teaching levels remain handcrafted.

Hints may highlight an impossible orientation, identify a required connection, or apply
one confirmed rotation. Acceptance covers mask rotation, boundary behavior,
deterministic connectivity, locked-tile rejection, Undo/Reset fidelity, reproducible
generation, and shipped-level solvability.

## 13. Celestial Binding

Stars are nodes and paths are undirected edges. The player traces every required edge
once in one continuous stroke, with immediate reverse traversal removing the most recent
edge. Base content follows Euler-trail conditions.

Definitions use normalized coordinates and direction-independent edge identities.
Validation rejects duplicate/self edges, missing nodes, disconnected graphs, unsupported
coordinates, and invalid Euler conditions. An explicit idle/tracing/preview/completed
gesture state machine prevents pointer jitter from duplicating edges.

Hints identify valid starts, warn about an impossible unused-edge subgraph, suggest one
edge, or demonstrate a short prefix. Acceptance covers edge identity, no duplicate use,
single-edge backtracking, pointer-jitter resistance, responsive scaling, and non-color
feedback.

## 14. Living Laws

Living Laws uses an original magical vocabulary and presentation for physically changing
rules. Its first future release supports explicit three-token sentences:

```text
SUBJECT + VERB + COMPLEMENT
```

Initial scope may include horizontal and vertical sentences, multiple active rules,
noun-to-property rules, a small explicit set of binary relations, and noun-to-noun
transformation. Conjunctions, negation, conditions, arbitrary sentence length, stacked
entities, recursive transformations, and text-to-nontext transformation remain deferred.

Each accepted input parses rules, derives properties, plans movement and push chains,
commits movement, reparses moved words, applies simultaneous transformations and
interactions, then resolves danger and victory. Failed pushes are transactional.
Properties accumulate when compatible, pushing precedes interactions, and victory
follows destruction.

Hints are authored per level. Acceptance covers deterministic parsing, crossing
sentences, transactional pushes, complete Undo, iteration-order-independent
transformation, replayable solutions, and tutorials for all vocabulary.

## 15. Post-MVP decisions required before scheduling

Before a future family enters implementation planning, approve:

1. which family ships first and whether it joins the ledger or a campaign;
2. whether the supported platform remains web-only;
3. its exact first-release vocabulary or modifier set;
4. whether generated Leyline boards are optional challenge content;
5. how completion relates to lore, currency, abilities, or regions;
6. content count and difficulty progression;
7. persistence migrations and navigation changes;
8. originality and visual-identity review requirements.

These decisions belong to separate post-MVP designs and plans. They are not prerequisites
for completing the Royal Inquest and Siege Lines MVP.