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
