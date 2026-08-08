# Authoring clues and predicates

> Human version. Agent version:
> [`clues-and-predicates.cave.md`](clues-and-predicates.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

This document covers every `InquestPredicate` variant, its exact evaluation semantics
(`predicates.ts`, `evaluatePredicate`), which predicates a *clue* is actually allowed to
use, and how to write an `InquestClue` against them.

## Structured predicates are the source of truth

```ts
interface InquestClue {
  id: string;
  text: string;
  predicate: InquestPredicate;
}
```

`text` is flavor shown to the player. It is **never** parsed to decide correctness — only
`predicate` is evaluated. Write `text` and `predicate` so they agree, but they are
independent pieces of data; a mismatch between them is an authoring bug validation
cannot catch for you.

Every predicate evaluates to one of three results:

```ts
type PredicateResult = true | false | 'unknown';
```

`'unknown'` means at least one referenced character isn't placed yet — the predicate is
withheld from Hint until it can be decided one way or the other.

## Predicate reference

### `exact-row` / `exact-column`

```ts
{ type: 'exact-row'; characterId: CharacterId; row: number }
{ type: 'exact-column'; characterId: CharacterId; column: number }
```

True when `characterId`'s placed row/column equals the given value; `'unknown'` if not
yet placed. **These two exist in the type system and are evaluated normally, but no
clue may use either one** — see "What a clue may not do" below.

### `exact-chamber`

```ts
{ type: 'exact-chamber'; characterId: CharacterId; chamberId: string }
```

True when `characterId`'s placed cell's `chamberId` equals `chamberId`.

### `on-prop`

```ts
{ type: 'on-prop'; characterId: CharacterId; propId: PropAssetId }
```

True when `characterId` is placed on the (single) cell in the definition whose `propId`
equals `propId`. `'unknown'` until that character is placed. This is what lets a clue
say "seated in the chair" without ever stating a coordinate or chamber — see
[board, rooms, and props](board-rooms-props.human.md) for the seat-prop model this
pairs with.

### `same-chamber` / `different-chamber`

```ts
{ type: 'same-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
{ type: 'different-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
```

`'unknown'` unless **both** characters are placed. Otherwise compares their chambers;
`different-chamber` is the exact negation of `same-chamber`, not a distance check.

### `direction-from`

```ts
{
  type: 'direction-from';
  subjectCharacterId: CharacterId;
  referenceCharacterId: CharacterId;
  direction: 'north' | 'east' | 'south' | 'west';
}
```

`'unknown'` unless both characters are placed. Otherwise:

- `north`: same column, subject's row strictly less than reference's row.
- `south`: same column, subject's row strictly greater than reference's row.
- `east`: same row, subject's column strictly greater than reference's column.
- `west`: same row, subject's column strictly less than reference's column.

Because these all require the subject and reference to share a row or column, a
solution that is a full row/column permutation (see
[character placement](character-placement.human.md)) can never make a `direction-from`
clue true for any pair — the shipped case never uses it as a real clue for exactly this
reason. A future case with a non-permutation solution could use it for real.

### `beside` / `not-beside`

```ts
{ type: 'beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
{ type: 'not-beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
```

`'unknown'` unless both characters are placed. Otherwise: adjacency is Manhattan distance
exactly 1 **and** the same chamber — crossing a chamber wall does not count as adjacent
even if the cells are physically next to each other. `not-beside` is the exact negation.

`not-beside` *is* usable against a permutation solution (unlike `beside`, which never
fires there) — the shipped case uses `aldric-not-beside-edmund` exactly this way,
since "not adjacent" is trivially true whenever two characters don't even share a row or
column, and can still be a meaningful clue combined with same/different-chamber facts.

### `diagonal-from` / `not-diagonal-from`

```ts
{ type: 'diagonal-from'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
{ type: 'not-diagonal-from'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
```

`'unknown'` unless both characters are placed. Otherwise: true when the two characters sit
exactly one row **and** one column apart — a pure coordinate relationship, like
`direction-from`, with **no** same-chamber requirement (unlike `beside`/`not-beside`).
`not-diagonal-from` is the exact negation. This is the hardest predicate in the vocabulary
(see "Predicate difficulty" below) — it requires reasoning about two axes at once, and
readers can't fall back on chamber membership the way `beside` lets them.

### `chamber-occupant-count`

```ts
{ type: 'chamber-occupant-count'; characterId: CharacterId; count: number }
```

True when exactly `count` other characters (not `characterId` itself) share its chamber
in the completed solution. This needs to know **every** other character's placement to
confirm `true` — if the already-placed others in the chamber already exceed `count`, it
decides `false` early (the count can only grow as more are placed); otherwise it stays
`'unknown'` until every other character is placed.

This subsumes "was alone" (`count: 0`). To say "alone with a specific named character
B," combine two clues: `same-chamber(a, b)` plus `chamber-occupant-count(a, 1)`.

### `in-corner`

```ts
{ type: 'in-corner'; characterId: CharacterId }
```

True when `characterId`'s cell is one of the board's four corners (row `0` or
`rows - 1`, **and** column `0` or `columns - 1`). Disjunctive — matches **any** of a set
of four cells, not one exact cell like `exact-chamber`.

### `seated-character-count`

```ts
{ type: 'seated-character-count'; count: number }
```

A global (cast-wide) quantifier — names no specific character (see "Which characters a
predicate touches" below; it returns an empty array). True when exactly `count`
characters, across the **whole cast**, are seated on a seat-kind prop cell
(`propKindByAsset[propId] === 'seat'`) in the completed solution. Same early-`false`/
stay-`'unknown'`-until-everyone's-placed logic as `chamber-occupant-count`, just counted
across every character instead of one chamber.

### `not-beside-wall`

```ts
{ type: 'not-beside-wall'; characterId: CharacterId }
```

True when none of `characterId`'s four orthogonal neighbor cells are off-board or in a
different chamber — i.e. the cell is fully interior to its chamber, with no wall
touching any side (matches the `getCellWalls` wall-drawing rule; see
[board, rooms, and props](board-rooms-props.human.md)). This is the only predicate that
relates to the chamber boundary itself rather than another character. It's decisive as
soon as `characterId` is placed — no waiting on any other character.

### `category-not-beside-prop`

```ts
{ type: 'category-not-beside-prop'; category: string; propId: PropAssetId }
```

A global/category quantifier — names no specific character. True when no character
whose `InquestCharacter.category` matches `category` is orthogonally adjacent
(Manhattan distance 1 — no same-chamber requirement, unlike `beside`) to the (single)
cell bearing `propId`. `category` is an optional field on `InquestCharacter`; a case
that never sets it simply has no character matching any `category` string, so the
predicate is vacuously true.

### `shares-prop-neighbor`

```ts
{ type: 'shares-prop-neighbor'; characterId: CharacterId; propId: PropAssetId }
```

An existential pairing — true when `characterId` is orthogonally adjacent to the
(single) cell bearing `propId` **and** at least one other (unnamed) character is also
adjacent to that same cell. "Someone else was beside the same prop" without saying who
— the second character is deliberately not returned by `getPredicateCharacterIds` (only
`characterId` is named). It's `false` immediately if `characterId` isn't even near the
prop; otherwise `'unknown'` until every other character is placed (a nearby match found
early decides `true` right away, with no need to wait).

### `offset-from`

```ts
{
  type: 'offset-from';
  subjectCharacterId: CharacterId;
  referenceCharacterId: CharacterId;
  rowOffset: number;
  columnOffset: number;
}
```

`'unknown'` unless both characters are placed. Otherwise true when
`subject.row - reference.row === rowOffset` **and**
`subject.column - reference.column === columnOffset` (south/east positive, matching
`direction-from`'s south/east sign convention). Unlike `direction-from`, this does
**not** require the pair to share a row or column — like `diagonal-from`, it stays
satisfiable against a full row/column permutation solution whenever both offsets are
nonzero. It's the strongest positional predicate in the vocabulary: an exact vector
distance, not just a direction or a fixed one-row-one-column shape.

### `prop-neighbor-count`

```ts
{ type: 'prop-neighbor-count'; propId: PropAssetId; count: number }
```

A global (cast-wide) quantifier, in the same family as `seated-character-count` — names
no specific character. True when exactly `count` characters, across the **whole cast**,
are orthogonally adjacent to the (single) cell bearing `propId` in the completed
solution. Same early-`false`/stay-`'unknown'`-until-everyone's-placed logic as
`chamber-occupant-count`. This is what lets a clue say "exactly two people stood beside
the table" without naming either of them — `shares-prop-neighbor` only proves "at least
one other," not an exact count.

### `area-occupant-count`

```ts
{ type: 'area-occupant-count'; characterId: CharacterId; count: number }
```

A direct generalization of `chamber-occupant-count`: same shape and the same
early-`false`/`'unknown'`-until-everyone's-placed logic, but scoped to a combined
chamber+area key instead of bare chamber — see `InquestCell.areaId`. When no cell in a
definition sets `areaId`, every cell's key collapses to the same "no area" value, so this
predicate behaves identically to `chamber-occupant-count` for every level that doesn't
use area tags. This is what lets a clue say "alone on the stand" (a named sub-area of a
chamber) instead of only "alone in the chamber."

### `by-window`

```ts
{ type: 'by-window'; characterId: CharacterId; propId: PropAssetId }
```

`'unknown'` until `characterId` is placed. Otherwise true when `characterId` is
orthogonally adjacent to the (single) cell bearing `propId` — the same adjacency check as
the first half of `shares-prop-neighbor`, but without needing a second (unnamed)
character nearby. Takes `propId` as a parameter (like `on-prop`,
`category-not-beside-prop`, and `shares-prop-neighbor`) rather than hardcoding a single
asset, so any edge-anchored prop could reuse this shape — not just `window`.
`definitionValidation.ts` separately requires any cell whose `propId` is `window` to sit
on the board's outer edge; see [board, rooms, and props](board-rooms-props.human.md).

## Predicate difficulty rating

**The sole canonical source for every difficulty number in this doc set** — the table
below is the only place any predicate's or book keyword's rating lives. No other table
(including "Murdoku book glossary" below, and the
[Murdoku clue catalog](murdoku-clue-catalog.human.md)) restates a number — they link back
here instead. Rating is 1-3, and it isn't a "harder predicate = higher weight" scale
stacking on top of itself — read it as a plain tier label: a clue rated N can appear in
any puzzle that declares rating N **or higher**. Fixed at authoring time, lives in
`predicateDifficulty.ts`:

| Rating | Meaning | Predicates |
| --- | --- | --- |
| 1 | Trivial/foundational fact | `exact-row`, `exact-column`, `exact-chamber`, `same-chamber`, `different-chamber`, `on-prop`, `beside`, `not-beside`, `seated-character-count` |
| 2 | Moderate counting/positional reasoning | `direction-from`, `chamber-occupant-count`, `in-corner`, `not-beside-wall`, `shares-prop-neighbor`, `area-occupant-count`, `by-window` |
| 3 | Hard multi-axis or existential reasoning | `category-not-beside-prop`, `diagonal-from`, `not-diagonal-from`, `offset-from`, `prop-neighbor-count` |

Ratings revised from the original, after a cross-check pass against the
[Murdoku book glossary](#murdoku-book-glossary-source-vocab) — `beside`/`not-beside`/
`seated-character-count` drop from 2 to 1 (a simple direct adjacency/uniqueness fact, no
harder than `on-prop`), and `shares-prop-neighbor` drops from 3 to 2 (an existential pair,
but anchored to a single prop, not multi-axis like `diagonal-from`).

Every `InquestDefinition` declares its own `difficulty: number` (also 1-3).
`validateInquestDefinition` rejects any clue whose predicate rating exceeds the case's
declared difficulty — so a case can't accidentally reach for a rating-3 predicate like
`diagonal-from` while claiming to be an easy case. In other words: a clue rated N is
usable by any puzzle rated N or higher, never lower. This is purely an authoring-time
gate; there's no player-facing difficulty selector or display.

Gap keywords (book vocabulary with no engine predicate built yet) still need their own
rating estimate somewhere for planning purposes — those live **only** in the "Murdoku
book glossary" table below (marked *(new)*), since this table is keyed by real predicate
only. No overlap: a keyword's number either lives here (it maps to a real predicate) or
there (a gap, no predicate) — never both.

## What a clue may not do

`validateInquestDefinition` rejects two shapes of clue outright, independent of the
predicate reference above:

1. **No `exact-row`/`exact-column` clue.**
   > `Clue "<id>" may not use exact-row/exact-column; use exact-chamber, direction-from,
   > beside, not-beside, same-chamber, or different-chamber instead.`

   Stating a literal coordinate is a giveaway, not a deduction — chamber membership,
   relative direction, and adjacency are the vocabulary the game is built around.
2. **No clue may name the victim.** Checked via `getPredicateCharacterIds(clue.predicate)`
   against the victim's `id`:
   > `Clue "<id>" names the victim directly; the victim's position must be derived only
   > from other witnesses.`

   See [character placement](character-placement.human.md) for the solver-backed check
   that makes sure the victim's cell is still uniquely forced by elimination despite
   never being named.

## What a clue should not do (not enforced by the validator)

Beyond the two shapes `validateInquestDefinition` rejects outright, there's a quality
rule it can't check because a redundant clue doesn't break solvability or uniqueness —
so it has to be caught by eye when authoring or reviewing a level:

- **Don't author a `different-chamber` clue between two characters who each already
  have their own `exact-chamber` clue naming a different chamber.** The pair is already
  implied, so the clue adds zero information. For example, "The Cook was seen in the
  Kitchen" plus "The Gardener tended alone in the Garden" already makes "The Cook and
  the Gardener were in different chambers" redundant — a player who reads all three
  gets nothing from the third that the first two didn't already give. `different-chamber`
  only earns its place when at least one side of the pair is *not* independently pinned
  by its own `exact-chamber` clue — i.e. it's doing real elimination work, not restating
  two clues that already ran.

## Relationship to Murdoku's official clue types

[Murdoku](https://murdoku.fans/en/how-to-play/) publishes its clue vocabulary as a small
set of categories. Our `InquestPredicate` variants map onto them one-for-one, so an
author already familiar with Murdoku can write a Royal Inquest clue on sight:

| Murdoku clue category | Our predicate | Notes |
| --- | --- | --- |
| Room/location clues | `exact-chamber` | Direct match — "seen in the Kitchen." |
| Object/prop clues (a single chair, a single plant) | `on-prop` | Direct match — the prop is unique to one cell by construction, so this doubles as Murdoku's "uniqueness clue" (see below). |
| Directional clues ("south of") | `direction-from` | Direct match in shape; see its own entry above for why the shipped cases never author it as a real (non-vacuous) clue. |
| Adjacency/"beside" clues | `beside` / `not-beside` | Direct match, including Murdoku's rule that two cells can touch physically but belong to different regions and still not count as "beside" — see `beside`'s entry above. |
| "Alone with" (victim/murderer) | The traitor rule (not a clue at all) | Direct match in meaning: the only other character left alone with the victim's chamber is the traitor. See [character placement](character-placement.human.md) and [rules.human.md](../rules.human.md#victim-and-traitor). |
| Column/row clues ("fixed rows or columns") | `exact-row` / `exact-column` — **deliberately never authored** | This is the one intentional divergence: Murdoku permits a clue that fixes a suspect to a literal row or column, but the Royal Inquest's validator rejects any clue using either predicate (see "What a clue may not do" above). A raw coordinate reads as a giveaway rather than a deduction in our presentation; the predicates stay in the engine only so hints and hand-authored `solution` checks still have a coordinate-level primitive to reason with internally. |

There is no Murdoku category for `same-chamber` (the positive form of `different-chamber`)
as a standalone clue in the published guide, but it's the natural complement of
`different-chamber` and is exercised the same way — same predicate machinery, opposite
boolean.

## Murdoku book glossary (source vocab)

Full keyword list pulled from the physical Murdoku book — the glossary page (p13) plus
case clue card scans (cases 1, 2, 3, 4, 11, 38, 39, 54, 76). Check this table first when
authoring a new clue — it's the source vocabulary every `InquestPredicate` maps against,
plus a few book terms that are still gaps (no engine predicate yet — see "Predicate
ideas not yet in the engine" below). Full provenance and raw quotes per term live in the
[Murdoku clue catalog](murdoku-clue-catalog.human.md) — this table is the condensed
version for quick lookup while writing a clue.

The engine predicate column is a clean map, keyword → predicate — either a real
`InquestPredicate` variant (look up its eval semantics and rating by name, in the section
above and the "Predicate reference" section near the top of this doc), or plain
"not implemented". The rationale for each gap lives in the Meaning column instead of
here, so this column stays scannable — one lookup per row.

Rating column only filled when a keyword has **no** engine predicate (a gap, marked
*(new)*) — mapped keywords leave it blank; look up their predicate's rating in
["Predicate difficulty rating"](#predicate-difficulty-rating) above instead. This keeps
each number from living in two places.

| Keyword | Meaning | Engine predicate | Rating (gap only) |
| --- | --- | --- | --- |
| row | Character sits in this row — `exact-row` is banned outright, see "What a clue may not do" above | not implemented | — |
| column (+ Nth, + "last") | Character sits in this column, maybe a fixed number — `exact-column` banned for the same reason | not implemented | — |
| under (a) | Lower row than a, not necessarily same room | `direction-from` (`south`) | — |
| above (a) *(inferred)* | Higher row than a, not necessarily same room | `direction-from` (`north`) | — |
| left of (a) | Same row, strictly less column than a | `direction-from` (`west`) | — |
| right of (a) | Same row, strictly greater column than a | `direction-from` (`east`) | — |
| beside | Directly up/down/left/right AND same room | `beside` | — |
| not beside (character) *(derived, engine)* | Negates "beside" — any placement not both adjacent and same-chamber. No own glossary card (book's "naast" covers both senses) | `not-beside` | — |
| not beside a wall *(derived, case 4)* | Cell is fully interior to its room | `not-beside-wall` | — |
| corner | Cell where two walls of the same room meet | `in-corner` | — |
| one of the four corners *(derived, case 76)* | Disjunctive variant of "corner" — same predicate, already disjunctive by design | `in-corner` | — |
| by a window | Cell touches a window — MVP is a single-cell decorative prop validated to sit on the board's outer edge, not the book's literal two-cell span, see [Board, rooms, props](board-rooms-props.human.md#asset-ideas-not-yet-built) | `by-window` | — |
| alone | Nobody else in the room, not even the victim | `chamber-occupant-count` (`count: 0`) | — |
| alone with (b) | Only these two people in the room | `same-chamber(a,b)` + `chamber-occupant-count(a,1)` combined | — |
| not alone *(derived, case 76)* | Negates "alone" — check the predicate supports a negated form (count != 0) before using it | `chamber-occupant-count` negated | — |
| alone on [prop area] *(derived, case 38)* | "Alone" localized to a prop-tagged area (an `InquestCell.areaId`), not the whole chamber | `area-occupant-count` (`count: 0`) | — |
| empty | Nobody in the room at all, not even the victim | `chamber-occupant-count` (`count: 0`, everyone including the victim) | — |
| no empty room *(derived, case 39)* | Global, every room at once — already an author-time invariant, see [Board, rooms, props](board-rooms-props.human.md) "no empty chamber at the solution" — not a clue predicate itself | not a clue | `n/a` |
| only person on [prop] | Nobody else sat on the same prop type — prop is unique to one cell by construction, doubling as uniqueness | `on-prop` | — |
| exactly one person on [prop-kind] *(derived, case 76)* | Global unique quantifier, cast-wide, whole prop-kind | `seated-character-count` (`count: 1`) | — |
| room/chamber | Any enclosed area | `exact-chamber` | — |
| two people stood beside a table | Exactly two adjacent to the same table, victim may be one — `shares-prop-neighbor` only does "at least one other", not an exact count of two | `prop-neighbor-count` (`count: 2`) | — |
| beside the same [prop] *(derived, case 39)* | Existential pair, second character unnamed | `shares-prop-neighbor` | — |
| room with exactly N other suspects *(derived, case 54)* | Room occupant-count, excludes self | `chamber-occupant-count` | — |
| no [category] beside [prop] *(derived, case 54)* | Global, nobody matching a category adjacent to a prop | `category-not-beside-prop` | — |
| same diagonal as (a) (or (b)) *(derived, case 38)* | One row plus one column apart — only the single-reference form is implemented, OR of two references isn't supported today | `diagonal-from` | — |
| N columns and M rows ... (a) *(derived, case 38, 76)* | Relative offset, exact vector distance — stronger than `direction-from` (direction only) | `offset-from` | — |

## Predicate ideas not yet in the engine

Murdoku's full clue vocabulary is bigger than our current `InquestPredicate` set —
captured here as future ideas, not a spec. None of these are implemented today. Discuss
and spec it (under `docs/superpowers/specs/`) before touching `predicates.ts`. Royal
Inquest already deliberately simplifies from Murdoku's full rule set (see the
`exact-row`/`exact-column` ban above) — expanding the vocabulary is a design decision,
not an automatic "the genre does it so we should too."

As of this pass, every item this list used to track is either implemented or is not
actually a clue predicate. Diagonal, occupancy count, attribute/category clues,
shared-prop pairing, the disjunctive corner set, the global uniqueness quantifier, and
"not beside a wall" were all built into `predicates.ts` in earlier passes and this list
simply wasn't pruned to match — see `diagonal-from`/`not-diagonal-from`,
`chamber-occupant-count`, `category-not-beside-prop`, `shares-prop-neighbor`,
`in-corner`, `seated-character-count`, and `not-beside-wall` above. Relative offset,
by-window, and alone-on-a-prop-area (the three genuine remaining gaps) are now
`offset-from`, `by-window`, and `area-occupant-count` respectively — see "Predicate
reference" above.

Only one item never was a clue predicate at all and stays out of scope here:

1. **No-empty-room global constraint** — "no room stayed empty" as a puzzle-level fact
   that helps solving, but isn't a clue predicate itself — it's an author-time invariant
   (every chamber gets at least one occupant at the solution), already enforced by
   `validateInquestDefinition`'s "every chamber has no occupant in the solution" check.

Two follow-ups remain open from this pass, both flagged as non-goals in
`docs/superpowers/specs/2026-08-08-royal-inquest-predicate-expansion-design.md`:

- **Real window art.** `by-window`'s `window` prop currently reuses the stone-planter
  texture as a placeholder (see [board, rooms, props](board-rooms-props.human.md)) —
  swap it once real source art exists.
- **Literal two-cell window span.** The book's window spans two grid cells; the MVP here
  is a normal single-cell decorative prop validated to sit on the board's outer edge.
  Modeling a true multi-cell prop is a separate, larger design (rendering + validation +
  authoring model changes) if it's ever worth doing.

## Which characters a predicate touches

`getPredicateCharacterIds(predicate)` returns every `CharacterId` a predicate references,
exhaustively over all variants. This is what both the victim-naming check above and hint
text use to find "the clue relevant to this character" — use it (don't hand-roll a check
against only `characterId`, which misses every pairwise predicate).

`seated-character-count` and `category-not-beside-prop` return an **empty array** — they
name no character at all (global/category scope). The victim-naming check naturally
passes these (an empty array never `includes(victimId)`); hint text falls back to a
generic "can now be placed" phrase since no clue matches a specific character.

## Writing a clue

1. Decide which fact about the solution the clue should reveal.
2. Pick the predicate variant that expresses it exactly, from the allowed set
   (`exact-chamber`, `on-prop`, `same-chamber`, `different-chamber`, `direction-from`,
   `beside`, `not-beside`, `diagonal-from`, `not-diagonal-from`, `chamber-occupant-count`,
   `in-corner`, `seated-character-count`, `not-beside-wall`, `category-not-beside-prop`,
   `shares-prop-neighbor`, `offset-from`, `prop-neighbor-count`, `area-occupant-count`,
   `by-window`) — never `exact-row`/`exact-column`, and never referencing the victim.
3. Check the predicate's difficulty weight (see "Predicate difficulty" above) against the
   case's declared `difficulty` — `validateInquestDefinition` rejects the clue otherwise.
4. Write `text` as in-world flavor that matches the predicate's meaning.
5. Run `validateInquestDefinition` (or the test suite). Unlike before, you don't have to
   manually reason through whether the clue set pins down a unique placement — the
   bundled solver (`solver.ts`) backtracks the full clue set and tells you directly if
   it's under-constrained (no solution), ambiguous (more than one solution), or
   inconsistent with the authored `solution`. It also verifies the victim's cell is
   forced by elimination once everyone else is placed. See
   [character placement](character-placement.human.md) for exactly what those checks
   require.
