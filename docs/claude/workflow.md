# Claude Code workflow for Realmbound Logic

This repo's plan/spec/worktree conventions predate Claude Code and are shared with Codex (see [`AGENTS.md`](../../AGENTS.md) and `docs/superpowers/`). This doc maps those conventions onto Claude Code's own tools so both agents produce compatible artifacts.

## Plans and specs

- Design docs: `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`
- Implementation plans: `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`

Before implementing, check both directories for the newest file touching the area you're changing — a later plan for the same feature supersedes an earlier one (e.g. the two mobile-viewport plans, or the two royal-inquest-art-assets plans).

When starting new work:

1. Use Plan mode to design the change and get it approved.
2. Once approved, write the plan to `docs/superpowers/plans/` (and a design doc to `docs/superpowers/specs/` if the change needs one), matching the structure of existing files in those directories.
3. Implement in a dedicated worktree (below), per `AGENTS.md`'s rule.

## Worktrees

Existing feature worktrees live under `.worktrees/<slug>/` (each carries its own copy of `AGENTS.md` — that's normal, it's a tracked file). To start new implementation work:

- Prefer the `EnterWorktree` tool over manual `git worktree add`, so the worktree is registered and torn down through the same mechanism the harness tracks.
- If delegating implementation to a subagent, pass `isolation: "worktree"` to `Agent` instead of pre-creating a worktree yourself.
- Never implement directly on `main`.

## Testing

Match `AGENTS.md`: finish the implementation, then run only the targeted tests for what changed (e.g. `npm test -- <pattern>` or `npm run test:run -- <pattern>`), not the full suite, unless the user asks for a full pass.

## Codex compatibility

Nothing above changes what Codex sees. Codex reads `AGENTS.md` directly; Claude Code reads `CLAUDE.md`, which imports `AGENTS.md` via `@AGENTS.md` and points here for Claude-specific detail. Edit `AGENTS.md` for any rule that should apply to both agents — this file only holds Claude-tool-specific mapping, not new shared rules.
