---
name: royal-inquest-difficulty-design
description: Use whenever asked to author a Royal Inquest case at a specific difficulty tier (1/2/3), a batch of cases spanning tiers, or to re-tier an existing case. Covers the difficulty-1..3 gate itself — predicate budget per tier, how to hit a tier deliberately, and the validator check that enforces it. Pairs with royal-inquest-puzzle-design (general case authoring) — read that one for board/cast/clue mechanics, this one for the difficulty knob specifically.
---

# Royal Inquest difficulty design

Difficulty is an **author-time-only** gate on an `InquestDefinition`, not a player-facing setting and
not a board-size/cast-size knob. It exists purely to stop a case from grabbing a harder predicate than
its declared tier admits. Read
[`royal-inquest-puzzle-design`](../royal-inquest-puzzle-design/SKILL.md) first for everything else
(board, chambers, cast, victim rule) — this skill is only about picking and hitting the right tier.

## The mechanism

- `InquestDefinition.difficulty` is an integer 1-3.
- Every `InquestPredicate` type has a fixed rating (1-3) in
  `src/features/royal-inquest/predicateDifficulty.ts` (canonical source:
  `docs/royal-inquest/authoring/clues-and-predicates.cave.md` "predicate difficulty rating" — update
  the doc first, mirror the number in code second, never the reverse).
- `validateInquestDefinition` rejects any clue whose predicate rating exceeds the case's declared
  `difficulty`. Read as a **floor, not a target**: a rating-N predicate is legal in any case declaring
  difficulty N or higher, never lower. Declaring difficulty 3 does not require using any rating-3
  predicate — it just permits it.
- There is no separate board-size/cast-size/chamber-count rule tied to difficulty in the doc set. Don't
  invent one (e.g. "difficulty 3 = 6x6 board") — tier is about predicate vocabulary only, not scale.

## Current tiers (mirror `predicateDifficulty.ts` — verify against that file, don't trust a stale copy)

| Tier | Meaning | Predicates newly unlocked at this tier |
| --- | --- | --- |
| 1 | Trivial/foundational — single-character or simple pairwise facts | `exact-row`, `exact-column`, `exact-chamber`, `same-chamber`, `different-chamber`, `on-prop`, `beside`, `not-beside`, `seated-character-count` |
| 2 | Moderate — counting/positional reasoning | `direction-from`, `chamber-occupant-count`, `in-corner`, `not-beside-wall`, `shares-prop-neighbor`, `area-occupant-count`, `by-window` |
| 3 | Hard — simultaneous multi-axis or existential/negative reasoning | `category-not-beside-prop`, `diagonal-from`, `not-diagonal-from`, `offset-from`, `prop-neighbor-count` |

`exact-row`/`exact-column` are rating-1 by table but banned outright from clue authoring regardless of
tier (see `royal-inquest-puzzle-design` non-negotiables) — never reach for them even in a difficulty-1
case.

## Authoring a case at a target tier

1. Pick the tier the case should declare, set `difficulty: <N>` in the definition up front — don't
   leave it to infer after the clue list is written.
2. Build the clue list from predicates rated `N` or below only. A genuinely hard tier-3 case should
   still lean on tier-1/2 predicates for most clues and use the tier-3 ones sparingly, for the specific
   deduction that needs them — a clue list that's entirely rating-3 predicates is usually just noisy,
   not more fun.
3. A low-tier case (1) is constrained by vocabulary, not by making the puzzle logically trivial — it
   can still have a tight, unique solution; it just can't lean on multi-axis/existential predicates to
   get there. If a tier-1 clue set can't pin down a unique solution with only tier-1 predicates, that's
   a sign the cast/board needs adjusting, not a reason to sneak in a tier-2 predicate.
4. Run the solver-backed validator before calling the case done — same as any new case:
   - `npm run test:run -- definitionValidation` once registered in `levels/index.ts`, or
   - `npm run inquest:solve -- <levelId>` (or `-- --file <path>` pre-registration) for fast iteration.
   A tier mismatch shows up as a specific validator message: `Clue "<id>" uses a difficulty-<rating>
   predicate ("<type>"), which exceeds this case's declared difficulty of <N>.` — that's the signal to
   either raise the case's declared tier (if the harder predicate is truly needed) or swap the clue for
   a lower-rated predicate (if the tier should stay as declared).

## Re-tiering an existing case

Lowering `difficulty` on an existing case is a breaking change if any authored clue uses a predicate
above the new tier — the validator will catch it, but check the clue list first rather than lowering
the number and letting the test suite discover every violation one at a time. Raising `difficulty`
is always safe (existing clues stay legal) but should still reflect a real change in what the case
demands, not just a workaround for a validator failure caused by one over-tier clue.

## Authoring a batch spanning tiers

When asked for "a set of puzzles at different difficulties" rather than one case:
- Vary tier by *predicate vocabulary used*, not by board size, cast size, or chamber count — keep those
  comparable across the batch unless asked otherwise, so difficulty is the only thing that moved.
- Don't reuse the exact same clue skeleton across tiers with predicates swapped 1:1 — a tier-3 case
  should read as needing its harder predicates for a real deduction gap, not as a tier-1 case with
  decoration added.
- Validate each case independently (`npm run inquest:solve -- --file <path>` per draft) before
  registering any of them — a batch is not done until every member individually passes.

## Gap predicates (book vocabulary, no engine predicate yet)

If a design calls for a clue concept that has no `InquestPredicate` implementation yet (check
`docs/royal-inquest/authoring/murdoku-clue-catalog.cave.md`), its provisional difficulty estimate lives
only in that doc's "murdoku book glossary" gap table, marked `(NEW)` — never invent a rating for it
inline in a case definition, and never implement the predicate as part of a difficulty-authoring task
unless separately asked.
