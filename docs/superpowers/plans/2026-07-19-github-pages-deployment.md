# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Realmbound Logic at `https://stuf90.github.io/Realmbound-Logic/` from every successful build of `main`.

**Architecture:** Vite emits assets beneath the repository Pages subpath. A GitHub Actions workflow builds the locked npm project, uploads `dist` as a Pages artifact, and deploys that artifact only after the build succeeds.

**Tech Stack:** Vite, React, npm, GitHub Actions, GitHub Pages

## Global Constraints

- Keep application code, navigation, and browser `localStorage` persistence unchanged.
- Use `/Realmbound-Logic/` as the Vite base path.
- Deploy only the generated `dist` directory.
- Run automatically on pushes to `main` and allow manual dispatch.
- Use GitHub's official Pages actions and least-privilege workflow permissions.

---

### Task 1: Repository-aware production build

**Files:**
- Modify: `vite.config.ts`
- Verify: `dist/index.html`

**Interfaces:**
- Consumes: Vite's `base` configuration option.
- Produces: A production build whose asset URLs begin with `/Realmbound-Logic/`.

- [ ] **Step 1: Build before the change and verify the required URL is absent**

Run:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run build
Select-String -Path dist\index.html -SimpleMatch '/Realmbound-Logic/assets/'
```

Expected: the build passes, but `Select-String` returns no match because Vite currently emits `/assets/...` URLs.

- [ ] **Step 2: Configure the repository base path**

Change `vite.config.ts` to:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/Realmbound-Logic/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 3: Build and verify the generated asset URLs**

Run:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run build
Select-String -Path dist\index.html -SimpleMatch '/Realmbound-Logic/assets/'
```

Expected: `npm run build` exits 0 and `Select-String` prints the generated script and stylesheet references.

- [ ] **Step 4: Commit the Vite configuration**

```powershell
git add vite.config.ts
git commit -m "build: set GitHub Pages base path"
```

### Task 2: GitHub Pages deployment workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: npm's locked dependency graph and the `dist` output from `npm run build`.
- Produces: A Pages artifact named by `actions/upload-pages-artifact` and deployed by `actions/deploy-pages`.

- [ ] **Step 1: Create the deployment workflow**

Create `.github/workflows/deploy-pages.yml` with:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Review the workflow contract**

Run:

```powershell
Get-Content -Raw .github\workflows\deploy-pages.yml
rg -n "branches: \[main\]|workflow_dispatch|contents: read|pages: write|id-token: write|npm ci|npm run build|path: dist|needs: build" .github\workflows\deploy-pages.yml
```

Expected: the full workflow is printed and `rg` finds every trigger, permission, build command, artifact path, and deployment dependency.

- [ ] **Step 3: Commit the workflow**

```powershell
git add .github/workflows/deploy-pages.yml
git commit -m "ci: deploy app to GitHub Pages"
```

### Task 3: Final verification

**Files:**
- Verify: `vite.config.ts`
- Verify: `.github/workflows/deploy-pages.yml`
- Verify: `dist/index.html`

**Interfaces:**
- Consumes: the completed Vite and GitHub Actions configuration.
- Produces: verification evidence that tests pass, the production bundle builds, and Pages asset URLs use the repository subpath.

- [ ] **Step 1: Run the targeted project checks after implementation**

Run:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run test:run
& 'C:\Program Files\nodejs\npm.cmd' run build
Select-String -Path dist\index.html -SimpleMatch '/Realmbound-Logic/assets/'
git diff --check HEAD~2..HEAD
git status --short
```

Expected: 10 test files and 36 tests pass; the build exits 0; generated asset references include `/Realmbound-Logic/assets/`; `git diff --check` prints nothing; and only ignored build output, if any, remains outside Git status.

- [ ] **Step 2: Record the repository setting needed after push**

In the handoff, tell the repository owner to confirm **Settings > Pages > Source: GitHub Actions** after the branch is merged or pushed to `main`.
