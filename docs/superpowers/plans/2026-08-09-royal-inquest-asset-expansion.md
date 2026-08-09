# Royal Inquest Asset Expansion Plan

Design doc: `docs/superpowers/specs/2026-08-09-royal-inquest-asset-expansion-design.md`.

Work in a dedicated worktree (`EnterWorktree`, per `AGENTS.md`), never on `main`. Complete the
implementation before running tests, per `AGENTS.md`.

## Changes

0. **Decide art style for this batch, before generating anything.** Either (a) match the existing
   style guide (`docs/superpowers/archive/specs/2026-07-19-royal-inquest-art-assets-design.md:9-21`
   + prompt prefixes in `docs/superpowers/archive/plans/2026-07-19-royal-inquest-art-assets.md:43-88`)
   or (b) propose a new direction (e.g. more hand-drawn/painterly, or flatter/cartoony) — your
   call. Constraints: one style for every asset in this pass (no mixing), and existing assets are
   not re-skinned (out of scope, mismatch is accepted). Write the chosen style down as
   `docs/royal-inquest/authoring/art-style.human.md` / `.cave.md` (new file — either the full new
   direction per the design doc's shape, or a short pointer at the existing archived guide if
   sticking with (a)), and link it from `board-rooms-props.human.md`/`.cave.md`. Every asset
   generated in steps 1-5 below follows whatever's decided here.

1. **Window art (replace placeholder)**
   - Source/generate one 512x512 window sprite; run through
     `tools/royal_inquest_assets/normalize_cutout.py`, verify with
     `tools/royal_inquest_assets/test_image_contract.py`.
   - Save as `src/assets/royal-inquest/props/window.png`.
   - `src/assets/royal-inquest/manifest.ts`: add `import windowSprite from './props/window.png';`,
     replace `window: stonePlanter,` with `window: windowSprite,`, delete the `// TODO(art)`
     comment above it (`manifest.ts:218-220`).

2. **New prop assets** — final naming is your call; start from the design doc's table
   (`door`, `torch`, `painting`, `tapestry`, `torture-rack`, `royal-banner`, `garden-fountain`).
   For each new prop:
   - Source/generate 512x512 contract-compliant art, save under
     `src/assets/royal-inquest/props/<kebab-case-name>.png`.
   - `manifest.ts`: import the PNG, add the id to `PropAssetId`, add a `propKindByAsset` entry
     (all `'decorative'` per the design), add `royalInquestAssets.props.<id>`.
   - `propsByEnvironment`: add the id to every environment list it belongs in, per the design's
     table. **Never add anything to `hallway`** — its empty list is a deliberate invariant, not a
     gap (`board-rooms-props.human.md` line 94, `"hallway | *(none)*"`).
   - Do not place any new prop into an existing shipped level's cells in this pass — registering
     the asset in the manifest is sufficient; using it in `hollowmereLodge.ts` or any other level
     is a separate authoring pass and out of scope here.

3. **New tile variants + new environment**
   - Add `hallway-stone-2.png`/`-3.png`, `dungeon-masonry-2.png`/`-3.png`,
     `royal-marble-2.png`/`-3.png` under `src/assets/royal-inquest/tiles/`, via
     `tools/royal_inquest_assets/build_tile_set.py`.
   - Add a new `'armory'` `TileEnvironment` with `armory-stone-1/2/3.png`.
   - `manifest.ts`: import all new tile PNGs; extend `hallway`/`dungeon`/`royalRoom` arrays in
     `royalInquestAssets.tiles` to 3 entries each; add `'armory'` to the `TileEnvironment` union;
     add `royalInquestAssets.tiles.armory = [armoryStone1, armoryStone2, armoryStone3]`; add an
     `armory` entry to `propsByEnvironment` (`weapon-rack`, `shield-display` — new decorative
     props following the same pattern as step 2 — plus `torch`, `door`, `window`).
   - No shipped level needs to use `armory` in this pass; the manifest entry alone satisfies
     `Record<TileEnvironment, ...>` completeness (TypeScript's `satisfies` check on
     `royalInquestAssets` will fail to compile if any map is missing the new key — this is your
     correctness signal, not just a nice-to-have).

4. **Wall art**
   - Add `src/assets/royal-inquest/walls/<environment>.png` — one 512x512 seamlessly-tileable
     texture per `TileEnvironment` (7 existing + `armory` = 8 total), via `build_tile_set.py`'s
     seamless-tiling approach.
   - `manifest.ts`: import all wall PNGs; add `wallsByEnvironment: Record<TileEnvironment, string>`
     export (or fold into `royalInquestAssets.walls` alongside `avatars`/`props`/`tiles`, matching
     the existing `satisfies` pattern for compile-time completeness — prefer this over a separate
     export for consistency).
   - `src/features/royal-inquest/visuals.ts`: add
     `getCellWallTexture(definition: InquestDefinition, cell: InquestCell): string`, returning
     `royalInquestAssets.walls[definition.chamberEnvironments[cell.chamberId]]` (uses the
     wall-bearing cell's own environment, not the neighbor's — see design doc rationale).
   - `src/features/royal-inquest/RoyalInquest.tsx`: alongside the existing `wallClasses`
     computation (`RoyalInquest.tsx:139-140`), call `getCellWallTexture` and pass it through as a
     CSS custom property (e.g. `style={{ '--wall-texture': `url(${wallTextureUrl})` }}`) on the
     cell element.
   - `src/app/puzzle.css`: change `.cell.wall-right`/`.cell.wall-bottom` (currently
     `puzzle.css:16-17`, flat `3px solid var(--ink)`) to render `var(--wall-texture)` instead of a
     flat color — via `border-image` or an absolutely-positioned textured strip, whichever looks
     right. Verify visually with `npm run dev`; exact CSS technique isn't dictated by the design.

5. **Mark-out ("X") indicator art**
   - Source/generate 512x512 ink-stamp art for `manual-cross` and `auto-cross`, save under
     `src/assets/royal-inquest/marks/manual-cross.png` and `auto-cross.png`, via the same pipeline
     as other assets.
   - `manifest.ts`: import both, add a `marks: { 'manual-cross': string; 'auto-cross': string }`
     entry to `royalInquestAssets` (no new `*AssetId` union — fixed 2-value map, same shape
     pattern as `avatars`/`props`/`tiles`/`walls`).
   - `RoyalInquest.tsx:143`: replace the `<span className="cell-mark ...">{'×'|'·'}</span>` with an
     `<img className={`cell-mark ${cellState}`} src={...} alt="" />`, keeping `aria-hidden="true"`.
   - `puzzle.css:25-27`: keep the sizing/shape/`box-shadow` rules on `.cell-mark`/`.manual-cross`/
     `.auto-cross`, drop the now-unused `font-weight`/`color`/`font-size` text-styling rules.
   - No change to `toggle-cross`, `getCellState`, `reduceInquest`, the "Ink cross" toolbar button,
     or the `x` keyboard shortcut — rendering-only, same scope discipline as the wall change.

6. **Tests**
   - `src/features/royal-inquest/visuals.test.ts`: add a case for `getCellWallTexture` returning
     the correct texture per environment.
   - `src/app/App.test.tsx`: existing `wall-right`/`wall-bottom` count assertions
     (`App.test.tsx:328-329`) must still pass unchanged — wall *placement* logic isn't touched,
     only what renders for a wall. Add a targeted assertion (or update an existing one) that a
     wall cell also carries the `--wall-texture` custom property / resolves to a non-empty texture
     URL.
   - `src/assets/royal-inquest/manifest.ts` has no direct test file today — if adding one, cover:
     every `PropAssetId` has a `propKindByAsset` entry and appears in at least one
     `propsByEnvironment` list (except intentionally-window-only cases), every `TileEnvironment`
     has both a `tiles` array and a `walls` entry. Otherwise rely on the `satisfies` compile-time
     check plus `definitionValidation.test.ts`.
   - `tools/royal_inquest_assets/test_image_contract.py`: run against every new PNG (window, new
     props, new tiles, new walls, new marks) to confirm 512x512 + contract compliance.

7. **Docs** (cave + human pairs, same content each — update both together per repo convention):
   - `docs/royal-inquest/authoring/board-rooms-props.human.md` / `.cave.md`:
     - "Asset ideas not yet built" section (lines 169-186): remove the `door` item (built now);
       update the `window` item — real art now exists, only the two-cell-span remains open.
     - Add new props to the "Allow-list by environment" table and the seat/decorative table.
     - Add a new "Walls" subsection describing the per-environment wall texture (mirroring how
       "Chambers" already documents tile-per-environment selection), noting it's rendering-only —
       no new authoring field.
     - Add `armory` to the `TileEnvironment` documentation wherever the full union is listed.
   - `docs/royal-inquest/rules.human.md` / `.cave.md`: update only if it enumerates environments or
     props directly (check before assuming; skip if it just links out to the authoring doc).

8. This plan + the design doc (already written).

`types.ts`, `predicates.ts`, `predicateDifficulty.ts`, `definitionValidation.ts`'s predicate logic,
`selectors.ts`, `solver.ts`, `hints.ts`, and every shipped level file are unaffected (confirmed in
the design doc's non-goals) — `definitionValidation.ts`'s existing prop/environment *checks*
(`Prop "<propId>" is not permitted in a "<environment>" chamber.`, etc.) already generalize to new
values with no code change, since they key off `propsByEnvironment`/`propKindByAsset` data, not
hardcoded prop lists.

## Verification

1. `npm run build` — typecheck + build; the `satisfies` constraints on `royalInquestAssets` and
   `propsByEnvironment`/`propKindByAsset` will fail to compile if any new `PropAssetId` or
   `TileEnvironment` is missing a required map entry.
2. `npm run test:run` — all existing + new tests green, including the untouched
   `wall-right`/`wall-bottom` count assertions in `App.test.tsx`.
3. `python tools/royal_inquest_assets/test_image_contract.py` (or however that suite is invoked in
   this repo — check for an npm/make wrapper before assuming raw `python`) — confirms every new
   PNG meets the 512x512/transparency contract.
4. `npm run dev` — manually load a level touching each environment (or add a temporary debug level
   if none currently exercises `armory`) and visually confirm: window renders real art (not the
   planter), new props render distinct art, new tile variants show up, walls render a texture
   instead of a flat line and differ visibly between at least two environments (e.g. `dungeon` vs
   `garden`), and toggling "Ink cross" on a cell shows the new ink-stamp art instead of the `×`/`·`
   glyph.
