# Asset inventory

> Human version. Agent version: [`asset-inventory.cave.md`](asset-inventory.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

This document is a complete inventory of the visual assets that exist today, and a
tracked list of assets that are planned or plausible to add later. It covers **The
Royal Inquest** only — **Siege Lines** has no image or audio assets at all; its board
renders entirely from Unicode box-drawing glyphs and CSS (`SiegeLines.tsx`,
`puzzle.css`).

All Royal Inquest asset files live under `src/assets/royal-inquest/`, and the single
source of truth for which ids exist and what they resolve to is
`src/assets/royal-inquest/manifest.ts`. There is no `public/` directory, no fonts, no
icons, no sound effects, and no window/dialog chrome images anywhere in the project —
all UI chrome (panels, topbar, tray) is plain CSS.

## Existing assets

### Avatars (18)

One 512x512 PNG per character, `src/assets/royal-inquest/avatars/`:

`monarch`, `royal-consort`, `royal-heir`, `nobleman`, `noblewoman`, `royal-envoy`,
`knight`, `guard-captain`, `court-physician`, `priest`, `monk`, `scholar`, `steward`,
`cook`, `maid`, `gardener`, `merchant`, `prisoner`

### Tiles (15 files, 7 environments)

Floor art per `TileEnvironment`, `src/assets/royal-inquest/tiles/`:

| Environment | Variants |
| --- | --- |
| `room` | `room-timber-1/2/3.png` |
| `garden` | `garden-1/2/3.png` |
| `church` | `church-stone-1/2/3.png` |
| `kitchen` | `kitchen-flagstone-1/2/3.png` |
| `hallway` | `hallway-stone-1.png` |
| `dungeon` | `dungeon-masonry-1.png` |
| `royalRoom` | `royal-marble-1.png` |

### Props (23 ids, 22 files)

`src/assets/royal-inquest/props/`. Each prop is `seat` (character can sit there, cell
must be unblocked) or `decorative` (cell must be blocked) — see
[board, rooms, and props](board-rooms-props.human.md#data-model) for the full rule.

| Kind | Props |
| --- | --- |
| `seat` | `throne`, `formal-chair`, `simple-chair`, `wooden-bench` (+ `-left`/`-right`), `church-pew` (+ `-left`/`-right`) |
| `decorative` | `bookshelf` (+ `-left`/`-right`), `barrel-cluster`, `dungeon-cage`, `stone-planter`, `wooden-planter`, `dining-table` (+ `-left`/`-right`), `kitchen-worktable` (+ `-left`/`-right`), `candle-stand`, `offering-chest`, `window` |

`-left`/`-right` pairs are two halves of one wide object spanning two adjacent cells,
not alternate single-cell art — see
[the `-left`/`-right` variant rule](board-rooms-props.human.md#-left-right-variants-are-two-cell-spans-not-single-cell-flavors).

Allow-list by environment (`propsByEnvironment` in `manifest.ts`):

| Environment | Allowed props |
| --- | --- |
| `royalRoom` | `throne`, `formal-chair`, `window` |
| `room` | `bookshelf` (+ variants), `simple-chair`, `wooden-bench` (+ variants), `barrel-cluster`, `dining-table` (+ variants), `window` |
| `church` | `church-pew` (+ variants), `candle-stand`, `offering-chest`, `window` |
| `dungeon` | `dungeon-cage`, `barrel-cluster`, `window` |
| `garden` | `stone-planter`, `wooden-planter`, `window` |
| `kitchen` | `kitchen-worktable` (+ variants), `barrel-cluster`, `dining-table` (+ variants), `window` |
| `hallway` | *(none)* — deliberately kept clear, passageways stay empty |

### Marks / tokens (not images)

Manual cross, auto-cross, blocked/no-prop, and draft-note markers are all plain text
glyphs styled with CSS (`×`, `·`, `◆`, initials) — no asset files exist for these today.

### Known placeholder

`window` has no dedicated art yet. `manifest.ts` wires it to reuse `stone-planter.png`
as a placeholder texture (`// TODO(art)` comment at the definition), and
`manifest.test.ts` documents this exact mismatch so it fails loudly if the asset count
assumptions drift.

### Non-runtime files (exist on disk, not part of the game)

- `src/assets/royal-inquest/contact-sheet.png`, `tile-repeat-sheet.png` — review sheets
  for the art pipeline, deliberately excluded from the manifest.
- `tmp/royal-inquest-assets/` — a duplicate avatar set plus review composites left over
  from the original art-generation pass. Not imported by any code; safe to ignore or
  clean up.
- `docs/royal-inquest/reference/murdoku-book/` — reference photos of the physical
  Murdoku book, used for design reference, not game assets.

## Planned / possible future assets

These are documented ideas, not yet built. Some exist only as unmerged design docs
(`docs/superpowers/plans/2026-08-09-royal-inquest-asset-expansion.md` and its paired
design doc, on branches not yet merged to `main`) — treat them as a backlog, not a
commitment.

- **Real `window` art** — replace the current `stone-planter` placeholder with a
  dedicated sprite. The two-cell-span version of a window (the physical book's window
  visually spans two grid cells) is a larger, separate change to the prop model — see
  [board, rooms, and props](board-rooms-props.human.md#asset-ideas-not-yet-built).
- **New props**: `door` (decorative, same model as existing blocking props), `torch`,
  `painting`, `tapestry`, `torture-rack`, `royal-banner`, `garden-fountain`, plus
  `weapon-rack`/`shield-display` for a possible new `armory` environment.
- **New tile variants**: `hallway-stone-2/3`, `dungeon-masonry-2/3`, `royal-marble-2/3`
  (every environment currently has 3 variants except `hallway` and `dungeon`, which
  only have 1).
- **New `armory` `TileEnvironment`** with its own `armory-stone-1/2/3` tiles, paired
  with the `weapon-rack`/`shield-display` props above.
- **New outdoor/rural environments** — a rustier, non-court counterpart to the
  existing indoor set, useful for cases set outside the keep:
  - `farm` — tiles like `farm-dirt-1/2/3`; props: `hay-bale`, `feed-trough`,
    `well`, `scarecrow`, `farm-fence` (fits alongside the existing `garden` env
    rather than replacing it).
  - `tavern` — tiles like `tavern-planks-1/2/3`; props: `tavern-bar` (seat-adjacent
    counter), `barstool` (seat), `ale-barrel`, `fireplace`, `dartboard`. A natural
    home for `barrel-cluster` too.
  - `cabin` — tiles like `cabin-log-1/2/3`; props: `cabin-bed` (seat, doubling as
    "resting place"), `wood-stove`, `washbasin`, `rocking-chair` (seat), `chest`
    (decorative, distinct from `offering-chest`).
  Each would need its own `propsByEnvironment` allow-list entry, following the same
  pattern as the existing seven environments — see
  [board, rooms, and props](board-rooms-props.human.md#allow-list-by-environment).
- **Wall textures** — a `walls/<environment>.png` set (one per environment, 8 including
  `armory`) plus a `getCellWallTexture()` accessor, replacing the current plain
  CSS-drawn walls (`getCellWalls` in `visuals.ts`).
- **Image-based marks** — `marks/manual-cross.png` and `marks/auto-cross.png`, to
  replace the current text-glyph marks (`×`/`·`). Both mark the same idea — "this cell
  cannot hold the selected character" — at two different confidence levels:
  - `manual-cross.png` — the player's own note, placed by hand on any cell they've
    reasoned out or want to rule out; purely a bookkeeping aid, not derived from game
    state.
  - `auto-cross.png` — the game's own deduction: a cell in the same row or column as
    an already-placed character is automatically marked, since placement rules 1–2
    forbid two characters sharing a row or column (see
    [rules](../rules.human.md#placement-rules)). This one is derived from game state
    and repaints live as placements change; it must stay visually distinct from the
    manual mark so the player can tell "the game ruled this out" from "I ruled this
    out" at a glance.
- **A new `art-style` doc** to formalize the visual language once the above lands.

## Not asset gaps (documented as intentional)

- `hallway` has no allowed props at all — passageways are meant to stay visually clear,
  not an oversight.
- Siege Lines has zero visual assets by design; its board is legible from glyphs alone.
- The three unavailable puzzle families in `puzzleCatalog.ts` (`leyline-weaving`,
  `celestial-binding`, `living-laws`) have no assets and no levels — they're
  `available: false` stubs, not a missing-art bug.
