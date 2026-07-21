# AUTHOR CLUES + PREDICATES

> AGENT FILE. CAVE SPEAK. HUMAN VERSION: `clues-and-predicates.human.md`.
> BACK TO [ROYAL INQUEST RULES](../rules.cave.md).

THIS DOC = EVERY `InquestPredicate` VARIANT, EXACT EVAL SEMANTICS (`predicates.ts`,
`evaluatePredicate`), WHICH PREDICATE *CLUE* ACTUAL ALLOW USE, HOW WRITE `InquestClue`
AGAINST THEM.

## STRUCTURED PREDICATE = SOURCE OF TRUTH

```ts
interface InquestClue {
  id: string;
  text: string;
  predicate: InquestPredicate;
}
```

`text` = FLAVOR SHOW PLAYER. **NEVER** PARSE FOR CORRECTNESS — ONLY `predicate` EVAL.
WRITE `text` + `predicate` SO AGREE, BUT INDEPENDENT DATA — MISMATCH = AUTHOR BUG,
VALIDATION CAN'T CATCH.

EVERY PREDICATE EVAL ONE OF THREE:

```ts
type PredicateResult = true | false | 'unknown';
```

`'unknown'` = AT LEAST ONE REF CHARACTER NOT PLACE YET — PREDICATE WITHHOLD FROM CHECK
PROGRESS/HINT TILL DECIDE ONE WAY.

## PREDICATE REFERENCE

### `exact-row` / `exact-column`

```ts
{ type: 'exact-row'; characterId: CharacterId; row: number }
{ type: 'exact-column'; characterId: CharacterId; column: number }
```

TRUE WHEN `characterId` PLACE ROW/COLUMN = GIVE VALUE; `'unknown'` IF NOT PLACE YET.
**BOTH EXIST IN TYPE SYSTEM + EVAL NORMAL, BUT NO CLUE MAY USE EITHER** — SEE "WHAT
CLUE MAY NOT DO" BELOW.

### `exact-chamber`

```ts
{ type: 'exact-chamber'; characterId: CharacterId; chamberId: string }
```

TRUE WHEN `characterId` PLACE CELL `chamberId` = `chamberId`.

### `on-prop`

```ts
{ type: 'on-prop'; characterId: CharacterId; propId: PropAssetId }
```

TRUE WHEN `characterId` PLACE ON (SINGLE) CELL IN DEFINITION WHOSE `propId` = `propId`.
`'unknown'` TILL THAT CHARACTER PLACE. THIS LET CLUE SAY "SEATED IN CHAIR" NO STATE
COORDINATE OR CHAMBER — SEE [BOARD, ROOMS, PROPS](board-rooms-props.cave.md) FOR SEAT-
PROP MODEL THIS PAIR WITH.

### `same-chamber` / `different-chamber`

```ts
{ type: 'same-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
{ type: 'different-chamber'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
```

`'unknown'` UNLESS **BOTH** PLACE. ELSE COMPARE CHAMBER; `different-chamber` = EXACT
NEGATE `same-chamber`, NOT DISTANCE CHECK.

### `direction-from`

```ts
{
  type: 'direction-from';
  subjectCharacterId: CharacterId;
  referenceCharacterId: CharacterId;
  direction: 'north' | 'east' | 'south' | 'west';
}
```

`'unknown'` UNLESS BOTH PLACE. ELSE:

- `north`: SAME COLUMN, SUBJECT ROW STRICT LESS THAN REFERENCE ROW.
- `south`: SAME COLUMN, SUBJECT ROW STRICT GREATER.
- `east`: SAME ROW, SUBJECT COLUMN STRICT GREATER.
- `west`: SAME ROW, SUBJECT COLUMN STRICT LESS.

ALL REQUIRE SUBJECT + REFERENCE SHARE ROW OR COLUMN — SOLUTION FULL ROW/COLUMN
PERMUTATION (SEE [CHARACTER PLACEMENT](character-placement.cave.md)) NEVER MAKE
`direction-from` CLUE TRUE ANY PAIR. SHIP CASE NEVER USE AS REAL CLUE THIS REASON.
FUTURE CASE NON-PERMUTATION SOLUTION COULD USE REAL.

### `beside` / `not-beside`

```ts
{ type: 'beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
{ type: 'not-beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
```

`'unknown'` UNLESS BOTH PLACE. ELSE: ADJACENT = MANHATTAN DIST EXACTLY 1 **+** SAME
CHAMBER — CROSS CHAMBER WALL NOT COUNT ADJACENT EVEN IF CELL PHYSICAL NEXT TO EACH
OTHER. `not-beside` = EXACT NEGATE.

`not-beside` *IS* USABLE AGAINST PERMUTATION SOLUTION (UNLIKE `beside`, NEVER FIRE
THERE) — SHIP CASE USE `aldric-not-beside-edmund` EXACT THIS WAY, SINCE "NOT ADJACENT"
TRIVIAL TRUE WHENEVER TWO CHARACTER NOT EVEN SHARE ROW/COLUMN, STILL MEANINGFUL CLUE
COMBINE WITH SAME/DIFFERENT-CHAMBER FACT.

## WHAT CLUE MAY NOT DO

`validateInquestDefinition` REJECT TWO SHAPE CLUE OUTRIGHT, INDEPENDENT FROM PREDICATE
REFERENCE ABOVE:

1. **NO `exact-row`/`exact-column` CLUE.**
   > `Clue "<id>" may not use exact-row/exact-column; use exact-chamber, direction-from,
   > beside, not-beside, same-chamber, or different-chamber instead.`

   STATE LITERAL COORDINATE = GIVEAWAY, NOT DEDUCTION — CHAMBER MEMBERSHIP, RELATIVE
   DIRECTION, ADJACENCY = VOCAB GAME BUILD AROUND.
2. **NO CLUE MAY NAME VICTIM.** CHECK VIA `getPredicateCharacterIds(clue.predicate)`
   AGAINST VICTIM `id`:
   > `Clue "<id>" names the victim directly; the victim's position must be derived only
   > from other witnesses.`

   SEE [CHARACTER PLACEMENT](character-placement.cave.md) FOR SOLVER-BACK CHECK MAKE
   SURE VICTIM CELL STILL UNIQUE FORCE BY ELIMINATION DESPITE NEVER NAME.

## WHICH CHARACTERS PREDICATE TOUCH

`getPredicateCharacterIds(predicate)` RETURN EVERY `CharacterId` PREDICATE REFERENCE,
EXHAUSTIVE ALL VARIANT. THIS WHAT BOTH VICTIM-NAME CHECK ABOVE + HINT TEXT USE FIND
"CLUE RELEVANT THIS CHARACTER" — USE IT (DON'T HAND-ROLL CHECK AGAINST ONLY
`characterId`, MISS EVERY PAIRWISE PREDICATE).

## WRITE CLUE

1. DECIDE WHICH FACT ABOUT SOLUTION CLUE SHOULD REVEAL.
2. PICK PREDICATE VARIANT EXPRESS EXACT, FROM ALLOW SET (`exact-chamber`, `on-prop`,
   `same-chamber`, `different-chamber`, `direction-from`, `beside`, `not-beside`) —
   NEVER `exact-row`/`exact-column`, NEVER REF VICTIM.
3. WRITE `text` AS IN-WORLD FLAVOR MATCH PREDICATE MEAN.
4. RUN `validateInquestDefinition` (OR TEST SUITE). UNLIKE BEFORE, NOT NEED HAND-REASON
   WHETHER CLUE SET PIN DOWN UNIQUE PLACEMENT — BUNDLE SOLVER (`solver.ts`) BACKTRACK
   FULL CLUE SET, TELL DIRECT IF UNDER-CONSTRAIN (NO SOLUTION), AMBIGUOUS (MORE THAN
   ONE SOLUTION), OR INCONSISTENT WITH AUTHOR `solution`. ALSO VERIFY VICTIM CELL FORCE
   BY ELIMINATION ONCE EVERYONE ELSE PLACE. SEE
   [CHARACTER PLACEMENT](character-placement.cave.md) EXACT WHAT THOSE CHECK REQUIRE.
