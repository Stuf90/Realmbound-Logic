# npm-only Package Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make npm the repository's sole documented and reproducible package-management workflow.

**Architecture:** Use `package.json` plus npm's lockfile v3 as the only package-manager metadata. Remove pnpm's tracked lockfile and local store, while retaining the existing package-manager-neutral scripts.

**Tech Stack:** npm 11.16.0, Node.js, Vite, React, TypeScript, Vitest

## Global Constraints

- Do not add install-time package-manager enforcement.
- Keep the existing `dev`, `build`, `test`, and `test:run` script commands unchanged.
- `package-lock.json` must be the sole dependency lockfile.
- Do not modify application source code.

---

### Task 1: Normalize package-manager metadata and verify npm workflows

**Files:**
- Modify: `package.json`
- Create/retain: `package-lock.json`
- Delete: `pnpm-lock.yaml`
- Delete local artifact: `.pnpm-store/`
- Test: existing Vitest test suite and TypeScript/Vite production build

**Interfaces:**
- Consumes: the existing dependency declarations and npm-compatible scripts in `package.json`
- Produces: npm 11.16.0 package-manager metadata and a reproducible npm lockfile

- [ ] **Step 1: Record npm as the supported package manager**

Add this top-level field after `"version"` in `package.json`:

```json
"packageManager": "npm@11.16.0",
```

- [ ] **Step 2: Remove pnpm artifacts**

Delete tracked `pnpm-lock.yaml` and the untracked local `.pnpm-store/` directory. Confirm that neither path exists:

```powershell
Test-Path -LiteralPath '.\pnpm-lock.yaml'
Test-Path -LiteralPath '.\.pnpm-store'
```

Expected: both commands output `False`.

- [ ] **Step 3: Refresh npm's lockfile**

Run:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
```

Expected: exit code 0, `package-lock.json` remains lockfile version 3, and `package.json` contains `"packageManager": "npm@11.16.0"`.

- [ ] **Step 4: Run the automated tests**

Run:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test:run
```

Expected: exit code 0 and all Vitest test files pass.

- [ ] **Step 5: Run the production build**

Run:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Expected: exit code 0 and Vite writes the production bundle to `dist/`.

- [ ] **Step 6: Audit and commit the migration**

Run:

```powershell
git status --short
git diff --check
git diff -- package.json package-lock.json pnpm-lock.yaml
```

Expected: only `package.json`, `package-lock.json`, and `pnpm-lock.yaml` are part of the migration; no pnpm artifact remains; `git diff --check` produces no errors.

Commit:

```powershell
git add -- package.json package-lock.json pnpm-lock.yaml
git commit -m "chore: switch package management to npm"
```

