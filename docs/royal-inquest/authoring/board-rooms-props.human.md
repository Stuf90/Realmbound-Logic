# Authoring the board: rooms and props

> Human version. Agent version: [`board-rooms-props.cave.md`](board-rooms-props.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

This document covers how a Royal Inquest board is built: grid, chambers ("rooms"), tile
art, and prop placement. Enforced in `definitionValidation.ts` (`validateInquestDefinition`).

## Grid

- The board is `rows x columns` cells, one `InquestCell` per position.
- `InquestCell.position` is `{ row, column }`, and every position on the grid must be
  covered by exactly one cell (no gaps, no duplicates).
- Board size is not fixed to a constant — the shipped case (`blackwoodKeep`) is 6x6.
  Grid sizing in the UI is driven from `definition.columns`/`rows`, not a hardcoded CSS
  value.

## Chambers ("rooms")

A chamber is a named group of cells sharing a `chamberId`. Chambers are how the board is
divided into rooms; they are not a second coordinate system.

Authoring rules, enforced by `validateInquestDefinition`:

1. **Every `chamberId` used by any cell must have both a name and an environment.**
   `chamberNames[chamberId]` and `chamberEnvironments[chamberId]` are required —
   `Chamber "<id>" must have a name and an environment.`
2. **Minimum size: 5 cells.** Group cells by `chamberId`; each group must contain at
   least 5 cells — `Chamber "<id>" must contain at least 5 tiles.` Chambers may differ in
   size above that floor; there's no uniformity requirement.

`chamberEnvironments` values are one of the `TileEnvironment` union:
`'room' | 'garden' | 'church' | 'kitchen' | 'hallway' | 'dungeon' | 'royalRoom'`. The
environment selects both the chamber's tile art (`royalInquestAssets.tiles[environment]`)
and which props may be placed in it (see below).

### Visible room identity

A room needs to visibly read as a room, not just be a data grouping:

- **Boundary** — `getCellWalls` (`visuals.ts`) draws a wall wherever an adjacent cell has
  a different `chamberId`. This is automatic from the `chamberId` layout; nothing extra
  needs authoring.
- **Label** — the first cell of each `chamberId`, in the order cells appear in
  `definition.cells`, is treated as that chamber's anchor and renders a `.chamber-label`
  overlay with `chamberNames[chamberId]`. If chambers are authored as contiguous
  rectangular blocks this anchor naturally lands at the chamber's top-left corner, but
  irregularly-shaped chambers are allowed too — the shipped case uses four irregular
  chambers below the Solar specifically so the one-per-row/one-per-column rule, combined
  with the clue set, forces each non-victim character's cell uniquely (see
  [character placement](character-placement.human.md)).

## Props

A prop is a piece of scenery that sits in a specific cell — a throne, a bookshelf, a
dungeon cage, and so on.

### Data model

- `InquestCell.propId?: PropAssetId` — optional, references an asset in
  `royalInquestAssets.props` (`manifest.ts`).
- Unlike a generic scenery system, **whether a prop is a seat or decorative is a
  property of the prop asset itself**, not something an author decides per cell.
  `manifest.ts` exports `propKindByAsset: Record<PropAssetId, 'seat' | 'decorative'>`:

  | Kind | Props | Cell requirement |
  | --- | --- | --- |
  | `seat` | `throne`, `formal-chair`, `simple-chair`, `wooden-bench` (+ variants), `church-pew` (+ variants) | must be **unblocked** — a character can be placed there |
  | `decorative` | `bookshelf` (+ variants), `barrel-cluster`, `dungeon-cage`, `stone-planter`, `wooden-planter`, `dining-table` (+ variants), `kitchen-worktable` (+ variants), `candle-stand`, `offering-chest` | must be **blocked** — permanently impassable |

  There is no per-cell "reserve this seat for one specific character" mechanism — a seat
  cell is exactly as open to every character as any other unblocked cell once you
  place a chair or bench on it.

### Allow-list by environment

`manifest.ts` also exports `propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]>`
— the logical fit of which props belong in which kind of room, independent of the
seat/decorative split above:

| Environment | Allowed props |
| --- | --- |
| `royalRoom` | `throne`, `formal-chair` |
| `room` | `bookshelf` (+ `-left`/`-right`), `simple-chair`, `wooden-bench` (+ variants), `barrel-cluster`, `dining-table` (+ variants) |
| `church` | `church-pew` (+ variants), `candle-stand`, `offering-chest` |
| `dungeon` | `dungeon-cage`, `barrel-cluster` |
| `garden` | `stone-planter`, `wooden-planter` |
| `kitchen` | `kitchen-worktable` (+ variants), `barrel-cluster`, `dining-table` (+ variants) |
| `hallway` | *(none)* — passageways stay clear |

A bookshelf can never end up in a `royalRoom` (court) or a `garden`, and nothing at all
can be placed in a `hallway` chamber — that's enforced by validation, not just
convention.

`church` used to have **no decorative-only prop** at all — only `church-pew` and its variants,
which are all `seat`-kind. `candle-stand`/`offering-chest` close that gap. Before this fix, a
blocked cell in a `church` chamber with no prop fell back to the bare `◆` glyph (see "Rendering"
below) purely because no legal decorative asset existed yet for that environment — don't assume
every environment has decorative coverage; check `propsByEnvironment` for the specific environment
you're authoring against, every time. (This exact gap was copy-pasted into two other levels whose
environments *did* have decorative coverage — see the checklist addition below.)

#### `-left`/`-right` variants are two-cell spans, not single-cell flavors

`bookshelf-left`/`-right`, `dining-table-left`/`-right`, `kitchen-worktable-left`/`-right`,
`wooden-bench-left`/`-right`, and `church-pew-left`/`-right` are **not** alternate single-cell art
for the same object — each pair is one wide object split across exactly two horizontally-adjacent
cells in the same chamber, produced by `tools/royal_inquest_assets/split_prop.py` from a single
2-cell-wide source image. `-left` goes in the left cell, `-right` in the cell immediately to its
right. A `-left`/`-right` variant placed alone, with no matching half in the adjacent cell, renders
as an object with an abruptly cropped edge. Always place them as a pair. If no adjacent
same-chamber cell is free — not a solution cell, not already holding another prop — use the plain
base asset (`bookshelf`, `dining-table`, `kitchen-worktable`, …) instead of a lone half.

### Validation

For every cell with `propId` set, `validateInquestDefinition` requires all of:

1. **Known asset.** `propId` must be a real `PropAssetId` — otherwise
   `Prop "<propId>" is not a known prop asset.`
2. **Blocked state matches the prop's kind.** Looked up via `propKindByAsset`:
   - a `seat` prop on a blocked cell — `Seat prop "<propId>" must be on an unblocked
     cell so a character can use it.`
   - a `decorative` prop on an unblocked cell — `Decorative prop "<propId>" must be
     placed on a blocked cell.`
3. **Environment-legal.** `propId` must appear in
   `propsByEnvironment[chamberEnvironments[cell.chamberId]]` — otherwise
   `Prop "<propId>" is not permitted in a "<environment>" chamber.`

### Rendering

- `getCellPropUrl(cell)` (`visuals.ts`) resolves a cell's `propId` to
  `royalInquestAssets.props[propId]`, mirroring `getCellTileUrl` for chamber floor tiles.
- In `RoyalInquest.tsx`, prop art and a placed character's avatar render simultaneously
  when both are present (the prop underneath, `z-index: 0`; the avatar on top,
  `z-index: 1`) — this is what makes a seat prop read as "this character is sitting in
  the chair" rather than one replacing the other. A blocked cell with no prop falls back
  to the plain `◆` glyph.

### Authoring checklist for a new prop placement

1. Pick the prop asset you want and check its kind in `propKindByAsset`.
2. Set `blocked` to match: `true` for a `decorative` prop, `false` for a `seat` prop.
3. Confirm the cell's `chamberEnvironments[chamberId]` allows that prop (check the table
   above, or `propsByEnvironment` directly).
4. Set `propId` to that asset's ID.
5. If it's a decorative (blocked) prop, make sure the cell isn't a solution cell for any
   character — a blocked cell can never be a placement destination, so it must not
   collide with the puzzle's authored `solution`.
6. Never copy a "these cells have no prop art" list from an existing level into a new one without
   re-checking `propsByEnvironment` for the *new* level's chamber environment at those exact cells —
   a gap that's real for one environment may not exist for another, and copying it blind leaves
   decoratable cells rendering the bare `◆` glyph for no reason.
7. Don't place the same `PropAssetId` in two cells that share an edge — it reads as a stamped-twice
   copy-paste. Prefer a different environment-legal asset over relocating an already-blocked cell:
   moving which cells are blocked can silently break `solveInquestDefinition`'s uniqueness proof,
   while swapping the asset at an already-blocked cell never does.

Non-goal: props are otherwise decorative. There is no interactivity beyond the seat
mechanic above, and a prop's mere presence doesn't feed a clue predicate on its own —
that requires an explicit `on-prop` clue (see
[clues and predicates](clues-and-predicates.human.md)).

## Asset ideas not yet built

Two prop ideas not yet implemented — captured here as future ideas, not a spec:

1. **Door** — a blocking decorative prop, distinct from the existing
   `dungeon-cage`/`bookshelf`/etc. Just a new asset, not a new predicate — slots
   straight into the existing `decorative` prop model above.
2. **Window edge-only rule** — a window prop that only sits on the board's outer edge,
   spanning two grid cells. Needs a new asset **and** a new placement constraint
   (edge-adjacency check) — the engine has no edge-adjacency concept today.
