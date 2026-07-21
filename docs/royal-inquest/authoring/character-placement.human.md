# Authoring character placement

> Human version. Agent version: [`character-placement.cave.md`](character-placement.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

This document covers how a case's cast and authored solution are built, and how
`definitionValidation.ts` proves the clue set actually narrows to that solution rather
than merely being consistent with it.

## Cast

`InquestDefinition.characters: InquestCharacter[]`:

```ts
interface InquestCharacter {
  id: CharacterId;
  name: string;
  portraitLabel: string;
  avatarId: AvatarAssetId;
  isVictim?: boolean;
}
```

Validation requires:

- **At least two characters.** `Definition must contain at least two characters.` (a
  victim and a traitor are the floor — the cast size is otherwise not fixed.)
- **No more characters than rows or columns.** Every character needs a unique row and a
  unique column in the solution, so the cast can never outgrow the smaller board
  dimension — `Definition must not contain more characters than rows or columns, since
  every character needs a unique row and column.` The shipped case ships six characters
  on a 6x6 board, but that's a content choice, not a structural limit.
- **Unique IDs.** `Character IDs must be unique.`
- **Exactly one victim.** Exactly one character has `isVictim: true` —
  `Definition must contain exactly one victim.`

`avatarId` must be one of the `AvatarAssetId`s in `manifest.ts` (e.g. `nobleman`,
`knight`, `monk`, `guard-captain`, ...). Pick the nearest fit if the exact role doesn't
have a dedicated portrait — the shipped case uses `guard-captain` for "Dame Daria" for
this reason.

## Cells

Every board position gets exactly one `InquestCell` — validation requires
`cells.length === rows * columns`, unique `position`s, and every `position` inside the
grid bounds. There is no per-cell character restriction: **every unblocked cell is
legal for every character.** `InquestCell.blocked: boolean` is the only thing that ever
keeps a character off a cell (scenery, optionally with a prop — see
[board, rooms, and props](board-rooms-props.human.md)).

## Solution

`InquestDefinition.solution: Record<CharacterId, GridPosition>` is the one authored
correct placement. Validation requires:

- **Every character placed exactly once.** The solution's keys must match the character
  IDs one-to-one, each value a valid `{ row, column }` —
  `Solution must place every character exactly once.`
- **Unique rows.** `Solution rows must be unique.`
- **Unique columns.** `Solution columns must be unique.`
- **Unblocked cell.** For every character, the cell at their solution position must
  exist and must not be `blocked` —
  `Solution for <characterId> must use a legal, unblocked cell.`

The row/column uniqueness requirement is what makes the shipped case's solution a full
permutation — no two characters ever share a row or column in the authored solution,
which is also why row/column-relative predicates like `beside` and `direction-from` are
never usable as *clues* against it (see
[clues and predicates](clues-and-predicates.human.md)): they'd never be true for any
pair. A future case with a deliberately non-permutation solution could use them for
real.

## The victim is never named directly

No clue's predicate may reference the victim's `id`, checked via
`getPredicateCharacterIds`:

> `Clue "<id>" names the victim directly; the victim's position must be derived only
> from other witnesses.`

The victim's cell must be reachable only by elimination from clues about everyone else
— see the solver-backed check below.

## Victim and traitor

`InquestDefinition.traitorId: CharacterId` is authored explicitly, but must be
consistent with the solution:

- **Traitor must be a non-victim character.** `traitorId` must reference a real
  character and must not equal the victim's ID —
  `Traitor must be a non-victim character.`
- **Victim's chamber must contain exactly the victim and the traitor.** Using the
  solution positions, find the victim's chamber, then find every character whose
  solution position is in that same chamber. That set must be exactly `{ victim, traitor }`
  — no more, no fewer —
  `Victim and traitor must be the only two solution occupants of their chamber.`

## The solver-backed uniqueness check

Beyond the structural rules above, `validateInquestDefinition` runs a real
constraint-satisfaction solver (`solver.ts`, author-time only — never called during
play) against the case's full clue set:

1. **`solveInquestDefinition`** backtracks over every character and every unblocked
   cell, rejecting any partial placement that already violates a clue or repeats a row
   or column, and collects up to two full solutions.
   - **Zero solutions** — `The clue set has no valid solution.`
   - **More than one solution** — `The clue set does not narrow the puzzle to a unique
     solution.`
   - **Exactly one solution that doesn't match the authored `solution`** — `The clue
     set's unique solution does not match the authored solution.`

   This is what makes "the clues actually narrow the puzzle" a checked property instead
   of something an author has to reason through by hand.

2. **`checkVictimElimination`** solves the puzzle again for every character *except*
   the victim. That sub-puzzle (all clues, minus the victim) must itself have exactly
   one solution; once those characters are placed, exactly one unblocked cell must
   remain that shares no row or column with any of them; and that cell's chamber must
   already contain exactly one of the other solved characters, who must be the traitor.
   Failing any part of this produces:

   > `Victim <id> must have exactly one legal cell once every other character is
   > placed, in a chamber occupied solely by the traitor.`

   This formalizes the "one logical space left, in a chamber with exactly one other
   person" deduction as an authoring requirement, not just a description of the finished
   case.

## Authoring checklist for a new case

1. Define at least two characters (no more than the board has rows or columns), one
   `isVictim: true`, unique IDs, valid `avatarId`s. Put the victim's clues last in your
   own thinking — nothing may name them.
2. Lay out `cells` covering the full grid, assigning `chamberId`, `blocked`, and
   optional `propId` per cell (see the board doc for chamber and prop rules).
3. Pick a `solution` that is a full row/column permutation across the cast, with every
   position on an unblocked cell.
4. Pick `traitorId` so that, in the solution, the victim's chamber contains exactly the
   victim and the traitor.
5. Write clues (see [clues and predicates](clues-and-predicates.human.md)) that never
   name the victim and, together with the structural rules, pin down a single
   placement.
6. Run `validateInquestDefinition` (or the test suite) — the solver will tell you
   directly if the clue set is under-constrained, over-constrained, or inconsistent
   with the authored solution, and whether the victim's cell is genuinely forced by
   elimination.
