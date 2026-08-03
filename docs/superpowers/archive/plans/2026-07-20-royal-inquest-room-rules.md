# Royal Inquest Room Rules Plan

Design doc: `docs/superpowers/specs/2026-07-20-royal-inquest-room-rules-design.md`.

## Changes

1. **`src/features/royal-inquest/types.ts`** — add `propId?: PropAssetId` to `InquestCell` (import
   `PropAssetId` from the manifest).
2. **`src/assets/royal-inquest/manifest.ts`** — add `propsByEnvironment: Record<TileEnvironment,
   readonly PropAssetId[]>` (see design doc's table).
3. **`src/features/royal-inquest/definitionValidation.ts`** — add: every `chamberId` must resolve in
   `chamberNames`/`chamberEnvironments`; each chamber's cell count must be ≥ 5; any `propId` must be a
   known asset, on a `blocked` cell, and permitted for that chamber's environment.
4. **`src/features/royal-inquest/definitionValidation.test.ts`** — new cases: a sub-5-tile chamber is
   rejected, a `propId` in a disallowed environment is rejected (e.g. `bookshelf` in a `royalRoom` cell),
   a `propId` on a non-blocked cell is rejected.
5. **`src/features/royal-inquest/visuals.ts`** — add `getCellPropUrl(definition, cell)`, mirroring
   `getCellTileUrl`.
6. **`src/features/royal-inquest/visuals.test.ts`** — coverage for `getCellPropUrl` (returns the asset URL
   when `propId` is set, `undefined` otherwise) and a data-integrity check that every `blackwoodKeep`
   `propId` resolves to a real asset.
7. **`src/features/royal-inquest/definition.ts`** — redesign `blackwoodKeep`: 9-row × 6-column board
   (54 cells), new `chamberByPosition`, new `blockedCells`/`propId` map, new `solution`, two clue-text
   edits (`edmund-sixth-row` → seventh row). See design doc for the exact layout, solution, and prop table.
8. **`src/features/royal-inquest/RoyalInquest.tsx`** —
   - compute chamber-anchor cell keys (first cell per `chamberId` in `blackwoodKeep.cells` order) and
     render a `.chamber-label` span with the chamber name on each;
   - render `getCellPropUrl(...)` as a `.cell-prop` `<img>` on blocked cells that carry a `propId`,
     falling back to the existing `◆` glyph when they don't;
   - drive `.inquest-board`'s `gridTemplateColumns`/`aspectRatio` from `blackwoodKeep.columns`/`rows`
     via inline style instead of the hardcoded 6-column/square CSS;
   - update the board `aria-label` from the hardcoded "six by six" to `${rows} by ${columns}`.
9. **`src/app/app.css`** — add `.chamber-label` and `.cell-prop`; remove the now-inline
   `grid-template-columns`/`aspect-ratio` from `.inquest-board` (keep the rest: border, sizing at
   breakpoints via `width`, which stays CSS-driven).
10. **`src/app/App.test.tsx`** — `blackwoodKeep.cells` length assertion `36` → `54`.
11. Docs: this plan + the design doc.

`predicates.ts`, `reducer.ts`, `selectors.ts`, `hints.ts` are unaffected — none of them read chamber size,
props, or board dimensions.

## Verification

1. `npm run test:run -- royal-inquest` and `npm run test:run -- App.test` — all existing + new tests green.
2. `npm run build` — typecheck + build.
3. `npm run dev` — manual check: chamber names render on-screen (not just via screen reader), the six
   props render on their blocked cells with correct art, the board renders as a 9-row (not squished
   6x6) grid, and the puzzle is still solvable end-to-end against the existing clue list.
