# Authoring the board: rooms and props

> Human version. Agent version: [`board-rooms-props.cave.md`](board-rooms-props.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

This document covers how a Royal Inquest board is built: grid, chambers ("rooms"), tile
art, and prop placement. Enforced in `definitionValidation.ts` (`validateInquestDefinition`).

## Grid

- The board is `rows x columns` cells, one `InquestCell` per position.
- `InquestCell.position` is `{ row, column }`, and every position on the grid must be
  covered by exactly one cell (no gaps, no duplicates).
- Board size is not fixed to a constant — `blackwoodKeep` is 9 rows x 6 columns. Grid
  sizing in the UI is driven from `definition.columns`/`rows`, not a hardcoded CSS value.

## Chambers ("rooms")

A chamber is a named group of cells sharing a `chamberId`. Chambers are how the board is
divided into rooms; they are not a second coordinate system.

Authoring rules, enforced by `validateInquestDefinition`:

1. **Every `chamberId` used by any cell must have both a name and an environment.**
   `chamberNames[chamberId]` and `chamberEnvironments[chamberId]` are required —
   `Chamber "<id>" must have a name and an environment.`
2. **Minimum size: 5 cells.** Group cells by `chamberId`; each group must contain at
   least 5 cells — `Chamber "<id>" must contain at least 5 tiles.` Chambers may differ in
   size above that floor; there's no uniformity requirement. (`blackwoodKeep` uses nine
   3-row x 2-column, 6-tile chambers.)

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
  overlay with `chamberNames[chamberId]`. Since chambers are typically authored as
  rectangular row-major blocks, this anchor is naturally the chamber's top-left corner —
  keep authoring chambers as contiguous rectangular blocks so the label lands somewhere
  sensible.

## Props

A prop is a piece of decorative scenery that sits in a specific cell — a throne, a
bookshelf, a dungeon cage, and so on.

### Data model

- `InquestCell.propId?: PropAssetId` — optional, references an asset in
  `royalInquestAssets.props` (`manifest.ts`).
- A prop cell reuses the existing `blocked` mechanic rather than introducing a new
  occupancy concept: **a prop always occupies a blocked cell.** A character can never
  stand on a prop, which is exactly what `blocked: true` already means.

### Allow-list by environment

`manifest.ts` exports `propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]>`
— the logical fit of which props belong in which kind of room:

| Environment | Allowed props |
| --- | --- |
| `royalRoom` | `throne`, `formal-chair` |
| `room` | `bookshelf` (+ `-left`/`-right`), `simple-chair`, `wooden-bench` (+ variants), `barrel-cluster`, `dining-table` (+ variants) |
| `church` | `church-pew` (+ variants) |
| `dungeon` | `dungeon-cage`, `barrel-cluster` |
| `garden` | `stone-planter`, `wooden-planter` |
| `kitchen` | `kitchen-worktable` (+ variants), `barrel-cluster`, `dining-table` (+ variants) |
| `hallway` | *(none)* — passageways stay clear |

A bookshelf can never end up in a `royalRoom` (court) or a `garden`, and nothing at all
can be placed in a `hallway` chamber — that's enforced by validation, not just convention.

### Two kinds of prop cell

A prop cell can be blocked or unblocked, and the two mean different things:

- **Decorative (blocked).** Pure impassable scenery — a throne no one actually sits in,
  a bookshelf, a dungeon cage. No character can ever occupy the cell. Don't add
  `legalCharacterIds` here; it would be dead data with no effect, since nobody can reach
  the cell regardless.
- **A specific seat (unblocked).** The prop is the literal piece of furniture a
  character's solution cell sits at — a chair, a bench. Set `legalCharacterIds` to the
  one character (or characters) who may sit there; combined with the puzzle's row/column
  uniqueness, this is how a chair becomes *the* correct seat for exactly one character to
  solve on, not an open cell any of the six could occupy.

### Validation

For every cell with `propId` set, `validateInquestDefinition` requires all of:

1. **Known asset.** `propId` must be a real `PropAssetId` — otherwise
   `Prop "<propId>" is not a known prop asset.`
2. **Environment-legal.** `propId` must appear in
   `propsByEnvironment[chamberEnvironments[cell.chamberId]]` — otherwise
   `Prop "<propId>" is not permitted in a "<environment>" chamber.`

There is no structural requirement that a prop cell be blocked — that choice is up to
the author, per the two kinds above. Validation does not (yet) reject
`legalCharacterIds` on a blocked prop cell, so don't rely on it to catch that mistake;
just don't author it that way.

### Rendering

- `getCellPropUrl(cell)` (`visuals.ts`) resolves a cell's `propId` to
  `royalInquestAssets.props[propId]`, mirroring `getCellTileUrl` for chamber floor tiles.
- In `RoyalInquest.tsx`, a cell renders (in priority order): the placed character's
  avatar if occupied, else the cell's prop image if it has one, else — only for a
  blocked cell with no prop — the plain `◆` glyph. An unblocked seat prop is fully
  visible until a character is placed there, then the character's avatar takes over.

### Authoring checklist for a new prop placement

1. Decide which kind of prop cell you're authoring (decorative vs. a specific seat —
   see above).
2. Confirm the cell's `chamberEnvironments[chamberId]` allows the prop you want (check
   the table above, or `propsByEnvironment` directly).
3. Set `propId` to that asset's ID.
4. **Decorative:** set `blocked: true`, no `legalCharacterIds`. Make sure the cell isn't
   a solution cell or a `legalCharacterIds` target for any character — a blocked cell
   can never be a placement destination, so it must not collide with the puzzle's
   authored `solution` or any character's legal-cell list.
5. **Seat:** set `blocked: false` and `legalCharacterIds` to the character(s) who may
   occupy it. If it's meant to be *the* solution cell for one character, make sure the
   puzzle's authored `solution` actually places that character there — see
   [character placement](character-placement.human.md#legal-cells).

Non-goal: props are otherwise decorative. There is no interactivity beyond the seat
mechanic above, and a prop's presence does not itself feed any clue predicate.
