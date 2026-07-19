# Royal Inquest Art Assets Handoff

## Current State

Work continues on branch `codex/royal-inquest-art-assets` in:

```text
C:\Users\stef\source\repos\stuf\Realmbound Logic\.worktrees\royal-inquest-art-assets
```

The artwork is frozen. Do not generate, regenerate, or redesign any images unless the user explicitly reverses the instruction to use the current designs.

The branch currently contains:

- 18 avatar tokens in `src/assets/royal-inquest/avatars/`;
- 12 complete props in `src/assets/royal-inquest/props/`;
- 10 additional left/right segments for five two-cell props;
- 15 self-seamless tiles in `src/assets/royal-inquest/tiles/`;
- image normalization, validation, split-prop, tile-building, and contact-sheet utilities under `tools/royal_inquest_assets/`.

All artwork is 512x512 PNG.

## Approved Asset Inventory

### Avatars: 18

`monarch`, `royal-consort`, `royal-heir`, `nobleman`, `noblewoman`, `royal-envoy`, `knight`, `guard-captain`, `court-physician`, `priest`, `monk`, `scholar`, `steward`, `cook`, `maid`, `gardener`, `merchant`, and `prisoner`.

The avatar review passed after removing low-alpha green chroma fringe. The current files have complete circular frames, transparent corners, distinct identities, and readable 96px silhouettes.

### Props: 22 files

Complete one-cell files:

- `throne.png`
- `formal-chair.png`
- `simple-chair.png`
- `wooden-bench.png`
- `church-pew.png`
- `stone-planter.png`
- `wooden-planter.png`
- `dining-table.png`
- `kitchen-worktable.png`
- `barrel-cluster.png`
- `bookshelf.png`
- `dungeon-cage.png`

Two-cell horizontal pairs:

- `wooden-bench-left.png` and `wooden-bench-right.png`
- `church-pew-left.png` and `church-pew-right.png`
- `dining-table-left.png` and `dining-table-right.png`
- `kitchen-worktable-left.png` and `kitchen-worktable-right.png`
- `bookshelf-left.png` and `bookshelf-right.png`

The complete one-cell versions are intentionally retained alongside the larger two-cell versions. When a pair is placed in adjacent grid cells, use left then right without spacing or scaling. The pair exactly recomposes its 1024x512 reframed source.

The last prop processing pass removed sampled green and magenta key-color residue. Previous design issues were also corrected: the bookshelf is overhead, the dungeon cage has an open transparent interior, the dining table is bare, and the simple chair is flat rather than perspective-tilted.

### Tiles: 15

- General room: `room-timber-1.png`, `room-timber-2.png`, `room-timber-3.png`
- Garden: `garden-1.png`, `garden-2.png`, `garden-3.png`
- Church: `church-stone-1.png`, `church-stone-2.png`, `church-stone-3.png`
- Kitchen: `kitchen-flagstone-1.png`, `kitchen-flagstone-2.png`, `kitchen-flagstone-3.png`
- Hallway: `hallway-stone-1.png`
- Dungeon: `dungeon-masonry-1.png`
- Royal room: `royal-marble-1.png`

The original 21-tile target was reduced during implementation. The user requested retaining already-generated surplus tiles while generating only the missing environment types. The final approved count is therefore 15, covering all seven environments.

Every tile is individually self-seamless: its left edge matches its right edge and its top edge matches its bottom edge. Different variants are not required to share identical edges. This matches the user's requirement that a square background tile connect when duplicated and avoids the visible inner frames caused by the earlier cross-variant shared-edge treatment.

The final tile review passed: no hard duplication seams, square inner frames, or mirror rosettes remain at the 96px gameplay scale.

## Completed Processing Fixes

Do not repeat these investigations:

1. Chroma-key normalization now samples the actual border key and handles both green and magenta sources.
2. Low-alpha saturated key remnants are removed after resize so antialiasing cannot reintroduce fringe.
3. Two-cell props are reframed to 1024x512 and split into exact 512x512 halves without distortion.
4. Tile processing no longer mirrors the complete source, which previously created rosettes and bilateral motifs.
5. Tile processing no longer forces a common perimeter across different variants, which previously created a visible square inner panel.
6. Each tile is now processed independently for exact self-repeat edges.

## Remaining Work

No further image generation is required. Complete only the following integration and verification work.

### 1. Update Documentation Counts

Update these approved-but-now-stale documents to match the user-authorized final inventory:

- `docs/superpowers/specs/2026-07-19-royal-inquest-art-assets-design.md`
- `docs/superpowers/plans/2026-07-19-royal-inquest-art-assets.md`

Record 18 avatars, 22 prop files including five two-cell pairs, and 15 tiles. Record that tiles are self-seamless but not cross-variant edge-compatible. Preserve the history explaining why the scope changed.

### 2. Create the Typed Manifest

Create `src/assets/royal-inquest/manifest.ts` with explicit Vite imports for all 55 runtime PNGs:

- 18 avatar URLs;
- 22 prop URLs;
- 15 tile URLs.

Export literal ID types and a `royalInquestAssets` object. Recommended shape:

```ts
export const royalInquestAssets = {
  avatars: { /* 18 explicit imports */ },
  props: {
    /* 12 complete props */
    /* 10 left/right segment files */
  },
  tiles: {
    room: [/* three timber URLs */],
    garden: [/* three URLs */],
    church: [/* three URLs */],
    kitchen: [/* three URLs */],
    hallway: [/* one URL */],
    dungeon: [/* one URL */],
    royalRoom: [/* one URL */],
  },
} as const;
```

Do not add rendering logic to the manifest. Do not wire the assets into `RoyalInquest.tsx` unless the user separately asks for UI integration.

### 3. Add the Manifest Test

Create `src/assets/royal-inquest/manifest.test.ts`. Assert:

- 18 avatar entries;
- 22 prop entries;
- seven tile environments;
- tile variant counts of 3, 3, 3, 3, 1, 1, and 1;
- 55 total unique runtime URLs.

### 4. Generate Final Review Sheets

Use the existing utility; do not generate new art:

```powershell
$python = 'C:\Users\stef\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python tools/royal_inquest_assets/build_contact_sheet.py --root src/assets/royal-inquest --out src/assets/royal-inquest/contact-sheet.png --tile-size 96
& $python tools/royal_inquest_assets/build_contact_sheet.py --root src/assets/royal-inquest/tiles --out src/assets/royal-inquest/tile-repeat-sheet.png --tile-size 96 --repeat-tiles
```

If the first command's layout is too large, build avatar and prop sheets separately and combine them with Pillow. Do not modify the underlying artwork.

Commit both sheets. They are review artifacts and must not be imported by the runtime manifest.

### 5. Align Complete-Pack Validation

Review `tools/royal_inquest_assets/test_image_contract.py` after the prop/tile branch integration. It must assert:

- 18 avatars;
- 22 props;
- 15 tiles;
- 512x512 dimensions;
- alpha and transparent corners for avatars/props;
- full opacity for tiles;
- exact self-edge equality for every tile;
- exact recomposition for all five left/right prop pairs;
- no sampled-key fringe in avatar or prop alpha edges.

Do not restore the obsolete 21-tile count, 12-prop count, or cross-variant edge comparison.

### 6. Run the Deferred Targeted Verification Once

Repository instructions deferred tests until implementation was complete. After steps 1-5, run each command once:

```powershell
$python = 'C:\Users\stef\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python -m unittest discover -s tools/royal_inquest_assets -p 'test_*.py' -v
```

For Node commands, `npm` is not currently on `PATH`. The parent checkout has `node_modules`, and the bundled Node executable is:

```text
C:\Users\stef\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
```

Either expose an approved npm executable or invoke the parent checkout's local Vitest/Vite entry points with bundled Node. Run only:

```text
src/assets/royal-inquest/manifest.test.ts
```

Then run one production build. Do not run broad or repetitive test suites.

### 7. Final Review and Branch Completion

After tests pass:

1. inspect `contact-sheet.png` and `tile-repeat-sheet.png`;
2. confirm `git status --short` contains no unintended tracked or untracked files;
3. commit documentation, manifest, tests, and sheets;
4. perform one final whole-branch review against the merge base;
5. use `superpowers:finishing-a-development-branch` to offer merge/PR/keep-worktree options.

## Known Non-Blocking Notes

- The raw generation and intermediate review sheets live under ignored `tmp/` directories in the parallel prop/tile worktrees; they are not required runtime files.
- Pillow currently emits a `getdata()` deprecation warning in a focused inspection path. Replace deprecated iteration when touching that code, but it does not affect output correctness.
- Some source materials naturally contain regular boards, slabs, pavers, or inlay. The final acceptance concern is visible seams or artificial central frames, not the presence of a repeating architectural material itself.
- The main application does not yet render these assets. That is intentionally outside this asset-pack task.

## Relevant Commits

- `7844f18` — initial asset tooling
- `2343825` — shared edge-band correction from the earlier design
- `45a45bc` — avatar token pack
- `6e74cc8` — avatar despill fix
- `cc78496` — prop pack integrated into the main asset branch
- `335f447` — prop redesign fixes and two-cell split assets
- `d8de370` — final prop chroma cleanup
- `6af8716` — tile pack integrated into the main asset branch
- `700b95b` — non-mirrored tile processing
- `2fc665e` — final individually self-seamless tile processing

Use the branch log as the authoritative source if hashes change through rebasing or cherry-picking.
