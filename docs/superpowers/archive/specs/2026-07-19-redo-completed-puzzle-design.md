# Redo Completed Puzzle Design

## Goal

Let a player deliberately reset and replay a completed puzzle while showing how long the previous successful attempt took. The reset must never happen merely because the completed level was selected.

## Interaction

Selecting an incomplete Level 1 keeps the current behavior and opens its briefing.

Selecting a completed Level 1 opens an accessible in-app confirmation dialog. The dialog names the puzzle, displays the saved `elapsedSeconds` value as a human-readable completion time, and offers two actions:

- **Cancel** closes the dialog without changing the save or navigation state.
- **Reset and replay** deletes the puzzle's saved record and immediately opens a fresh puzzle, skipping the briefing.

The dialog uses modal semantics, has a visible heading, and remains usable by keyboard and assistive technology. The existing parchment visual language is retained.

## Data and Navigation

The level-selection screen already loads the authored puzzle's save to determine completion. It will retain the completed save selected by the player long enough to render the dialog and its elapsed time.

Confirming a reset removes only the selected puzzle's `realmbound:<puzzleId>` local-storage record. It then asks the app to open that family's puzzle view. Each gameplay component already initializes its default state when no save exists, so no persistence schema change is required.

Cancelling clears only the pending dialog state. Saves for other puzzles and all unrelated browser storage remain untouched.

## Time Formatting

Elapsed time is shown in a compact clock format:

- less than one hour: `m:ss`;
- one hour or more: `h:mm:ss`.

Seconds and minutes are zero-padded where required. Invalid or negative elapsed values are treated as zero so the dialog always presents a stable value.

## Testing

Focused application and persistence tests will verify:

- completed levels open the reset dialog and show their prior completion time;
- cancelling preserves the completed save and remains on level selection;
- confirming removes only that puzzle's save and opens the fresh puzzle immediately;
- incomplete levels continue to open the briefing without a reset dialog;
- the behavior works through the shared level flow for both authored puzzle families;
- elapsed time formatting covers sub-hour and hour-or-longer values.

## Out of Scope

This change does not preserve a history of completion times, add a best-time system, reset incomplete puzzles, alter the save schema, or add reset controls inside gameplay.
