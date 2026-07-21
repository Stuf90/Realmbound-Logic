# Authoring clues and predicates

> Human version. Agent version:
> [`clues-and-predicates.cave.md`](clues-and-predicates.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

This document covers every `InquestPredicate` variant, its exact evaluation semantics
(`predicates.ts`, `evaluatePredicate`), and how to write a `InquestClue` against them.

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
withheld from Check Progress until it can be decided one way or the other.

## Predicate reference

### `exact-row`

```ts
{ type: 'exact-row'; characterId: CharacterId; row: number }
```

True when `characterId`'s placed row equals `row`. `'unknown'` if not yet placed.

### `exact-column`

```ts
{ type: 'exact-column'; characterId: CharacterId; column: number }
```

Same as `exact-row`, for columns.

### `exact-chamber`

```ts
{ type: 'exact-chamber'; characterId: CharacterId; chamberId: string }
```

True when `characterId`'s placed cell's `chamberId` equals `chamberId`.

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
clue true for any pair — `blackwoodKeep` never uses it as a real clue for exactly this
reason; it's exercised only by synthetic placements in unit tests. A future case with a
non-permutation solution could use it for real.

### `beside` / `not-beside`

```ts
{ type: 'beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
{ type: 'not-beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
```

`'unknown'` unless both characters are placed. Otherwise: adjacency is Manhattan distance
exactly 1 **and** the same chamber — crossing a chamber wall does not count as adjacent
even if the cells are physically next to each other. `not-beside` is the exact negation.

Same permutation caveat as `direction-from`: a full row/column permutation solution means
no two characters are ever adjacent, so `beside`/`not-beside` are only meaningfully
usable as clues against a non-permutation solution.

## Which characters a predicate touches

`getPredicateCharacterIds(predicate)` returns every `CharacterId` a predicate references,
exhaustively over all variants. This is what hint text uses to find "the clue relevant to
this character" — use it (don't hand-roll a check against only `characterId`, which
misses every pairwise predicate).

## Writing a clue

1. Decide which fact about the solution the clue should reveal.
2. Pick the predicate variant that expresses it exactly — prefer the most specific one
   (`exact-chamber` over a `same-chamber` clue with an already-placed character, if the
   chamber itself is the fact).
3. Confirm the predicate evaluates to `true` against `InquestDefinition.solution` — there
   is no automated check for this; a clue that's false against the authored solution is
   an unsolvable puzzle.
4. Write `text` as in-world flavor that matches the predicate's meaning. Keep row/column
   references 1-indexed in text even though the data is 0-indexed (row index `0` reads as
   "the first row").
5. As a set, the case's clues plus the structural rules (row/column uniqueness, legal
   cells, victim/traitor chamber) must together pin down exactly one placement — the
   authored `solution`. There's no solver bundled in this repo to verify uniqueness
   automatically; check it by reasoning through the clue set by hand, or by confirming no
   other permutation of the six characters onto legal cells also satisfies every clue.
