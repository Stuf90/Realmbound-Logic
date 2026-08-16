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
  | `decorative` | `bookshelf` (+ VARIANT), `barrel-cluster`, `dungeon-cage`, `stone-planter`, `wooden-planter`, `dining-table` (+ VARIANT), `kitchen-worktable` (+ VARIANT), `candle-stand`, `offering-chest` | MUST BE **BLOCKED** — PERMANENT IMPASSABLE |

  NO PER-CELL "RESERVE THIS SEAT ONE SPECIFIC CHARACTER" MECHANISM — SEAT CELL EXACT AS
  OPEN TO EVERY CHARACTER AS ANY OTHER UNBLOCKED CELL ONCE CHAIR/BENCH PLACE ON IT.

- `manifest.ts` ALSO EXPORT `propCategoryByAsset: Record<PropAssetId, string>` (ADD
  2026-08-16, `shares-prop-category-neighbor` PREDICATE — SEE
  [CLUES + PREDICATES](clues-and-predicates.cave.md#shares-prop-category-neighbor)) —
  GROUP ASSET VARIANT SAME "THING" DIFFERENT SKIN/ENVIRONMENT INTO ONE CATEGORY STRING:
  `stone-planter`/`wooden-planter` → `planter`; `dining-table`/`-left`/`-right` →
  `dining-table`; `kitchen-worktable`/`-left`/`-right` → `kitchen-worktable`;
  `bookshelf`/`-left`/`-right` → `bookshelf`; `wooden-bench`/`-left`/`-right` →
  `wooden-bench`; `church-pew`/`-left`/`-right` → `church-pew`. EVERY OTHER ASSET (NO
  SIBLING VARIANT) MAP TO OWN ID — ALREADY UNIQUE CATEGORY. SEPARATE FROM `propKindByAsset`
  (SEAT/DECORATIVE) — ORTHOGONAL CONCERN, ONE ASSET HAVE BOTH A KIND + A CATEGORY.

### ALLOW-LIST BY ENVIRONMENT

`manifest.ts` ALSO EXPORT `propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]>`
— LOGICAL FIT WHICH PROP BELONG WHICH ROOM KIND, INDEPENDENT FROM SEAT/DECORATIVE SPLIT
ABOVE:

| ENVIRONMENT | ALLOW PROPS |
| --- | --- |
| `royalRoom` | `throne`, `formal-chair` |
| `room` | `bookshelf` (+ `-left`/`-right`), `simple-chair`, `wooden-bench` (+ VARIANT), `barrel-cluster`, `dining-table` (+ VARIANT) |
| `church` | `church-pew` (+ VARIANT), `candle-stand`, `offering-chest` |
| `dungeon` | `dungeon-cage`, `barrel-cluster` |
| `garden` | `stone-planter`, `wooden-planter` |
| `kitchen` | `kitchen-worktable` (+ VARIANT), `barrel-cluster`, `dining-table` (+ VARIANT) |
| `hallway` | *(NONE)* — PASSAGE STAY CLEAR |

BOOKSHELF NEVER END UP `royalRoom` (COURT) OR `garden`. NOTHING PLACE `hallway`
CHAMBER AT ALL — ENFORCE BY VALIDATION, NOT JUST CONVENTION.

`church` USE HAVE **NO DECORATIVE-ONLY PROP** AT ALL — ONLY `church-pew` + VARIANT, ALL
`seat`-KIND. `candle-stand`/`offering-chest` CLOSE GAP. BEFORE FIX: BLOCK CELL IN
`church` CHAMBER NO PROP → FALL BACK BARE `◆` GLYPH (SEE "RENDER" BELOW) — ONLY BECAUSE
NO LEGAL DECORATIVE ASSET EXIST YET FOR THAT ENV. DON'T ASSUME EVERY ENV HAVE
DECORATIVE COVER — CHECK `propsByEnvironment` FOR SPECIFIC ENV AUTHOR AGAINST, EVERY
TIME. (SAME GAP COPY-PASTE INTO TWO OTHER LEVEL WHOSE ENV *DID* HAVE DECORATIVE COVER —
SEE CHECKLIST ADD BELOW.)

#### `-left`/`-right` VARIANT = TWO-CELL SPAN, NOT SINGLE-CELL FLAVOR

`bookshelf-left`/`-right`, `dining-table-left`/`-right`, `kitchen-worktable-left`/`-right`,
`wooden-bench-left`/`-right`, `church-pew-left`/`-right` NOT ALTERNATE SINGLE-CELL ART
SAME OBJECT — EACH PAIR = ONE WIDE OBJECT SPLIT ACROSS EXACT TWO ADJACENT CELL SAME
CHAMBER, MAKE BY `tools/royal_inquest_assets/split_prop.py` FROM ONE 2-CELL-WIDE SOURCE
IMAGE. `-left` GO LEFT CELL, `-right` GO CELL RIGHT NEXT TO IT. `-left`/`-right` PLACE
ALONE (NO MATCH HALF ADJACENT CELL) → RENDER OBJECT WITH ABRUPT CROP EDGE. ALWAYS PLACE
PAIR TOGETHER. NO ADJACENT SAME-CHAMBER CELL FREE (NOT SOLUTION CELL, NOT ALREADY HOLD
OTHER PROP) → USE PLAIN BASE ASSET (`bookshelf`, `dining-table`, `kitchen-worktable`, …)
INSTEAD LONE HALF.

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
6. NEVER COPY "THESE CELL NO PROP ART" LIST FROM EXIST LEVEL INTO NEW LEVEL WITHOUT
   RE-CHECK `propsByEnvironment` FOR *NEW* LEVEL CHAMBER ENV AT THOSE EXACT CELL — GAP
   REAL FOR ONE ENV MAY NOT EXIST OTHER ENV. COPY BLIND → DECORATABLE CELL RENDER BARE
   `◆` GLYPH FOR NO REASON.
7. DON'T PLACE SAME `PropAssetId` IN TWO CELL SHARE EDGE — READ AS STAMP-TWICE COPY-
   PASTE. PREFER DIFFERENT ENV-LEGAL ASSET OVER RELOCATE ALREADY-BLOCKED CELL: MOVE
   WHICH CELL BLOCKED CAN SILENT BREAK `solveInquestDefinition` UNIQUENESS PROOF, WHILE
   SWAP ASSET AT ALREADY-BLOCKED CELL NEVER DOES.

NON-GOAL: PROPS OTHERWISE DECOR ONLY. NO INTERACT BEYOND SEAT MECHANIC ABOVE, PROP MERE
PRESENCE NOT FEED CLUE PREDICATE ON OWN — NEED EXPLICIT `on-prop` CLUE (SEE
[CLUES + PREDICATES](clues-and-predicates.cave.md)).

## ASSET IDEA NOT YET BUILD

1. **DOOR** — BLOCK DECORATIVE PROP, DISTINCT FROM EXIST `dungeon-cage`/`bookshelf`/ETC.
   PLAIN NEW ASSET, NOT NEW PREDICATE — SLOT STRAIGHT INTO EXIST `decorative` PROP MODEL
   ABOVE.
2. **WINDOW EDGE-ONLY RULE** — MOSTLY DONE. `window` NOW REAL `PropAssetId`
   (DECORATIVE, PERMIT EVERY CHAMBER ENV), `definitionValidation.ts` REQUIRE ANY CELL
   BEAR IT SIT BOARD OUTER EDGE, `by-window` PREDICATE (SEE
   [CLUES + PREDICATES](clues-and-predicates.cave.md)) CHECK ORTHOGONAL ADJACENCY. TWO
   THING STAY OPEN, BOTH NON-GOAL IN
   `docs/superpowers/specs/2026-08-08-royal-inquest-predicate-expansion-design.md`:
   - **REAL ART.** `royalInquestAssets.props.window` REUSE `stone-planter` IMAGE
     PLACEHOLDER (`// TODO(art)` IN `manifest.ts`) TODAY — NO SOURCE WINDOW SPRITE YET,
     ASSET PIPELINE (`tools/royal_inquest_assets/`) ONLY PROCESS EXIST SOURCE IMAGE, NOT
     GENERATE NEW ART.
   - **TWO-CELL SPAN.** BOOK WINDOW VISUAL SPAN TWO GRID CELL; MVP HERE = NORMAL
     SINGLE-CELL DECORATIVE PROP, EDGE-VALIDATE ADD ON. MODEL REAL MULTI-CELL PROP =
     SEPARATE BIGGER CHANGE PLACEMENT/RENDER MODEL.
