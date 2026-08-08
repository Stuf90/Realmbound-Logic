# Murdoku book — reference scan

> Human version. Agent version: `murdoku-book.cave.md`.
> Back to [Royal Inquest rules](../rules.human.md).

23 photos of a physical Murdoku puzzle book (Dutch), saved under `murdoku-book/`. Rule
pages and worked puzzle examples, the same source material referenced from
[the Murdoku relation section](../rules.human.md#relation-to-murdoku) of the rules doc.
This is reference material only — not authoritative over the engine code, just
inspiration and a cross-check when authoring a new case or extending the predicate
vocabulary.

## File index

Rule / tutorial pages:

| File | Content |
| --- | --- |
| `tutorial-intro-goal-rules-firststeps.jpg` | Goal statement ("Samengevat" rules summary) plus the start of the walkthrough tutorial case (Vico is the victim, Charlotte/Brian/Alain are suspects, 4x4 board) |
| `p10-tutorial-elimination-technique.jpg` | Tutorial continues — shows the row/column cross-out elimination technique |
| `p11-tutorial-murderer-identification.jpg` | Tutorial continues — how the final murderer is identified by elimination (Alain is the only one left alone with Vico) |
| `p12-prop-legend-advanced-tips.jpg` | Object legend: "can be occupied" (chair, rug, bed) vs "cannot be occupied" (table, TV, plant, bookcase, box) plus the window's special edge-only rule, and advanced solving tips |
| `p13-clue-keyword-glossary.jpg` | Full clue keyword glossary — row/column/beside/corner/alone/alone-with/under/left-right-of/room/by-a-window/empty/two-people-beside-a-table/only-person-on-a-chair |

Standalone puzzle cases (clue card photo + separate board photo):

| Case | Clue file | Board file | Note |
| --- | --- | --- | --- |
| 1 — Je eerste zaak (p6) | `p06-case01-first-case-clues.jpg` | *(board page not photographed)* | 6 characters, simple clue set |
| *(unknown case, p16 not photographed)* | *(not photographed)* | `p17-board-hal-woonkamer-eetkamer-slaapkamer.jpg` | Board only, 4 chambers |
| 2 — Vakantiehuisje (p18-19) | `p18-case02-vakantiehuisje-clues.jpg` | `p19-case02-vakantiehuisje-board.jpg` | 7 characters, 4-chamber rectangular board |
| 3 — Engels ontbijt (p21) | `case03-engels-ontbijt-clues.jpg` | `p21-case03-engels-ontbijt-board.jpg` | 7 characters, 5 chambers, irregular shapes |
| 4 — Vier ramen (p23) | `case04-vier-ramen-clues.jpg` | `p23-case04-vier-ramen-board.jpg` | 7 characters, 4-quadrant board, window-per-chamber clue focus |
| 11 — Afvalscheidingsstation (p36-37) | `p36-case11-afvalscheidingsstation-clues.jpg` | `p37-case11-afvalscheidingsstation-board.jpg` | 9 characters, introduces "big rock" (occupiable) vs "rubble" (blocking) prop pair |
| 38 — Het schaaktoernooi (p90-91) | `p90-case38-schaaktoernooi-clues.jpg` | `p91-case38-schaaktoernooi-board.jpg` | Advanced — diagonal clue, relative-offset clue, count-based "alone with exactly two" clue, curved room shape, multi-cell chess-table prop |
| 39 — Het concert (p92-93) | `p92-case39-concert-clues.jpg` | `p93-case39-concert-board.jpg` | Advanced — shared-prop-without-naming-the-pair clue ("beside the same TV"), a global "no empty room" constraint note, a fully-blocked non-occupiable chamber (the "Toneel" stage) |
| 54 — Het huis van de tuinman (p122-123) | `p122-case54-tuinman-clues.jpg` | `p123-case54-tuinman-board.jpg` | Advanced — gender/attribute clue ("no women beside the tables"), occupancy-count clue ("a room with exactly two other suspects"), combined below + different-chamber clue |
| 76 — Het landgoed (p166-167) | `p166-case76-landgoed-clues.jpg` | `p167-case76-landgoed-board.jpg` | Advanced, 13 characters — global-uniqueness quantifier clue ("exactly one person sat on a chair"), disjunctive "one of the four corners" clue, a "door" blocking-prop legend entry, 10-chamber board |

## Predicate ideas not yet in the engine

Cross-checked against [clues and predicates](../authoring/clues-and-predicates.human.md).
Our current `InquestPredicate` set already covers Murdoku's core clue vocabulary (see
the "relate to Murdoku" table in the rules doc). The advanced cases (38, 39, 54, 76)
show clue shapes that **no** current predicate variant models — captured here as future
ideas, not a spec:

1. **Diagonal** — "is on the same diagonal as X" (case 38). Our solution model is a full
   row/column permutation (see the `direction-from` entry in the rules doc), so a
   diagonal relation may never be satisfiable for the same reason `direction-from`
   never fires — needs checking before adoption.
2. **Relative offset** — "one column and two rows up-left of X" (case 38). Stronger than
   `direction-from` (exact distance, not just direction) — likely has the same
   permutation-solution caveat.
3. **Occupancy count** — "a room with exactly two other suspects" (case 54), "alone with
   precisely two men" (case 38) — counts how many other characters share a chamber, an
   exact number. Needs to know **every** chamber occupant to evaluate (not just two
   named characters like `same-chamber`) — a different evaluation shape from anything
   we have today.
4. **Attribute/category clue** — "no women beside the tables" (case 54) — requires the
   cast to carry gender (or another category) metadata, and a predicate over a
   **group**, not a named individual. Royal Inquest's cast data has no such field
   today.
5. **Shared-prop pairing (unnamed)** — "someone else was beside the same TV" (case 39) —
   links two characters via a shared prop without naming the second character directly
   (existential, not pairwise). `on-prop` today only pins one named character to a
   prop; there's no "someone else too" form.
6. **Disjunctive corner set** — "was in one of the four corners of the floor plan" (case
   76) — true if the cell matches **any** of a set of positions, not one exact cell.
   Would need an or-of-`exact-chamber`-like construct, or a new `in-corner` predicate.
7. **Global uniqueness quantifier** — "exactly one person sat on a chair" (case 76) —
   constrains a count across the **entire cast**, not a pair/chamber scope. The biggest
   departure from our current per-character/per-pair predicate shape.
8. **"Not beside a wall"** — "was not beside a wall" (case 4) — relates to the chamber
   boundary, not another character. No equivalent today (`beside`/`not-beside` are both
   character-to-character only).
9. **Door as a blocking prop** — the case 76 board legend shows a "door" decorative
   blocking-prop type, distinct from the existing `dungeon-cage`/`bookshelf`/etc. —
   just a new asset, not a new predicate, slots straight into the existing
   `decorative` prop model
   ([board, rooms, props](../authoring/board-rooms-props.human.md)).
10. **No-empty-room global constraint** — cases 39/54 note "there was no empty room" as
    a puzzle-level fact that helps solving, but it isn't a clue predicate itself — more
    of an authoring-time invariant (every chamber gets at least one occupant at the
    solution).

None of the above are implemented today. Treat this as a backlog idea list — discuss
and spec it (under `docs/superpowers/specs/`) before touching `predicates.ts`. Royal
Inquest already deliberately simplifies from Murdoku's full rule set (see the rules
doc's `exact-row`/`exact-column` ban) — expanding the vocabulary is a design decision,
not an automatic "Murdoku does it so we should too."

## Other observations

- **Seat/blocking prop split matches exactly.** The book's page 12 legend ("can be
  occupied" vs "cannot be occupied") is the same binary as our `propKindByAsset`
  seat/decorative split — confirms our model follows the source material correctly.
- **Window (raam) edge-only rule.** The book notes that a window only sits on the
  board's outer edge, spanning exactly two grid cells. We have no window prop asset or
  edge-adjacency constraint today — case 4 ("Vier ramen") builds its whole case around
  this. Flagging for later if we ever want a window-flavored clue.
- **Clue glossary (p13) doubles as a QA checklist.** Every keyword row maps cleanly to
  an existing predicate except items #6-9 above — a good quick cross-check next time
  `clues-and-predicates.human.md` gets reviewed for gaps.

Agent version: `murdoku-book.cave.md`
