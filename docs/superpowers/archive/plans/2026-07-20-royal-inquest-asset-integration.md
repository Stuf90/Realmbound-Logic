# Royal Inquest Asset Integration Plan

Design doc: `docs/superpowers/specs/2026-07-20-royal-inquest-asset-integration-design.md`.

## Prerequisite

The typed asset manifest (`src/assets/royal-inquest/manifest.ts`, `manifest.test.ts`, review sheets) previously lived on unmerged branch `worktree-royal-inquest-art-manifest`. It was a strict fast-forward of `main` and has been merged (`main` now includes commit `1e947a0`).

## Changes

1. **`src/features/royal-inquest/types.ts`** — `InquestCharacter.avatarId: AvatarAssetId`; `InquestDefinition.chamberEnvironments: Record<string, TileEnvironment>`.
2. **`src/features/royal-inquest/definition.ts`** — added `avatarId` to each of the six `blackwoodKeep` characters and a `chamberEnvironments` map for the nine chamber IDs (see design doc for the mapping tables and rationale).
3. **`src/features/royal-inquest/visuals.ts`** (new) — `getCharacterAvatarUrl(character)` and `getCellTileUrl(definition, cell)`, the latter picking a deterministic tile variant via `(row * 5 + column * 7) % variants.length` (constants chosen so neither shares a factor with the 3-variant tile sets, avoiding the column-stripe degenerate case a `row * columns + column` formula would hit here).
4. **`src/features/royal-inquest/visuals.test.ts`** (new) — unit tests for both helpers, plus a data-integrity check that every `blackwoodKeep` character's `avatarId` and every cell's `chamberEnvironments` entry resolves to a real key in `royalInquestAssets`.
5. **`src/features/royal-inquest/RoyalInquest.tsx`** — cell buttons get an inline `background-image` (tint + tile URL); occupied cells render an avatar `<img>` instead of initials text; the character carousel renders an avatar `<img>` instead of the `♙` glyph.
6. **`src/app/app.css`** — `.cell` becomes a CSS grid stack (tile background + centered glyph/avatar layer) driven by a `--cell-tint` custom property that each state class (`.blocked`, `.occupied`, default) sets; `.cell-avatar` and `.carousel-avatar` styles added; the two rules that targeted the old glyph `<span>` inside `.featured-portrait` now target `.carousel-avatar`.
7. **`src/app/App.test.tsx`** — extended the existing "places a character and provides progress controls" test with an assertion that the placed gridcell contains an `<img>` whose `src` includes `royal-envoy`.
8. Docs: this plan + the design doc.

## Verification

1. `npm run build` — typecheck + build.
2. `npx vitest run src/features/royal-inquest/visuals.test.ts src/app/App.test.tsx` — targeted tests only.
3. `npm run dev` — manual visual check: floor textures per chamber, avatar art for placed/carousel characters, blocked/manual-cross/derived-unavailable states remain legible.
