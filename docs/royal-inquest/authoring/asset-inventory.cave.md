# Asset inventory

> Agent file. Cave speak. Human version: [`asset-inventory.human.md`](asset-inventory.human.md).
> Back to [Royal Inquest rules](../rules.cave.md).

Covers Royal Inquest only. Siege Lines: zero image/audio asset. Board = Unicode glyph
+ CSS only (`SiegeLines.tsx`, `puzzle.css`).

All Royal Inquest asset file live `src/assets/royal-inquest/`. Truth source =
`src/assets/royal-inquest/manifest.ts`. No `public/` dir. No font file. No icon. No
sound. No window/dialog chrome image — all UI chrome plain CSS.

## Existing assets

### Avatars (18)

512x512 PNG per character, `src/assets/royal-inquest/avatars/`:

`monarch`, `royal-consort`, `royal-heir`, `nobleman`, `noblewoman`, `royal-envoy`,
`knight`, `guard-captain`, `court-physician`, `priest`, `monk`, `scholar`, `steward`,
`cook`, `maid`, `gardener`, `merchant`, `prisoner`

### Tiles (15 file, 7 environment)

`src/assets/royal-inquest/tiles/`:

| Environment | Variant |
| --- | --- |
| `room` | `room-timber-1/2/3.png` |
| `garden` | `garden-1/2/3.png` |
| `church` | `church-stone-1/2/3.png` |
| `kitchen` | `kitchen-flagstone-1/2/3.png` |
| `hallway` | `hallway-stone-1.png` |
| `dungeon` | `dungeon-masonry-1.png` |
| `royalRoom` | `royal-marble-1.png` |

### Props (23 id, 22 file)

`src/assets/royal-inquest/props/`. Kind = `seat` (char sit, cell unblocked) or
`decorative` (cell blocked). Full rule: [board-rooms-props.cave.md](board-rooms-props.cave.md#data-model).

| Kind | Props |
| --- | --- |
| `seat` | `throne`, `formal-chair`, `simple-chair`, `wooden-bench` (+ `-left`/`-right`), `church-pew` (+ `-left`/`-right`) |
| `decorative` | `bookshelf` (+ `-left`/`-right`), `barrel-cluster`, `dungeon-cage`, `stone-planter`, `wooden-planter`, `dining-table` (+ `-left`/`-right`), `kitchen-worktable` (+ `-left`/`-right`), `candle-stand`, `offering-chest`, `window` |

`-left`/`-right` pair = two half of one wide object, two adjacent cell. NOT two
alt single-cell art. See [split-prop rule](board-rooms-props.cave.md#-left-right-variants-are-two-cell-spans-not-single-cell-flavors).

Allow-list per environment (`propsByEnvironment`, manifest.ts):

| Environment | Allowed props |
| --- | --- |
| `royalRoom` | `throne`, `formal-chair`, `window` |
| `room` | `bookshelf` (+var), `simple-chair`, `wooden-bench` (+var), `barrel-cluster`, `dining-table` (+var), `window` |
| `church` | `church-pew` (+var), `candle-stand`, `offering-chest`, `window` |
| `dungeon` | `dungeon-cage`, `barrel-cluster`, `window` |
| `garden` | `stone-planter`, `wooden-planter`, `window` |
| `kitchen` | `kitchen-worktable` (+var), `barrel-cluster`, `dining-table` (+var), `window` |
| `hallway` | none — stay clear, on purpose |

### Marks / tokens — no image

Manual cross, auto-cross, blocked/no-prop, draft note = text glyph + CSS only
(`×`, `·`, `◆`, initials). No asset file exist for these.

### Known placeholder

`window` no dedicated art yet. `manifest.ts` reuse `stone-planter.png` as placeholder
(`// TODO(art)` comment at def). `manifest.test.ts` locks this mismatch on purpose —
fail loud if asset count assumption drift.

### Non-runtime file (exist disk, not in game)

- `src/assets/royal-inquest/contact-sheet.png`, `tile-repeat-sheet.png` — review sheet,
  art pipeline only, excluded from manifest on purpose.
- `tmp/royal-inquest-assets/` — dupe avatar set + review composite, leftover from
  first art-gen pass. No code import. Safe skip/clean.
- `docs/royal-inquest/reference/murdoku-book/` — physical book ref photo, design
  reference only, not game asset.

## Planned / possible future asset

Backlog, not commitment. Some idea only live unmerged branch —
`docs/superpowers/plans/2026-08-09-royal-inquest-asset-expansion.md` + paired design
doc, not on `main` yet.

- **Real `window` art** — swap `stone-planter` placeholder for real sprite. Two-cell
  span version (book window span 2 grid cell) = bigger separate change to prop model.
  See [board-rooms-props.cave.md](board-rooms-props.cave.md#asset-ideas-not-yet-built).
- **New props**: `door` (decorative, same model as existing block prop), `torch`,
  `painting`, `tapestry`, `torture-rack`, `royal-banner`, `garden-fountain`, plus
  `weapon-rack`/`shield-display` for possible new `armory` environment.
- **New tile variant**: `hallway-stone-2/3`, `dungeon-masonry-2/3`, `royal-marble-2/3`
  (every env got 3 variant except `hallway`/`dungeon` — only 1 each).
- **New `armory` `TileEnvironment`** with own `armory-stone-1/2/3` tile, paired with
  weapon-rack/shield-display prop above.
- **New outdoor/rural environment** — rustier, non-court counterpart to existing
  indoor set. Good for case set outside keep:
  - `farm` — tile like `farm-dirt-1/2/3`; prop: `hay-bale`, `feed-trough`, `well`,
    `scarecrow`, `farm-fence` (sit alongside existing `garden` env, not replace it).
  - `tavern` — tile like `tavern-planks-1/2/3`; prop: `tavern-bar` (seat-adjacent
    counter), `barstool` (seat), `ale-barrel`, `fireplace`, `dartboard`. Natural home
    for `barrel-cluster` too.
  - `cabin` — tile like `cabin-log-1/2/3`; prop: `cabin-bed` (seat, doubles as
    "resting place"), `wood-stove`, `washbasin`, `rocking-chair` (seat), `chest`
    (decorative, distinct from `offering-chest`).
  Each need own `propsByEnvironment` allow-list entry, same pattern as existing 7
  env — see [board-rooms-props.cave.md](board-rooms-props.cave.md#allow-list-by-environment).
- **Wall texture** — `walls/<environment>.png` set (1 per env, 8 incl armory) +
  `getCellWallTexture()` accessor, replace current plain CSS wall (`getCellWalls`,
  visuals.ts).
- **Image-based marks** — `marks/manual-cross.png`, `marks/auto-cross.png`, replace
  current text-glyph mark (`×`/`·`). Both say same thing — "selected char can't go
  here" — at 2 confidence level:
  - `manual-cross.png` — player own note, hand-placed on any cell they reason out or
    want ruled out. Pure bookkeeping, not derived from game state.
  - `auto-cross.png` — game own deduction: cell in same row/col as already-placed
    char auto-marked, since rule 1-2 forbid 2 char share row/col (see
    [rules.cave.md](../rules.cave.md#placement-rules)). Derived from game state,
    repaint live as placement change. Must stay visually distinct from manual mark
    so player tell "game ruled out" from "I ruled out" at glance.
- **New `art-style` doc** — formalize visual language once above land.

## Not gap (intentional, don't "fix")

- `hallway` no allowed prop at all — passageway stay visually clear, on purpose.
- Siege Lines zero visual asset by design — board legible from glyph alone.
- 3 unavailable puzzle family in `puzzleCatalog.ts` (`leyline-weaving`,
  `celestial-binding`, `living-laws`) — no asset, no level, `available: false` stub.
  Not missing-art bug.
