---
name: realmbound-workflow
description: Use whenever starting new implementation work in this repo (a feature, fix, or any non-trivial change) — before writing a plan, before creating a worktree, or before running tests. Walks through this repo's plan/spec/worktree/test conventions, shared with Codex via AGENTS.md.
---

# Realmbound Logic workflow

This repo's plan/spec/worktree conventions predate Claude Code and are shared with Codex (see [`AGENTS.md`](../../../AGENTS.md) and `docs/superpowers/`).

## Plans and specs

- Design docs: `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`
- Implementation plans: `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`
- Completed features whose plan/spec is no longer active guidance live in `docs/superpowers/archive/plans/` and `docs/superpowers/archive/specs/` — check there for history, but treat only the non-archived directories as current.

Before implementing, check both active directories for the newest file touching the area you're changing — a later plan for the same feature supersedes an earlier one (e.g. the two mobile-viewport plans, or the two royal-inquest-art-assets plans).

When starting new work:

1. Use Plan mode to design the change and get it approved.
2. Once approved, write the plan to `docs/superpowers/plans/` (and a design doc to `docs/superpowers/specs/` if the change needs one), matching the structure of existing files in those directories.
3. Implement in a dedicated worktree (below), per `AGENTS.md`'s rule.
4. Once the feature is merged into main, move its plan/spec pair into `docs/superpowers/archive/`.

## Worktrees

- Prefer the `EnterWorktree` tool over manual `git worktree add`, so the worktree is registered and torn down through the same mechanism the harness tracks.
- If delegating implementation to a subagent, pass `isolation: "worktree"` to `Agent` instead of pre-creating a worktree yourself.
- Never implement directly on `main`.
- Once a worktree's branch is merged into main, remove it (`git worktree remove <path>`) rather than leaving it checked out.

## Testing

Match `AGENTS.md`: finish the implementation, then run only the targeted tests for what changed (e.g. `npm test -- <pattern>` or `npm run test:run -- <pattern>`), not the full suite, unless the user asks for a full pass.

## Codex compatibility

Nothing above changes what Codex sees. Codex reads `AGENTS.md` directly; Claude Code reads `CLAUDE.md`, which imports `AGENTS.md` via `@AGENTS.md`. Edit `AGENTS.md` for any rule that should apply to both agents — this skill only holds Claude-tool-specific mapping, not new shared rules.
