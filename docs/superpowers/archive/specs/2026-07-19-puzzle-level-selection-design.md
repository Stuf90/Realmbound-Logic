# Puzzle and Level Selection Design

## Goal

Replace the direct commission launcher on the King's Ledger with a scalable two-screen
selection flow. Players first choose a puzzle family, then choose one of 40 levels for
that family. The interface must also advertise planned puzzle families without allowing
players to open unfinished content.

## Navigation

The application starts on the King's Ledger puzzle-family screen. Selecting an enabled
family opens that family's level-selection screen. Selecting an enabled level opens its
existing briefing, and the briefing starts the existing puzzle.

Back navigation follows the same hierarchy in reverse:

1. puzzle to its level-selection screen;
2. briefing to its level-selection screen;
3. level-selection screen to the King's Ledger.

No browser routing is introduced. The existing in-memory view state remains sufficient
for this MVP navigation change.

## Puzzle-Family Catalog

The catalog is defined as data so new puzzle families and authored levels can be added
without duplicating screen markup. It contains these entries:

| Puzzle family | Availability | Current playable levels |
|---|---|---|
| Royal Inquest | Enabled | Level 1 |
| Siege Lines | Enabled | Level 1 |
| Leyline Weaving | Disabled, labeled "Coming later" | None |
| Celestial Binding | Disabled, labeled "Coming later" | None |
| Living Laws | Disabled, labeled "Coming later" | None |

Disabled family controls remain visible and use native disabled semantics. Their names
come from the existing post-MVP roadmap; none of their mechanics are implemented.

## Level Selection

Each enabled family displays a dedicated screen containing exactly 40 numbered level
controls. Level 1 launches the currently authored puzzle. Levels 2 through 40 are visible
disabled placeholders until content is authored for them. Disabled level controls use
native disabled semantics and cannot change the current view.

Level 1 may also show its authored title so players can connect it to the briefing:

- Royal Inquest: The Treason at Blackwood Keep
- Siege Lines: The Highgate Passage

## Completion Marks

The level screen reads the existing save record for the authored puzzle ID. When its
`completed` field is true, Level 1 displays a visible completion mark. The mark includes
screen-reader text and does not rely on color alone. Incomplete and missing save records
show no completion mark. Placeholder levels cannot be completed and show no mark.

This design does not change the persistence schema. Future authored levels will receive
unique puzzle IDs and can use the same completion lookup.

## Components and Data Flow

The app owns the selected family and current view. A puzzle catalog maps family metadata,
level metadata, briefing content, and the playable view. Reusable family-card and level-grid
rendering consumes that catalog. The level screen derives completion when it is rendered,
so returning from a newly completed puzzle immediately reflects the saved state.

Existing Royal Inquest and Siege Lines components remain responsible for gameplay and
saving. Their back callbacks return to the relevant level screen instead of the ledger.

## Presentation and Accessibility

The current parchment-and-royal-commission visual language remains. The family catalog
uses responsive cards; the 40 levels use a compact responsive grid. Enabled and disabled
states must be distinguishable beyond opacity, and all interactive controls retain visible
keyboard focus. Completion marks have an accessible name, while disabled family and level
buttons expose their disabled state to assistive technology.

## Testing

Application tests cover:

- all five family names appearing on the King's Ledger;
- only Royal Inquest and Siege Lines being selectable;
- an enabled family opening a screen with 40 level controls;
- only Level 1 being enabled for each current family;
- Level 1 opening the correct briefing and puzzle;
- briefing and puzzle back navigation returning to the correct level screen;
- a completed persisted Level 1 displaying an accessible completion mark;
- an incomplete or missing save displaying no completion mark.

Existing gameplay and persistence tests remain unchanged unless navigation assertions need
to be updated for the new hierarchy.

## Out of Scope

This change does not author Levels 2 through 40, implement post-MVP puzzle mechanics,
introduce unlock progression, migrate saves, add browser routes, or revise gameplay.
