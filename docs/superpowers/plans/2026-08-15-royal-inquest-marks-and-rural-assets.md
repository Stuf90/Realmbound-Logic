# Royal Inquest: Cross Marks + Rural Environments (farm/tavern/cabin) — Codex Instructions

> **For Codex:** this doc is self-contained — it does not depend on any Claude Code
> "superpowers" sub-skill. Read it fully before starting. It follows the same
> asset-contract conventions as the original art pass, documented at
> `docs/superpowers/archive/plans/2026-07-19-royal-inquest-art-assets.md` — skim that
> file first if anything below is ambiguous.
>
> Background/rationale for *why* these specific assets: see
> `docs/royal-inquest/authoring/asset-inventory.human.md`, section "Planned / possible
> future assets".

**Goal:** generate two independent, additive asset batches for The Royal Inquest, using
the `$image-gen` tool:

1. **Two overlay mark icons** — `manual-cross.png` and `auto-cross.png` — to replace the
   current plain-CSS-glyph marks (`×` for a player's manual note, `·` for the game's
   automatic row/column-conflict deduction).
2. **Three new rural `TileEnvironment`s** — `farm`, `tavern`, `cabin` — each with 3 tile
   variants and 4-5 matching props.

These are two unrelated batches; do them as separate tasks/commits, in either order.

## Global constraints (same as the original art pass)

- Do this work in a dedicated non-`main` Git worktree.
- Complete all generation + normalization + manifest wiring before running any test
  suite; run tests once at the end, per `AGENTS.md`.
- Every final runtime PNG is 512x512.
- Do not overwrite any existing file under `src/assets/royal-inquest/` — these are pure
  additions.
- Do not change Royal Inquest gameplay/placement rules — this is art + manifest wiring
  only. New props' `seat`/`decorative` kind and `propsByEnvironment` allow-list entries
  are data, not rule changes.
- Reuse the existing normalization pipeline in `tools/royal_inquest_assets/` — don't
  write new Python tooling unless a genuine gap shows up (there shouldn't be one; marks
  and rural props/tiles are the same shapes as existing props/tiles).

## Batch 1 — Cross marks

### What these mean (read before generating)

Both mark the same idea — "the selected character cannot go in this cell" — but at two
different confidence levels, and they must look distinguishable at a glance:

- **`manual-cross.png`** — the player's own note, hand-placed on any cell. Pure
  bookkeeping; not derived from game state.
- **`auto-cross.png`** — the game's own deduction: any cell in the same row or column as
  an already-placed character is auto-marked (Royal Inquest's row/column-uniqueness
  rule). Repaints live as placements change.

These render as a small overlay on top of a tile (and possibly a prop) — not a full-cell
image like a tile, and not a large centered subject like a prop. Treat them like a prop
generation (transparent corners, single centered subject) but scaled down: the subject
should occupy roughly the center 40-50% of the frame, not 80-90% like a normal prop, so
it reads as an overlay stamp rather than a full tile occupant.

### Prompt prefix — marks (new; extends the prop prefix)

```text
Use case: stylized-concept
Asset type: small overlay indicator mark for a grid cell in the mobile medieval logic game Royal Inquest
Primary request: Create one small centered symbol that reads clearly as an overlay stamp on top of other art, not as a standalone object.
Style/medium: refined 2D game illustration, crisp dark-brown ink outline, restrained parchment texture, sophisticated rather than cartoonish
Composition/framing: exact straight-down orthographic view, single symbol centered and occupying roughly the middle 45% of the frame, generous transparent padding on all sides, no perspective tilt
Lighting/mood: even neutral light, no directional cast shadow
Color palette: burgundy, navy, forest green, warm stone, dark oak, antique gold
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background
Constraints: background is one uniform #00ff00 with no shadow, gradient, texture, reflection, or floor plane; do not use #00ff00 in the symbol; symbol reads clearly at 48 pixels (smaller than a typical prop, since it overlays other art); compact, simple silhouette
Avoid: words, labels, logos, watermark, people, scenery, furniture, isometric or three-quarter view, cast shadow, photorealism, pixel art, drop shadow
```

### Assets to generate

| Filename | Subject sentence |
| --- | --- |
| `manual-cross.png` | Subject: a hand-inked dark-brown ink X mark, slightly uneven brushstroke character, quill-drawn feel, confident but informal. |
| `auto-cross.png` | Subject: a precise antique-gold geometric X mark with a thin navy inner outline, mechanical and rule-stamped rather than hand-drawn, clearly distinct in character from a hand-inked mark. |

The two must be distinguishable from each other even at small size and even for a
colorblind player — lean on the shape/texture contrast (hand-inked vs. geometric-stamped)
described above, not color alone.

### Steps

1. Generate one source image per row above with `$image-gen`, appending the subject
   sentence to the marks prefix. Keep raw output under
   `tmp/royal-inquest-assets/marks/` (outside the runtime tree).
2. Inspect each: reject if the X extends edge-to-edge (should have overlay-scale
   padding), has a nonuniform green background, has any text/watermark, or the two marks
   are only distinguishable by color. Regenerate rejected ones only.
3. Normalize both with `tools/royal_inquest_assets/normalize_cutout.py` into
   `src/assets/royal-inquest/marks/manual-cross.png` and `.../marks/auto-cross.png`
   (new `marks/` subfolder, same convention as `avatars/`/`props/`/`tiles/`).
4. Add a `marks` entry to `src/assets/royal-inquest/manifest.ts`:
   `royalInquestAssets.marks: { manualCross: string; autoCross: string }`. Update
   `manifest.test.ts`'s key/URL-count assertions to match.
5. Wire the two renderers that currently emit the `×`/`·` text glyphs (search `puzzle.css`
   and the Royal Inquest board component for the manual-cross/auto-cross glyph logic) to
   render these images instead, sized to overlay legibly on top of tile + prop + avatar
   layers (`z-index` above both, per the existing prop-under/avatar-over convention in
   `RoyalInquest.tsx`).
6. Build a review contact sheet: `build_contact_sheet.py --root src/assets/royal-inquest/marks --out tmp/royal-inquest-assets/marks-review.png --tile-size 96`, and inspect both marks side by side at that size before committing.
7. Commit: `git add src/assets/royal-inquest/marks src/assets/royal-inquest/manifest.ts src/assets/royal-inquest/manifest.test.ts && git commit -m "feat: add image-based cross marks for Royal Inquest"`.

## Batch 2 — Rural environments: farm, tavern, cabin

Each new environment needs 3 tile variants (reuse the **Tile prefix** from the archived
art plan verbatim) and its props (reuse the **Prop prefix** verbatim). Do not invent new
prefixes for these — only the subject sentences below are new.

### Tiles

| Output names | Surface sentence | Variant sentences |
| --- | --- | --- |
| `farm-dirt-{1,2,3}.png` | Subject: packed warm-brown farmyard dirt with scattered straw wisps and faint furrow lines, rustic and lived-in. | 1: mostly bare packed dirt. 2: slightly more straw coverage. 3: faint furrow pattern with light straw scatter. |
| `tavern-planks-{1,2,3}.png` | Subject: worn dark-oak tavern floorboards, wider boards than a formal room, faint ale stains and scuff marks, welcoming and rough. | 1: clean worn boards. 2: slightly darker knot patterns and one small stain. 3: heavier scuffing with restrained stain marks. |
| `cabin-log-{1,2,3}.png` | Subject: rustic split-log cabin flooring, warm honey-oak tone, visible rounded log-cut seams, cozy and simple. | 1: even log-cut boards. 2: slightly varied grain with one small knot. 3: softly worn boards with faint soot smudge near one edge. |

### Props

| Filename | Environment | Kind | Subject sentence |
| --- | --- | --- | --- |
| `hay-bale.png` | farm | decorative | Subject: a compact round hay bale viewed exactly from above, warm golden straw texture, twine bindings visible. |
| `feed-trough.png` | farm | decorative | Subject: a weathered dark-oak feed trough viewed exactly from above, empty interior, iron corner bands. |
| `well.png` | farm | decorative | Subject: a circular warm-stone well viewed exactly from above, dark-oak roof brace crossing the opening, small bucket-rope detail. |
| `scarecrow.png` | farm | decorative | Subject: a simple crossed-post scarecrow viewed exactly from above, straw-stuffed burlap tunic, worn straw hat, compact footprint. |
| `farm-fence.png` | farm | decorative | Subject: a short section of rustic dark-oak post-and-rail fence viewed exactly from above, weathered wood, compact rectangular footprint. |
| `tavern-bar.png` | tavern | seat | Subject: a long dark-oak tavern serving counter viewed exactly from above, worn tabletop, subtle grain, multi-person footprint. |
| `barstool.png` | tavern | seat | Subject: a simple round-topped wooden barstool viewed exactly from above, worn oak seat, one-person footprint. |
| `ale-barrel.png` | tavern | decorative | Subject: a single upright wooden ale barrel viewed exactly from above, dark iron hoops, tapped spigot detail. |
| `fireplace.png` | tavern | decorative | Subject: a warm-stone tavern fireplace hearth viewed exactly from above, dark-oak mantle edge, restrained ember glow, compact footprint. |
| `dartboard.png` | tavern | decorative | Subject: a round dartboard mounted flat viewed exactly from above, burgundy and cream wedge pattern, antique-gold rim, compact footprint. |
| `cabin-bed.png` | cabin | seat | Subject: a simple rustic single-person bed viewed exactly from above, dark-oak frame, forest-green woven blanket, compact rectangular footprint. |
| `wood-stove.png` | cabin | decorative | Subject: a small cast-iron wood stove viewed exactly from above, dark-oak surround, restrained pipe detail, compact footprint. |
| `washbasin.png` | cabin | decorative | Subject: a round warm-stone washbasin on a low stand viewed exactly from above, plain and practical, compact footprint. |
| `rocking-chair.png` | cabin | seat | Subject: a plain dark-oak rocking chair viewed exactly from above, curved rocker base visible at the footprint edges, one-person footprint. |
| `chest.png` | cabin | decorative | Subject: a small dark-oak storage chest viewed exactly from above, iron corner bands and hasp, distinct in shape from the existing offering chest (no religious motifs). |

`seat` here follows the existing rule: cell must be unblocked. `decorative` here follows
the existing rule: cell must be blocked. See
`docs/royal-inquest/authoring/board-rooms-props.human.md#data-model` if the seat/
decorative split is unfamiliar.

### Steps

1. Generate the 9 tile sources (3 environments x 3 variants) with `$image-gen` using the
   **Tile prefix** verbatim + the sentences above. Keep raw output under
   `tmp/royal-inquest-assets/tiles/`.
2. Generate the 15 prop sources with `$image-gen` using the **Prop prefix** verbatim +
   the sentences above. Keep raw output under `tmp/royal-inquest-assets/props/`.
3. Inspect/reject per the same criteria as the original pass (perspective tilt, floor
   plane, directional shadow, clipped geometry, text, nonuniform green, illegible at 96
   pixels for props; borders/objects/focal points/text for tiles). Regenerate rejected
   ones only.
4. Build each environment's 3 tiles with
   `tools/royal_inquest_assets/build_tile_set.py`'s `build_environment`, output to
   `src/assets/royal-inquest/tiles/farm-dirt-{1,2,3}.png` etc. This is what makes the 3
   variants mutually edge-compatible — don't skip it and normalize tiles individually.
5. Normalize each prop with `normalize_cutout.py` into
   `src/assets/royal-inquest/props/<name>.png`.
6. Update `src/assets/royal-inquest/manifest.ts`:
   - Add `'farm' | 'tavern' | 'cabin'` to the `TileEnvironment` union, each mapped to its
     3-variant tuple.
   - Add the 15 new prop ids to `PropAssetId`, each with a `royalInquestAssets.props`
     entry.
   - Add all 15 to `propKindByAsset` (`seat`/`decorative` per the table above).
   - Add three new `propsByEnvironment` entries: `farm: [hay-bale, feed-trough, well,
     scarecrow, farm-fence, window]`, `tavern: [tavern-bar, barstool, ale-barrel,
     fireplace, dartboard, barrel-cluster, window]`, `cabin: [cabin-bed, wood-stove,
     washbasin, rocking-chair, chest, window]` (`window` included in every environment,
     per the existing pattern — see `board-rooms-props.human.md`).
   - Update `manifest.test.ts`'s key/URL-count assertions for the new totals.
7. Build review sheets:
   `build_contact_sheet.py --root src/assets/royal-inquest/tiles --out tmp/royal-inquest-assets/tile-review.png --tile-size 96 --repeat-tiles`
   and
   `build_contact_sheet.py --root src/assets/royal-inquest/props --out tmp/royal-inquest-assets/prop-review.png --tile-size 96`.
   Inspect both, specifically checking the 3 new tile environments repeat seamlessly and
   the 15 new props are visually distinct from each other and from existing props at 96px.
8. Commit tiles and props separately, following the original pass's per-batch commit
   style (`git add src/assets/royal-inquest/tiles && git commit -m "feat: add rural
   floor tiles for farm/tavern/cabin"`, then the same for props, then the manifest).

## Final verification (run once, after both batches are done)

1. `& 'C:\Users\stef\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s tools/royal_inquest_assets -p 'test_*.py' -v`
2. `npm test -- --run src/assets/royal-inquest/manifest.test.ts`
3. `npm run build`
4. Visual QA: open all new review sheets — no text/watermark, marks distinguishable from
   each other, new tiles repeat without visible seams, new props read clearly at 96px and
   don't collide visually with existing same-environment props.
5. `git status --short` — only intentionally-excluded `tmp/` raw files should be
   untracked; everything else committed.

## Out of scope for this doc

Do not use this pass to also build the `window` real-art fix, the `armory` environment,
wall textures, or other items in the "Planned / possible future assets" list that aren't
the marks or the farm/tavern/cabin environments — those are separate future work.
