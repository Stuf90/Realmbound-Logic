# Agent Instructions

## Implementation and Testing

- Always implement a new plan in a dedicated Git worktree. Never implement a new plan directly on the `main` branch; if already working in an appropriate non-main worktree, continue using it.
- When implementing a plan, complete the implementation before running tests.
- Keep testing token-efficient: run only the targeted, high-value tests needed to verify the completed change.
- Avoid unnecessarily broad or repetitive test runs.
- Watch for long-running tests and use bounded timeouts where practical.
