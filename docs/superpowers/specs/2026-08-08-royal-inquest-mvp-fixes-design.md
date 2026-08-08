# Royal Inquest — MVP Fixes Design

## Objective

An MVP-acceptance audit of the Royal Inquest against `PUZZLE_IMPLEMENTATION.md` found four gaps
worth fixing now, plus one piece of documentation drift to retire rather than build:

- The resolution panel (`RoyalInquest.tsx`'s `complete`-gated `.resolution` section) never
  reported elapsed time or hint usage, and had no explicit forward action — just a narrative
  paragraph, with the only way onward being the generic header "← Levels" button.
- `predicates.test.ts` didn't exercise all three `ConstraintResult` states (`true`/`false`/
  `'unknown'`) for every predicate variant — `same-chamber` had no `false` case, `exact-row`/
  `exact-column` had no `'unknown'` case, `beside` had no `'unknown'` case, and `different-chamber`
  only had a `true` case.
- The board had no cell-to-cell keyboard navigation — each `gridcell` button only handled the
  `'x'` cross-toggle key; tabbing was the only way to move focus, one cell at a time through the
  whole 36-cell grid.
- Nothing force-saved when the tab became hidden — `savePuzzle` only ran from a `useEffect` on
  state change, so a closed/backgrounded tab between actions could lose the most recent state on
  reload.

Separately, §5.5/§1/§10 of `PUZZLE_IMPLEMENTATION.md` documented a standalone "Check Progress"
action for the Royal Inquest, plus a 6th hint-ordering step ("an invalid completed envoy/traitor
chamber") that was never implemented. Neither exists in `RoyalInquest.tsx` — there's no Check
Progress button, and `checkInquestProgress` (`validation.ts`) is purely an internal helper
`hints.ts` uses to find contradictions before offering a hint. Decision: retire this from the
docs rather than build it. The 6th ordering step is dropped rather than implemented, since victim/
traitor placement is already proven correct at authoring time by the solver
(`solveInquestDefinition`/`checkVictimElimination`, §5.1) — no live runtime check is needed.
Siege Lines keeps its own real, wired-up Check Progress feature (§6.6) untouched; `checksUsed`
stays in the shared `PuzzleSave<T>` type because Siege Lines' counter is real and live.

## Decisions confirmed up front

1. No view-level routing refactor for the resolution step — the solved board stays visible behind
   the resolution panel (matches §3's "Completion preserves the solved board... presents a
   narrative resolution"); the fix is adding the missing stats line and an explicit "Return to the
   Ledger" button that reuses the existing `onBack` prop.
2. Arrow-key navigation is minimal roving focus: compute the target `{row, column}`, look it up via
   `data-row`/`data-column` attributes within a ref'd board container, and call `.focus()` if a
   non-`disabled` cell exists there. No wraparound, no skip-search past blocked cells — boards are
   small (6x6) and blocked cells sparse enough that this is sufficient.
3. Force-save reuses the existing autosave `savePuzzle` call, factored into a `persist()` function
   shared by the on-change effect and a new `visibilitychange` listener (fires `persist()` when
   `document.visibilityState === 'hidden'`).
4. Check Progress removal is docs-only. No code changes to `validation.ts`, `hints.ts`, or the
   shared `PuzzleSave<T>` type/`checksUsed` field.

## Data/behavior changes

- **`RoyalInquest.tsx`**: resolution section gains a stats paragraph (`Solved in M:SS using N
  hint(s).`, reusing existing `seconds`/`hints` state) and a "Return to the Ledger" button (reuses
  `onBack`). Autosave effect body extracted into `persist()`; a second effect adds a
  `visibilitychange` listener calling `persist()` on hide. Board container div gets a `ref`; each
  cell button gets `data-row`/`data-column` attributes and its `onKeyDown` gains arrow-key handling
  (delegates to a new `focusCell(row, column)` helper) alongside the existing `'x'` handling.
- **`predicates.test.ts`**: existing `it` blocks extended (no new blocks) with the missing
  `ConstraintResult` cases listed above, reusing the file's existing `blackwoodKeep` fixture and
  already-established coordinate/chamber facts.
- **`PUZZLE_IMPLEMENTATION.md`**: §1's Check Progress bullet scoped to "Siege Lines only"; §5.5
  renamed "Hints" and rewritten to state the Royal Inquest has no standalone Check Progress action,
  keeping the 5 real ordering steps and dropping the 6th; Phase 0 exit condition drops "checked,";
  §10 step 5 drops "Check Progress,". Siege Lines' own Check Progress mentions (§6.6, Phase 1, §8)
  are untouched.
- **`docs/royal-inquest/authoring/clues-and-predicates.cave.md`/`.human.md`**: "withheld from Check
  Progress/Hint" → "withheld from Hint" in both files, keeping each file's existing style.

## Non-goals

- No change to Siege Lines.
- No change to `validation.ts`, `hints.ts`, or `PuzzleSave<T>`/`checksUsed`.
- No full view-level "resolution" route — the resolution panel stays an in-place overlay on the
  solved board.
- No wraparound or blocked-cell-skipping logic in arrow-key navigation.

See `docs/superpowers/plans/2026-08-08-royal-inquest-mvp-fixes.md` for the implementation plan.
