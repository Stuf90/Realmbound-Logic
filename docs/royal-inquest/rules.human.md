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
- Some cells are **blocked** — impassable scenery (a prop, or otherwise unusable). No
  character can ever occupy a blocked cell.
- Some plain (unblocked, prop-free) cells carry a **legal-character restriction**
  (`legalCharacterIds`): only the listed character(s) may occupy that cell. A cell with
  no restriction — including every cell that holds a prop — is legal for any character.
  A prop cell is never restricted to specific characters: it either allows everyone
  (before accounting for it being blocked) or, being blocked, allows no one.

## Characters

- A case has a fixed cast of characters, each with a name and portrait.
- Exactly one character is the **victim**.
- Exactly one character is the **traitor**, decided by where everyone ends up (see
  "Victim and traitor" below) — not authored as an independent fact for the player to
  place.

## Placement rules

A finished placement is only valid when **all** of the following hold:

1. **One character per row.** No two characters share a row.
2. **One character per column.** No two characters share a column.
3. **Legal cell only.** A character occupies only an unblocked cell it is permitted to
   use (no restriction, or it's on that cell's restriction list).
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
the full predicate list and exact semantics of each one (exact row/column/chamber,
same/different chamber, cardinal direction, beside/not-beside).

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
occupants — the victim and the traitor — and no one else.

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
those coincide, but the implementation checks both).

## Tools available to the player

- **Place** — put the selected character on a legal cell.
- **Cross** — manually mark a cell as impossible for the player's own bookkeeping. This
  is independent from the game's own derived exclusions (cells the game already knows
  are unavailable because of blocked/legal-cell/row/column conflicts) and is never
  cleared automatically when those derived exclusions change.
- **Check Progress** — reports the first definite problem only (illegal/blocked
  placement, duplicate row, duplicate column, violated clue, a character with no legal
  cell left, or an invalid victim/traitor chamber), without revealing an unrelated
  correct destination.
- **Hint** — reports an existing contradiction first; otherwise offers one deterministic
  deduction with its reasoning, and optionally offers to apply it.

## Creating new content

The rules above describe how a finished Royal Inquest case is played and judged. To
author a **new** case (a new board, cast, chamber layout, prop set, or clue list), see:

- [Board, rooms, and props](authoring/board-rooms-props.human.md) — grid, chambers, room
  identity, and prop placement rules.
- [Character placement](authoring/character-placement.human.md) — cast, legal-cell
  restrictions, solution constraints, and the victim/traitor authoring rule.
- [Clues and predicates](authoring/clues-and-predicates.human.md) — every predicate
  type, its exact semantics, and how to write a clue against them.
