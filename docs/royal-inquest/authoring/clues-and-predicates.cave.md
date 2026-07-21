# AUTHOR CLUES + PREDICATES

> AGENT FILE. CAVE SPEAK. HUMAN VERSION: `clues-and-predicates.human.md`.
> BACK TO [ROYAL INQUEST RULES](../rules.cave.md).

THIS DOC = EVERY `InquestPredicate` VARIANT, EXACT EVAL SEMANTICS (`predicates.ts`,
`evaluatePredicate`), HOW WRITE `InquestClue` AGAINST THEM.

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
PROGRESS TILL DECIDE ONE WAY.

## PREDICATE REFERENCE

### `exact-row`

```ts
{ type: 'exact-row'; characterId: CharacterId; row: number }
```

TRUE WHEN `characterId` PLACE ROW = `row`. `'unknown'` IF NOT PLACE YET.

### `exact-column`

```ts
{ type: 'exact-column'; characterId: CharacterId; column: number }
```

SAME AS `exact-row`, FOR COLUMN.

### `exact-chamber`

```ts
{ type: 'exact-chamber'; characterId: CharacterId; chamberId: string }
```

TRUE WHEN `characterId` PLACE CELL `chamberId` = `chamberId`.

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
`direction-from` CLUE TRUE ANY PAIR. `blackwoodKeep` NEVER USE AS REAL CLUE THIS
REASON — ONLY EXERCISE SYNTHETIC PLACEMENT UNIT TEST. FUTURE CASE NON-PERMUTATION
SOLUTION COULD USE REAL.

### `beside` / `not-beside`

```ts
{ type: 'beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
{ type: 'not-beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
```

`'unknown'` UNLESS BOTH PLACE. ELSE: ADJACENT = MANHATTAN DIST EXACTLY 1 **+** SAME
CHAMBER — CROSS CHAMBER WALL NOT COUNT ADJACENT EVEN IF CELL PHYSICAL NEXT TO EACH
OTHER. `not-beside` = EXACT NEGATE.

SAME PERMUTATION CAVEAT AS `direction-from`: FULL PERMUTATION SOLUTION MEAN NO TWO
CHARACTER EVER ADJACENT — `beside`/`not-beside` ONLY MEANINGFUL USABLE AGAINST NON-
PERMUTATION SOLUTION.

## WHICH CHARACTERS PREDICATE TOUCH

`getPredicateCharacterIds(predicate)` RETURN EVERY `CharacterId` PREDICATE REFERENCE,
EXHAUSTIVE ALL VARIANT. THIS WHAT HINT TEXT USE FIND "CLUE RELEVANT THIS CHARACTER" —
USE IT (DON'T HAND-ROLL CHECK AGAINST ONLY `characterId`, MISS EVERY PAIRWISE
PREDICATE).

## WRITE CLUE

1. DECIDE WHICH FACT ABOUT SOLUTION CLUE SHOULD REVEAL.
2. PICK PREDICATE VARIANT EXPRESS EXACT — PREFER MOST SPECIFIC (`exact-chamber` OVER
   `same-chamber` CLUE WITH ALREADY-PLACE CHARACTER, IF CHAMBER ITSELF = FACT).
3. CONFIRM PREDICATE EVAL `true` AGAINST `InquestDefinition.solution` — NO AUTOMATE
   CHECK THIS; CLUE FALSE AGAINST AUTHOR SOLUTION = UNSOLVABLE PUZZLE.
4. WRITE `text` AS IN-WORLD FLAVOR MATCH PREDICATE MEAN. KEEP ROW/COLUMN REF 1-INDEX
   IN TEXT EVEN THOUGH DATA 0-INDEX (ROW INDEX `0` READ "FIRST ROW").
5. AS SET, CASE CLUES + STRUCTURAL RULES (ROW/COLUMN UNIQUE, LEGAL CELL,
   VICTIM/TRAITOR CHAMBER) MUST TOGETHER PIN DOWN EXACTLY ONE PLACEMENT — AUTHOR
   `solution`. NO SOLVER BUNDLE THIS REPO VERIFY UNIQUE AUTOMATIC — CHECK BY REASON
   THROUGH CLUE SET BY HAND, OR CONFIRM NO OTHER PERMUTATION SIX CHARACTER ONTO LEGAL
   CELL ALSO SATISFY EVERY CLUE.
