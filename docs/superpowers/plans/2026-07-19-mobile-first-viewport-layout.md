# Mobile-First Viewport Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Realmbound Logic screen fit the device viewport, with overflow confined to contextual elements and mobile-first puzzle controls.

**Architecture:** Introduce shared viewport-shell CSS primitives and add only the semantic wrappers and local presentation state needed by the ledger, briefings, Royal Inquest, and Siege Lines. Gameplay reducers and persisted state remain untouched; responsive layout is driven by mobile defaults, container min-size discipline, and progressive `min-width`/`min-height` queries.

**Tech Stack:** React 19, TypeScript, CSS Grid/Flexbox, Vitest, Testing Library, Vite.

## Global Constraints

- The document must not scroll horizontally or vertically.
- Overflow belongs inside the relevant content component.
- Gameplay rules, persistence formats, validation, hints, history, and completion behavior remain unchanged.
- Interactive targets remain at least 44 by 44 CSS pixels.
- No essential text may be truncated.
- Base styles target narrow mobile screens; wider layouts use progressive `min-width` queries.

---

### Task 1: Ledger and briefing viewport shells

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: existing `View` state and commission navigation callbacks.
- Produces: `.app-shell`, `.app-topbar`, `.app-workspace`, `.ledger-switcher`, `.briefing-scroll`, and ledger carousel controls used only in `App.tsx`.

- [ ] **Step 1: Write failing interaction tests**

Add tests that render `App`, assert one active commission card on a narrow-layout semantic structure, click `Next commission`, and verify the Siege Lines card becomes active. Add a briefing test that verifies the prose is inside a region labeled `Commission briefing` and the primary action remains outside that scroll region.

```tsx
expect(screen.getByRole('region', { name: 'Commission selector' })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: 'Next commission' }));
expect(screen.getByRole('article', { name: /Highgate Passage/ })).toHaveAttribute('data-active', 'true');
expect(screen.getByRole('region', { name: 'Commission briefing' })).toBeInTheDocument();
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because the selector controls, active-card state, and briefing region do not exist.

- [ ] **Step 3: Implement the semantic shells**

Add local `commissionIndex` state. Render both ledger articles with `data-active`, `aria-hidden`, named previous/next controls, and a `1 / 2` indicator. Split briefing content into a bounded `Commission briefing` region and persistent action footer. Add shared shell CSS with `height: 100vh; height: 100dvh; overflow: hidden`, safe-area padding, and `minmax(0, 1fr)` tracks.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.test.tsx src/app/App.tsx src/app/app.css
git commit -m "feat: fit ledger and briefings to viewport"
```

### Task 2: Royal Inquest character carousel and tray

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/features/royal-inquest/RoyalInquest.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: `blackwoodKeep.characters`, existing `dispatch({ type: 'select-character' })`, and clue content.
- Produces: local `activeTray: 'characters' | 'clues'`, local `characterIndex: number`, named carousel controls, and pressed tray buttons.

- [ ] **Step 1: Write failing tray tests**

Navigate to the inquest. Assert the first character and `1 / 7` indicator are visible, click `Next character`, assert the second character and `2 / 7`, then switch to `Clues` and assert the witness list region is visible.

```tsx
expect(screen.getByText('1 / 7')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: 'Next character' }));
expect(screen.getByText('2 / 7')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: 'Clues' }));
expect(screen.getByRole('region', { name: 'Witness statements' })).toBeInTheDocument();
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because the carousel and tray controls do not exist.

- [ ] **Step 3: Implement minimal tray behavior**

Add presentation-only state, render a single character card with wrapping previous/next indexes, and dispatch selection from the visible character button. Render clues in a bounded region only when the clue tray is active. Recompose the page into `.puzzle-shell`, `.puzzle-board-region`, `.puzzle-actions`, and `.context-tray` without changing puzzle actions.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/app/App.test.tsx`

Expected: PASS, including existing inquest behavior tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.test.tsx src/features/royal-inquest/RoyalInquest.tsx src/app/app.css
git commit -m "feat: add viewport-first inquest tray"
```

### Task 3: Siege Lines pieces and rules tray

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/features/siege-lines/SiegeLines.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: `ROUTE_MASKS`, existing tool state, and existing orientation/status behavior.
- Produces: local `activeTray: 'pieces' | 'rules'` and pressed tray buttons sharing the inquest tray styles.

- [ ] **Step 1: Write failing tray test**

Navigate to Siege Lines, assert the `Pieces` tab is pressed, switch to `Rules`, and verify the region named `Architect's rules` appears while the board remains present.

```tsx
expect(screen.getByRole('button', { name: 'Pieces' })).toHaveAttribute('aria-pressed', 'true');
await user.click(screen.getByRole('button', { name: 'Rules' }));
expect(screen.getByRole('region', { name: "Architect's rules" })).toBeInTheDocument();
expect(screen.getByLabelText('Column road counts')).toBeInTheDocument();
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because the Siege Lines tray tabs do not exist.

- [ ] **Step 3: Implement minimal tray behavior**

Add local tray state, conditionally render pieces or rules in the shared bounded tray, and retain all existing route controls and callbacks. Apply the shared puzzle shell and board sizing classes.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/app/App.test.tsx`

Expected: PASS, including existing Siege Lines interaction coverage.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.test.tsx src/features/siege-lines/SiegeLines.tsx src/app/app.css
git commit -m "feat: add viewport-first siege tray"
```

### Task 4: Responsive overflow and regression verification

**Files:**
- Modify: `src/app/app.css`
- Modify: `src/app/App.test.tsx` only if an accessibility regression is discovered through a failing reproduction test.

**Interfaces:**
- Consumes: all shell and tray classes from Tasks 1–3.
- Produces: final mobile-first breakpoint behavior for phone, landscape, tablet, and desktop sizes.

- [ ] **Step 1: Add a failing structural regression test**

Assert every top-level view uses the shared `app-shell` class and each potentially long content section uses a named internal scroll region. This establishes the DOM contract needed for CSS containment.

```tsx
expect(container.querySelector('main')).toHaveClass('app-shell');
expect(screen.getByRole('region', { name: /briefing|statements|rules/i })).toHaveClass('internal-scroll');
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL for any remaining view or panel not using the containment contract.

- [ ] **Step 3: Complete responsive CSS**

Use mobile defaults with the board and tray stacked in bounded tracks. Add `@media (min-width: 801px)` for the board/rail layout and `@media (max-height: 600px) and (orientation: landscape)` for a compact side-by-side mobile layout. Ensure every grid/flex ancestor has `min-height: 0`, only `.internal-scroll` uses `overflow-y: auto`, and `html`, `body`, `#root`, and `main` remain overflow-hidden.

- [ ] **Step 4: Run full verification**

Run: `npm run test:run`

Expected: all tests pass with no unhandled errors.

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

Serve the built app and inspect 320×568, 390×844, 844×390, 768×1024, 1024×600, and 1440×900. For the ledger, both briefings, and both puzzle screens, confirm the document scroll dimensions do not exceed its client dimensions and designated panels can scroll internally.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.test.tsx src/app/app.css
git commit -m "fix: contain responsive screens within viewport"
```
