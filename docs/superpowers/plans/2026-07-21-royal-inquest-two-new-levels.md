# Add two new Royal Inquest puzzle levels

> Grounded in `docs/royal-inquest/rules.cave.md` and the `authoring/*.cave.md` sub-docs
> (board/rooms/props, character placement, clues/predicates) — canonical authoring rules,
> matched point by point. Cast-size floor is 2, not a fixed 6 (validated by
> `characters.length <= min(rows, columns)`); 6 remains a content choice for parity with
> Blackwood Keep, not a structural requirement.

## Context

Royal Inquest had exactly one playable puzzle (`blackwoodKeep`, in
`src/features/royal-inquest/definition.ts`). The level-selection screen (`src/app/App.tsx`,
built per `2026-07-19-puzzle-level-selection.md`) already rendered 40 level slots per
family but only unlocked "Level 1" via a single `family.levelOne` field. `RoyalInquest.tsx`
also hardcoded the `blackwoodKeep` import throughout (title, board aria-label, victim badge
text, and the "Solved" resolution banner all referenced Blackwood Keep/Aldric/the Solar
directly) — the feature was wired for exactly one level, not many.

Two new levels require: (1) two new `InquestDefinition`s that satisfy the structural
validator and solver in `definitionValidation.ts`/`solver.ts` (one victim, board split into
chambers of ≥5 tiles, clues restricted to the allowed predicate set, no clue naming the
victim, a solver-verified unique solution matching the authored one, victim+traitor as the
sole two occupants of their shared chamber), and (2) generalizing the level-selection
plumbing and `RoyalInquest` component so more than one level can actually be selected and
played.

## Approach taken

### 1. New level definitions

- `src/features/royal-inquest/levels/thornfieldManor.ts` — "The Vanishing at Thornfield
  Manor" (manor-house cast: steward, cook, maid, gardener, merchant + a physician victim;
  `room`/`kitchen`/`garden` chamber environments).
- `src/features/royal-inquest/levels/ravensholtAbbey.ts` — "The Reckoning at Ravensholt
  Abbey" (abbey cast: prior, scholar, knight, captain, monk + a pilgrim victim;
  `church`/`room`/`dungeon` chamber environments).

Both reuse Blackwood Keep's proven chamber shape (one full-width top chamber housing
victim + traitor, four irregular chambers below, each ≥5 tiles) with a relabeled cast,
clue text, and prop set appropriate to each chamber's environment — an isomorphic reskin
of a shape already proven to force a unique solution. Both passed
`validateInquestDefinition` (including the solver-backed uniqueness and victim-elimination
checks) on the first attempt.

- `src/features/royal-inquest/levels/index.ts` exports `royalInquestLevels` (ordered:
  Blackwood Keep, Thornfield Manor, Ravensholt Abbey) and `getRoyalInquestLevel(id)`.
- `definition.ts` untouched — still exports `blackwoodKeep` directly, so
  `definitionValidation.test.ts` needed no changes.
- `src/features/royal-inquest/levels/levels.test.ts` asserts both new definitions validate
  cleanly, have the expected shape, and that the registry/lookup work.

### 2. `RoyalInquest.tsx` takes a `definition` prop

Signature changed to `RoyalInquest({ definition, onBack })`; every internal `blackwoodKeep`
reference became `definition` (reducer/selectors/hints/validation/visuals already took the
definition generically). Removed the remaining Blackwood-specific hardcodes:
- Board `aria-label` now uses `definition.title`.
- Victim badge is now generic ("Victim" instead of "Slain envoy").
- The "Solved" resolution banner now computes the traitor/victim/chamber names from
  `definition` dynamically instead of a fixed Aldric/Solar sentence.

### 3. Catalog + `App.tsx` navigation generalized to N levels

- `puzzleCatalog.ts`: `PuzzleFamily.levelOne?` replaced with `levels: Array<{ title;
  puzzleId }>`. Royal Inquest's entry is `royalInquestLevels.map(...)`; Siege Lines keeps
  its single-entry array; the three unavailable families get `levels: []`.
- `App.tsx`: `View` now carries `levelIndex` for the briefing/puzzle views.
  `LevelSelection` looks up each of the 40 slots against `family.levels[index]`, loads that
  level's own save independently for its completion/replay state, and passes the clicked
  level's index up. `Briefing` takes the resolved `level` entry directly. For Royal Inquest,
  the actual `InquestDefinition` is resolved via `getRoyalInquestLevel` and passed to
  `<RoyalInquest definition={...} />`. The briefing flavor paragraph was generalized to not
  name "Blackwood Keep"/"a royal envoy" specifically, since it now applies to any level.

### 4. Tests

- `App.test.tsx`: the "only the authored level enabled" test now asserts Levels 1–3
  enabled, Level 4+ disabled. Added a test opening Level 2 and Level 3 end-to-end (briefing
  shows the new title, "Begin the inquest" opens a working board for each).
- Existing Level-1-specific tests (persistence key `blackwood-keep`, chamber labels, wall
  counts, seat prop, clue text) were unaffected since Level 1 still resolves to
  `blackwoodKeep`.

## Verification (all green)

- `vitest run src/features/royal-inquest/levels/levels.test.ts` — new definitions pass
  structural + solver validation.
- `vitest run` (full suite) — 98 tests passed.
- `tsc -b && vite build` — typecheck + build clean, no whitespace errors (`git diff --check`).
