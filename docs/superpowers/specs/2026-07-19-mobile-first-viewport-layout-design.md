# Mobile-First Viewport Layout Design

## Goal

Rework Realmbound Logic into a mobile-first interface in which every application screen fits within the visible device viewport. The document must not scroll horizontally or vertically. When content cannot fit, scrolling belongs inside the relevant component, such as the clue list, rather than on the page.

Gameplay rules, persistence formats, validation, hints, history, and completion behavior remain unchanged.

## Layout Direction

Use a board-first workspace. The puzzle board is the dominant element, while characters, clues, puzzle guidance, and secondary controls occupy a contextual tray.

Every screen uses a full-height application shell based on `100dvh`, with safe-area padding for devices with notches or browser chrome. The shell has three regions:

1. A compact top bar containing back navigation, a shortened title, and progress metrics where applicable.
2. A flexible central workspace sized from the remaining width and height.
3. A contextual tray containing puzzle-specific choices, reference material, and secondary actions.

On phones and short windows, the tray sits below the board and shows one panel at a time. On wider viewports, it becomes a right-side rail. The board is sized from the smaller available dimension so it cannot force page overflow.

## Screen Behavior

### Ledger

The ledger fills the viewport with a compact heading and commission selector. Commission cards become a mobile carousel or switchable single-card region rather than a vertically stacked list. The active card provides the commission summary and primary action. On wider screens, both cards may appear side by side when they fit without overflow.

### Briefings

The briefing screen uses a fixed-height shell with persistent back navigation and primary action. The briefing sheet fills the remaining space. Its prose and rules may scroll inside the sheet when the available height is insufficient, while the page remains fixed.

### Puzzle Screens

Puzzle pages use the shared top bar, board workspace, action toolbar, and contextual tray.

- The board remains visible and receives the largest feasible square area.
- High-frequency actions remain reachable in a compact toolbar with touch targets of at least 44 by 44 CSS pixels.
- Status and metrics are condensed into the shell rather than creating additional page height.
- Reset has lower visual emphasis than common reversible actions.
- Completion messaging appears as an overlay or bounded panel within the workspace and does not expand the document.

### Royal Inquest Tray

The tray has switchable `Characters` and `Clues` views.

- The character view shows one selected character at a time with previous and next controls and a position indicator such as `2 / 6`.
- Selecting the displayed character updates the existing selected-character puzzle state.
- Moving through the character carousel changes only local presentation state until the user selects a character.
- The clue view displays an internally scrollable ordered list.

### Siege Lines Tray

The tray has switchable `Pieces` and `Rules` views.

- The pieces view exposes road orientations in a compact, wrapping selector.
- The rules view uses an internally scrollable list when necessary.
- Existing tool and board-edit behavior remains unchanged.

## Responsive Styling

Base styles target narrow mobile screens. Progressive `min-width` media queries add the side rail, larger spacing, and multi-column ledger presentation only when the available viewport can support them.

Shared CSS variables describe shell spacing, top-bar height, tray size, and minimum interaction size. Layout uses grid and flex tracks with `minmax(0, 1fr)` so content is allowed to shrink. Internal scroll containers require `min-height: 0` or `min-width: 0` at each relevant grid or flex boundary.

Dynamic viewport units account for changing mobile browser controls. Safe-area environment variables protect interactive content. A fallback height remains available for browsers without dynamic viewport-unit support.

No essential text is truncated. Long prose moves into a bounded scroll region. Horizontal scrolling is not used.

## Accessibility and Interaction

All tabs, carousel controls, toolbar actions, and selectors use native buttons with visible focus states and meaningful accessible labels. Active tray views and tools expose pressed or selected state. The DOM follows the visual reading order at each breakpoint without custom tab indices.

Internal scroll areas remain keyboard accessible through their naturally focusable content. Motion is unnecessary for understanding the layout; any optional transitions honor reduced-motion preferences.

## Component Changes

- `App.tsx` gains semantic wrappers and small local presentation state for the ledger selector where required.
- `RoyalInquest.tsx` gains local state for the active tray view and displayed character index. Existing reducer and persisted puzzle state are not expanded for presentation-only state.
- `SiegeLines.tsx` gains local state for the active tray view.
- `app.css` is reorganized around mobile defaults, shared viewport-shell primitives, and progressive wider-screen rules.

The shared shell and tray patterns should be expressed with reusable class structures rather than introducing a new component abstraction unless markup repetition makes that abstraction clearly smaller and easier to understand.

## Edge Cases

- On exceptionally short screens, the board shrinks to its usable minimum before the toolbar or tray becomes internally scrollable.
- Essential navigation remains visible at every supported size.
- Completion panels, validation status, and long localized copy stay within bounded regions.
- Device rotation recalculates board and tray sizing without losing puzzle or presentation state.
- Browser zoom may require internal scrolling but must not introduce document-level overflow.

## Verification

Automated checks will cover character switching, tray selection, preserved puzzle interaction, and existing persistence behavior. The full existing test suite and production build must pass.

Visual verification will exercise representative phone, tablet, laptop, landscape, and short-window dimensions. At each size:

- `document.documentElement.scrollWidth` must not exceed its client width.
- `document.documentElement.scrollHeight` must not exceed its client height.
- The board, navigation, and primary controls remain reachable.
- Designated clue, rules, or briefing containers scroll internally when their content exceeds their bounds.
- Focus indicators are visible and interactive targets retain their minimum size.

## Out of Scope

- Gameplay or puzzle-rule changes.
- Persistence schema changes.
- New content, artwork, or animation systems.
- A general component-library refactor.
