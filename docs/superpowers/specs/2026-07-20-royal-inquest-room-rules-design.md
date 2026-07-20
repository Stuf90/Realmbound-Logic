# Royal Inquest Room Rules Design

## Objective

Add authoring rules for Royal Inquest chambers ("rooms"): a minimum size, a visible name/boundary
indication, and logical prop placement using the existing art pack
(`src/assets/royal-inquest/manifest.ts`). Today none of this is representable or enforced:

- `blackwoodKeep`'s 9 chambers are all exactly 4 tiles on a 6x6 board.
- Chamber names exist only in the screen-reader `aria-label` (`RoyalInquest.tsx`), never rendered visibly.
  Chamber *boundaries* are already drawn via `getCellWalls` (`visuals.ts`) based on adjacent-cell
  `chamberId` differences — that part of "clear indication it's a room" already exists.
- There is no data model for "a prop sits at this cell". The asset-integration design doc
  (`2026-07-20-royal-inquest-asset-integration-design.md`) explicitly deferred this: "no data model exists
  for where a prop sits within a chamber, and authoring one is a separate design decision." This is that
  decision.
- `definitionValidation.ts` has no chamber-size or prop-legality checks.

This is a reusable rule set enforced in `definitionValidation.ts` for all future puzzle content, plus
`blackwoodKeep` redesigned to actually satisfy it (not grandfathered in as an exception).

## Data model

- `InquestCell` gains an optional `propId?: PropAssetId` (`types.ts`, mirroring how `chamberId` is already
  a per-cell field). A prop occupies a `blocked` cell — reusing the existing impassable-tile mechanic
  rather than adding a new one, since a prop is by definition something a character can't stand on.
- `manifest.ts` gains `propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]>`, the logical
  allow-list per environment:

  | Environment | Allowed props |
  | --- | --- |
  | `royalRoom` | `throne`, `formal-chair` |
  | `room` | `bookshelf`(+variants), `simple-chair`, `wooden-bench`(+variants), `barrel-cluster`, `dining-table`(+variants) |
  | `church` | `church-pew`(+variants) |
  | `dungeon` | `dungeon-cage`, `barrel-cluster` |
  | `garden` | `stone-planter`, `wooden-planter` |
  | `kitchen` | `kitchen-worktable`(+variants), `barrel-cluster`, `dining-table`(+variants) |
  | `hallway` | *(none)* — passageways stay clear |

  This is the mechanism that keeps, e.g., a bookshelf out of a `royalRoom` (court) or `garden`.

## Validation (`definitionValidation.ts`)

Additive checks alongside the existing structural ones:

1. Every `chamberId` referenced by `cells` must have an entry in both `chamberNames` and
   `chamberEnvironments` (previously only an implicit runtime requirement).
2. Group cells by `chamberId`; each group must contain **at least 5 cells** —
   `Chamber "<id>" must contain at least 5 tiles.` Chambers are free to differ in size above that floor;
   nothing requires uniformity.
3. For any cell with `propId` set:
   - it must be a known `PropAssetId`;
   - `cell.blocked` must be `true`;
   - it must appear in `propsByEnvironment[chamberEnvironments[cell.chamberId]]`, else
     `Prop "<propId>" is not permitted in a "<environment>" chamber.`

## Rendering — visible room identity

- `visuals.ts`: `getCellPropUrl(definition, cell)` → `royalInquestAssets.props[cell.propId]` or
  `undefined`, mirroring `getCellTileUrl`.
- `RoyalInquest.tsx`: the first cell of each `chamberId`, in `blackwoodKeep.cells` order, is that chamber's
  top-left corner (cells are generated row-major per rectangular chamber block in `definition.ts`). Render
  a small `.chamber-label` overlay with `chamberNames[chamberId]` on that anchor cell — the on-screen name
  indication to go with the walls that already mark the boundary.
- Blocked cells with a `propId` render a `.cell-prop` `<img>` in place of the plain `◆` glyph; blocked cells
  without one keep the existing glyph.
- The board's grid sizing (`repeat(6, ...)` columns, `aspect-ratio: 1`) moves from hardcoded `app.css` to
  inline styles driven by `definition.columns`/`rows`, since the redesigned board below is no longer 6x6.

## `blackwoodKeep` redesign

6x6 (9 chambers × 4 tiles) → **9 rows × 6 columns** (54 cells), three 3-row bands each split into three
2-column chambers:

```
rows 0-2: solar(cols0-1)     | west-gallery(cols2-3) | east-gallery(cols4-5)
rows 3-5: guardroom(cols0-1) | great-hall(cols2-3)   | gallery(cols4-5)
rows 6-8: chapel(cols0-1)    | archives(cols2-3)     | crypt(cols4-5)
```

All 9 chambers are 6 tiles — comfortably above the 5-tile floor. `chamberNames`/`chamberEnvironments` keep
their existing mapping.

New solution: `envoy(0,1)`, `aldric(1,0)`, `beatrice(2,4)`, `cedric(3,3)`, `daria(4,5)`, `edmund(6,2)`
(columns stay a 0-5 permutation; rows just need to stay distinct — both already validated). This keeps
every existing clue predicate true:

- `solar-witnesses` (same-chamber aldric/envoy): both land in `solar`.
- `beatrice-apart-from-cedric` (different-chamber): `east-gallery` vs `great-hall`.
- `edmund-archives` (exact-chamber): edmund lands in `archives`.
- `aldric-not-beside-edmund`: still far apart.

Only clue *text* needing an edit: `edmund-sixth-row`'s row moved from index 5 to index 6, so the text
becomes "seventh row" instead of "sixth row" to stay 1-indexed-accurate. `daria-fifth-row` keeps its text
(still row index 4).

Six blocked cells double as prop anchors — none overlapping a solution or legal cell:

| Cell | Chamber | Environment | Prop |
| --- | --- | --- | --- |
| `(0,0)` | solar | royalRoom | `throne` |
| `(3,2)` | great-hall | royalRoom | `formal-chair` |
| `(5,0)` | guardroom | room | `barrel-cluster` |
| `(7,0)` | chapel | church | `church-pew` |
| `(8,3)` | archives | room | `bookshelf` |
| `(6,4)` | crypt | dungeon | `dungeon-cage` |

`west-gallery`/`east-gallery`/`gallery` (all `hallway`) get no props — `propsByEnvironment.hallway` is
`[]`, so a prop there would fail validation; this is also the demonstration that a bookshelf (or anything)
can't land somewhere illogical.

## Non-goals

- No change to predicate/reducer semantics (`predicates.ts`, `reducer.ts`, `selectors.ts`).
- No prop interactivity — props are decorative, rendered like the existing `◆` glyph they replace.
- No requirement that every chamber differ in size; the rule is a floor, not a mandate for variety.

See `docs/superpowers/plans/2026-07-20-royal-inquest-room-rules.md` for the implementation plan.
