---
name: royal-inquest-puzzle-design
description: Use whenever designing or authoring a new Royal Inquest case (a new board, cast, chamber layout, prop set, or clue list) — before writing a spec/plan, before touching definition.ts-shaped data, and before picking assets. Points at the canonical rules, the three authoring docs, the asset manifest, and the solver-backed validation a new case must pass.
---

# Royal Inquest puzzle design

The Royal Inquest is a spatial Murdoku-style placement puzzle (`src/features/royal-inquest/`). This
skill is the entry point for designing a **new case** (new board/cast/clues) — not for gameplay
mechanics changes, which follow the general [`realmbound-workflow`](../realmbound-workflow/SKILL.md)
skill instead. Targeting a specific difficulty tier, or authoring a batch across tiers? See
[`royal-inquest-difficulty-design`](../royal-inquest-difficulty-design/SKILL.md) for the tier-specific
knob — this skill covers everything else.

## Read in this order

1. [`docs/royal-inquest/rules.cave.md`](../../../docs/royal-inquest/rules.cave.md) — canonical game
   rules (board, chambers, placement, clue states, victim/traitor condition, completion). Read this
   first even if you only think you're touching content, not rules.
2. [`docs/royal-inquest/authoring/board-rooms-props.cave.md`](../../../docs/royal-inquest/authoring/board-rooms-props.cave.md)
   — grid, chambers ("rooms"), tile environments, prop placement (seat vs decorative, environment
   allow-list), enforced by `validateInquestDefinition`.
3. [`docs/royal-inquest/authoring/character-placement.cave.md`](../../../docs/royal-inquest/authoring/character-placement.cave.md)
   — cast, solution model, victim/traitor authoring rule, the solver-backed uniqueness check every
   case must pass.
4. [`docs/royal-inquest/authoring/clues-and-predicates.cave.md`](../../../docs/royal-inquest/authoring/clues-and-predicates.cave.md)
   — every `InquestPredicate` variant, which ones a clue may actually use, exact eval semantics.

Each doc has a `.human.md` twin — per this repo's convention (and the workspace's), read only the
`.cave.md` version.

## Non-negotiable authoring constraints (from the docs above)

- A clue is a structured `InquestPredicate`, never parsed free text. Never author `exact-row` /
  `exact-column` on a clue — use `exact-chamber`, `same-chamber`/`different-chamber`, `on-prop`,
  `beside`/`not-beside`, or `direction-from` instead.
- No clue may name the victim (`getPredicateCharacterIds` is checked against the victim id). The
  victim's cell must be reached only by elimination.
- On a full row/column-permutation solution (the norm), `beside` and `direction-from` can never be
  authored `true` between two distinct characters — only usable as always-false negative flavor
  (`not-beside`).
- Every chamber needs a name + `TileEnvironment` and at least 5 cells.
- A prop's seat/decorative kind is fixed by the asset itself (`propKindByAsset` in
  `src/assets/royal-inquest/manifest.ts`) — `blocked` must match (`false` for seat, `true` for
  decorative), and the prop must be in that chamber's `propsByEnvironment` allow-list.
- Cast size can't exceed the board's row/column count (every character needs a unique row and
  column). At least two characters, exactly one victim.
- The victim's chamber must hold exactly the victim + traitor in the authored `solution` — no more,
  no fewer.

## Assets — pick from what exists, don't invent ids

`src/assets/royal-inquest/manifest.ts` is the source of truth:

- `AvatarAssetId` — pick nearest fit if no exact-role portrait exists (e.g. ship case used
  `guard-captain` for "Dame Daria").
- `PropAssetId` + `propKindByAsset` (seat vs decorative) + `propsByEnvironment` (which prop fits
  which `TileEnvironment`).
- `TileEnvironment` union: `'room' | 'garden' | 'church' | 'kitchen' | 'hallway' | 'dungeon' |
  'royalRoom'`.

If a new case needs an avatar/prop/tile that doesn't exist yet, that's a separate asset-pipeline
task (`tools/royal_inquest_assets/` — `split_prop.py`, `normalize_cutout.py`, `build_tile_set.py`,
`build_contact_sheet.py`, contract-checked by `image_contract.py`/`test_image_contract.py`), not
something to hand-roll inside the case definition. Flag it rather than fabricating an id.

## Validation is the source of truth, not hand-reasoning

`definitionValidation.ts` (`validateInquestDefinition`) enforces every structural rule above, and
runs `solver.ts` against the full clue set:

- `solveInquestDefinition` backtracks the whole clue set — must yield exactly one solution, matching
  the authored `solution`.
- `checkVictimElimination` re-solves with every character except the victim — must yield exactly one
  solution, with exactly one legal cell left for the victim, in a chamber holding exactly one other
  (the traitor).

A new case isn't done until it passes this validator — don't declare a clue set correct by manual
deduction alone. Two ways to run it:

- `npm run test:run -- definitionValidation` — via the test suite, once the case is registered in
  `levels/index.ts`.
- `npm run inquest:solve -- <levelId>` (or with no args, all bundled levels; or `-- --file <path>`
  for a draft not yet registered) — a standalone CLI (`tools/royal-inquest-solver/`) that prints
  PASS/FAIL, every validation issue, and the solved character→cell grid, without writing a test
  file. Use this while iterating on a case still in progress.

## Where a new case lives

- Definition: a new file under `src/features/royal-inquest/levels/` (see `ravensholtAbbey.ts` /
  `thornfieldManor.ts` for shape), registered in `src/features/royal-inquest/levels/index.ts`
  (`royalInquestLevels` array).
- Follow the standard spec/plan/worktree flow from
  [`realmbound-workflow`](../realmbound-workflow/SKILL.md) for anything beyond a trivial content
  addition — a new case is exactly the kind of non-trivial change that skill's plan-first rule
  covers.
