# Royal Inquest Art Assets Design

## Objective

Create a reusable, game-ready medieval art pack for Royal Inquest. The pack must improve character recognition and turn the existing abstract grid into a readable castle map without sacrificing mobile usability.

## Art Direction

All assets use a polished illustrated board-game style:

- straight top-down map perspective;
- crisp dark-brown outlines;
- restrained parchment texture;
- burgundy, navy, forest green, warm stone, dark oak, and antique-gold palette;
- strong silhouettes and limited small detail for legibility inside compact grid cells;
- consistent neutral lighting;
- no text, labels, logos, watermarks, or outer tile borders.

Avatars use circular portrait-token framing. The portrait itself may use a three-quarter head angle for expression, but the token remains a front-facing circular UI asset rather than a full-body map figure. Face, clothing, palette, and silhouette distinguish every person.

Map props are illustrated from directly overhead. They have compact footprints and no cast shadows extending beyond those footprints. Floor textures are directly overhead, fully opaque, and seamless.

## Deliverables

### Avatars

Create 18 reusable character tokens:

1. monarch;
2. royal consort;
3. prince or princess;
4. nobleman;
5. noblewoman;
6. royal envoy;
7. knight;
8. female guard captain;
9. court physician;
10. priest;
11. monk;
12. scholar;
13. steward;
14. cook;
15. maid;
16. gardener;
17. merchant;
18. prisoner.

The cast should vary visibly in age, gender presentation, skin tone, hair, clothing, and social role while remaining coherent within one fictional medieval court.

### Placeable Props

Create 12 reusable objects:

1. throne;
2. formal chair;
3. simple chair;
4. wooden bench;
5. church pew;
6. stone planter;
7. wooden planter;
8. dining table;
9. kitchen worktable;
10. barrel cluster;
11. bookshelf;
12. dungeon cage.

Each object must be centered, fully visible, directly overhead, and isolated on transparency. Scale should be internally consistent: seating fits one person, tables relate plausibly to chairs, and large props remain readable when constrained to one or two grid cells.

**Final scope change:** five of these twelve objects — `wooden-bench`, `church-pew`, `dining-table`, `kitchen-worktable`, and `bookshelf` — are large enough that a single 512x512 cell compressed their footprint below the 96px readability bar. Each of those five was additionally reframed to a 1024x512 source and split into an exact left/right 512x512 pair, so it can span two adjacent grid cells at full scale. The original complete one-cell file is retained for placements where only one cell is available. This raises the prop file count from 12 to **22 files** (12 complete one-cell props + 10 left/right segment files) while the object count stays 12.

### Seamless Floor Tiles

Create three interchangeable variants for each of seven environments, for 21 tiles total:

| Environment | Surface |
| --- | --- |
| General rooms | Worn timber |
| Garden | Grass and garden paving |
| Church | Pale devotional stone |
| Kitchen | Practical flagstone |
| Hallway | Neutral castle stone |
| Dungeon | Dark, damp masonry |
| Royal room | Ornate marble and inlay |

Every tile is a square background for a grid cell. Each variant must tile seamlessly against itself and against the other two variants in the same environment. Opposite edges must connect without visible seams. Variants may change small internal texture details, but may not introduce borders, directional lighting changes, or singular central motifs that make repetition obvious.

Tiles from different environments are not required to share seamless edges; room boundaries remain the responsibility of the map layout or a future transition-tile set.

**Final scope change:** the original 21-tile target (three variants per environment) was reduced during implementation. The user requested keeping already-generated surplus variants rather than discarding them, but generating only the missing environment types rather than filling every environment back up to three. The final approved count is **15 tiles**: three variants each for general rooms, garden, church, and kitchen, and a single variant each for hallway, dungeon, and royal room. Each tile is individually self-seamless (its own opposite edges match); tiles are no longer required to share edges across variants or across environments — an earlier shared-edge-band treatment produced visible inner-frame artifacts and was replaced by per-tile self-seamless processing.

## File Contract

Final assets are 512x512 PNG files organized as:

```text
src/assets/royal-inquest/
  avatars/
  props/
  tiles/
  manifest.ts
  contact-sheet.png
```

- Avatars have transparent pixels outside the circular token frame.
- Props have transparent backgrounds and transparent image corners.
- Tiles are fully opaque.
- Filenames use lowercase kebab-case and include the tile variant number where applicable.
- `manifest.ts` exports stable named paths grouped into `avatars`, `props`, and `tiles`; it contains no rendering logic.
- `contact-sheet.png` presents all final assets at representative game scale for visual review and is not loaded by the game at runtime.

Generated source images may be larger than 512x512, but only normalized final PNGs belong in the runtime asset directories.

## Generation Workflow

Use the built-in image generator. Prompts must repeat the shared art-direction constraints and specify each asset's role, perspective, composition, and exclusions.

Generate avatars and props against a flat removable chroma-key background, then remove it locally and preserve clean antialiased edges. Generate tiles as opaque images. Normalize selected outputs to the file contract without overwriting unrelated or pre-existing assets.

Consistency takes priority over maximizing variation. Review each generation against the approved style reference before accepting it. Regenerate assets with perspective drift, inconsistent outlines, unwanted text, clipped geometry, or poor small-size readability.

## Integration

The asset pack is reusable and independent of puzzle rules. The manifest supplies stable imports to the React application. A later UI integration can map current character IDs to chosen reusable avatars, assign floor textures by chamber type, and layer props over cells without changing puzzle state or validation logic.

Creating the asset pack does not alter Royal Inquest gameplay, board dimensions, or placement rules.

## Validation

Automated validation will verify:

- every declared manifest file exists;
- every image is PNG and exactly 512x512;
- avatars and props contain an alpha channel and transparent corners;
- tiles are fully opaque;
- the expected counts are 18 avatars, 22 prop files (12 complete one-cell props plus 10 left/right segment files for five two-cell props), and 15 tiles;
- filenames and manifest groups are unique;
- each tile is self-seamless (its own opposite edges match), and each two-cell prop pair recomposes exactly to its 1024x512 source.

Tile validation will compare each tile's own opposite edges and generate repeated 3x3 previews to expose seams. Visual review of the contact sheet and repeated previews will confirm consistent style, direct overhead perspective, plausible scale, unclipped subjects, clean transparency, and readability at representative grid-cell size.

## Acceptance Criteria

The pack is complete when all 55 individual runtime assets (18 avatars + 22 props + 15 tiles) satisfy the file contract and automated checks, every tile repeats without a visible seam against itself, every two-cell prop pair recomposes exactly, the contact sheet presents a coherent illustrated board-game collection, and no gameplay code has been unintentionally changed.
