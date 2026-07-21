# The Royal Inquest — Rules

> Human version. Agent version: [`rules.cave.md`](rules.cave.md).

The Royal Inquest is a spatial, Murdoku-style placement puzzle: the player places every
character on a board of chambers so that all clues hold at once. This document is the
canonical **game rules** — how a finished case is played and judged. It does not cover
how to author new content; that logic lives in the sub-docs linked at the bottom.

## Board

- The board is a grid of `rows x columns` cells (`InquestDefinition.rows/columns`).
- Every cell belongs to exactly one **chamber** (`chamberId`), a named room with a
  visible boundary and label. Chambers group cells; they are not a separate grid.
- Some cells are **blocked** — impassable. No character can ever occupy a blocked cell.
  A blocked cell may hold a **decorative** prop (a bookshelf, a dungeon cage, ...).
- Every unblocked cell is legal for **any** character — there is no per-cell character
  restriction. An unblocked cell may hold a **seat** prop (a chair, a bench, a pew, a
  throne); a character can be placed on a seat cell exactly like any other unblocked
  cell, and the prop renders underneath their portrait.

## Characters

- A case has a fixed cast of characters, each with a name and portrait.
- Exactly one character is the **victim**.
- Exactly one character is the **traitor**, decided by where everyone ends up (see
  "Victim and traitor" below) — not authored as an independent fact for the player to
  place.
- No clue ever names the victim directly. The victim's cell can only be reached by
  elimination, from clues about everyone else.

## Placement rules

A finished placement is only valid when **all** of the following hold:

1. **One character per row.** No two characters share a row.
2. **One character per column.** No two characters share a column.
3. **Unblocked cell only.** A character occupies only an unblocked cell.
4. **Every clue is satisfied.** See "Clues" below.
5. **The victim/traitor condition holds** (see below).

Rows and columns increase top-to-bottom and left-to-right, 0-indexed internally
(1-indexed in clue text, e.g. row index `0` is "the first row").

## Chambers and adjacency

- **Same chamber** — two characters occupy cells with the same `chamberId`.
- **Different chamber** — the opposite.
- **Beside** — two characters are orthogonally adjacent (Manhattan distance 1) **and**
  in the same chamber. Adjacency across a chamber boundary does not count as "beside".
- **Not beside** — the negation of "beside": any placement that is not both adjacent and
  same-chamber.

## Clues

Every clue is a structured predicate, not free text — the sentence shown to the player
is flavor, and is never parsed to decide correctness. See
[`authoring/clues-and-predicates.human.md`](authoring/clues-and-predicates.human.md) for
the full predicate list, which predicates a clue is actually allowed to use, and the
exact semantics of each one.

A clue can be in one of three states while the player is still placing characters:

- **satisfied** — true given the current (possibly partial) placement;
- **violated** — definitely false already, regardless of what's still unplaced;
- **undetermined** — cannot yet be decided because a needed character isn't placed.

Only definite violations are ever reported before the puzzle is complete — the player is
never told a clue is wrong when it's merely still unknown.

## Victim and traitor

The traitor is not an independent placement fact — it falls out of everyone else's
position:

> The traitor is the only non-victim character sharing the victim's chamber, when no
> third character is also present there.

In other words: at completion, the victim's chamber must contain exactly two solved
occupants — the victim and the traitor — and no one else. This is also enforced at
authoring time by elimination: once every character but the victim is placed, exactly
one unblocked cell must remain open to the victim, and its chamber's only other occupant
must be the traitor. See [character placement](authoring/character-placement.human.md).

## Completion

A case is complete only when:

- all characters are legally placed (rule 3 above);
- row and column uniqueness holds (rules 1–2);
- every clue is satisfied (rule 4);
- the victim/traitor condition holds (rule 5);
- every character sits on the puzzle's authored solution cell.

The last point matters even though the structural rules above are also checked
independently: a case can have exactly one authored solution, and completion requires
reaching it, not merely satisfying every rule in the abstract (the puzzle is authored so
those coincide, and authoring itself is verified to have exactly one valid solution —
see "Creating new content" below).

## Tools available to the player

- **Place** — put the selected character on an unblocked cell. This commits the
  character there; placing over a tile removes any draft note left on that specific tile
  for that character (see Note/Draft below), and satisfies/violates clues and row/column
  uniqueness for real. Placing into a row or column another character already occupies
  is rejected and briefly flashes the attempted cell red.
- **Note/Draft** — mark a cell as a possible candidate for the selected character
  without committing to it. Unlike Place, the same character can be drafted onto
  multiple cells at once, as a scratchpad of "maybe here" hypotheses; each drafted cell
  shows the character's first-name initial, smaller than the avatar/prop art. Note and
  Place share one toolbar slot: while not drafting, that button reads "Note" and starts
  a draft; while drafting, it reads "Place" and returns to placement mode.
- **Cross** — manually mark a cell as impossible for the player's own bookkeeping. This
  is independent from the game's own auto-crossed cells (cells the game already marks
  unavailable because another placed character shares their row or column) and is never
  cleared automatically when those auto-crossed cells change. Clicking an already-marked
  cell again removes the cross — except a manual cross cannot be removed while its row
  or column still holds a placed character, since the game's own auto-cross would
  immediately re-mark it anyway.
- **Hint** — reports an existing contradiction first (illegal placement, duplicate row,
  duplicate column, violated clue, a character with no legal cell left, or an invalid
  victim/traitor chamber); otherwise offers one deterministic deduction with its
  reasoning, and optionally offers to apply it.
- **Reset** — erase all placements, drafts, and crosses and start the case over, after
  confirming.

## Creating new content

The rules above describe how a finished Royal Inquest case is played and judged. To
author a **new** case (a new board, cast, chamber layout, prop set, or clue list), see:

- [Board, rooms, and props](authoring/board-rooms-props.human.md) — grid, chambers, room
  identity, and prop placement rules.
- [Character placement](authoring/character-placement.human.md) — cast, solution
  constraints, the victim/traitor authoring rule, and the solver-backed uniqueness check
  every case must pass.
- [Clues and predicates](authoring/clues-and-predicates.human.md) — every predicate
  type, which ones a clue may actually use, and how to write a clue against them.
