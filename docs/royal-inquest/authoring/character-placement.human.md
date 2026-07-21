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

- **Exactly six characters.** `Definition must contain six characters.`
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
  characters. Omit it to allow any character. This is how a puzzle can place, e.g.,
  narrative "found here" hints directly into the board geometry rather than only as
  clues.
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

1. Define six characters, one `isVictim: true`, unique IDs, valid `avatarId`s.
2. Lay out `cells` covering the full grid, assigning `chamberId`, `blocked`, and
   optional `legalCharacterIds`/`propId` per cell (see the board doc for chamber and
   prop rules).
3. Pick a `solution` that is a full row/column permutation across the six characters,
   with every position on a legal, unblocked cell.
4. Pick `traitorId` so that, in the solution, the victim's chamber contains exactly the
   victim and the traitor.
5. Write clues (see [clues and predicates](clues-and-predicates.human.md)) that are true
   against this solution and, together, pin down a single placement.
