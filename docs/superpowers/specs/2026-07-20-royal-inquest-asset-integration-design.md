# Royal Inquest Asset Integration Design

## Objective

Wire the existing Royal Inquest art pack (avatars and floor tiles from `src/assets/royal-inquest/`, exposed via `src/assets/royal-inquest/manifest.ts`) into the live `RoyalInquest` gameplay component. Today the board and character portraits are flat CSS colors and Unicode glyphs (♙, ◆, ×, ·); this task replaces the floor and character-token layers with the approved art while leaving predicate/reducer/validation logic untouched.

Prop rendering (furniture such as `throne`, `bookshelf`) is explicitly out of scope: no data model exists for where a prop sits within a chamber, and authoring one is a separate design decision.

## Data model

- `InquestCharacter` gains `avatarId: AvatarAssetId` (type imported from the manifest).
- `InquestDefinition` gains `chamberEnvironments: Record<string, TileEnvironment>`, keyed by `chamberId` (mirrors the existing chamber grouping rather than repeating the fact per cell).

## Character → avatar mapping (`blackwoodKeep`)

| Character | Avatar | Rationale |
| --- | --- | --- |
| envoy | `royal-envoy` | exact title match |
| aldric | `nobleman` | "Lord Aldric" |
| beatrice | `noblewoman` | "Lady Beatrice" |
| cedric | `knight` | "Sir Cedric" |
| daria | `guard-captain` | no dedicated "Dame" asset exists; nearest fit for an authority figure who searched the keep |
| edmund | `monk` | "Brother Edmund" |

## Chamber → tile environment mapping (`blackwoodKeep`)

| Chamber(s) | Environment |
| --- | --- |
| `solar`, `great-hall` | `royalRoom` |
| `west-gallery`, `east-gallery`, `gallery` | `hallway` |
| `guardroom`, `archives` | `room` |
| `chapel` | `church` |
| `crypt` | `dungeon` |

`garden` and `kitchen` environments are unused by this puzzle instance and remain available for future puzzles. `royalRoom` and `hallway` each have only one tile variant, so the chambers sharing them render visually identical floors — an asset-inventory limit, not a bug.

## Rendering

- Board cells: floor tile set via inline `background-image` combining a CSS custom property (`--cell-tint`, varies by `.cell.blocked`/`.cell.occupied`/default state) with the resolved tile `url(...)`. Occupied cells render the character's avatar as an `<img>` (replacing the two-letter text label); unoccupied/blocked/crossed cells keep their existing glyphs, layered via CSS grid stacking.
- Character carousel: the `♙` glyph is replaced with the visible character's avatar `<img>`.
- Tile variant selection is a pure, deterministic function of cell position (`src/features/royal-inquest/visuals.ts`), not stored state or randomness.

## Non-goals

- No prop rendering.
- No changes to `tools/royal_inquest_assets/` tooling or `test_image_contract.py`.
- No changes to puzzle predicate/reducer/validation logic.

See `docs/superpowers/plans/2026-07-20-royal-inquest-asset-integration.md` for the implementation plan.
