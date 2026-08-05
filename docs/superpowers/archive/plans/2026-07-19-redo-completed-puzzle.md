# Redo Completed Puzzle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a completion-time reset confirmation when a completed level is opened, then erase only that puzzle's save and start a fresh puzzle when confirmed.

**Architecture:** Keep the flow in `LevelSelection`, which already reads completion state. Add focused persistence deletion and elapsed-time formatting helpers, then let the level screen hold the pending completed save and render an accessible modal; confirmation deletes the save and calls a new direct-play callback owned by `App`.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, browser `localStorage`, CSS.

## Global Constraints

- Selecting an incomplete Level 1 continues to open its briefing.
- Cancel never changes saved data or navigation.
- Reset removes only `realmbound:<puzzleId>` and immediately opens gameplay without the briefing.
- Elapsed time uses `m:ss` below one hour and `h:mm:ss` at one hour or more; invalid or negative values display as zero.
- The dialog must have modal semantics, a visible heading, and keyboard-accessible native buttons.
- No persistence schema changes or completion-history tracking.

---

### Task 1: Completed Puzzle Reset Flow

**Files:**
- Modify: `src/shared/persistence.ts`
- Modify: `src/shared/persistence.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Produces: `deletePuzzle(puzzleId: string): void`, removing exactly `realmbound:<puzzleId>`.
- Produces: `formatElapsedTime(elapsedSeconds: number): string` for stable clock display.
- Changes `LevelSelection` to consume separate `onBriefing` and `onPlay` callbacks.

- [ ] **Step 1: Add failing persistence deletion tests**

Add a test that saves two puzzle records, invokes `deletePuzzle('blackwood-keep')`, and asserts the Blackwood save is absent while the Highgate save remains.

- [ ] **Step 2: Run the persistence test and verify RED**

Run: `npm test -- src/shared/persistence.test.ts`

Expected: FAIL because `deletePuzzle` is not exported.

- [ ] **Step 3: Implement minimal puzzle deletion**

Add to `src/shared/persistence.ts`:

```ts
export function deletePuzzle(puzzleId: string): void {
  localStorage.removeItem(`realmbound:${puzzleId}`);
}
```

- [ ] **Step 4: Run the persistence test and verify GREEN**

Run: `npm test -- src/shared/persistence.test.ts`

Expected: all persistence tests pass.

- [ ] **Step 5: Add failing application tests**

In `src/app/App.test.tsx`, add behavior tests that persist completed records and assert:

```ts
await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
expect(screen.getByRole('dialog', { name: 'Replay completed puzzle?' })).toBeInTheDocument();
expect(screen.getByText('Completed in 2:05')).toBeInTheDocument();
```

Cancel must close the dialog, preserve the save, and keep the level list visible. Reset must replace Blackwood's completed record with the fresh incomplete zero-time record auto-saved by gameplay, preserve an unrelated Highgate record, skip the briefing, and show Royal Inquest's `Check progress` control. Add a Siege Lines case that confirms the shared flow opens its `Check progress` gameplay control. Add direct `formatElapsedTime` assertions for `125 -> '2:05'`, `3661 -> '1:01:01'`, and invalid/negative input -> `'0:00'`.

- [ ] **Step 6: Run application tests and verify RED**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because completed level selection still opens the briefing and the dialog/formatter do not exist.

- [ ] **Step 7: Implement the minimal reset dialog and direct-play navigation**

In `src/app/App.tsx`:

- import `deletePuzzle` and `PuzzleSave`;
- export `formatElapsedTime`, normalizing with `Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))`;
- give `LevelSelection` pending-save state;
- when Level 1 is selected, open the dialog if its save is completed, otherwise call `onBriefing`;
- render `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` around the completion time and Cancel / Reset and replay buttons;
- on confirmation, delete `family.levelOne.puzzleId`, clear pending state, and call `onPlay`;
- wire `App` so `onBriefing` opens the briefing and `onPlay` opens gameplay.

Use native buttons and keep the dialog within the level-selection render tree.

- [ ] **Step 8: Add focused dialog styling**

In `src/app/app.css`, add a fixed full-viewport translucent backdrop, a bounded parchment dialog panel, and responsive action layout using existing button classes and color variables. Do not alter unrelated screen styling.

- [ ] **Step 9: Run focused tests and verify GREEN**

Run: `npm test -- src/shared/persistence.test.ts src/app/App.test.tsx`

Expected: all targeted tests pass with no errors.

- [ ] **Step 10: Run build verification**

Run: `npm run build`

Expected: TypeScript and Vite complete with exit code 0.

- [ ] **Step 11: Review and commit implementation**

Run `git diff --check` and inspect `git diff` against every global constraint, then commit:

```powershell
git add src/shared/persistence.ts src/shared/persistence.test.ts src/app/App.tsx src/app/App.test.tsx src/app/app.css docs/superpowers/plans/2026-07-19-redo-completed-puzzle.md
git commit -m "feat: replay completed puzzles"
```
