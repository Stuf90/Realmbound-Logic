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
withheld from Check Progress/Hint until it can be decided one way or the other.

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

## Which characters a predicate touches

`getPredicateCharacterIds(predicate)` returns every `CharacterId` a predicate references,
exhaustively over all variants. This is what both the victim-naming check above and hint
text use to find "the clue relevant to this character" — use it (don't hand-roll a check
against only `characterId`, which misses every pairwise predicate).

## Writing a clue

1. Decide which fact about the solution the clue should reveal.
2. Pick the predicate variant that expresses it exactly, from the allowed set
   (`exact-chamber`, `on-prop`, `same-chamber`, `different-chamber`, `direction-from`,
   `beside`, `not-beside`) — never `exact-row`/`exact-column`, and never referencing the
   victim.
3. Write `text` as in-world flavor that matches the predicate's meaning.
4. Run `validateInquestDefinition` (or the test suite). Unlike before, you don't have to
   manually reason through whether the clue set pins down a unique placement — the
   bundled solver (`solver.ts`) backtracks the full clue set and tells you directly if
   it's under-constrained (no solution), ambiguous (more than one solution), or
   inconsistent with the authored `solution`. It also verifies the victim's cell is
   forced by elimination once everyone else is placed. See
   [character placement](character-placement.human.md) for exactly what those checks
   require.
