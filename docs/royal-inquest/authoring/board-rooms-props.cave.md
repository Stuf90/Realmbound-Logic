# AUTHOR BOARD: ROOMS + PROPS

> AGENT FILE. CAVE SPEAK. HUMAN VERSION: `board-rooms-props.human.md`.
> BACK TO [ROYAL INQUEST RULES](../rules.cave.md).

THIS DOC = HOW BUILD ROYAL INQUEST BOARD: GRID, CHAMBERS ("ROOMS"), TILE ART, PROP
PLACE. ENFORCE IN `definitionValidation.ts` (`validateInquestDefinition`).

## GRID

- BOARD = `rows x columns` CELLS, ONE `InquestCell` PER POSITION.
- `InquestCell.position` = `{ row, column }`. EVERY POSITION MUST COVER EXACTLY ONE
  CELL (NO GAP, NO DUPLICATE).
- BOARD SIZE NOT FIX CONSTANT — `blackwoodKeep` = 9 ROW x 6 COL. UI GRID SIZE DRIVE FROM
  `definition.columns`/`rows`, NOT HARDCODE CSS.

## CHAMBERS ("ROOMS")

CHAMBER = NAME GROUP CELLS SHARE `chamberId`. CHAMBERS DIVIDE BOARD INTO ROOMS — NOT
SECOND COORD SYSTEM.

AUTHOR RULES, ENFORCE BY `validateInquestDefinition`:

1. **EVERY `chamberId` USE BY ANY CELL MUST HAVE NAME + ENVIRONMENT.**
   `chamberNames[chamberId]` + `chamberEnvironments[chamberId]` REQUIRE — ELSE
   `Chamber "<id>" must have a name and an environment.`
2. **MIN SIZE: 5 CELLS.** GROUP CELLS BY `chamberId`; EACH GROUP MUST HAVE >= 5 CELLS —
   ELSE `Chamber "<id>" must contain at least 5 tiles.` CHAMBERS MAY DIFFER SIZE ABOVE
   FLOOR — NO UNIFORM REQUIRE. (`blackwoodKeep` USE NINE 3-ROW x 2-COL, 6-TILE
   CHAMBERS.)

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
  `chamberNames[chamberId]`. CHAMBERS TYPICAL AUTHOR AS RECTANGLE ROW-MAJOR BLOCK, SO
  ANCHOR NATURAL = TOP-LEFT CORNER — KEEP AUTHOR CHAMBERS CONTIGUOUS RECTANGLE BLOCK SO
  LABEL LAND SENSIBLE.

## PROPS

PROP = DECOR SCENERY SIT ONE CELL — THRONE, BOOKSHELF, DUNGEON CAGE, ETC.

### DATA MODEL

- `InquestCell.propId?: PropAssetId` — OPTIONAL, REF ASSET IN
  `royalInquestAssets.props` (`manifest.ts`).
- PROP CELL REUSE EXIST `blocked` MECHANIC, NOT NEW OCCUPY CONCEPT: **PROP ALWAYS
  OCCUPY BLOCKED CELL.** CHARACTER NEVER STAND ON PROP — EXACT WHAT `blocked: true`
  ALREADY MEAN.

### ALLOW-LIST BY ENVIRONMENT

`manifest.ts` EXPORT `propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]>`
— LOGICAL FIT WHICH PROP BELONG WHICH ROOM KIND:

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
2. **BLOCKED CELL.** `cell.blocked` MUST BE `true` — ELSE
   `Prop "<propId>" must be placed on a blocked cell.`
3. **ENVIRONMENT-LEGAL.** `propId` MUST APPEAR IN
   `propsByEnvironment[chamberEnvironments[cell.chamberId]]` — ELSE
   `Prop "<propId>" is not permitted in a "<environment>" chamber.`

### RENDER

- `getCellPropUrl(definition, cell)` (`visuals.ts`) RESOLVE CELL `propId` TO
  `royalInquestAssets.props[propId]`, MIRROR `getCellTileUrl` FOR CHAMBER FLOOR TILE.
- BLOCKED CELL WITH `propId` RENDER `.cell-prop` `<img>` IN PLACE OF PLAIN `◆` GLYPH
  (BLOCKED CELL NO PROP KEEP GLYPH).

### AUTHOR CHECKLIST NEW PROP PLACE

1. PICK CELL SHOULD BE IMPASSABLE SCENERY; SET `blocked: true`.
2. CONFIRM CELL `chamberEnvironments[chamberId]` ALLOW PROP WANT (CHECK TABLE ABOVE OR
   `propsByEnvironment` DIRECT).
3. SET `propId` TO THAT ASSET ID.
4. MAKE SURE CELL NOT SOLUTION CELL OR `legalCharacterIds` TARGET FOR ANY CHARACTER —
   BLOCKED CELL NEVER PLACEMENT DESTINATION, MUST NOT COLLIDE PUZZLE AUTHOR `solution`
   OR ANY CHARACTER LEGAL-CELL LIST.
5. NEVER ADD `legalCharacterIds` TO PROP CELL ITSELF. PROP LIKE CHAIR/BENCH MUST READ
   OPEN TO ANY CHARACTER, NEVER SEAT RESERVE ONE — EVEN THOUGH CELL `blocked` ALREADY
   MAKE RESTRICTION MOOT PRACTICE, DON'T RELY ON THAT — AUTHOR CELL WITHOUT
   `legalCharacterIds` AT ALL. SEE
   [CHARACTER PLACEMENT](character-placement.cave.md#legal-cells) FULL RULE.

NON-GOAL: PROPS DECOR ONLY. NO INTERACT, PROP PRESENCE NOT FEED ANY CLUE PREDICATE.
