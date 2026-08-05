# Mobile Viewport Fit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ledger and every puzzle route fit a 360 by 740 CSS-pixel mobile viewport without document-level scrolling.

**Architecture:** Replace the ledger carousel with semantic puzzle-family button rows, then revise the existing mobile-first CSS tracks so every page consumes only the dynamic viewport. Keep excess prose and reference content inside the existing bounded scroll regions; do not change puzzle state or persistence.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Vite

## Global Constraints

- The minimum supported portrait viewport is exactly 360 by 740 CSS pixels.
- The document must not scroll horizontally or vertically on any route.
- Touch targets remain at least 44 by 44 CSS pixels.
- All five ledger options must be simultaneously visible at the target viewport.
- Ledger descriptions remain visible at the target viewport.
- Unavailable puzzle families are disabled and visually greyed out.
- Puzzle rules, content, persistence, and navigation hierarchy remain unchanged.
- Complete implementation before running the final targeted verification, per `AGENTS.md`.

---

### Task 1: Replace the Ledger Carousel with Button Rows

**Files:**
- Modify: `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `PUZZLE_FAMILIES: PuzzleFamily[]` and `onSelect(familyId: PuzzleFamilyId): void`
- Produces: one accessible native button per family; enabled buttons call `onSelect`, disabled buttons do not

- [ ] **Step 1: Write the failing ledger behavior tests**

Replace the current `shows current and future puzzle families` test and add a navigation assertion:

```tsx
it('shows every puzzle family as one ledger button', () => {
  render(<App />);

  const families = [
    'Royal Inquest',
    'Siege Lines',
    'Leyline Weaving',
    'Celestial Binding',
    'Living Laws',
  ];

  expect(screen.getByRole('region', { name: 'Puzzle families' })).toBeInTheDocument();
  for (const name of families) {
    expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
  }
  expect(screen.getAllByRole('button')).toHaveLength(5);
  expect(screen.getByRole('button', { name: /Royal Inquest/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Siege Lines/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Leyline Weaving/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Celestial Binding/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Living Laws/ })).toBeDisabled();
});

it('opens a family from its ledger row', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));

  expect(screen.getByRole('list', { name: 'Royal Inquest levels' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the ledger test to verify it fails**

Run: `npm test -- --run src/app/App.test.tsx -t "ledger"`

Expected: FAIL because the current ledger includes carousel navigation buttons and each family is not itself a button.

- [ ] **Step 3: Implement semantic ledger rows**

Remove `familyIndex`, the card articles, nested action buttons, carousel controls, and the now-unused `toRoman` helper. Render this structure inside `PuzzleLedger`:

```tsx
function PuzzleLedger({ onSelect }: { onSelect: (familyId: PuzzleFamilyId) => void }) {
  return <main className="app-shell ledger">
    <header className="ledger-header">
      <p className="eyebrow">His Majesty’s Office of Reason</p>
      <h1>The King’s Ledger</h1>
      <p>Choose a discipline, then select a commission from its record.</p>
    </header>
    <section className="commission-list app-workspace" role="region" aria-label="Puzzle families">
      {PUZZLE_FAMILIES.map((family, index) =>
        <button
          className={`commission-row ${family.accent}`}
          disabled={!family.available}
          onClick={() => onSelect(family.id)}
          aria-label={`${family.name}. ${family.discipline}. ${family.description}`}
          key={family.id}
        >
          <span className="card-mark" aria-hidden="true">{['I', 'II', 'III', 'IV', 'V'][index]}</span>
          <span className="commission-copy">
            <span className="eyebrow">{family.discipline}</span>
            <strong>{family.name}</strong>
            <span className="commission-description">{family.description}</span>
          </span>
        </button>)}
    </section>
    <footer className="ledger-footer">Progress is kept automatically in this browser.</footer>
  </main>;
}
```

- [ ] **Step 4: Run the ledger tests to verify they pass**

Run: `npm test -- --run src/app/App.test.tsx -t "ledger"`

Expected: PASS for both ledger tests.

- [ ] **Step 5: Commit the ledger behavior**

```powershell
git add -- src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: show puzzle families as ledger rows"
```

### Task 2: Enforce the 360 by 740 Viewport Layout

**Files:**
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: `.commission-list`, `.commission-row`, and `.commission-copy` markup from Task 1; existing shared shell and internal-scroll classes
- Produces: a no-document-scroll responsive layout at 360 by 740 with bounded internal scroll regions

- [ ] **Step 1: Replace carousel/card ledger styling with the compact list**

Delete `.commission-selector`, `.commission-grid`, `.commission-card`, and ledger `.carousel-controls` rules. Define the mobile list using:

```css
.ledger { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: var(--gap); }
.ledger-header { padding-bottom: .4rem; border-bottom: 2px solid var(--ink); }
.ledger-header h1 { margin-block: .15rem; }
.ledger-header > p:last-child { font-size: clamp(.78rem, 2.8vw, .95rem); }
.commission-list { display: grid; grid-template-rows: repeat(5, minmax(0, 1fr)); gap: .35rem; }
.commission-row { display: grid; min-width: 0; min-height: 44px; grid-template-columns: 2.25rem minmax(0, 1fr); align-items: center; gap: .55rem; overflow: hidden; padding: .38rem .55rem; border: 2px solid var(--crimson); background: rgba(255,248,222,.72); color: var(--ink); text-align: left; box-shadow: 2px 2px 0 rgba(55,29,18,.16); }
.commission-row.blue { border-color: var(--blue); }
.commission-row:disabled { opacity: .4; filter: grayscale(1); }
.commission-copy { display: grid; min-width: 0; gap: .08rem; }
.commission-copy strong { font-size: clamp(.9rem, 3.7vw, 1.15rem); line-height: 1; }
.commission-description { overflow: hidden; font-size: clamp(.68rem, 2.7vw, .82rem); line-height: 1.1; text-overflow: ellipsis; white-space: nowrap; }
.card-mark { display: grid; width: 2rem; height: 2rem; place-items: center; border: 2px solid currentColor; border-radius: 50%; color: var(--gold); font-weight: 700; }
.ledger-footer { font-size: .72rem; font-style: italic; text-align: center; }
```

- [ ] **Step 2: Compact shared mobile puzzle tracks**

Update the base mobile variables and puzzle rules so the top bar, board, toolbar, status, and tray fit inside 740 pixels:

```css
:root {
  --gap: clamp(.3rem, 1.2vmin, .75rem);
  --shell-pad: max(.4rem, env(safe-area-inset-top)) max(.4rem, env(safe-area-inset-right)) max(.4rem, env(safe-area-inset-bottom)) max(.4rem, env(safe-area-inset-left));
}
.app-topbar { min-height: 44px; }
.puzzle-layout { grid-template-rows: minmax(0, 1fr) minmax(6.5rem, 21dvh); }
.board-panel { grid-template-rows: minmax(0, 1fr) auto minmax(1.8rem, auto); gap: .25rem; padding: .3rem; }
.inquest-board { width: min(100%, 45dvh); min-width: 0; }
.toolbar { grid-template-columns: repeat(4, minmax(44px, 1fr)); max-height: 5.5rem; }
.context-tray { padding: .3rem; }
```

Keep the existing 44-pixel cell and control minimums. Preserve the wide-screen media query, but change its ledger rule to lay out `.commission-list` in responsive columns only when the full rows remain readable.

- [ ] **Step 3: Add the supported phone-height refinement**

Add a portrait rule that tightens secondary content without hiding ledger descriptions at 740 pixels:

```css
@media (max-height: 740px) and (orientation: portrait) {
  .ledger-header > p:last-child, .ledger-footer { font-size: .68rem; }
  .puzzle-topbar .eyebrow { display: none; }
  .puzzle-topbar h1 { font-size: 1rem; }
  .status { max-height: 2.4rem; font-size: .72rem; }
  .featured-portrait { grid-template-columns: auto 1fr; }
  .featured-portrait span { grid-row: auto; }
  .featured-portrait small { display: none; }
}

@media (max-height: 620px) and (orientation: portrait) {
  .commission-description { display: none; }
}
```

- [ ] **Step 4: Review the completed stylesheet before testing**

Run: `git diff --check`

Expected: no output. Confirm that no rule lowers `button`, `.cell`, or toolbar controls below 44 pixels and that only `.internal-scroll`, `.board-scroll`, status, toolbar, and bounded content regions can scroll.

- [ ] **Step 5: Commit responsive styling**

```powershell
git add -- src/app/app.css
git commit -m "fix: fit mobile routes within viewport"
```

### Task 3: Targeted Verification

**Files:**
- Verify: `src/app/App.test.tsx`
- Verify: `src/app/app.css`

**Interfaces:**
- Consumes: completed Task 1 and Task 2 implementation
- Produces: test, build, and 360 by 740 browser evidence

- [ ] **Step 1: Run the targeted application tests**

Run: `npm test -- --run src/app/App.test.tsx`

Expected: all application navigation and puzzle interaction tests pass with no warnings.

- [ ] **Step 2: Build the production bundle**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully with exit code 0.

- [ ] **Step 3: Verify every route at 360 by 740**

Start the app with `npm run dev -- --host 127.0.0.1`, open it at a 360 by 740 viewport, and visit:

1. Ledger.
2. Royal Inquest level archive.
3. Royal Inquest briefing.
4. Royal Inquest puzzle.
5. Siege Lines level archive.
6. Siege Lines briefing.
7. Siege Lines puzzle.

For each route, evaluate:

```js
({
  documentWidth: document.documentElement.scrollWidth,
  viewportWidth: document.documentElement.clientWidth,
  documentHeight: document.documentElement.scrollHeight,
  viewportHeight: document.documentElement.clientHeight,
  bodyWidth: document.body.scrollWidth,
  bodyHeight: document.body.scrollHeight,
})
```

Expected: document and body widths are at most 360; document and body heights are at most 740. Confirm visually that all five ledger descriptions are present, and that back navigation, board, puzzle actions, and active character or piece control are visible or reachable within bounded internal regions.

- [ ] **Step 4: Record final repository state**

Run: `git status --short`

Expected: only the pre-existing untracked `.pnpm-store/` entry; no implementation files remain uncommitted.
