@AGENTS.md

Realmbound Logic is a local-only puzzle web app (React + TypeScript + Vite + Vitest). This file adds Claude Code-specific notes on top of the shared agent guidelines imported above from `AGENTS.md`.

## Project orientation

- Gameplay and MVP scope: [GAMEPLAY_SPECIFICATION.md](GAMEPLAY_SPECIFICATION.md) and [PUZZLE_IMPLEMENTATION.md](PUZZLE_IMPLEMENTATION.md).
- Approved design docs and implementation plans: `docs/superpowers/specs/` and `docs/superpowers/plans/`. These are shared between Codex and Claude Code — check both for the newest file touching the area you're about to change before starting new work there.
- Two puzzle families: **The Royal Inquest** (`src/features/royal-inquest/`, Murdoku-style placement) and **Siege Lines** (`src/features/siege-lines/`, Train Tracks mechanics).
- Royal Inquest art pipeline: `tools/royal_inquest_assets/` (Python) generates and validates the 512x512 PNG assets in `src/assets/royal-inquest/`.

## Commands

- `npm run dev` — start the Vite dev server.
- `npm run build` — typecheck (`tsc -b`) then build.
- `npm test` / `npm run test:run` — Vitest (watch / single run).

## Working in this repo with Claude Code

The shared rule imported above: implement each plan in a dedicated Git worktree, finish the implementation before testing, and keep test runs targeted.

- Start new work with Plan mode; save the approved design under `docs/superpowers/specs/` and the implementation plan under `docs/superpowers/plans/`, following the existing files' naming and structure.
- Create the dedicated worktree with the `EnterWorktree` tool, or pass `isolation: "worktree"` to `Agent` when delegating implementation to a subagent, rather than running raw `git worktree` commands.
- Use `TodoWrite` to track multi-step implementation work within a plan.
- Prefer the `Explore` agent over manual multi-round `Grep`/`Glob` chains for broad codebase questions.
- See [docs/claude/workflow.md](docs/claude/workflow.md) for the full mapping from this repo's plan/spec/worktree conventions to Claude Code tools.

## Keep in sync

Shared instructions (worktree discipline, testing policy) live in `AGENTS.md` and are imported at the top of this file — edit `AGENTS.md`, not this file, when that guidance changes. Add Claude Code-only notes here instead of duplicating shared rules.
