# Authoring character placement

> Human version. Agent version: [`character-placement.cave.md`](character-placement.cave.md).
> Back to [Royal Inquest rules](../rules.human.md).

This document covers how a case's cast, legal-cell restrictions, and authored solution
are built. Enforced in `definitionValidation.ts` (`validateInquestDefinition`).

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
  every character needs a unique row and column.` `blackwoodKeep` happens to ship six
  characters on a 9x6 board, but that's a content choice, not a structural limit — a
  larger board can ship a larger cast, and a smaller one a smaller cast.
- **Unique IDs.** `Character IDs must be unique.`
- **Exactly one victim.** Exactly one character has `isVictim: true` —
  `Definition must contain exactly one victim.`

`avatarId` must be one of the `AvatarAssetId`s in `manifest.ts` (e.g. `nobleman`,
`knight`, `monk`, `guard-captain`, ...). Pick the nearest fit if the exact role doesn't
have a dedicated portrait — `blackwoodKeep` uses `guard-captain` for "Dame Daria" for
this reason.

## Legal cells

- Every board position gets exactly one `InquestCell` — validation requires
  `cells.length === rows * columns`, unique `position`s, and every `position` inside the
  grid bounds.
- `InquestCell.legalCharacterIds?: CharacterId[]` restricts a cell to specific
  characters. Omit it to allow any character. In `blackwoodKeep` this is used to pin
  each character's solution cell to that one character, ruling out an alternate valid
  placement that would also satisfy every clue — it is not a general-purpose narrative
  device for arbitrary "found here" hints.
- **`legalCharacterIds` and `propId` can combine, but only on an unblocked cell.** A
  prop like a chair or bench can be the specific piece of furniture one character's
  solution cell sits at — set `propId`, leave `blocked: false`, and restrict
  `legalCharacterIds` to that one character. A **blocked** prop cell (pure impassable
  scenery — a throne no one actually sits in, a bookshelf) should never carry
  `legalCharacterIds`: no character can ever occupy a blocked cell, so a restriction
  there is dead data that only misleads whoever reads the definition next.
- `InquestCell.blocked: boolean` marks a cell no character can ever occupy (scenery,
  optionally with a prop — see [board, rooms, and props](board-rooms-props.human.md)).

## Solution

`InquestDefinition.solution: Record<CharacterId, GridPosition>` is the one authored
correct placement. Validation requires:

- **Every character placed exactly once.** The solution's keys must match the character
  IDs one-to-one, each value a valid `{ row, column }` —
  `Solution must place every character exactly once.`
- **Unique rows.** `Solution rows must be unique.`
- **Unique columns.** `Solution columns must be unique.`
- **Legal, unblocked cell.** For every character, the cell at their solution position
  must exist, must not be `blocked`, and if it has a `legalCharacterIds` restriction that
  character must be on the list —
  `Solution for <characterId> must use a legal, unblocked cell.`

The row/column uniqueness requirement here is what makes `blackwoodKeep`'s solution a
full permutation — no two characters ever share a row or column in the authored
solution, which is also why row/column-relative predicates like `beside` and
`direction-from` are never usable as *clues* in that case (see
[clues and predicates](clues-and-predicates.human.md)): they'd never be true for any
pair. A future case with a deliberately non-permutation solution could use them for real.

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

This means the victim's chamber, as authored, must be sized and populated so that
exactly two solved characters land in it — everyone else in the case must solve to a
different chamber.

## Authoring checklist for a new case

1. Define at least two characters (no more than the board has rows or columns), one
   `isVictim: true`, unique IDs, valid `avatarId`s.
2. Lay out `cells` covering the full grid, assigning `chamberId`, `blocked`, and
   optional `legalCharacterIds`/`propId` per cell (see the board doc for chamber and
   prop rules).
3. Pick a `solution` that is a full row/column permutation across the cast, with every
   position on a legal, unblocked cell.
4. Pick `traitorId` so that, in the solution, the victim's chamber contains exactly the
   victim and the traitor.
5. Write clues (see [clues and predicates](clues-and-predicates.human.md)) that are true
   against this solution and, together, pin down a single placement.
