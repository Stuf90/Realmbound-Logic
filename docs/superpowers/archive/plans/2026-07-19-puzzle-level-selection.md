# Puzzle and Level Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scalable puzzle-family catalog and 40-level selection screen with persisted completion marks and hierarchical back navigation.

**Architecture:** Keep navigation in `App` as a small typed view state and define family metadata in a focused catalog module. Render reusable catalog and level-selection screens from that data, while the existing puzzle components continue to own gameplay and persistence.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, browser localStorage

## Global Constraints

- Show Royal Inquest and Siege Lines as enabled puzzle families.
- Show Leyline Weaving, Celestial Binding, and Living Laws as disabled and labeled "Coming later".
- Every enabled family displays exactly 40 level controls.
- Only Level 1 is playable; Levels 2 through 40 are disabled placeholders.
- Completion is read from the existing persistence schema and communicated without relying on color alone.
- Preserve the existing briefing and gameplay behavior; do not add browser routing or future puzzle mechanics.

---

### Task 1: Data-driven family and level navigation

**Files:**
- Create: `src/app/puzzleCatalog.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `PuzzleFamilyId`, `PuzzleFamily`, `PUZZLE_FAMILIES`, and `getPuzzleFamily(id)` from `puzzleCatalog.ts`.
- Consumes: existing `RoyalInquest`, `SiegeLines`, and `loadPuzzle` APIs.

- [ ] **Step 1: Write failing navigation and availability tests**

Expand `App.test.tsx` with focused tests that render `<App />`, assert all five family headings, assert the three roadmap buttons are disabled, select Royal Inquest, and assert 40 buttons named `Level 1` through `Level 40`, with only Level 1 enabled.

```tsx
it('shows current and future puzzle families', () => {
  render(<App />);
  for (const name of ['Royal Inquest', 'Siege Lines', 'Leyline Weaving', 'Celestial Binding', 'Living Laws']) {
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  }
  expect(screen.getByRole('button', { name: /Select Leyline Weaving/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Select Celestial Binding/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Select Living Laws/ })).toBeDisabled();
});

it('shows forty levels with only the authored level enabled', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
  const levels = screen.getAllByRole('button', { name: /Level \d+/ });
  expect(levels).toHaveLength(40);
  expect(screen.getByRole('button', { name: /^Level 1/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: /^Level 2/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /^Level 40/ })).toBeDisabled();
});
```

- [ ] **Step 2: Run the app test to verify RED**

Run: `node ../../node_modules/vitest/vitest.mjs run src/app/App.test.tsx`

Expected: FAIL because the current ledger has no future family controls and opens briefings directly.

- [ ] **Step 3: Add catalog metadata and render both selection screens**

Create typed family metadata containing IDs, display copy, availability, level-one title, and persistence puzzle ID. Refactor `App` to use views `{ kind: 'ledger' }`, `{ kind: 'levels'; familyId }`, `{ kind: 'briefing'; familyId }`, and `{ kind: 'puzzle'; familyId }`. Render the family catalog from `PUZZLE_FAMILIES`, render 40 numbered controls on the level screen, and direct puzzle/briefing back callbacks to the selected family's level screen.

```ts
export type PuzzleFamilyId = 'royal-inquest' | 'siege-lines' | 'leyline-weaving' | 'celestial-binding' | 'living-laws';

export interface PuzzleFamily {
  id: PuzzleFamilyId;
  name: string;
  discipline: string;
  description: string;
  available: boolean;
  levelOne?: { title: string; puzzleId: string };
}
```

- [ ] **Step 4: Run the app test to verify GREEN**

Run: `node ../../node_modules/vitest/vitest.mjs run src/app/App.test.tsx`

Expected: PASS for catalog, disabled state, 40 levels, briefings, gameplay entry, and back navigation.

- [ ] **Step 5: Commit Task 1**

```powershell
git add src/app/puzzleCatalog.ts src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: add puzzle and level navigation"
```

### Task 2: Persisted completion mark and responsive presentation

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: `loadPuzzle<unknown>(puzzleId): PuzzleSave<unknown> | null` and the selected family's `levelOne.puzzleId`.
- Produces: an accessible `Completed` status within the Level 1 control when the save record is complete.

- [ ] **Step 1: Write the failing completion and back-navigation tests**

Persist a schema-version-1 completed Blackwood Keep save before rendering. Select Royal Inquest and assert Level 1 contains an accessible `Completed` status. Add a separate test that starts with no save and asserts the status is absent. Exercise ledger → levels → briefing → levels and levels → ledger back navigation.

```tsx
it('marks a persisted completed level', async () => {
  localStorage.setItem('realmbound:blackwood-keep', JSON.stringify({
    schemaVersion: 1,
    puzzleId: 'blackwood-keep',
    state: {},
    elapsedSeconds: 1,
    completed: true,
    hintsUsed: 0,
    checksUsed: 0,
  }));
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
  expect(screen.getByRole('status', { name: 'Completed' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the completion test to verify RED**

Run: `node ../../node_modules/vitest/vitest.mjs run src/app/App.test.tsx`

Expected: FAIL because the level control does not yet expose a completion status.

- [ ] **Step 3: Implement completion lookup and screen styling**

Read the selected level's save as the level screen renders and conditionally include a visible check/seal with `role="status"` and `aria-label="Completed"`. Add responsive styles for the catalog cards, compact 40-level grid, enabled/disabled distinctions beyond opacity, authored level title, and completion seal while preserving the parchment visual language and focus treatment.

```tsx
const completed = family.levelOne
  ? loadPuzzle<unknown>(family.levelOne.puzzleId)?.completed === true
  : false;
```

- [ ] **Step 4: Run the focused test and full suite to verify GREEN**

Run: `node ../../node_modules/vitest/vitest.mjs run src/app/App.test.tsx`

Expected: all app tests PASS.

Run: `node ../../node_modules/vitest/vitest.mjs run`

Expected: all test files PASS with zero failures.

- [ ] **Step 5: Build and inspect the diff**

Run: `node ../../node_modules/typescript/bin/tsc -b && node ../../node_modules/vite/bin/vite.js build`

Expected: TypeScript and Vite complete with exit code 0.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Commit Task 2**

```powershell
git add src/app/App.tsx src/app/App.test.tsx src/app/app.css docs/superpowers/plans/2026-07-19-puzzle-level-selection.md
git commit -m "feat: show level completion progress"
```
