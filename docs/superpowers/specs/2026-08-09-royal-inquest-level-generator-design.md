# Royal Inquest Level Generator Design

## Problem

All 5 shipped Royal Inquest levels (`src/features/royal-inquest/levels/{marrowfenChapel,ashwellManor,
thistledownMarket,wrenmoorWatchtower,hollowmereLodge}.ts`) trace back to one hand-authored template
(`marrowfenChapel` / the archived `blackwoodKeep`): a 6x6 board, one full-row/column chamber holding
the victim+traitor pair, four irregular chambers, a fixed 10-decorative/1-seat prop count, and — the
part board-shape variation (already partially fixed by a prior pass, see
`git log -- src/features/royal-inquest/levels`) does not touch — a clue set that is always exactly
one `exact-chamber` clue per non-victim character plus one `on-prop` clue on the traitor. Confirmed by
grepping `predicate: { type:` across all five level files: only `exact-chamber` and `on-prop` appear.

The engine (`types.ts`) supports 20 `InquestPredicate` variants and `predicateDifficulty.ts` rates
them 1-3, but the clue-predicate monoculture means difficulty tiers 2 and 3 have no real content
demonstrating them, and every case reads the same once you strip the flavor text. This has been an
agent-authoring failure mode, not an engine limitation: given "author a new case," an agent
consistently regresses to copying the nearest existing level's shape rather than exploring the
predicate space, because nothing forces it to.

## Goal

Build a procedural generator (`tools/royal-inquest-generator/`) that produces valid
`InquestDefinition` values with randomized board size, chamber shape/count, prop placement, cast
size, and — the actual fix — a randomized *mix* of clue predicates gated by requested difficulty,
validated end-to-end by the existing solver-backed `validateInquestDefinition` before ever being
accepted. This makes variety a property of the code path, not of an author's (or agent's) discipline.

## Non-goals

- Not touching the 5 existing shipped level files, `predicates.ts`, `RoyalInquest.tsx`, or gameplay
  rendering.
- Not adding new `PropAssetId`/`AvatarAssetId`/`InquestPredicate` values — the generator only
  recombines what `manifest.ts`/`types.ts` already export.
- Not modeling `-left`/`-right` two-cell-span props (`bookshelf-left/right`,
  `dining-table-left/right`, `kitchen-worktable-left/right`, `wooden-bench-left/right`,
  `church-pew-left/right`) — these require finding an adjacent same-chamber unblocked-or-legally-
  blockable pair and are a placement-model complication orthogonal to the clue-variety problem this
  generator targets. The generator only ever emits the plain single-cell prop asset for a given kind.
- Not authoring `exact-row`/`exact-column` or character-pair `beside`/`not-beside` clues — these are
  validator-rejected outright (`definitionValidation.ts`), so the generator excludes them from its
  candidate predicate pool entirely rather than generating-then-discarding.
- Not treating `direction-from` as a usable clue — per `clues-and-predicates.cave.md`, it's always
  vacuous against a full row/column-permutation solution (which every generated case uses, per
  `character-placement.cave.md`), so the generator never selects it even though it's difficulty-2
  legal in principle.
- Not a UI/gameplay feature — this is an authoring-time CLI tool, mirroring
  `tools/royal-inquest-solver/`.

## Pipeline

`generateInquestDefinition({ difficulty, seed })` runs five stages, each pure functions of the seeded
RNG and the definition-so-far, with a bounded-retry "repair loop" concept threaded through instead of
a single one-shot generate-and-hope:

1. **`chamberLayout.ts`** — pick a chamber count (4-5) and set `rows = columns = chamberCount + 1`
   (see "Why a square, full-quota board" below), then seeded region-growth (repeatedly pick a random
   chamber, grow it into a random unassigned orthogonal neighbor) from that many random seed cells
   until every cell is assigned to a chamber. Chambers under 5 cells (the validator's floor) are
   merged into an adjacent chamber — if that reduces the chamber count below what was requested, the
   board is no longer sized to exactly `chamberCount + 1` and the outer orchestrator retries the
   whole layout rather than patching it. Each chamber gets a random `TileEnvironment`, restricted to
   `room`/`church`/`royalRoom` (the only environments with a seat-kind prop at all — see "Why
   seat-capable environments only" below) and capped so no environment is picked more times than it
   has distinct non-span seat assets (`room`: 2, `church`: 1, `royalRoom`: 2), biased against
   repeating an environment on two orthogonally-adjacent chambers on top of that hard cap.
2. **`solutionAndCast.ts`** — *before* any props are placed: searches (cheap, purely combinatorial)
   for a full row/column permutation over the board whose chamber grouping is exactly "one chamber
   gets two cells, every other chamber gets exactly one" — the shape needed for a victim+traitor pair
   chamber plus one singly-anchored occupant per remaining chamber. This decides where everyone sits
   before deciding what's in the room, so props can be placed to match the solution instead of hoping
   a solution happens to land on wherever props ended up.
3. **`propPlacement.ts`** — forces a seat prop (a `PropAssetId` not reused across chambers) onto each
   chamber's designated anchor cell from step 2, then blocks 0-2 *other* cells per chamber for legal
   decorative props (from `propsByEnvironment[environment]` filtered to
   `propKindByAsset[id] === 'decorative'`), never touching a step-2 assignment cell, avoiding
   stamping the same `PropAssetId` on two orthogonally-adjacent cells (per the authoring checklist in
   `board-rooms-props.cave.md`). Every non-pair chamber's occupant now sits exactly on a uniquely
   identifiable seat, and the pair chamber's anchor occupant (the traitor) does too.
4. Cast labeling (still in `solutionAndCast.ts`) — assigns a unique `AvatarAssetId`/name per occupant
   from step 2's positions, marks the pair chamber's anchor occupant as traitor and its second
   (unanchored) occupant as victim.

### Why a square, full-quota board

A random *partial*-quota cast (cast size less than the board's row/column count — an earlier version
of this design) leaves most rows and columns entirely unused by anyone, so even with every non-victim
character's chamber pinned, the victim usually has many legal remaining cells, not one — the
elimination check never holds, and there's no difficulty-1/2-legal predicate that can pin a
generic interior chamber cell down further (chamber membership alone never narrows below the
chamber's cell count; that only works in the shipped hand-authored levels because their four
irregular chambers were deliberately shaped to interact with a full-board permutation). Making cast
size *equal* to the board's row/column count fixes this for free: once every non-victim character is
placed, every row and column except one is used, forcing the victim's cell by pure elimination,
independent of chamber shape.

### Why seat-capable environments only

Chamber membership alone doesn't pin an exact cell in general (see above) — the generator instead
anchors each chamber's occupant to a real single-cell fact: an `on-prop` clue against that chamber's
seat. `garden`/`kitchen`/`dungeon` have no seat-kind `PropAssetId` at all (`propsByEnvironment`), so a
character placed there could never get this anchor; the generator restricts itself to
`room`/`church`/`royalRoom`. This in turn caps the maximum chamber count at 5 (the combined seat-asset
supply across those three environments, excluding `-left`/`-right` variants per the scope cut below),
which is why board size is capped at 6x6 rather than reaching 7x7. A deliberate, documented departure
from a literal "rows/columns randomly 5-7, cast size independently 4-7" reading of the original brief,
made once solver-backed verification showed that shape essentially never converges — see "Verification
findings" below.

5. **`clueGeneration.ts`** — the core fix. For each non-victim character, weighted-randomly draw one
   anchoring predicate from the tier-legal candidate set (gated against `predicateDifficulty.ts` vs
   the requested difficulty), generate flavor `text` from `wordBanks.ts` templates, then run the
   solver (`solveInquestDefinition`/`checkVictimElimination`) as a repair loop: under-constrained (0
   or >1 solutions) adds another random legal clue; a unique solution that doesn't match the authored
   one drops/swaps the most recently added clue. Bounded retries; bails to the caller (which
   regenerates the outer layout) rather than looping forever. With the anchoring from steps 2-4 above,
   `exact-chamber` + `on-prop` alone are already usually enough to reach a unique, victim-eliminable
   solution at difficulty 1 — the repair loop's real job is patching the occasional gap, not carrying
   the whole puzzle.
6. **`generate.ts`** — orchestrates 1-5, retrying the *entire* pipeline (not just one stage) up to
   ~50 attempts on any stage failure, with a final gate of `validateInquestDefinition` before
   returning. Never returns an invalid definition — throws descriptively once attempts are exhausted.

### Verification findings (why the pipeline above isn't the original single-pass design)

The first implementation attempt picked `rows`/`columns` independently in 5-7, chamber count
independently in 3-5, and cast size independently in 4-7 (all per the original brief), then placed
props and picked a random solution afterward. Stress-testing that version directly (running each
stage thousands of times outside the CLI, not just relying on the 50-attempt retry budget) showed it
converges essentially never at difficulty 1-2 — under 1% of attempts — because (a) a partial-quota
cast leaves the victim's cell under-constrained no matter how many clues get added, since chamber
membership caps out with no positional information left to add at low difficulty, and (b)
independently-random seat placement per chamber collides across chambers (two chambers landing on the
same row or column, or — worse — sharing a seat asset id, breaking `on-prop`'s uniqueness
requirement) far more often than intuition suggests. The square/full-quota-cast/seat-anchored/
seat-capacity-capped design above was arrived at by measuring failure rates at each pipeline stage
directly and fixing whichever stage dominated the failures, in this order: partial→full-quota cast
(cast-fail rate), seat-capacity capping (a `clue-fail` cause hiding inside what looked like a cast
success), and finally reordering solution-before-props (the last `cast-fail` cause, a birthday-
collision problem no amount of retrying could reliably beat). The result converges essentially always
within the 50-attempt budget (verified: 20/20 across seeds 1-20 spanning all three difficulties).

`emitLevelFile.ts` then serializes an accepted `InquestDefinition` back into a `.ts` source string
matching the shape of the 5 hand-authored level files exactly (same imports,
`decorativePropsByPosition`/`seatPropsByPosition`/`propsByPosition`/`blockedCells`,
`chamberByPosition` 2D literal, `chamberEnvironments`/`chamberNames`, `cells` via `.flatMap`,
`solution` record, trailing `export const <camelId>: InquestDefinition = {...}`), so the output is
freely hand-editable by a human or agent afterward — the generator produces a starting point, not a
black box.

## Why a repair loop instead of constraint-solving forward

The engine's own solver (`solver.ts`) is a backtracking constraint solver, not a puzzle *generator* —
running it forward to build a minimal clue set from scratch would mean re-deriving a whole CSP
minimization algorithm. Instead, the generator works like a human author: place a solution first,
guess a plausible clue set, then use the existing solver as an oracle to detect under/over-
constraint and iteratively patch. This reuses `solver.ts` exactly as `validateInquestDefinition`
already does (author-time only, never called at runtime) instead of building a second solving
strategy, at the cost of being probabilistic (bounded retries, not a guaranteed-minimal clue count).

## Word banks

`wordBanks.ts` holds pools per `TileEnvironment` (chamber name fragments), character role/avatar
pairs (varied across the `AvatarAssetId` set), case title fragments, and one flavor-text template per
predicate type — sized so that repeats across a handful of seeds are rare, without attempting to be
exhaustive prose generation.

## CLI

`tools/royal-inquest-generator/cli.ts` mirrors `tools/royal-inquest-solver/cli.ts`'s shape:
`--difficulty <1|2|3>` (required), `--seed <number>` (optional — random + logged if omitted), `--out
<path>` (optional — stdout if omitted). Runs `generateInquestDefinition` then `emitLevelFile`, and
prints a PASS/FAIL report reusing `buildSolveReport` from the existing solver tool.

## Testing

`generate.test.ts` runs `generateInquestDefinition` across 20+ seeds spanning all three difficulties
and asserts: every result passes `validateInquestDefinition` with zero issues; board dimensions vary
across seeds; the aggregated set of predicate types used across all seeds includes more than just
`exact-chamber`/`on-prop`; chamber shapes (cell-to-chamber assignment) differ across seeds.

## Downstream skill change

`.claude/skills/royal-inquest-puzzle-design/SKILL.md` is rewritten so "where a new case lives"
recommends running `npm run inquest:generate -- --difficulty <N> --out <path>` first and hand-
polishing the result, rather than authoring a case from scratch by default (manual authoring becomes
an explicitly-noted escape hatch). See
`docs/royal-inquest/authoring/level-generator.human.md`/`.cave.md` for the authoring-facing doc this
links to.
