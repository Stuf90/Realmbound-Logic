# Royal Inquest Predicate Expansion Design

## Objective

`docs/royal-inquest/authoring/clues-and-predicates.human.md` keeps a running list, "Predicate idea
not yet in engine," of Murdoku book clue vocabulary that `InquestPredicate` doesn't cover. That
list is stale: 6 of its 10 entries (occupancy count, category clue, shared-prop pairing,
disjunctive corner, global uniqueness, not-beside-wall) were already built into `predicates.ts` in
a later pass and the list was never pruned; diagonal is already struck through as done. Cross-
checking the list against the current `predicates.ts`/`types.ts` and the doc's own glossary/gap
tables leaves 4 real gaps:

1. **Relative offset** ("one column and two rows up-left of X") — exact vector distance, stronger
   than `direction-from` (direction only, no distance).
2. **Exact-two-beside-same-prop** ("two people stood beside a table") — `shares-prop-neighbor`
   only proves "at least one other," not an exact count.
3. **Alone-on-prop-area** ("was alone on the stand") — `chamber-occupant-count` only scopes to a
   whole chamber, not a named sub-area within it.
4. **By-window** ("was in front of a window") — needs an edge-adjacency concept and a window prop
   asset; neither exists today.

For #4, there is no real window sprite and the Python asset pipeline
(`tools/royal_inquest_assets/`) only processes existing source images — it does not generate new
art. This design builds the real engine mechanic (predicate + edge-only placement validation +
manifest wiring) and points the manifest at an existing image as a placeholder texture, clearly
flagged for a later art swap. The book's two-cell visual span for windows is out of scope for this
pass — MVP treats window as a normal single-cell decorative prop that is additionally validated as
edge-only.

## Predicate additions

```ts
| {
    type: 'offset-from';
    subjectCharacterId: CharacterId;
    referenceCharacterId: CharacterId;
    rowOffset: number;
    columnOffset: number;
  }
| { type: 'prop-neighbor-count'; propId: PropAssetId; count: number }
| { type: 'area-occupant-count'; characterId: CharacterId; count: number }
| { type: 'by-window'; characterId: CharacterId; propId: PropAssetId }
```

Plus a new optional field on `InquestCell`:

```ts
areaId?: string;
```

### `offset-from`

`'unknown'` unless both characters are placed. Else true when
`subject.row - reference.row === rowOffset && subject.column - reference.column === columnOffset`
(south/east positive, matching `direction-from`'s south/east sign convention). Unlike
`direction-from`, this does **not** require the pair to share a row or column, so — like
`diagonal-from` — it stays satisfiable against a full row/column permutation solution whenever
both offsets are nonzero. Rated 3 (hardest tier, per the doc's existing gap-table estimate).

### `prop-neighbor-count`

Global/cast-wide quantifier, same shape family as `seated-character-count`. Finds the (single)
cell bearing `propId`; counts how many placed characters are orthogonally adjacent to it (reusing
the existing `isAdjacent` helper from `predicates.ts`). Early `false` once the placed-count exceeds
`predicate.count`; `'unknown'` until every character is placed; otherwise exact match. Names no
character — `getPredicateCharacterIds` returns `[]`, joining `seated-character-count` and
`category-not-beside-prop` in the "global" bucket. Rated 3 (existential + exact count, matching
`shares-prop-neighbor`'s own tier-3-adjacent existential shape plus a stricter count).

### `area-occupant-count`

Direct generalization of `chamber-occupant-count`: same early-exit/`'unknown'` logic, but keyed by
a combined `${chamberId}:${areaId ?? ''}` string instead of bare `chamberId` (new `areaKeyAt`
helper next to the existing `chamberAt`). When no cell in a definition sets `areaId`, every cell's
key collapses to `${chamberId}:`, so the predicate behaves identically to `chamber-occupant-count`
for every existing level — this is a strict superset, not a parallel concept. Rated 2 (same tier as
`chamber-occupant-count`, which it generalizes).

### `by-window`

Same adjacency check as `shares-prop-neighbor`'s first half: `'unknown'` until `characterId` is
placed, else `isAdjacent(position, propCell.position)` against the (single) cell bearing `propId`.
Takes `propId` as a parameter rather than hardcoding the `window` asset, matching how `on-prop`,
`category-not-beside-prop`, and `shares-prop-neighbor` already parameterize by prop — a future
non-window edge-adjacent prop could reuse the same predicate shape. Rated 2 (single-anchor
adjacency fact, same tier as `shares-prop-neighbor`).

## Validation additions

- All 4 new type strings join the `PREDICATE_TYPES` set in `definitionValidation.ts`.
- New per-cell rule: any cell whose `propId === 'window'` must sit on the board's outer edge
  (`row === 0 || row === rows - 1 || column === 0 || column === columns - 1`); otherwise push
  `Prop "window" must sit on the board's outer edge.`. This is the MVP stand-in for the book's real
  edge-only/two-cell-span rule — enforced by asset placement rather than by the predicate itself
  (the predicate only checks adjacency, same as every other prop-anchored predicate).
- No other new validation: `offset-from`, `prop-neighbor-count`, and `area-occupant-count` all ride
  the existing generic difficulty-gate (`predicateDifficulty`) and victim-name check
  (`getPredicateCharacterIds`), same as every other predicate.

## New placeholder prop asset

`src/assets/royal-inquest/manifest.ts` gains a `window` `PropAssetId`:

- `propKindByAsset.window = 'decorative'` (matches the book's "window" being a fixture, not a seat).
- Added to every `propsByEnvironment` list, including the currently-empty `hallway` — windows are
  architecturally generic, not environment-specific like a kitchen worktable.
- `royalInquestAssets.props.window` reuses the already-imported `stonePlanter` image as a
  placeholder texture, with a `// TODO(art)` comment pointing at
  `docs/royal-inquest/authoring/board-rooms-props.human.md#asset-idea-not-yet-built` for the real
  sprite swap later.

## Non-goals

- No real window sprite/art generation — flagged as a follow-up once source art exists.
- No literal two-cell window span — MVP is single-cell, edge-validated only.
- No changes to `selectors.ts`, `solver.ts`, or `hints.ts` — none of the new predicates need
  special-cased cell-availability or hint-text logic beyond what `getPredicateCharacterIds` already
  provides generically.
- No new shipped level content — this pass is engine-only; new clues in `thornfieldManor.ts` /
  `ravensholtAbbey.ts` using these predicates are a separate future authoring pass.

See `docs/superpowers/plans/2026-08-08-royal-inquest-predicate-expansion.md` for the implementation
plan.
