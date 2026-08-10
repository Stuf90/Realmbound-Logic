# Authoring with the level generator

> Human version. Agent version: [`level-generator.cave.md`](level-generator.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

## The problem this solves

All 5 shipped cases (`marrowfenChapel`, `ashwellManor`, `thistledownMarket`, `wrenmoorWatchtower`,
`hollowmereLodge`) trace back to one hand-authored template: always a full-row/column victim+traitor
chamber plus four irregular chambers, an identical prop-count pattern, and — the part board-shape
variation alone didn't fix — a clue set that is *always* exactly one `exact-chamber` clue per
non-victim character plus one `on-prop` clue on the traitor. The engine supports 20
`InquestPredicate` variants (`types.ts`), but almost none of them had ever shipped in real content.
This happened because, given "author a new case," an agent (or a human under time pressure)
consistently regresses to copying the nearest existing level's shape rather than exploring the
predicate space — nothing forced variety.

`tools/royal-inquest-generator/` is a procedural generator that fixes this by making board shape,
prop placement, cast, and clue-predicate mix a property of code, not of an author's discipline. It
does not replace hand-authoring — it gives it a randomized, always-valid starting point.

## CLI

```
npm run inquest:generate -- --difficulty <1|2|3> [--seed <number>] [--out <path>]
```

- `--difficulty <1|2|3>` — required. Gates which predicate types the generated clue set may draw
  from, via the same `predicateDifficulty.ts` table used by hand-authored cases.
- `--seed <number>` — optional. Omit it and the generator picks one and logs it (`Generated with seed
  N (rerun with --seed N to reproduce this exact case).`) — the whole pipeline is a pure function of
  the seed, so passing the logged value back reproduces the exact same case.
- `--out <path>` — optional. Writes the generated level as a `.ts` file at that path, in the same
  shape as the hand-authored files under `src/features/royal-inquest/levels/`. Without it, the file
  content prints to stdout instead.

The CLI also runs the generated definition back through `buildSolveReport` (the same report the
`inquest:solve` CLI uses) and prints a PASS/FAIL summary before exiting — a generated case that
somehow fails validation would still exit non-zero rather than silently writing a broken file (this
should never actually happen; `generateInquestDefinition` itself gates on
`validateInquestDefinition` before returning).

## Pipeline

Chamber count is picked first (`[4, 5]`), and board size AND cast size are BOTH derived as
`chamberCount + 1` — a square board where the cast fills every row and every column exactly once (a
"full-quota" cast), not a partial one. This is a load-bearing choice, not an arbitrary one — see "Why
a square, full-quota cast" below.

Five stages, each in its own file under `tools/royal-inquest-generator/`:

1. **`chamberLayout.ts`** — grows chambers via seeded region-growth (BFS-style frontier expansion)
   from `chamberCount` random seed cells on the `size x size` board until every cell is assigned —
   this is what makes chamber shapes irregular rather than rectangular. Chambers under 5 cells (the
   validator's floor) get merged into a neighbor — if that drops the count below what was requested,
   the board is no longer sized to exactly `chamberCount + 1` and the caller retries the whole layout
   rather than patching it. Each chamber gets a `TileEnvironment` restricted to `room`/`church`/
   `royalRoom` — the only environments with a seat-kind prop at all (see "Why seat-capable
   environments only" below) — capped so no environment repeats more than its own distinct
   non-span seat-asset count (`room`: 2, `church`: 1, `royalRoom`: 2), on top of a softer bias against
   repeating a neighbor's environment.
2. **`solutionAndCast.ts`**'s `chooseChamberAssignment` — *before any props exist* — searches (cheap,
   purely combinatorial) for a full row/column permutation whose chamber grouping is exactly "one
   chamber gets two cells, every other chamber gets exactly one." This decides where everyone will
   sit before deciding what's in the room.
3. **`propPlacement.ts`** — forces a seat prop (a `PropAssetId` not reused across chambers) onto each
   chamber's assigned anchor cell from step 2, then blocks 0-2 *other* cells per chamber for legal
   decorative props (filtered from `propsByEnvironment[environment]` by
   `propKindByAsset[id] === 'decorative'`), never touching a step-2 cell, avoiding repeating the same
   prop asset on two orthogonally-adjacent cells. Deliberately skips `-left`/`-right` two-cell-span
   props entirely (see "Scope cuts" below).
4. **`solutionAndCast.ts`**'s `buildCastAndSolution` — labels step 2's positions with a cast: unique
   avatar/name per occupant, the pair chamber's anchor occupant becomes traitor, its second occupant
   becomes victim.
5. **`clueGeneration.ts`** — the actual fix for the sameness problem. Builds a weighted candidate pool
   of every clue-legal predicate type (excluding `exact-row`/`exact-column`, character-pair
   `beside`/`not-beside`, and `direction-from` — see "What's excluded" below), gated by
   `predicateDifficulty.ts` against the requested difficulty, and instantiated only when the
   authored solution actually makes it true. Gives each non-victim character one anchoring clue, then
   runs a **repair loop**: re-solve with `solveInquestDefinition`/`checkVictimElimination` (the same
   author-time solver `validateInquestDefinition` uses); if under-constrained, add another true,
   legal clue; bounded retries, then bail so the caller regenerates the whole layout instead of
   looping forever on an unfixable clue set.
6. **`generate.ts`** — orchestrates 1-5, retrying the *entire* pipeline (not just a single stage) up
   to ~50 times on any stage failure, gated by a final `validateInquestDefinition` call. Throws a
   descriptive error if every attempt fails; never returns an invalid definition.

`emitLevelFile.ts` then serializes the accepted `InquestDefinition` into a `.ts` source string
matching the shape of the hand-authored files exactly, so the output is freely hand-editable
afterward, not a black box.

## Why a repair loop, not a forward solver

`solver.ts`'s backtracking search is built to *check* a clue set, not to *build* a minimal one from
scratch — turning it into a generator would mean writing a second, different CSP-minimization
algorithm. Instead, the generator works the way a human author does: place a solution first, guess a
plausible clue set (every candidate is checked true against that solution before being added, so the
clue set can never be *inconsistent* — only *under-constrained*), then use the same solver
`validateInquestDefinition` already runs as an oracle to detect under-constraint and patch it
iteratively. This reuses the existing solver exactly as-is, at the cost of being probabilistic
(bounded retries, not a guaranteed-minimal clue count) rather than deterministic-optimal.

## Why a square, full-quota cast

An earlier version of this generator picked `rows`/`columns` independently in 5-7 and cast size
independently in 4-7, per a literal reading of the original design brief. Stress-testing it directly
(running each pipeline stage thousands of times, not just relying on the 50-attempt retry budget)
showed it converges under 1% of the time at difficulty 1-2: a partial-quota cast leaves most rows and
columns unused by anyone, so even with every character's chamber pinned, the victim usually has many
legal remaining cells, not the one the elimination check requires — and there's no difficulty-1/2
predicate that can narrow a generic interior chamber cell down any further. Making cast size *equal*
to the board's row/column count fixes this structurally: once every non-victim character is placed,
every row and column except one is used, forcing the victim's cell by pure elimination, independent
of chamber shape.

## Why seat-capable environments only

Chamber membership alone doesn't pin an exact cell (see above) — the generator instead anchors each
chamber's occupant to a real single-cell fact: an `on-prop` clue against that chamber's seat.
`garden`/`kitchen`/`dungeon` have no seat-kind `PropAssetId` at all, so a character placed there could
never get this anchor; the generator restricts itself to `room`/`church`/`royalRoom`. This caps the
maximum chamber count at 5 (the combined seat-asset supply across those three environments, excluding
`-left`/`-right` variants), which is why board size tops out at 6x6 rather than 7x7 — another
deliberate departure from the original 5-7 range, made for the same solver-verified-convergence
reason as the full-quota cast above.

## What's excluded from the candidate pool (not generate-then-discard)

- `exact-row`/`exact-column` and character-pair `beside`/`not-beside` — `validateInquestDefinition`
  rejects these outright, so the generator never has them in its candidate pool at all.
- `direction-from` — always vacuous against a full row/column-permutation solution (which every
  generated case uses), per `clues-and-predicates.human.md`. Difficulty-2-legal in principle, but the
  generator never selects it since it could never be true against the authored solution.
- `-left`/`-right` two-cell-span props (`bookshelf-left/right`, `dining-table-left/right`,
  `kitchen-worktable-left/right`, `wooden-bench-left/right`, `church-pew-left/right`) — placing these
  correctly requires finding an adjacent same-chamber cell pair, a placement-model complication
  orthogonal to the clue-variety problem this generator targets. A deliberate scope cut, not an
  oversight — the generator only ever emits the plain single-cell prop asset for a given kind.
- `garden`/`kitchen`/`dungeon`/`hallway` chamber environments — never picked as a *generated* chamber
  environment (see "Why seat-capable environments only" above for the first three; `hallway`'s
  `propsByEnvironment` allow-list is effectively empty altogether). A human hand-editing generator
  output is free to repaint a chamber into any of these afterward.

## Using it as a starting point, not a final product

The recommended flow (see `.claude/skills/royal-inquest-puzzle-design/SKILL.md`):

1. `npm run inquest:generate -- --difficulty <N> --out src/features/royal-inquest/levels/<slug>.ts`
2. Hand-polish: rename chambers/characters/the case title, adjust clue wording, optionally add one
   bespoke hand-written clue on top.
3. `npm run inquest:solve -- --file src/features/royal-inquest/levels/<slug>.ts` to re-validate after
   hand edits.
4. Register the new level in `src/features/royal-inquest/levels/index.ts`.

Manual from-scratch authoring (skipping the generator entirely) is still possible — it's an
explicitly-noted escape hatch now, not the default path.

See `docs/superpowers/specs/2026-08-09-royal-inquest-level-generator-design.md` for the full design
rationale and `docs/superpowers/plans/2026-08-09-royal-inquest-level-generator.md` for the
implementation plan.
