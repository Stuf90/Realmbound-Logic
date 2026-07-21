# AUTHOR BOARD: ROOMS + PROPS

> AGENT FILE. CAVE SPEAK. HUMAN VERSION: `board-rooms-props.human.md`.
> BACK TO [ROYAL INQUEST RULES](../rules.cave.md).

THIS DOC = HOW BUILD ROYAL INQUEST BOARD: GRID, CHAMBERS ("ROOMS"), TILE ART, PROP
PLACE. ENFORCE IN `definitionValidation.ts` (`validateInquestDefinition`).

## GRID

- BOARD = `rows x columns` CELLS, ONE `InquestCell` PER POSITION.
- `InquestCell.position` = `{ row, column }`. EVERY POSITION MUST COVER EXACTLY ONE
  CELL (NO GAP, NO DUPLICATE).
- BOARD SIZE NOT FIX CONSTANT — SHIP CASE (`blackwoodKeep`) = 6x6. UI GRID SIZE DRIVE
  FROM `definition.columns`/`rows`, NOT HARDCODE CSS.

## CHAMBERS ("ROOMS")

CHAMBER = NAME GROUP CELLS SHARE `chamberId`. CHAMBERS DIVIDE BOARD INTO ROOMS — NOT
SECOND COORD SYSTEM.

AUTHOR RULES, ENFORCE BY `validateInquestDefinition`:

1. **EVERY `chamberId` USE BY ANY CELL MUST HAVE NAME + ENVIRONMENT.**
   `chamberNames[chamberId]` + `chamberEnvironments[chamberId]` REQUIRE — ELSE
   `Chamber "<id>" must have a name and an environment.`
2. **MIN SIZE: 5 CELLS.** GROUP CELLS BY `chamberId`; EACH GROUP MUST HAVE >= 5 CELLS —
   ELSE `Chamber "<id>" must contain at least 5 tiles.` CHAMBERS MAY DIFFER SIZE ABOVE
   FLOOR — NO UNIFORM REQUIRE.

`chamberEnvironments` VALUES = ONE OF `TileEnvironment` UNION:
`'room' | 'garden' | 'church' | 'kitchen' | 'hallway' | 'dungeon' | 'royalRoom'`.
ENVIRONMENT PICK CHAMBER TILE ART (`royalInquestAssets.tiles[environment]`) + WHICH
PROPS ALLOW IN IT (SEE BELOW).

### VISIBLE ROOM IDENTITY

ROOM NEED READ VISIBLE AS ROOM, NOT JUST DATA GROUP:

- **BOUNDARY** — `getCellWalls` (`visuals.ts`) DRAW WALL WHEREVER ADJACENT CELL HAVE
  DIFFERENT `chamberId`. AUTOMATIC FROM `chamberId` LAYOUT — NOTHING EXTRA AUTHOR NEED.
- **LABEL** — FIRST CELL OF EACH `chamberId`, ORDER CELLS APPEAR IN `definition.cells`,
  TREAT AS CHAMBER ANCHOR — RENDER `.chamber-label` OVERLAY WITH
  `chamberNames[chamberId]`. CONTIGUOUS RECTANGLE CHAMBER → ANCHOR NATURAL LAND TOP-
  LEFT CORNER, BUT IRREGULAR-SHAPE CHAMBER ALLOW TOO — SHIP CASE USE FOUR IRREGULAR
  CHAMBER BELOW SOLAR SPECIFIC SO ONE-PER-ROW/ONE-PER-COLUMN RULE + CLUE SET FORCE EACH
  NON-VICTIM CHARACTER CELL UNIQUE (SEE
  [CHARACTER PLACEMENT](character-placement.cave.md)).

## PROPS

PROP = SCENERY SIT ONE CELL — THRONE, BOOKSHELF, DUNGEON CAGE, ETC.

### DATA MODEL

- `InquestCell.propId?: PropAssetId` — OPTIONAL, REF ASSET IN
  `royalInquestAssets.props` (`manifest.ts`).
- UNLIKE GENERIC SCENERY SYSTEM, **WHETHER PROP = SEAT OR DECORATIVE = PROPERTY OF PROP
  ASSET ITSELF**, NOT AUTHOR CHOICE PER CELL. `manifest.ts` EXPORT
  `propKindByAsset: Record<PropAssetId, 'seat' | 'decorative'>`:

  | KIND | PROPS | CELL REQUIRE |
  | --- | --- | --- |
  | `seat` | `throne`, `formal-chair`, `simple-chair`, `wooden-bench` (+ VARIANT), `church-pew` (+ VARIANT) | MUST BE **UNBLOCKED** — CHARACTER CAN PLACE THERE |
  | `decorative` | `bookshelf` (+ VARIANT), `barrel-cluster`, `dungeon-cage`, `stone-planter`, `wooden-planter`, `dining-table` (+ VARIANT), `kitchen-worktable` (+ VARIANT) | MUST BE **BLOCKED** — PERMANENT IMPASSABLE |

  NO PER-CELL "RESERVE THIS SEAT ONE SPECIFIC CHARACTER" MECHANISM — SEAT CELL EXACT AS
  OPEN TO EVERY CHARACTER AS ANY OTHER UNBLOCKED CELL ONCE CHAIR/BENCH PLACE ON IT.

### ALLOW-LIST BY ENVIRONMENT

`manifest.ts` ALSO EXPORT `propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]>`
— LOGICAL FIT WHICH PROP BELONG WHICH ROOM KIND, INDEPENDENT FROM SEAT/DECORATIVE SPLIT
ABOVE:

| ENVIRONMENT | ALLOW PROPS |
| --- | --- |
| `royalRoom` | `throne`, `formal-chair` |
| `room` | `bookshelf` (+ `-left`/`-right`), `simple-chair`, `wooden-bench` (+ VARIANT), `barrel-cluster`, `dining-table` (+ VARIANT) |
| `church` | `church-pew` (+ VARIANT) |
| `dungeon` | `dungeon-cage`, `barrel-cluster` |
| `garden` | `stone-planter`, `wooden-planter` |
| `kitchen` | `kitchen-worktable` (+ VARIANT), `barrel-cluster`, `dining-table` (+ VARIANT) |
| `hallway` | *(NONE)* — PASSAGE STAY CLEAR |

BOOKSHELF NEVER END UP `royalRoom` (COURT) OR `garden`. NOTHING PLACE `hallway`
CHAMBER AT ALL — ENFORCE BY VALIDATION, NOT JUST CONVENTION.

### VALIDATION

FOR EVERY CELL WITH `propId` SET, `validateInquestDefinition` REQUIRE ALL:

1. **KNOWN ASSET.** `propId` MUST BE REAL `PropAssetId` — ELSE
   `Prop "<propId>" is not a known prop asset.`
2. **BLOCK STATE MATCH PROP KIND.** LOOK UP VIA `propKindByAsset`:
   - `seat` PROP ON BLOCKED CELL — `Seat prop "<propId>" must be on an unblocked cell so
     a character can use it.`
   - `decorative` PROP ON UNBLOCKED CELL — `Decorative prop "<propId>" must be placed on
     a blocked cell.`
3. **ENVIRONMENT-LEGAL.** `propId` MUST APPEAR IN
   `propsByEnvironment[chamberEnvironments[cell.chamberId]]` — ELSE
   `Prop "<propId>" is not permitted in a "<environment>" chamber.`

### RENDER

- `getCellPropUrl(cell)` (`visuals.ts`) RESOLVE CELL `propId` TO
  `royalInquestAssets.props[propId]`, MIRROR `getCellTileUrl` FOR CHAMBER FLOOR TILE.
- `RoyalInquest.tsx`: PROP ART + PLACE CHARACTER AVATAR RENDER SAME TIME WHEN BOTH
  PRESENT (PROP UNDERNEATH `z-index: 0`, AVATAR ON TOP `z-index: 1`) — THIS MAKE SEAT
  PROP READ "CHARACTER SIT IN CHAIR" INSTEAD ONE REPLACE OTHER. BLOCKED CELL NO PROP
  FALL BACK PLAIN `◆` GLYPH.

### AUTHOR CHECKLIST NEW PROP PLACE

1. PICK PROP ASSET WANT, CHECK KIND IN `propKindByAsset`.
2. SET `blocked` MATCH: `true` FOR `decorative` PROP, `false` FOR `seat` PROP.
3. CONFIRM CELL `chamberEnvironments[chamberId]` ALLOW THAT PROP (CHECK TABLE ABOVE OR
   `propsByEnvironment` DIRECT).
4. SET `propId` TO THAT ASSET ID.
5. IF DECORATIVE (BLOCKED) PROP, MAKE SURE CELL NOT SOLUTION CELL FOR ANY CHARACTER —
   BLOCKED CELL NEVER PLACEMENT DESTINATION, MUST NOT COLLIDE PUZZLE AUTHOR `solution`.

NON-GOAL: PROPS OTHERWISE DECOR ONLY. NO INTERACT BEYOND SEAT MECHANIC ABOVE, PROP MERE
PRESENCE NOT FEED CLUE PREDICATE ON OWN — NEED EXPLICIT `on-prop` CLUE (SEE
[CLUES + PREDICATES](clues-and-predicates.cave.md)).
