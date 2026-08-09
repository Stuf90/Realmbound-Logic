# Royal Inquest Asset Expansion Design

## Objective

Round out Royal Inquest's visual asset system in four areas flagged as incomplete or sparse in
`docs/royal-inquest/authoring/board-rooms-props.human.md`:

1. **Window art** — `royalInquestAssets.props.window` currently reuses `stone-planter` as a
   placeholder (`manifest.ts:218-220`). Give it real art.
2. **New props** — add `door` (explicitly called out as not-yet-built), a small set of
   wall-decor props (torch, painting, tapestry), and filler props for the sparsest environments
   (`dungeon`, `royalRoom`, `garden`).
3. **New tiles** — bring `hallway`, `dungeon`, `royalRoom` up from 1 tile variant to 3 (matching
   `room`/`garden`/`church`/`kitchen`), and add one new `TileEnvironment`: `armory`.
4. **Wall art** — walls currently render as a flat 3px CSS border (`puzzle.css:16-17`,
   `var(--ink)`, no texture, same color everywhere). Give each `TileEnvironment` its own wall
   texture, mirroring how tiles already work per environment.
5. **Mark-out ("X") indicator art** — the manual mark-out tool ("Ink cross") already exists but
   renders as a plain unicode glyph (`×`/`·`) with no illustrated art. Give it real ink-stamp art.

## Art style — open decision

The existing style guide lives in
`docs/superpowers/archive/specs/2026-07-19-royal-inquest-art-assets-design.md:9-21` (polished
illustrated board-game look, top-down, crisp dark-brown outlines, restrained parchment texture,
burgundy/navy/forest-green/warm-stone/dark-oak/antique-gold palette) with generation prompt
prefixes per category in
`docs/superpowers/archive/plans/2026-07-19-royal-inquest-art-assets.md:43-88`.

Codex may either:

- **(a) Match the existing style guide** — reuse the same prompt prefixes/palette/perspective so
  new assets sit indistinguishably next to `throne.png`, `room-timber-1.png`, etc.; or
- **(b) Propose a new style direction** for this whole batch (e.g. more hand-drawn/painterly, or a
  flatter cartoony look) if that's a better fit going forward.

This is Codex's call, with two hard constraints either way:

1. **One style per batch.** Every asset touched in this pass (window, new props, new tiles,
   walls, marks) must share one consistent style — don't mix "matches existing" for some assets
   and "new direction" for others within the same pass.
2. **Existing assets are out of scope.** Whichever style is chosen applies only to the new/
   replaced assets listed above. Re-skinning the 18 existing avatars, 12+ existing props, or 15
   existing tiles to a new style is a separate, much larger pass and is not part of this plan —
   if a new style is chosen, the visual mismatch between old and new assets is an accepted,
   temporary side effect, not a bug to fix here.

If Codex picks (b), write the new style direction down (palette, perspective, line/shading
approach, generation prompt prefixes per category, same shape as the existing style guide) as a
new file, `docs/royal-inquest/authoring/art-style.human.md` / `.cave.md`, and have
`board-rooms-props.human.md`/`.cave.md` link to it. If Codex picks (a), that new file can just
point at the existing archived style guide instead of duplicating it.

Everything here is additive to the existing data model — no predicate or solver changes, no
existing level's puzzle logic changes. `definitionValidation.ts`'s prop/environment rules already
generalize to new `PropAssetId`/`TileEnvironment` values without modification.

## 1. Window art

Source or generate one 512x512 window sprite following the existing image contract
(`tools/royal_inquest_assets/image_contract.py`: 512x512, transparent corners, cutout style).
Run it through `normalize_cutout.py` same as other prop art, verify with
`test_image_contract.py`.

Changes in `manifest.ts`:
- Add `import windowSprite from './props/window.png';`.
- Replace `window: stonePlanter,` with `window: windowSprite,` and delete the `// TODO(art)`
  comment above it.

No `PropAssetId`, `propKindByAsset`, or `propsByEnvironment` changes — `window` is already fully
wired as a real prop (decorative, edge-validated, every environment). This is purely swapping the
placeholder texture for real art.

## 2. New props

All new props follow the existing `decorative` model exactly (`propKindByAsset` entry,
`blocked: true` on any cell that uses them) — there is no separate "wall-mounted" rendering path.
"Wall decor" below is a naming/theme convention only; mechanically these are ordinary decorative
props placed on a blocked floor cell, same as `bookshelf` or `candle-stand`.

| Prop asset ID | Kind | Rationale | Suggested `propsByEnvironment` additions |
| --- | --- | --- | --- |
| `door` | `decorative` | Named gap in `board-rooms-props.human.md` "Asset ideas not yet built" #1 | `room`, `church`, `kitchen`, `dungeon`, `royalRoom` — **not** `hallway` (hallway's empty allow-list is a deliberate "passageways stay clear" invariant covered by existing tests; do not add anything there) |
| `torch` | `decorative` | Wall-decor theme, architecturally generic | all environments except `garden` (torches don't fit an outdoor scene) |
| `painting` | `decorative` | Wall-decor theme | `room`, `royalRoom` |
| `tapestry` | `decorative` | Wall-decor theme | `royalRoom`, `church` |
| `torture-rack` | `decorative` | `dungeon` filler (currently only `dungeon-cage`/`barrel-cluster`) | `dungeon` only |
| `royal-banner` | `decorative` | `royalRoom` filler (currently only `throne`/`formal-chair`/`window`) | `royalRoom` only |
| `garden-fountain` | `decorative` | `garden` filler (currently only 2 planters + `window`) | `garden` only |

Exact final naming/list is Codex's call at implementation time — this table is a starting point,
not a locked contract. Whatever list Codex lands on, each new prop must:
- Get a `propKindByAsset` entry.
- Be added to every `propsByEnvironment` list it's meant to appear in (never to `hallway`).
- Get 512x512 contract-compliant art via the existing pipeline (`tools/royal_inquest_assets/`),
  same as the window sprite above.
- Follow the "Authoring checklist for a new prop placement" in
  `board-rooms-props.human.md` lines 145-162 when actually placed into a level's cells (this
  design only covers registering the asset in the manifest — using new props inside a shipped
  level's `cells`/`decorativePropsByPosition` is a separate authoring pass, not required by this
  design).

## 3. New tiles

Add tile variants (art via the same pipeline, `build_tile_set.py`) so every environment reaches at
least 3 variants:

- `hallway`: add `hallway-stone-2.png`, `hallway-stone-3.png` (matching existing
  `hallway-stone-1` naming).
- `dungeon`: add `dungeon-masonry-2.png`, `dungeon-masonry-3.png`.
- `royalRoom`: add `royal-marble-2.png`, `royal-marble-3.png`.

Add one new `TileEnvironment`: `'armory'` — 3 tile variants (`armory-stone-1/2/3.png`).
`armory` gets its own `propsByEnvironment` entry: `weapon-rack`, `shield-display` (new decorative
props, same rules as section 2) plus `torch`, `door`, `window` (existing/new generic props). A new
environment only needs a manifest entry to be valid — it does not have to be used by any shipped
level in this pass (no forced changes to `hollowmereLodge.ts` or any other level file).

## 4. Wall art

### Current state

`getCellWalls` (`visuals.ts:33-48`) is unchanged by this design — it still returns
`{ right: boolean, bottom: boolean }` purely from `chamberId` adjacency. What changes is how a
`true` wall renders: today `.cell.wall-right`/`.cell.wall-bottom` (`puzzle.css:16-17`) draw a flat
`3px solid var(--ink)` border, identical for every environment.

### New model

Add a `wallsByEnvironment: Record<TileEnvironment, string>` map to `manifest.ts` (one texture per
environment, not per-chamber-variant like tiles — walls don't need per-chamber visual hashing,
one texture per environment is enough since walls are thin and repetitive). Each texture is a
512x512 seamlessly-tileable image (reuse `build_tile_set.py`'s existing seamless-tiling approach,
same script family as floor tiles) stored under `src/assets/royal-inquest/walls/<environment>.png`
(one file per environment, no `-1/-2/-3` numbering since there's exactly one wall texture per
environment).

Rendering change in `RoyalInquest.tsx`/`visuals.ts`:
- Add `getCellWallTexture(definition, cell): string` to `visuals.ts`, returning
  `royalInquestAssets.walls[definition.chamberEnvironments[cell.chamberId]]`. Note this uses the
  wall-*bearing* cell's own environment, not the neighbor's — a wall between two different
  environments (e.g. `room` next to `dungeon`) renders using the room-side cell's environment
  texture, which is a reasonable default and avoids needing to look up the neighbor's environment
  in the hot render path.
- `RoyalInquest.tsx` sets a CSS custom property per cell (e.g.
  `style={{ '--wall-texture': `url(${wallTextureUrl})` }}`) alongside the existing
  `wallClasses` computation (`RoyalInquest.tsx:139-140`).
- `puzzle.css`: widen `.cell.wall-right`/`.cell.wall-bottom` from a `3px solid` border to a
  thicker (e.g. `8px`) `border-image: var(--wall-texture) 30 repeat` (or an absolutely-positioned
  `::after` strip with `background-image: var(--wall-texture)` if `border-image` proves visually
  awkward at 8px — leave the exact CSS technique to whoever implements this, verified visually via
  `npm run dev`, not dictated here).

### Non-goals for walls

- No `WallAssetId` union type, no per-cell wall authoring field — walls stay fully derived from
  `chamberId` adjacency plus environment, exactly as today. This is a rendering-only change.
- No wall thickness/visual tuning beyond "distinguishable texture per environment, doesn't break
  existing grid sizing" — exact pixel values are an implementation/visual-QA detail.
- `getCellWalls`'s `{ right, bottom }` boolean shape is unchanged; only what gets drawn for a
  `true` value changes.

## Non-goals (whole design)

- No new predicates, no `types.ts`/`predicates.ts`/`definitionValidation.ts` logic changes beyond
  what new `PropAssetId`/`TileEnvironment` values already generalize to for free.
- No changes to any shipped level's `cells`/`solution` — new props/tiles/environment are
  registered in the manifest but not required to appear in `hollowmereLodge.ts` or any other
  existing level.
- No two-cell window span (tracked separately, unchanged from the predicate-expansion design's
  non-goals).
- No AI-art-generation tooling changes — `tools/royal_inquest_assets/` scripts process/normalize
  already-sourced images; sourcing the raw window/door/wall images themselves is outside this
  design.

## 5. Mark-out ("X") indicator art

The manual mark-out tool already exists — `state.tool === 'cross'` / `toggle-cross`
(`RoyalInquest.tsx:51`), rendered today as a plain styled unicode glyph in `.cell-mark`
(`RoyalInquest.tsx:143`: `×` for `manual-cross`, `·` for `auto-cross`; styled circles in
`puzzle.css:25-27`). This section replaces the glyph with real ink-stamp art matching the rest of
the board's illustrated style, not a new mechanic.

- New asset category, `src/assets/royal-inquest/marks/`: `manual-cross.png`, `auto-cross.png`
  (512x512, transparent background, same contract as props — run through the same
  `tools/royal_inquest_assets/` pipeline).
- `manifest.ts`: add a `marks: { 'manual-cross': string; 'auto-cross': string }` map to
  `royalInquestAssets` (own top-level key, same pattern as `avatars`/`props`/`tiles`/`walls`; no
  new `*AssetId` union needed since there are exactly two fixed marks, not an open per-level set).
- `RoyalInquest.tsx:143`: replace the `<span className="cell-mark ...">{'×' | '·'}</span>` text
  render with `<img className={`cell-mark ${cellState}`} src={royalInquestAssets.marks[...]} alt="" />`,
  keeping the existing `manual-cross`/`auto-cross` class names so `puzzle.css:25-27`'s sizing/
  positioning rules keep applying (drop the `font-weight`/`color`/`font-size` text-specific rules,
  keep size/shape/`box-shadow`).
- Accessibility: the mark is already `aria-hidden="true"`, decorative relative to the cell's
  `aria-label` (`RoyalInquest.tsx:136`, which already says `cellState.replace('-', ' ')` e.g.
  "manual cross") — no change needed there.

### Non-goals

- No change to `toggle-cross`/`getCellState`/`reduceInquest` logic — this is rendering-only, same
  as the wall-art change in section 4.
- No new tool or interaction; the existing "Ink cross" toolbar button and `x` keyboard shortcut
  (`RoyalInquest.tsx:143`'s `onKeyDown`) are unaffected.

See `docs/superpowers/plans/2026-08-09-royal-inquest-asset-expansion.md` for the implementation
plan.
