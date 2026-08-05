# Royal Inquest Art Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce 18 reusable avatar tokens, 12 transparent top-down props, and 21 mutually compatible seamless floor tiles for Royal Inquest, plus a typed manifest and visual review sheets.

**Final delivered scope (see `docs/superpowers/specs/2026-07-19-royal-inquest-art-assets-design.md` for the authorized rationale):** the tasks and tables below record the plan as originally authored. During implementation, five props (`wooden-bench`, `church-pew`, `dining-table`, `kitchen-worktable`, `bookshelf`) were additionally split into left/right two-cell pairs, raising the prop file count from 12 to 22 while keeping the retained one-cell files. Tile scope was reduced from three variants across all seven environments (21 files) to 15 files — three variants for room, garden, church, and kitchen, and one each for hallway, dungeon, and royal room — with each tile made independently self-seamless rather than cross-variant edge-compatible. The final runtime pack is therefore 18 avatars + 22 props + 15 tiles = 55 files, matching `tools/royal_inquest_assets/test_image_contract.py`'s `CompletePackTests` and `src/assets/royal-inquest/manifest.ts`.

**Architecture:** Generate one image per distinct asset with the built-in image generator, preserve raw outputs outside runtime directories, and normalize accepted outputs into deterministic 512x512 PNGs with small Python/Pillow utilities. Runtime code consumes stable Vite URL imports from a TypeScript manifest; Python tests validate file count, dimensions, opacity, transparency, and tile-edge compatibility.

**Tech Stack:** Built-in `image_gen`, bundled Python 3 with Pillow, TypeScript, Vite asset imports, Vitest for manifest checks, Python `unittest` for image checks.

## Global Constraints

- Implement this plan in a dedicated non-`main` Git worktree created with `superpowers:using-git-worktrees`.
- Complete all implementation before running the final targeted test set, per `AGENTS.md`.
- Every final image is a 512x512 PNG.
- Use a straight top-down perspective for map tiles and props.
- Use crisp dark-brown outlines, restrained parchment texture, and a burgundy/navy/forest-green/warm-stone/dark-oak/antique-gold palette.
- Avatars and props have transparent corners; tiles are fully opaque.
- Tiles have no outer border, labels, directional lighting shift, or singular central motif.
- The three variants within one environment must connect to themselves and one another on every edge.
- Do not alter Royal Inquest gameplay, board dimensions, or placement rules.
- Do not overwrite pre-existing assets; use a versioned sibling filename if a collision is discovered.

---

## File Map

- Create `tools/royal_inquest_assets/image_contract.py`: shared image-contract inspection and edge-comparison functions.
- Create `tools/royal_inquest_assets/normalize_cutout.py`: chroma-key removal, square padding, and Lanczos resize for avatars and props.
- Create `tools/royal_inquest_assets/build_tile_set.py`: creates one seamless base edge and blends each generated variant into its environment's shared edge band.
- Create `tools/royal_inquest_assets/build_contact_sheet.py`: renders labeled review sheets from final assets.
- Create `tools/royal_inquest_assets/test_image_contract.py`: focused Python tests for all image contracts.
- Create `src/assets/royal-inquest/manifest.ts`: stable typed Vite URL imports grouped by asset family.
- Create `src/assets/royal-inquest/manifest.test.ts`: checks manifest keys, counts, and URL uniqueness.
- Create `src/assets/royal-inquest/avatars/*.png`: 18 normalized avatar tokens.
- Create `src/assets/royal-inquest/props/*.png`: 12 normalized map objects.
- Create `src/assets/royal-inquest/tiles/*.png`: 21 normalized floor tiles.
- Create `src/assets/royal-inquest/contact-sheet.png`: visual review sheet, excluded from runtime manifest.
- Create `src/assets/royal-inquest/tile-repeat-sheet.png`: 3x3 repeat previews for all environments, excluded from runtime manifest.

## Shared Prompt Prefixes

Use these exact prefixes in Tasks 2-4. Add only the subject line specified in each task's table.

**Avatar prefix**

```text
Use case: stylized-concept
Asset type: circular portrait token for the mobile medieval logic game Royal Inquest
Primary request: Create one distinctive medieval character portrait token in a polished illustrated board-game style.
Style/medium: refined 2D game illustration, crisp dark-brown ink outline, restrained parchment texture, sophisticated rather than cartoonish
Composition/framing: head-and-shoulders portrait inside a complete circular antique-gold token frame, centered, fully visible, generous padding
Lighting/mood: neutral warm court lighting, mysterious royal investigation
Color palette: burgundy, navy, forest green, warm stone, dark oak, antique gold; use role-specific accents
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background outside the token
Constraints: all pixels outside the circular frame use one uniform #00ff00 with no shadow, gradient, texture, reflection, or floor plane; do not use #00ff00 in the token; strong small-size silhouette; no cropped frame
Avoid: words, labels, logos, watermark, photorealism, pixel art, full body, scenery, cast shadow
```

**Prop prefix**

```text
Use case: stylized-concept
Asset type: placeable map prop for the mobile medieval logic game Royal Inquest
Primary request: Create one medieval map object in a polished illustrated board-game style.
Style/medium: refined 2D game illustration, crisp dark-brown ink outline, restrained parchment texture, sophisticated rather than cartoonish
Composition/framing: exact straight-down orthographic view, centered object, entire footprint visible, generous padding, no perspective tilt
Lighting/mood: even neutral light with no directional cast shadow
Color palette: burgundy, navy, forest green, warm stone, dark oak, antique gold
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background
Constraints: background is one uniform #00ff00 with no shadow, gradient, texture, reflection, or floor plane; do not use #00ff00 in the object; object reads clearly at 96 pixels; compact footprint
Avoid: words, labels, logos, watermark, people, scenery, isometric or three-quarter view, cast shadow, photorealism, pixel art
```

**Tile prefix**

```text
Use case: stylized-concept
Asset type: repeatable square floor background for a grid cell in the mobile medieval logic game Royal Inquest
Primary request: Create one directly overhead floor texture in a polished illustrated board-game style.
Style/medium: refined 2D game illustration, crisp material detail, restrained parchment texture
Composition/framing: exact straight-down orthographic square texture filling the canvas edge to edge
Lighting/mood: flat neutral ambient light, no directional highlight or shadow
Constraints: fully opaque; no outer border; no objects; no central emblem; no focal point; uniform visual density; designed for local seamless post-processing and repeated duplication
Avoid: words, labels, logos, watermark, furniture, people, walls, perspective, vignette, corner decoration, frame, photorealism, pixel art
```

---

### Task 1: Asset Contract and Normalization Tools

**Files:**
- Create: `tools/royal_inquest_assets/image_contract.py`
- Create: `tools/royal_inquest_assets/normalize_cutout.py`
- Create: `tools/royal_inquest_assets/build_tile_set.py`
- Create: `tools/royal_inquest_assets/build_contact_sheet.py`
- Create: `tools/royal_inquest_assets/test_image_contract.py`

**Interfaces:**
- Produces: `inspect_png(path: Path) -> ImageFacts`, `edge_distance(first: Path, second: Path, first_edge: str, second_edge: str) -> float`, `normalize_cutout(source: Path, destination: Path, size: int = 512) -> None`, and `build_environment(sources: list[Path], destinations: list[Path], size: int = 512, edge_band: int = 48) -> None`.
- Consumes: bundled Python executable and Pillow from `codex_app__load_workspace_dependencies`.

- [ ] **Step 1: Write focused failing tests**

Create `tools/royal_inquest_assets/test_image_contract.py` with fixtures generated in memory and tests that assert: RGBA cutouts report transparent corners; RGB tiles report full opacity; a 256x256 image violates the 512 contract; identical opposing edge strips have distance `0.0`; `normalize_cutout` removes a flat green border and emits 512x512 RGBA; `build_environment` emits three 512x512 opaque tiles whose corresponding edge pixels are byte-identical. Also add `CompletePackTests.test_runtime_pack_contract`, which skips while `src/assets/royal-inquest` does not exist and otherwise asserts the exact 18/12/21 counts, 512x512 dimensions, cutout transparency, tile opacity, and all ordered pairs of compatible edges within each environment.

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from PIL import Image

from image_contract import edge_distance, inspect_png
from normalize_cutout import normalize_cutout
from build_tile_set import build_environment

class ImageContractTests(unittest.TestCase):
    def test_normalized_cutout_has_transparent_corners(self):
        with TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.png"
            output = Path(tmp) / "output.png"
            image = Image.new("RGB", (640, 640), "#00ff00")
            for x in range(160, 480):
                for y in range(160, 480):
                    image.putpixel((x, y), (90, 30, 40))
            image.save(source)
            normalize_cutout(source, output)
            facts = inspect_png(output)
            self.assertEqual((facts.width, facts.height), (512, 512))
            self.assertTrue(facts.has_alpha)
            self.assertTrue(facts.transparent_corners)

    def test_tile_variants_share_exact_edges(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            sources = []
            for index, color in enumerate(((80, 70, 60), (95, 75, 50), (65, 75, 80)), 1):
                path = root / f"source-{index}.png"
                Image.new("RGB", (768, 768), color).save(path)
                sources.append(path)
            outputs = [root / f"tile-{index}.png" for index in range(1, 4)]
            build_environment(sources, outputs)
            for output in outputs:
                self.assertEqual(inspect_png(output).opaque_fraction, 1.0)
            for first in outputs:
                for second in outputs:
                    self.assertEqual(edge_distance(first, second, "right", "left"), 0.0)
                    self.assertEqual(edge_distance(first, second, "bottom", "top"), 0.0)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tool tests and verify they fail**

Run: `& 'C:\Users\stef\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s tools/royal_inquest_assets -p 'test_*.py' -v`

Expected: FAIL because `image_contract`, `normalize_cutout`, and `build_tile_set` do not exist.

- [ ] **Step 3: Implement the minimum tooling**

Implement the declared functions with Pillow. `normalize_cutout` must sample the border key color, calculate color distance for alpha, apply a soft matte between distances 12 and 80, crop to the nontransparent bounding box, pad to a square with 8% breathing room, and resize with `Image.Resampling.LANCZOS`. `build_environment` must resize sources, create a horizontally and vertically mirrored seamless base, copy the same 48-pixel edge band into all variants, and cosine-feather each source's interior into that shared edge band. `build_contact_sheet.py` must accept `--root`, `--out`, `--tile-size`, and `--repeat-tiles`; it renders filenames below thumbnails and, when requested, renders each tile in a 3x3 repeated block.

- [ ] **Step 4: Do not run tests yet**

Per `AGENTS.md`, defer verification until all implementation tasks are complete. Inspect only with `git diff --check`.

- [ ] **Step 5: Commit the tooling**

```powershell
git add tools/royal_inquest_assets
git commit -m "feat: add Royal Inquest asset tooling"
```

---

### Task 2: Generate and Normalize the 18 Avatar Tokens

**Files:**
- Create: `src/assets/royal-inquest/avatars/*.png`
- Create outside runtime tree: `tmp/royal-inquest-assets/avatars/*.png`

**Interfaces:**
- Consumes: Avatar prompt prefix and `normalize_cutout(source, destination, 512)` from Task 1.
- Produces: the 18 stable files listed below.

- [ ] **Step 1: Generate one source image per avatar**

Call the built-in image generator separately for each row. Append its exact subject sentence to the avatar prefix. Keep the generator's original output, and copy the accepted source to `tmp/royal-inquest-assets/avatars/` using the filename shown in the table.

| Filename | Subject sentence |
| --- | --- |
| `monarch.png` | Subject: an older ruling queen with a narrow crown, silver-streaked dark hair, burgundy mantle, and controlled authoritative expression. |
| `royal-consort.png` | Subject: a middle-aged royal consort with warm brown skin, close-cropped hair, navy velvet, antique-gold chain, and observant expression. |
| `royal-heir.png` | Subject: a young adult royal heir with auburn curls, forest-green brocade, small circlet, and intelligent wary expression. |
| `nobleman.png` | Subject: an ambitious nobleman with black swept-back hair, trimmed moustache, burgundy doublet, jeweled collar, and guarded expression. |
| `noblewoman.png` | Subject: a poised older noblewoman with pale braided hair, navy gown, gold veil pins, and severe analytical gaze. |
| `royal-envoy.png` | Subject: a travel-worn royal envoy with olive skin, short curls, crimson-and-gold tabard, sealed document brooch, and alert expression. |
| `knight.png` | Subject: a broad middle-aged knight with weathered face, short beard, visible steel gorget, navy surcoat, and steady expression. |
| `guard-captain.png` | Subject: a Black female guard captain with braided hair, burgundy plume, steel gorget, forest-green cloak, and uncompromising expression. |
| `court-physician.png` | Subject: an elderly court physician with brown skin, grey beard, scholarly cap, navy robes, herb-and-vial brooch, and compassionate scrutiny. |
| `priest.png` | Subject: a solemn middle-aged priest with shaved crown, cream vestment, burgundy stole, antique-gold sun medallion, and calm expression. |
| `monk.png` | Subject: a young East Asian monk with simple tonsure, dark brown hood, parchment cord, and quietly nervous expression. |
| `scholar.png` | Subject: an elderly woman scholar with deep brown skin, white curls, round spectacles, ink-blue robes, and incisive curious expression. |
| `steward.png` | Subject: a meticulous middle-aged steward with sandy hair, trimmed beard, dark-oak livery, key-ring brooch, and discreet expression. |
| `cook.png` | Subject: a sturdy older cook with ruddy cheeks, greying hair wrapped in linen, practical burgundy apron, and skeptical expression. |
| `maid.png` | Subject: a young maid with medium-brown skin, dark braid, cream coif, forest-green dress, and attentive resolute expression. |
| `gardener.png` | Subject: an older gardener with sun-browned skin, white beard, patched green hood, leaf brooch, and kind watchful expression. |
| `merchant.png` | Subject: a prosperous woman merchant with olive skin, patterned navy headwrap, burgundy coat, coin brooch, and calculating smile. |
| `prisoner.png` | Subject: a gaunt adult prisoner with cropped dark hair, rough brown tunic, broken chain collar, and defiant exhausted expression. |

- [ ] **Step 2: Inspect and accept or regenerate each source**

Reject any image with a broken circular frame, cropped token, nonuniform green exterior, text, watermark, duplicate-looking face, or unreadable 96-pixel thumbnail. Regenerate only the rejected subject, repeating all invariants.

- [ ] **Step 3: Normalize accepted sources**

For every source, call `normalize_cutout` and write the corresponding final file under `src/assets/royal-inquest/avatars/`. Confirm visually that transparency exists only outside the token frame.

- [ ] **Step 4: Defer automated tests and inspect the avatar sheet**

Run `build_contact_sheet.py --root src/assets/royal-inquest/avatars --out tmp/royal-inquest-assets/avatar-review.png --tile-size 96`, then inspect the sheet. Do not run the test suites yet.

- [ ] **Step 5: Commit avatars**

```powershell
git add src/assets/royal-inquest/avatars
git commit -m "feat: add Royal Inquest avatar tokens"
```

---

### Task 3: Generate and Normalize the 12 Map Props

**Files:**
- Create: `src/assets/royal-inquest/props/*.png`
- Create outside runtime tree: `tmp/royal-inquest-assets/props/*.png`

**Interfaces:**
- Consumes: Prop prompt prefix and `normalize_cutout` from Task 1.
- Produces: 12 transparent, directly overhead prop PNGs.

- [ ] **Step 1: Generate one source per prop**

Call the built-in image generator separately for each row and append the exact subject sentence.

| Filename | Subject sentence |
| --- | --- |
| `throne.png` | Subject: an ornate dark-oak royal throne viewed exactly from above, burgundy cushion, antique-gold corner fittings, compact one-person footprint. |
| `formal-chair.png` | Subject: a carved dark-oak formal chair viewed exactly from above, navy upholstered seat, restrained gold studs, one-person footprint. |
| `simple-chair.png` | Subject: a plain medieval wooden chair viewed exactly from above, worn oak seat, sturdy square construction, one-person footprint. |
| `wooden-bench.png` | Subject: a long plain dark-oak bench viewed exactly from above, three-person seat, subtle worn edges, rectangular footprint. |
| `church-pew.png` | Subject: a carved medieval church pew viewed exactly from above, dark polished oak, modest devotional end carving, four-person footprint. |
| `stone-planter.png` | Subject: a square carved warm-stone planter viewed exactly from above, dense clipped forest-green shrub, restrained fleur-shaped relief. |
| `wooden-planter.png` | Subject: a rectangular dark-oak planter viewed exactly from above, herbs and small green leaves, iron corner bands. |
| `dining-table.png` | Subject: a long medieval dark-oak dining table viewed exactly from above, bare tabletop with subtle grain, six-person proportions. |
| `kitchen-worktable.png` | Subject: a heavy practical kitchen worktable viewed exactly from above, pale worn wood, inset chopping block, no loose food or tools. |
| `barrel-cluster.png` | Subject: a compact cluster of three closed wooden barrels viewed exactly from above, dark hoops, varied oak tones. |
| `bookshelf.png` | Subject: a low wide medieval bookshelf viewed exactly from above, dark oak case with visible rows of burgundy and navy book spines. |
| `dungeon-cage.png` | Subject: a compact square iron dungeon cage viewed exactly from above, empty interior, strong readable bars, closed door. |

- [ ] **Step 2: Inspect and accept or regenerate each source**

Reject perspective tilt, floor plane, directional shadow, clipped geometry, text, nonuniform green, or props that cannot be distinguished at 96 pixels. Regenerate only rejected subjects.

- [ ] **Step 3: Normalize accepted sources**

Run `normalize_cutout` for every accepted source and save the 12 final PNGs under `src/assets/royal-inquest/props/`.

- [ ] **Step 4: Defer automated tests and inspect the prop sheet**

Build `tmp/royal-inquest-assets/prop-review.png` at 96-pixel representative size and visually confirm overhead perspective, scale consistency, and clean edges.

- [ ] **Step 5: Commit props**

```powershell
git add src/assets/royal-inquest/props
git commit -m "feat: add Royal Inquest map props"
```

---

### Task 4: Generate and Build the 21 Seamless Tiles

**Files:**
- Create: `src/assets/royal-inquest/tiles/*.png`
- Create outside runtime tree: `tmp/royal-inquest-assets/tiles/room-timber-source-1.png` through `royal-marble-source-3.png`, following the seven table prefixes and three numbered variants.

**Interfaces:**
- Consumes: Tile prompt prefix and `build_environment` from Task 1.
- Produces: seven environment sets, each containing three mutually edge-compatible variants.

- [ ] **Step 1: Generate three sources per environment**

Call the built-in image generator separately for all 21 rows. Append the applicable surface sentence and variant sentence to the tile prefix.

| Output names | Surface sentence | Variant sentences |
| --- | --- | --- |
| `room-timber-{1,2,3}.png` | Subject: worn dark-oak room floorboards, medium-width boards, subtle warm grain and restrained age marks. | 1: balanced clean wear. 2: slightly varied grain and two small repaired knots. 3: softly scuffed boards with no stains. |
| `garden-{1,2,3}.png` | Subject: dense clipped garden grass interspersed with small warm-stone pavers, even distribution. | 1: mostly grass. 2: balanced grass and small stones. 3: slightly more moss-softened pavers. |
| `church-stone-{1,2,3}.png` | Subject: pale cream devotional stone slabs with fine antique-gold mineral veins, solemn and clean. | 1: broad rectangular slabs. 2: slightly narrower staggered slabs. 3: subtly mottled slabs with restrained age. |
| `kitchen-flagstone-{1,2,3}.png` | Subject: practical warm-grey kitchen flagstones, tightly laid, gently worn, clean enough for readable play. | 1: even flagstones. 2: slightly more tan variation. 3: restrained wear and faint grout variation. |
| `hallway-stone-{1,2,3}.png` | Subject: neutral castle corridor stone blocks, medium grey-brown, orderly courses, moderate wear. | 1: even blocks. 2: slightly darker alternating stones. 3: faint traffic polish without a directional path. |
| `dungeon-masonry-{1,2,3}.png` | Subject: dark damp dungeon floor masonry, charcoal stone, muted moss in a few joints, readable rather than black. | 1: broad rough stones. 2: smaller uneven stones. 3: restrained damp mottling and sparse moss. |
| `royal-marble-{1,2,3}.png` | Subject: ornate royal-room marble flooring, cream and burgundy geometric inlay with thin antique-gold lines, repeating nonfocal pattern. | 1: small diamond lattice. 2: offset square-and-diamond pattern. 3: restrained interlocking geometric pattern. |

- [ ] **Step 2: Inspect source suitability**

Reject sources containing borders, objects, emblems, focal centers, perspective, directional lighting, clipped patterns, text, or strong variation that will remain obvious when repeated.

- [ ] **Step 3: Build each compatible environment set**

For each environment, call `build_environment` with its three sources and exact destination filenames. The algorithm must impose the same seamless 48-pixel edge band on all three variants while retaining their distinct central texture.

- [ ] **Step 4: Build and inspect repeat previews**

Run `build_contact_sheet.py --root src/assets/royal-inquest/tiles --out tmp/royal-inquest-assets/tile-review.png --tile-size 96 --repeat-tiles`. Inspect all self-repeat and mixed-variant adjacencies at 100% and representative cell size. If a seam is visible, adjust only the environment set in question and rebuild all three of its variants.

- [ ] **Step 5: Commit tiles**

```powershell
git add src/assets/royal-inquest/tiles
git commit -m "feat: add seamless Royal Inquest floor tiles"
```

---

### Task 5: Typed Manifest and Final Review Sheets

**Files:**
- Create: `src/assets/royal-inquest/manifest.ts`
- Create: `src/assets/royal-inquest/manifest.test.ts`
- Create: `src/assets/royal-inquest/contact-sheet.png`
- Create: `src/assets/royal-inquest/tile-repeat-sheet.png`

**Interfaces:**
- Consumes: all final PNGs from Tasks 2-4.
- Produces: `royalInquestAssets: { avatars: Record<AvatarAssetId, string>; props: Record<PropAssetId, string>; tiles: Record<TileEnvironment, readonly [string, string, string]> }`.

- [ ] **Step 1: Write the failing manifest test**

Create a Vitest test that imports `royalInquestAssets` and asserts exactly 18 avatar keys, 12 prop keys, seven tile-environment keys, three unique URLs in every tile tuple, and 51 unique runtime URLs overall.

```ts
import { describe, expect, it } from 'vitest';
import { royalInquestAssets } from './manifest';

describe('royalInquestAssets', () => {
  it('exports the complete unique runtime asset pack', () => {
    expect(Object.keys(royalInquestAssets.avatars)).toHaveLength(18);
    expect(Object.keys(royalInquestAssets.props)).toHaveLength(12);
    expect(Object.keys(royalInquestAssets.tiles)).toHaveLength(7);
    Object.values(royalInquestAssets.tiles).forEach((variants) => {
      expect(variants).toHaveLength(3);
      expect(new Set(variants).size).toBe(3);
    });
    const urls = [
      ...Object.values(royalInquestAssets.avatars),
      ...Object.values(royalInquestAssets.props),
      ...Object.values(royalInquestAssets.tiles).flat(),
    ];
    expect(urls).toHaveLength(51);
    expect(new Set(urls).size).toBe(51);
  });
});
```

- [ ] **Step 2: Implement the typed manifest**

Use explicit Vite imports for each PNG. Export literal unions `AvatarAssetId`, `PropAssetId`, and `TileEnvironment`, then export `royalInquestAssets` with `as const satisfies` so missing or misspelled entries fail TypeScript compilation. Do not import either review sheet.

- [ ] **Step 3: Generate final review sheets**

Generate `contact-sheet.png` with all avatars at 96 pixels, props at 96 pixels, and tiles at 96 pixels, grouped and labeled. Generate `tile-repeat-sheet.png` with one 3x3 mixed-variant preview per environment.

- [ ] **Step 4: Commit the manifest and sheets**

```powershell
git add src/assets/royal-inquest/manifest.ts src/assets/royal-inquest/manifest.test.ts src/assets/royal-inquest/contact-sheet.png src/assets/royal-inquest/tile-repeat-sheet.png
git commit -m "feat: publish Royal Inquest asset manifest"
```

---

### Task 6: Targeted Final Verification

**Files:**
- Verify: `tools/royal_inquest_assets/test_image_contract.py`
- Verify: `src/assets/royal-inquest/manifest.test.ts`
- Verify: all 51 runtime PNGs and two review sheets.

**Interfaces:**
- Consumes: complete implementation from Tasks 1-5.
- Produces: evidence that the pack meets the approved design and file contract.

- [ ] **Step 1: Run the image-contract tests once**

Run: `& 'C:\Users\stef\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s tools/royal_inquest_assets -p 'test_*.py' -v`

Expected: all tooling tests and complete-pack checks PASS, reporting 18 avatars, 12 props, 21 tiles, 512x512 dimensions, correct alpha/opacity, and zero edge distance inside each environment set.

- [ ] **Step 2: Run the targeted manifest test once**

Run: `npm test -- --run src/assets/royal-inquest/manifest.test.ts`

Expected: one test file PASS with 51 unique runtime asset URLs.

- [ ] **Step 3: Run the production build once**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully and all manifest imports resolve.

- [ ] **Step 4: Perform final visual QA**

Open `contact-sheet.png` and `tile-repeat-sheet.png`. Confirm: no text or watermark inside assets; 18 visibly distinct people; all props directly overhead and correctly scaled; no clipped edges or green fringe; tiles have consistent lighting and no visible repeat seam; royal-room patterns do not form a singular emblem.

- [ ] **Step 5: Record the verified state**

Run `git status --short` and `git log -5 --oneline`. Expected: only intentionally excluded raw/intermediate files under `tmp/` remain untracked; committed runtime assets, tools, manifest, tests, and review sheets are clean.
