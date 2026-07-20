# Royal Inquest Predicate Rules Design

## Objective

The approved MVP spec (`docs/superpowers/specs/2026-07-19-realmbound-logic-mvp-design.md`, line 139)
defines the Royal Inquest clue-predicate set as: exact chamber, exact row/column, cardinal direction
relative to a person or object, orthogonal adjacency, non-adjacency, same chamber, different chamber, and
scene-specific legal-cell restrictions.

The shipped engine (`src/features/royal-inquest/types.ts`) only implements a subset: `exact-row`,
`exact-column`, `same-chamber`, `different-chamber`, `beside`, and `north-of` (a single cardinal
direction). Missing: an exact-chamber predicate, a non-adjacency predicate, and east/south/west
directions. This closes that gap without touching board geometry, persistence, or completion rules.

`PUZZLE_IMPLEMENTATION.md` section 5.2 contains an older, stale illustrative predicate interface
(camelCase types, `first`/`second` fields) that predates the shipped naming convention. This work follows
the **current shipped convention** (kebab-case `type`, `firstCharacterId`/`secondCharacterId` /
`subjectCharacterId`/`referenceCharacterId`), not that stale doc's exact names.

## Predicate additions

```ts
| { type: 'exact-chamber'; characterId: CharacterId; chamberId: string }
| { type: 'not-beside'; firstCharacterId: CharacterId; secondCharacterId: CharacterId }
| {
    type: 'direction-from';
    subjectCharacterId: CharacterId;
    referenceCharacterId: CharacterId;
    direction: 'north' | 'east' | 'south' | 'west';
  }
```

`direction-from` **replaces** `north-of` (refactor, not addition): the spec treats cardinal direction as
one concept, a `direction` field avoids four duplicated switch cases, and `north-of` has zero live usage
in the shipped `blackwoodKeep` case, so the rename costs nothing in puzzle content. Semantics mirror the
existing `north-of` logic: north/south require the same column with a strict row inequality; east/west
require the same row with a strict column inequality.

`not-beside` is the direct logical negation of `beside` — same distance+chamber computation, same
"unknown until both characters are placed" semantics, inverted result.

`exact-chamber` mirrors `exact-row`/`exact-column`: a single character pinned to a named chamber via the
existing `chamberAt` helper.

## Puzzle content

`blackwoodKeep`'s solution is a full row/column permutation (no two characters share a row or column), so
any same-row/same-column-based predicate (`beside`, `direction-from`) is structurally never true there —
which is also why `beside`/`north-of` were never used as clues in the shipped case. `direction-from`
therefore stays exercised only via synthetic placements in unit tests.

Two new, additive clues are added to `blackwoodKeep` (true against the existing fixed `solution`, no
solution/board changes):

- `edmund-archives`: `{ type: 'exact-chamber', characterId: 'edmund', chamberId: 'archives' }` — edmund
  solves to (5,2) → archives chamber.
- `aldric-not-beside-edmund`: `{ type: 'not-beside', firstCharacterId: 'aldric', secondCharacterId: 'edmund' }`
  — (1,0) and (5,2) are neither adjacent nor same-chamber.

## Bug fix bundled with this change

`hints.ts` looks up the clue relevant to a character via `'characterId' in predicate && predicate.characterId
=== character.id`. This only matches `exact-row`/`exact-column`, so hint text has always silently omitted
the clue for every pairwise predicate (`same-chamber`, `different-chamber`, `north-of`, `beside`),
falling back to a generic "can now be placed" message. Fixed by switching the lookup to
`getPredicateCharacterIds(predicate).includes(character.id)`, which already exists in `predicates.ts` and
is exhaustive over every predicate variant.

## Non-goals

- No changes to board geometry, `chamberByPosition`, blocked cells, or the fixed `solution`.
- No changes to `selectors.ts` (cell availability is row/column/blocked/legal-cell/manual-cross based and
  never reads predicates).
- No changes to `definitionValidation.ts` (it does not inspect `definition.clues` today).

See `docs/superpowers/plans/2026-07-20-royal-inquest-predicate-rules.md` for the implementation plan.
