# Murdoku Clue Catalog — Raw From Book

> Human version. Agent version: `murdoku-clue-catalog.cave.md`.
> Back to [Royal Inquest rules](../rules.human.md).

Full list of every clue type observed in the murdoku book scan
([reference index](../reference/murdoku-book.human.md)) — the keyword glossary page (p13)
plus 7 case examples (case 1, 2, 3, 4, 11, 38, 39, 54, 76). The source book is in Dutch;
everything below is translated to English. This is a pure catalog of the book's clue
vocabulary, not yet mapped to the engine's `InquestPredicate` types.

Cross-check against [Clues + Predicates](clues-and-predicates.human.md) separately — that
doc covers the engine side (predicates already implemented, plus the rating table).

**Difficulty rating doesn't live here.** The sole canonical rating table is
[Predicate difficulty rating](clues-and-predicates.human.md#predicate-difficulty-rating)
(mapped keywords/predicates) plus that same doc's "Murdoku book glossary" table (gap
keywords with no engine predicate yet). This catalog file stays pure book vocabulary and
case citations only — no number repeated here, to avoid the two copies drifting apart.

## Keyword glossary (p13)

| Keyword | Meaning |
| --- | --- |
| row | Character sits in this row |
| column | Character sits in this column |
| Nth column, literal number | Character sits in an exact, fixed board-wide column number |
| under (a) | Lower row than a, not necessarily the same room |
| above (a) *(inferred)* | Higher row than a, not necessarily the same room — no own glossary card in our p13 scan (only "under" shown), but the word itself is used directly in case 38's offset clue. Symmetric opposite of "under", same logic just flipped direction. Treated as a real keyword — either our photo missed its card, or the book never gave it a separate one and assumes it's obvious from "under". |
| left of (a) / right of (a) | Same row, strictly less/greater column than a |
| beside | Directly up/down/left/right AND in the same room |
| not beside (character) *(derived, engine)* | Negates "beside" — any placement not both adjacent and same-chamber. No own glossary card (book's "naast" covers both senses), but the engine has a separate `not-beside` predicate |
| not beside a wall *(derived, case 4)* | Cell is fully interior to its room, touches no wall on any side — no own glossary card, but a direct clue phrase from case 4 |
| corner | Cell where two walls of the same room meet |
| one of the four corners *(derived, case 76)* | Disjunctive variant of "corner" — matches ANY of the four corner cells, not one fixed cell |
| by a window | Cell touches a window (edge-only prop, spans two cells) |
| alone | Nobody else in the room, not even the victim |
| alone with (b) | Only these two people were in the room |
| not alone *(derived, case 76)* | Negates "alone" — at least one other person shares the room |
| alone on [prop area] *(derived, case 38)* | "Alone" localized to a prop-tagged area (e.g. "the stand"), not the whole room |
| empty | Nobody in the room at all, not even the victim |
| no empty room *(derived, case 39)* | Global, board-wide — negates "empty" across EVERY room at once, not one named room |
| only person on [prop] | Nobody else sat on that same prop type, not even the victim (chair, rug, at a table, etc.) |
| exactly one person on [prop-kind] *(derived, case 76)* | Global unique quantifier, cast-wide, scoped to an entire prop-kind (e.g. "chair") rather than a single prop cell — the biggest departure from "only person on [prop]", which stays scoped to one prop cell |
| room/chamber | Any enclosed area — includes alleys, jacuzzis, etc. |
| two people stood beside a table | Exactly two people were adjacent to the same table; the victim may be one of the two |
| beside the same [prop] *(derived, case 39)* | Existential pair — one named character is beside a prop, and a second, unnamed character is also beside that same prop |
| room with exactly N other suspects *(derived, case 54)* | Room occupant-count, exact number, excludes self |
| no [category] beside [prop] *(derived, case 54)* | Global — nobody matching a category (e.g. gender) is adjacent to a named prop, anywhere on the board |
| same diagonal as (a) (or (b)) *(derived, case 38)* | One row AND one column apart from the reference; disjunctive variant allows OR of two reference characters |
| N columns and M rows left/right above/under (a) *(derived, case 38, 76)* | Relative offset — exact vector distance on both axes, stronger than plain under/above/left/right (direction only) |

## Case-derived clue types (beyond the glossary)

Pulled from actual clue card text across case 1/2/3/4/11/38/39/54/76 — source book is
Dutch, gloss below is English only:

| # | English gloss | Note |
| --- | --- | --- |
| 1 | Sat on the bed. | Occupies a specific seat prop |
| 2 | Was in front of a window. | Same as glossary's "by a window", phrase variant |
| 3 | Was beside a plant. | Beside a named prop (decorative) |
| 4 | Was in the hall. | Named-room clue |
| 5 | Was on the rug. | Occupies the rug (a seat-kind floor prop) |
| 6 | The victim. Lay in the last remaining cell. | The victim is never named directly — position is forced only by elimination |
| 7 | Was in the kitchen. | Named-room clue, variant |
| 8 | Was beside a TV. | Beside a named prop |
| 9 | Sat in the chair. | Occupies a chair, phrase variant |
| 10 | Beside a plant AND sat on a bed. | Compound — two facts stacked on one card |
| 11 | Was NOT beside a wall. | Negative wall-adjacency — cell fully interior to its room |
| 12 | Was in a corner. | Corner, phrase variant |
| 13 | Was in a corner, under Benjamin. | Compound — corner + relative-row stacked |
| 14 | Was in the third column. | Literal fixed column number |
| 15 | Was beside the cabinet. | Beside a named prop; a new prop (cabinet/closet) |
| 16 | The TV was in his column, in a different room. | Links a prop to a character's coordinate, cross-room, without naming prop-adjacency |
| 17 | Was down-left (diagonal) of the TV, in the same room. | Prop + diagonal direction combined |
| 18 | Was one column and two rows up-left of Anatoly. | Relative offset — exact vector distance, not just direction |
| 19 | Was alone in the hall with exactly two men. | Alone + occupant-count + category filter (gender) combined |
| 20 | Was alone on the stand. | "Alone" localized to a prop-tagged area, not the whole room |
| 21 | Was on the same diagonal as Anatoly OR Boris. | Diagonal, disjunctive (OR of two reference characters) |
| 22 | Beside a plant, right of Dina. | Compound — prop-adjacency + relative direction stacked |
| 23 | Was in the lounge. | Named-room, variant |
| 24 | Was in toilet A. | Names a sub-room (letter-suffix variant of the same room type) |
| 25 | Was on the bottom row. | Literal fixed row (board edge, not relative to a character) |
| 26 | Left of Eduardo AND did not sit on a chair. | Compound — relative direction + negative occupy-prop |
| 27 | Beside a TV. Someone else was also beside the same TV. | Existential pair, second character unnamed |
| 28 | There was no empty room. | Global board-wide constraint, not tied to one character |
| 29 | Was under Gisele, in a different room. | Relative row, explicitly allows cross-room |
| 30 | Was in the 6th column, in the big bedroom. | Compound — literal column + named-room stacked |
| 31 | Was in a room with exactly two other suspects. | Room occupant-count (excludes self) |
| 32 | Sat on a chair OR on a bed. | Occupy-prop, disjunctive (OR of two prop types) |
| 33 | There were no women beside the tables. | Global category-excluded-from-prop constraint (gender) |
| 34 | Was the only person on a bed. | Only-person-on-prop, variant prop (bed) |
| 35 | Was beside a door. | Beside a named prop; a new prop (door) |
| 36 | Was in the big bedroom. Not beside a door. | Compound — named-room + negative prop-adjacency |
| 37 | Was in the last column. | Literal fixed column, relative-to-board-edge phrasing (not a number) |
| 38 | Was in the living room. He was not alone. | Compound — named-room + negative-alone (occupant count >= 1 other) |
| 39 | Beside a bed. Not beside Edith. | Compound — prop-adjacency + not-beside(character) stacked |
| 40 | Was alone AND beside a door. | Compound — alone + prop-adjacency stacked |
| 41 | Was in one of the four corners of the floor plan. | Disjunctive corner set (matches glossary "corner", explicit four-way phrasing) |
| 42 | Four rows under him, in the hall, was a male suspect. | Relative offset (row-only, literal distance) + category filter + named-room combined |
| 43 | Exactly one person sat on a chair. | Global unique quantifier, cast-wide, scoped to a prop-kind |
| — | The victim. Was together with the murderer. | Standard victim-card footer in every case — not a clue, it's the traitor-rule statement |

## Rough pattern groups (pre-difficulty)

Grouping #1-43 above into rough shape families to help the next step (difficulty
assignment) sort faster. **Not final** — just a sorting aid:

1. **Position fact, single character** — row, column (including literal number + "last"/
   "bottom" edge phrasing), named-room, corner, by-window, beside-prop (named + negated),
   occupy-prop (named + negated + disjunctive OR), not-beside-wall.
2. **Relation, two characters** — under/left/right (relative direction), diagonal
   (including disjunctive OR), relative offset (exact vector distance),
   not-beside(character).
3. **Room-level fact** — alone, alone-with(b), not-alone, empty, occupant-count (exact N
   others), alone-on-prop-area (localizes "alone" to a prop tag).
4. **Prop-link, unnamed second party** — beside-same-prop (existential pair),
   two-people-beside-table (exact-count pair), prop-in-character's-column
   (prop-to-coordinate link).
5. **Global / cast-wide** — no-empty-room, category-excluded-from-prop (gender etc.),
   global-unique-quantifier (exact N cast-wide on a prop-kind).
6. **Compound (stacks two+ facts on one card)** — see #10, #13, #17, #22, #26, #30, #36,
   #38, #39, #40, #42 — any fact from groups 1-5 can stack with another on the same card.
   Treat this as a combination, not a new primitive — the catalog only tracks primitives;
   compounding is an authoring choice layered on top.
7. **Victim-specific** — last-remaining-cell (position never named directly),
   alone-with-murderer (traitor rule, standard footer in every case, not a clue predicate
   at all).

## Next step

Difficulty rating is now live, but not in this file — see
[Predicate difficulty rating](clues-and-predicates.human.md#predicate-difficulty-rating)
(mapped keywords) plus that doc's "Murdoku book glossary" table (gap keywords, marked
*(new)*). Still open:

- The #1-43 case-derived list (below the glossary) doesn't yet have its own rating — most
  map directly onto one glossary keyword (inheriting its rating from the canonical
  table), but compound entries (group 6, #10 etc.) stack two or more keywords — how
  compound rating combines (max? sum? its own rule?) is still an open question.
- Gap-keyword ratings are estimates only, with no engine predicate yet to validate
  against — revisit once any of them get built.

Agent version: `murdoku-clue-catalog.cave.md`
