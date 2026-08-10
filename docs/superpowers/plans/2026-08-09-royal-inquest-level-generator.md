# Royal Inquest Level Generator Plan

Design doc: `docs/superpowers/specs/2026-08-09-royal-inquest-level-generator-design.md`.

Work in a dedicated worktree (`EnterWorktree`, per `AGENTS.md`), never on `main`. Complete the
implementation before running tests, per `AGENTS.md`.

**Post-implementation amendment:** the numeric ranges below (`rows`/`columns` independently 5-7,
chamber count independently 3-5, cast size independently 4-7) are what this plan was written
against, but stress-testing the implementation showed that shape converges under 1% of the time at
difficulty 1-2 (see the design doc's "Verification findings" section, added after implementation).
The shipped generator instead picks chamber count in `[4, 5]`, derives `rows = columns = chamberCount
+ 1` (a square, full-quota board) and `castSize = chamberCount + 1` from it, restricts generatable
chamber environments to `room`/`church`/`royalRoom` (the only seat-capable ones), and decides the
solution's cell assignment *before* placing props so every non-pair chamber's occupant can be
seat-anchored exactly. The stage list, file list, and CLI/test contracts below are otherwise
unchanged from what was implemented — only the specific numeric ranges inside stages 3 (chamber
count/board size) and 5 (cast size) moved.

## Changes

1. **`tools/royal-inquest-generator/rng.ts`** — seedable PRNG: `createRng(seed: number): () =>
   number` (mulberry32, returns floats in `[0, 1)`), `randInt(rng, min, max)` (inclusive both ends),
   `pick(rng, array)`, `shuffle(rng, array)` (Fisher-Yates, non-mutating), `weightedPick(rng,
   entries)` where `entries: Array<{ value: T; weight: number }>`.

2. **`tools/royal-inquest-generator/wordBanks.ts`** — data-only pools:
   - Chamber name fragments per `TileEnvironment` (a prefix/noun pool per environment, e.g. `room` →
     "Study", "Parlour", "Reading Room", ...).
   - Character role/avatar pairs: for each `AvatarAssetId`, one or more `{ role: string }` name
     templates ("The <Role>") so generated casts vary which avatar plays which role across seeds.
   - Case title fragments (place-name generator: adjective/noun pools combined into "<Place> Manor"-
     style titles) plus a per-case "Whispers at <Place>" style wrapper matching existing titles.
   - Per-predicate-type flavor `text` templates (a small array of phrasings per predicate type used
     by `clueGeneration.ts`), parameterized by role name / chamber name / prop name / count as
     needed — never state raw coordinates.

3. **`tools/royal-inquest-generator/chamberLayout.ts`** — `generateChamberLayout(rng, options)`:
   - Pick `rows`, `columns` independently from `[5, 7]`.
   - Pick a chamber count (roughly `rows*columns / 6`, clamped to a sane range).
   - Seed that many chambers on random distinct cells, then repeatedly pick a random chamber with
     an unassigned orthogonal neighbor and grow it by one cell, until every cell is assigned
     (flood-fill/region-growth, not a rectangle packer — this is what makes shapes irregular).
   - Merge any resulting chamber under 5 cells into an adjacent chamber (repeat until all chambers
     meet the floor; note this can reduce the chamber count from what was originally picked).
   - Assign each chamber a `TileEnvironment`, weighted-random with a bias against repeating the same
     environment as an orthogonally-adjacent chamber (soft — not enforced if it can't be satisfied).
   - Returns `{ rows, columns, chamberOf: Map<string, chamberId>, chamberEnvironment: Map<chamberId,
     TileEnvironment> }` (cell-key `row:column` → chamber, per existing `positionKey` convention).

4. **`tools/royal-inquest-generator/propPlacement.ts`** — `generatePropPlacement(rng, layout)`:
   - Per chamber, decide a handful of blocked cells (never all cells — must leave enough unblocked
     cells for the eventual cast placement) and assign each a legal decorative
     `PropAssetId` from `propsByEnvironment[environment]` filtered to `propKindByAsset[id] ===
     'decorative'`, skipping `-left`/`-right` variants entirely (see design doc non-goals). Avoid the
     same asset on two orthogonally-adjacent blocked cells.
   - Pick exactly one unblocked cell per chamber and assign a legal seat `PropAssetId` (filtered to
     `propKindByAsset[id] === 'seat'`), same env allow-list and adjacency-repeat avoidance.
   - `hallway` chambers get no props at all (`propsByEnvironment.hallway` is empty).
   - Returns `{ blocked: Set<cellKey>, propByCell: Map<cellKey, PropAssetId> }`.

5. **`tools/royal-inquest-generator/solutionAndCast.ts`** — `generateSolutionAndCast(rng, layout,
   propPlacement)`:
   - Pick cast size `n` in `[4, 7]`, clamped to `<= min(rows, columns)`.
   - Pick `n` distinct `{ avatarId, role/name }` pairs from `wordBanks.ts`.
   - Build the list of unblocked cells; attempt a random full permutation assigning one unblocked
     cell per character with all-distinct rows and all-distinct columns (retry internally, bounded,
     e.g. 200 attempts — small boards make this cheap).
   - Scan the resulting per-chamber occupant counts for a chamber with exactly 2 occupants; pick one
     of the two as victim, the other as traitor. If no chamber has exactly 2 occupants, retry the
     permutation (bounded); if attempts are exhausted, return a failure signal so `generate.ts` can
     regenerate the whole layout instead of looping here forever.
   - Returns `{ characters: InquestCharacter[], solution: Record<CharacterId, GridPosition>,
     victimId, traitorId }`.

6. **`tools/royal-inquest-generator/clueGeneration.ts`** — `generateClues(rng, definitionSoFar,
   difficulty)`:
   - Candidate predicate pool = every `InquestPredicate` type EXCEPT `exact-row`, `exact-column`,
     character-pair `beside`/`not-beside` (validator-banned outright) and `direction-from` (always
     vacuous per design doc), gated by `predicateDifficulty[type] <= difficulty`.
   - For each non-victim character, weighted-random-pick one anchoring predicate instantiated against
     that character (e.g. `exact-chamber` with their solved chamber, `on-prop` if they sit on a seat
     prop, `in-corner` if their cell qualifies, `same-chamber`/`different-chamber` against another
     already-anchored non-victim character, `chamber-occupant-count` from their solved chamber's
     occupant count, `not-beside-wall` if their cell qualifies, `by-window` if adjacent to a window
     prop cell, plus tier-2/3 `diagonal-from`/`offset-from`/`category-not-beside-prop`/
     `shares-prop-neighbor`/`prop-neighbor-count`/`area-occupant-count`/`seated-character-count` when
     `difficulty` allows and the solution actually satisfies that predicate's shape) — skip a
     candidate predicate for a character if the solution doesn't actually make it true or it would
     reference the victim (checked via `getPredicateCharacterIds`).
   - After the per-character pass, run the solver-backed repair loop: call
     `solveInquestDefinition`/`checkVictimElimination` (importing from
     `../../src/features/royal-inquest/solver`); if under-constrained, add one more random legal
     clue (any non-victim character, any legal predicate) and retry; if the unique solution doesn't
     match, drop the most recently added clue and try a different one instead; bounded retries (e.g.
     30), then signal failure so `generate.ts` regenerates the outer layout.
   - Attach flavor `text` from `wordBanks.ts` per clue.
   - Returns `InquestClue[]`.

7. **`tools/royal-inquest-generator/generate.ts`** — `generateInquestDefinition({ difficulty, seed?
   }): InquestDefinition`:
   - `seed` defaults to `Date.now() ^ (Math.random() * 2**31 | 0)` if omitted (logged by the CLI, not
     this function, so the function stays pure given a seed).
   - Retries the whole pipeline (chamberLayout → propPlacement → solutionAndCast → clueGeneration) up
     to ~50 times using a derived sub-seed per attempt, gated by a final
     `validateInquestDefinition(definition)` call — returns the first attempt with zero issues.
   - Throws a descriptive error (`Failed to generate a valid definition after N attempts (seed
     <seed>)`) if every attempt fails — never returns an invalid definition.

8. **`tools/royal-inquest-generator/emitLevelFile.ts`** — `emitLevelFile(definition:
   InquestDefinition): string`:
   - Serializes back to the exact shape of the 5 hand-authored level files (see `hollowmereLodge.ts`
     for the reference shape): relative imports for `GridPosition`, `PropAssetId`, `CharacterId`/
     `InquestCell`/`InquestDefinition`; `decorativePropsByPosition`/`seatPropsByPosition` merged into
     `propsByPosition`; `blockedCells` derived from decorative prop keys; `chamberByPosition` as a 2D
     `as const` array of chamber ids; `chamberEnvironments`/`chamberNames` records; `cells` built via
     `.flatMap`; `solution` record; trailing `export const <camelCaseId>: InquestDefinition = {...}`
     with `id`/`title`/`definitionVersion`/`difficulty`/`rows`/`columns`/`characters`/`cells`/
     `chamberEnvironments`/`chamberNames`/`clues`/`traitorId`/`solution`.
   - `camelCaseId` derives from `definition.id` (kebab-case → camelCase).

9. **`tools/royal-inquest-generator/cli.ts`**:
   - Flags: `--difficulty <1|2|3>` (required, else print usage and exit 1), `--seed <number>`
     (optional; if omitted pick one and log it), `--out <path>` (optional; stdout if omitted).
   - Calls `generateInquestDefinition` → `emitLevelFile`; writes to `--out` (via `node:fs`) or prints
     to stdout; then validates the generated definition again and prints a PASS/FAIL report reusing
     `buildSolveReport` from `../royal-inquest-solver/report.ts`, matching
     `tools/royal-inquest-solver/cli.ts`'s console output shape.

10. **`tools/royal-inquest-generator/generate.test.ts`** (vitest, mirror `solver.test.ts`'s style):
    - Across 20+ seeds (spanning difficulty 1, 2, 3): every generated definition has zero
      `validateInquestDefinition` issues.
    - Board `rows`/`columns` vary across the seed set (not identical every time).
    - The aggregated set of predicate types used across all generated clues includes more than just
      `exact-chamber`/`on-prop`.
    - Chamber shapes (the cell→chamberId assignment) differ across at least two seeds.

11. **`package.json`** — add `"inquest:generate": "vite-node tools/royal-inquest-generator/cli.ts
    --"` to `scripts`, alongside the existing `inquest:solve` entry.

12. **Docs** (cave + human pairs, identical content, per repo/workspace convention):
    - `docs/royal-inquest/authoring/level-generator.human.md` / `.cave.md` — new file documenting
      the CLI flags, the five pipeline stages, the repair-loop concept, and stating plainly the
      sameness problem this exists to solve (link back to the design doc for full rationale).
      Matches the style/structure of the other 4 authoring docs.
    - `.claude/skills/royal-inquest-puzzle-design/SKILL.md`:
      - Add a short "why this changed" note near the top (prior cases were all rotations of one
        template / one clue formula because nothing forced variety).
      - Add `level-generator.cave.md` to "Read in this order".
      - Rewrite "Where a new case lives": generator run first
        (`npm run inquest:generate -- --difficulty <N> --out
        src/features/royal-inquest/levels/<slug>.ts`), then hand-polish (renames, wording, optionally
        one bespoke added clue), then the unchanged `npm run inquest:solve -- --file <path>`
        validate step, then register in `levels/index.ts`. Manual from-scratch authoring becomes an
        explicitly-noted escape hatch, not the default.
      - Do not touch `.claude/skills/royal-inquest-difficulty-design/SKILL.md`.

13. This plan + the design doc (already written).

## Explicit out of scope

- The 5 existing shipped level files are untouched.
- No new `PropAssetId`/`AvatarAssetId`/`InquestPredicate` values.
- No changes to `predicates.ts`, `RoyalInquest.tsx`, or gameplay rendering.
- No `-left`/`-right` two-cell-span prop placement (documented as a scope cut in the design doc).
- Full test suite is not run — only the targeted generator/validator/solver tests below.

## Verification

1. `npm run inquest:generate -- --difficulty 1 --seed 1 --out /tmp/case-a.ts`, then `--seed 2`, then
   `--difficulty 3 --seed 3` — confirm PASS each time and genuinely different board dims/chamber
   shapes/predicate mixes across runs, not just renamed characters on the same skeleton.
2. `npm run inquest:solve -- --file <a generated path>` — independent re-validation via the existing
   solver CLI.
3. `npm run test:run -- royal-inquest-generator` — new generator test suite passes.
4. `npm run test:run -- definitionValidation solver` — no regressions in the existing engine tests.
