# Mobile Viewport Fit Design

## Goal

Ensure every Realmbound Logic screen fits within a 360 by 740 CSS-pixel mobile viewport without document-level horizontal or vertical scrolling. Preserve the existing puzzle rules, content, navigation hierarchy, persistence, and accessibility behavior.

## Viewport Contract

The application shell occupies the dynamic viewport and remains overflow-hidden. Every direct grid and flex ancestor that contains shrinkable content must use a zero minimum size. Content that cannot fit remains available through a deliberately bounded internal scroll region; it must never increase the document height.

The 360 by 740 viewport is the minimum supported portrait target. At that size:

- The document scroll width and height do not exceed its client width and height.
- Navigation, the active puzzle board, primary tools, and current puzzle selection remain reachable.
- Touch targets remain at least 44 by 44 CSS pixels.
- Safe-area padding remains supported without forcing overflow.

## Puzzle Ledger

Replace the single-card carousel with a five-row puzzle-family list. All five puzzle options are visible simultaneously at 360 by 740.

Each row is one native button containing the family mark, discipline, title, and a short description. An available row opens its level archive. An unavailable row is disabled and visually greyed out. Rows do not contain a second action button or separate availability label.

Descriptions remain visible at the target viewport. They may be hidden only through an additional short-height fallback below the supported 740-pixel target, after spacing and type have first been tightened. Wider layouts may retain the list or progressively arrange it into columns when doing so does not introduce overflow.

## Level Archive and Briefing

The level archive keeps its top navigation and family heading inside the fixed shell. The level grid owns vertical scrolling within the remaining space.

The briefing keeps its back navigation and begin action visible. Briefing prose owns any required vertical scrolling inside the bordered sheet. Neither screen may cause the document to scroll.

## Puzzle Screens

Royal Inquest and Siege Lines retain the shared top bar, board panel, action toolbar, status, metrics, and contextual tray. Mobile spacing, headings, and tracks become more compact so their combined minimum sizes do not exceed the viewport.

The board panel receives the largest remaining flexible track. Its board scales from both available width and available height. The toolbar and contextual tray use bounded tracks; when their contents exceed those tracks, their designated content regions scroll internally.

Royal Inquest must fit fully at 360 by 740 with the castle board, character selection, navigation, and puzzle actions reachable. Siege Lines follows the same contract with its road board, tools, and piece selector. Completion panels remain overlays or bounded regions and cannot add document height.

## Responsive Implementation

Use mobile-first CSS with shared variables for shell padding, gaps, control height, and mobile tray height. Use `100dvh` with the existing fallback, `minmax(0, 1fr)` for flexible tracks, and explicit `min-width: 0` and `min-height: 0` at shrink boundaries.

Add targeted short-height rules only where the base mobile layout cannot satisfy the viewport contract. These rules may reduce nonessential spacing and secondary copy before hiding descriptions below the supported target. They may not shrink interactive targets below 44 pixels or truncate essential labels.

The change should remain primarily structural markup and CSS. Presentation-only responsive behavior must not enter puzzle state or persistence.

## Accessibility

Puzzle-family rows use native buttons with meaningful accessible names. Disabled families use the native disabled state. Existing visible focus treatment, semantic navigation, pressed states, and source-order reading flow remain intact.

Internal scroll regions retain accessible region labels where needed. Responsive changes must not create keyboard traps or require horizontal scrolling.

## Verification

Automated component tests will verify that:

- The ledger renders five puzzle-family buttons simultaneously.
- Available puzzle-family rows navigate without a nested action button.
- Future puzzle-family rows are disabled.
- Existing level, briefing, puzzle interaction, and persistence behavior remains intact.

Browser verification will exercise the ledger, both level archives, both briefings, Royal Inquest, and Siege Lines at 360 by 740. For every route, both the document element and body must fit the viewport without horizontal or vertical overflow. The verification also checks that boards, back navigation, primary tools, and the active character or piece controls are visible or reachable within their intended bounded regions.

Run only the targeted component tests needed for the changed behavior, followed by the production build. Existing puzzle-engine tests do not need repetition because puzzle rules are out of scope.

## Out of Scope

- Puzzle-rule, clue, or level-content changes.
- Persistence schema changes.
- New artwork, animation, or navigation levels.
- A general component-library refactor.
