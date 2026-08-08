# Royal Inquest — MVP Fixes Plan

Design doc: `docs/superpowers/specs/2026-08-08-royal-inquest-mvp-fixes-design.md`.

## Changes

1. **`PUZZLE_IMPLEMENTATION.md`** — retire Royal-Inquest-facing "Check Progress" framing:
   - §1 MVP-supports bullet scoped to "(Siege Lines only — the Royal Inquest surfaces
     contradictions through hints instead)".
   - §5.5 renamed "Hints"; drops the standalone Check-Progress-evaluates-in-order framing and the
     unimplemented 6th ordering step ("an invalid completed envoy/traitor chamber"), keeping the 5
     real steps as the order hints resolve contradictions in.
   - Phase 0 exit condition drops "checked,".
   - §10 step 5 drops "Check Progress,".
   - Siege Lines' own Check Progress mentions (§6.6, Phase 1, §8) left untouched.
2. **`docs/royal-inquest/authoring/clues-and-predicates.cave.md`** and **`.human.md`** — "withheld
   from Check Progress/Hint until..." → "withheld from Hint until..." in both files.
3. **`src/features/royal-inquest/RoyalInquest.tsx`**:
   - Resolution section (`complete &&` block) gains a stats paragraph and a "Return to the Ledger"
     button reusing `onBack`.
   - Autosave `useEffect` body extracted into a `persist()` function; a new second effect adds a
     `document.addEventListener('visibilitychange', ...)` listener calling `persist()` when
     `document.visibilityState === 'hidden'`, cleaned up on unmount.
   - `useRef` import added; a `boardRef` on the `.inquest-board` container div.
   - `focusCell(row, column)` helper: queries `boardRef.current` for
     `[data-row="R"][data-column="C"]`, focuses it if found and not `disabled`.
   - Each cell button gets `data-row`/`data-column` attributes; its `onKeyDown` gains
     `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight` handling (calls `focusCell` with the
     computed neighbor) alongside the existing `'x'` cross-toggle handling.
4. **`src/features/royal-inquest/predicates.test.ts`** — extend existing `it` blocks:
   - `'evaluates exact rows and columns'` — add an `'unknown'` case (empty placements).
   - `'requires beside characters to be orthogonally adjacent in one chamber'` — add an
     `'unknown'` case (only one of the two characters placed).
   - `'evaluates chamber relationships'` — add `same-chamber` → `false` (envoy vs. beatrice,
     already-established different chambers), `different-chamber` → `false` (envoy vs. aldric,
     already-established same chamber), and `different-chamber` → `'unknown'` (envoy placed,
     daria not).

## Tests

- `predicates.test.ts` — the new cases above; no existing case changes.
- No other test files change — `validation.ts`, `hints.ts`, `PuzzleSave<T>` untouched, so
  `validation.test.ts`, `hints.test.ts`, `persistence.test.ts`, and `App.test.tsx` are unaffected.
  `RoyalInquest.tsx`'s changes are additive (new markup, new attributes, new effect) and don't
  change any existing prop/behavior a component test could have pinned — worth a final check of
  any Royal-Inquest component tests after implementation in case one snapshots the resolution
  markup verbatim.

## Verification

1. `npm run test:run` — full suite passes.
2. `npm run build` — typecheck + production build clean.
3. `npm run dev` — manual pass: solve `blackwoodKeep`, confirm the resolution panel shows elapsed
   time and hint count and "Return to the Ledger" navigates back to the level list; background the
   tab mid-puzzle (or trigger `visibilitychange` manually) and reload to confirm the latest state
   persisted; use arrow keys from a focused cell to move across the grid, confirming edges and
   blocked cells don't move focus or throw.
