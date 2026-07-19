# Realmbound Logic Playable MVP Design

**Date:** 2026-07-19  
**Status:** Approved for implementation planning  
**Platform:** Responsive local web application  
**Stack:** React, TypeScript, Vite, CSS, Vitest, Testing Library  

## 1. Goal

Build a polished local vertical slice of Realmbound Logic containing one complete Royal Inquest case and one complete Siege Lines map. Both puzzles must be genuinely playable, automatically validated, responsive, accessible, and saved locally without requiring a backend.

The medieval presentation changes names, fiction, and visual treatment only. It does not invent new puzzle rules or replace the established mechanics.

## 2. Scope

### Included

- A commission index called **The King’s Ledger**
- One Royal Inquest case: **The Treason at Blackwood Keep**
- One Siege Lines map: **The Highgate Passage**
- Briefing, play, completion, and resolution states for each commission
- Undo and redo
- Reset with confirmation
- Check Progress
- One-step contextual hints
- Elapsed active-time display
- Automatic local progress saving
- Keyboard, mouse, and touch input
- Responsive layouts for desktop, tablet, and mobile
- Reduced-motion support and non-color status indicators
- Automated rule-engine and interaction tests

### Excluded

- Accounts, cloud synchronization, or backend services
- Procedural generation or puzzle authoring tools
- Campaign progression or daily puzzles
- Multiple difficulty levels
- Multiplayer, leaderboards, monetization, or analytics
- External artwork or audio dependencies

## 3. Experience structure

The app opens as **The King’s Ledger**, a parchment-bound commission index containing two entries:

1. **The Treason at Blackwood Keep** — the player acts as Grand Investigator.
2. **The Highgate Passage** — the player acts as Royal Architect.

Each commission follows:

`Briefing → Play → Automatic validation → Resolution`

The app remembers completion and in-progress state independently for both commissions.

## 4. Visual direction

The approved direction is **Illuminated Ledger**.

- Warm parchment is the primary surface.
- Dark brown ink defines text, borders, rooms, and puzzle geometry.
- Deep crimson identifies primary actions, selected characters, and royal seals.
- Burnt gold is reserved for completion and heraldic accents.
- Midnight blue may distinguish secondary regions or Siege Lines map features.
- Serif display type is used for titles; a highly readable text face is used for rules and controls.
- Ornament remains restrained around the functional board.
- Parchment wear and texture are CSS-generated beneath a solid readability layer.
- Every interactive state remains distinguishable without texture, sound, animation, or color.

On desktop, the board is dominant and a dossier panel beside it contains the briefing, characters or map key, and clues. On mobile, the briefing and clue summary move above the full-width board, with large wrapping controls beneath it.

## 5. Shared gameplay

### Controls

- **Undo:** Restore the complete state before the most recent player action.
- **Redo:** Reapply the most recently undone action.
- **Reset:** Return to the authored starting state after confirmation.
- **Check Progress:** Identify contradictions without revealing unrelated solution cells.
- **Hint:** Explain and optionally apply one deterministic next deduction.
- **Timer:** Display elapsed active time without affecting completion.

### State history

Every meaningful player action produces a new immutable state snapshot. Automatic consequences caused by an action belong to the same history entry. Starting a new action after Undo clears the Redo stack.

### Persistence

Progress is serialized to `localStorage` after each meaningful action. Each save contains a schema version, puzzle ID, puzzle state, history, elapsed time, and completion status.

If stored data is missing, corrupt, or incompatible, the app discards only that puzzle save, restores its authored starting state, and displays a non-blocking recovery message.

### Completion

Completion is detected automatically. The completion view preserves the solved board, displays elapsed time and hint/check use, and presents a short narrative resolution.

## 6. The Royal Inquest

### 6.1 Theme and board

The player places every guest within Blackwood Keep. One guest is a slain royal envoy. The traitor is the only lord sharing the envoy’s chamber with nobody else present.

The case uses a 6×6 spatial grid containing six characters, including the envoy. Chamber boundaries are authored independently from cell boundaries. Some cells are blocked by scenery or explicit puzzle rules.

| Spatial mystery concept | Royal Inquest presentation |
| --- | --- |
| Crime scene | Castle floor plan |
| Suspects | Lords and courtiers |
| Victim | Slain royal envoy |
| Rooms or areas | Named chambers |
| Furniture and scenery | Banners, braziers, tables, armour racks, and thrones |
| Murderer | Traitor |

### 6.2 Canonical rules

1. Exactly one character occupies each row.
2. Exactly one character occupies each column.
3. A character can occupy only a legal, unblocked cell.
4. Every authored spatial clue must be satisfied.
5. “Beside” means orthogonally adjacent—north, east, south, or west—and within the same chamber.
6. The traitor is the sole non-victim character sharing the envoy’s chamber when no third character is present.

No category-matching matrix, crest assignment, tower assignment, or transitive relationship grid is part of this mechanic.

### 6.3 Interaction

- Select a character portrait, then select a legal cell to place that character.
- Selecting another legal cell moves the selected character.
- Select the ink-cross tool, then select cells to mark them impossible.
- Selecting an existing cross clears it.
- Placing a character derives unavailable marks for every other candidate cell in that row and column.
- Derived marks never erase the player’s manual crosses.
- Fixed scenery cannot be selected as a destination.
- Selected, focused, occupied, manually crossed, and derived-unavailable states are visually distinct.

Keyboard controls provide portrait selection, cell navigation, placement, crossing, clearing, Undo, and Redo.

### 6.4 Clue model

Clues are structured predicates evaluated against candidate or completed placements. The case may use exact chamber, exact row or column, cardinal direction relative to a person or object, orthogonal adjacency, non-adjacency, same chamber, different chamber, and scene-specific legal-cell restrictions.

Display text accompanies every predicate but is not the validation source of truth.

### 6.5 Validation and hints

Check Progress identifies multiple characters in one row or column, illegal placement, a determinable clue violation, a character with no remaining legal position, or a completed arrangement with an invalid envoy/traitor chamber. It identifies the affected entity or constraint without revealing a correct destination.

The hint engine returns one deterministic next step from the current correct deductions. It explains the applicable rule or clue before offering to apply a placement or cross. Existing contradictions take priority.

### 6.6 Completion

The case completes only when all six characters occupy their authored solution cells, every clue is satisfied, row/column uniqueness holds, and the traitor condition is satisfied. The resolution names the traitor and explains the decisive chamber arrangement using only puzzle-supported facts.

## 7. Siege Lines

### 7.1 Theme and board

The player completes the King’s highway from Highgate to an allied outpost. Stone road segments replace railway tracks; gates replace railway endpoints. The visual reskin does not change Train Tracks rules.

The map uses a 7×7 grid with two fixed border endpoints, an occupied-cell clue for every row and column, several fixed straight or curved segments, and editable undecided cells.

### 7.2 Canonical rules

1. The endpoints must be connected by one continuous route.
2. Each occupied non-endpoint cell contains a straight or curved segment with exactly two orthogonal connections.
3. Each endpoint has exactly one inward connection.
4. Adjacent route edges must match.
5. The route cannot branch or cross itself.
6. The route cannot form a separate loop.
7. The route cannot contain disconnected occupied segments.
8. Each row contains exactly its indicated number of occupied route cells.
9. Each column contains exactly its indicated number of occupied route cells.

### 7.3 Tile representation

Connections use a four-bit mask shared by rendering and validation:

- North: `1`
- East: `2`
- South: `4`
- West: `8`

Normal masks represent north–south, east–west, north–east, east–south, south–west, and west–north. Endpoints use one connection bit.

### 7.4 Interaction

- Selecting an undecided editable cell places the first legal route orientation.
- Repeated selection cycles through the six normal orientations and then returns to undecided.
- The Empty tool marks a cell definitively unused.
- Clear returns an editable cell to undecided.
- An explicit orientation picker supports precise touch and keyboard operation.
- Fixed pieces and endpoints cannot be changed.
- Current row and column occupancy appears beside the authored counts.

### 7.5 Validation and hints

Check Progress identifies excessive or unreachable line counts, out-of-bounds edges, edges entering empty cells, mismatched connections, invalid degrees, closed components excluding an endpoint, and components that can no longer connect.

The hint engine favors satisfied-line elimination, remaining-space completion, required continuation, edge and neighbour orientation removal, loop prevention, and connectivity preservation. It explains the deduction before offering to apply it.

### 7.6 Completion

The map completes only when every row and column count is satisfied and every occupied cell forms one simple path between the endpoints. Occupied normal cells have degree two and endpoints degree one. Reduced-motion users receive a static completion treatment; others receive one short, skippable messenger traversal.

## 8. Architecture and data flow

The React application has four independent areas:

- **App shell:** navigation, commission cards, briefings, resolutions, settings, persistence notices, and shared controls.
- **Royal Inquest module:** data types, state, placements, crosses, exclusions, predicates, validation, hints, completion, and board rendering.
- **Siege Lines module:** data types, state, masks, line counts, connection checks, path validation, hints, completion, and board rendering.
- **Shared services:** history, timer, local persistence, settings, announcements, and reusable controls.

Puzzle modules do not depend on each other.

Data flows as follows:

1. A commission loads immutable puzzle data and its newest valid save.
2. The UI emits a typed action.
3. The applicable reducer returns a new immutable state.
4. Selectors calculate exclusions, counts, contradictions, and completion.
5. History records the transition.
6. Persistence serializes the newest state.
7. React renders from state and derived results.

## 9. Error handling

- Invalid saves are isolated to their puzzle and replaced safely.
- Impossible UI actions leave state unchanged and produce an accessible explanation.
- Fixed puzzle elements cannot dispatch editing actions.
- Malformed bundled puzzles fail validation in automated tests and development startup.
- Completion and Check Progress verify public rules and structural constraints rather than trusting only a hidden solution.

## 10. Accessibility

- Functional colors meet WCAG 2.2 AA contrast.
- All actions work with keyboard, mouse, and touch.
- Touch targets are at least 44×44 CSS pixels where layout permits.
- Board cells announce coordinates, contents, availability, and relevant state.
- Selected, excluded, occupied, fixed, invalid, and completed states use shape or text in addition to color.
- Focus order follows the visible interface.
- The interface remains functional at 200% zoom.
- Motion respects `prefers-reduced-motion`.
- Neither puzzle requires timed play.

## 11. Testing and acceptance

Royal Inquest tests cover row/column uniqueness, blocked placement, manual versus derived exclusions, spatial predicates, chamber membership, traitor identification, completion rejection, and bundled-case hints.

Siege Lines tests cover mask compatibility, line counts, endpoint and normal-cell degree, branch/loop/crossing/disconnected rejection, completion, and bundled-map hints.

Shared tests cover Undo/Redo fidelity, reset confirmation, save restoration, invalid-save recovery, timer behavior, keyboard interaction, accessible status, responsive smoke checks, and the production build.

The MVP is accepted when both bundled commissions can be completed from their authored starting states on desktop and mobile, all validation and persistence tests pass, and the production build succeeds without console errors.
