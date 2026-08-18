import type { AvatarAssetId, PropAssetId, TileEnvironment } from '../../src/assets/royal-inquest/manifest';

// Flavor content for the generator. This is what keeps generated cases from reading like the same
// template with nouns swapped in - a good handful of entries per bucket so repeats across a run of
// a few dozen seeds are rare. Nothing here is load-bearing for validation; only `predicate` fields
// (built in clueGeneration.ts) are ever checked by `validateInquestDefinition`.

export const CASE_TITLE_PREFIXES: readonly string[] = [
  'Murder at',
  'Death at',
  'Silence at',
  'The Vigil at',
  'A Reckoning at',
  'Shadows over',
  'The Last Night at',
  'A Cold Hearth at',
  'Whispers at',
  'The Inquest at',
];

export const CASE_TITLE_PLACES: readonly string[] = [
  'Blackmoor Hall',
  'Cinderwell Priory',
  'Foxglove Manor',
  'Greywick Keep',
  'Thistlebrook Abbey',
  'Ravenscar Lodge',
  'Nettlefield Court',
  'Duskwater Grange',
  'Emberfall House',
  'Moorgate Rectory',
  'Wickstone Hollow',
  'Pemberly Croft',
  'Ashford Priory',
  'Cragmoor Estate',
  'Ferrymoor Manor',
];

export const CHAMBER_NAME_FRAGMENTS: Record<TileEnvironment, readonly string[]> = {
  room: ['Study', 'Parlour', 'Drawing Room', 'Reading Nook', 'Sitting Room', 'Map Room', 'West Wing Study'],
  garden: ['Rose Garden', 'Herb Yard', 'Orchard', 'Topiary Walk', 'Kitchen Garden', 'Courtyard Garden', 'Hedge Maze'],
  church: ['Chapel', 'Nave', 'Vestry', 'Bell Tower', 'Crypt', 'Sanctuary', 'Cloister'],
  kitchen: ['Kitchen', 'Scullery', 'Pantry', 'Bakehouse', "Cook's Quarter", 'Larder', 'Stillroom'],
  dungeon: ['Dungeon', 'Cellar', 'Oubliette', 'Holding Cell', 'Undercroft', 'Gaol', 'Wine Vault'],
  royalRoom: ['Throne Room', 'Great Hall', 'Solar', 'Audience Chamber', 'Council Room', 'Antechamber', 'Long Gallery'],
  hallway: ['Hallway', 'Corridor', 'Gallery', 'Passage'],
};

export interface CharacterTemplate {
  title: string;
  avatarId: AvatarAssetId;
  category: 'noble' | 'servant';
}

// A pool bigger than the max cast size (7) so a run rarely repeats the same role twice, each
// paired with a plausible avatar and a broad category usable by `category-not-beside-prop`.
export const CHARACTER_TEMPLATES: readonly CharacterTemplate[] = [
  { title: 'The Chancellor', avatarId: 'nobleman', category: 'noble' },
  { title: 'The Duchess', avatarId: 'noblewoman', category: 'noble' },
  { title: 'The Falconer', avatarId: 'knight', category: 'servant' },
  { title: 'The Apothecary', avatarId: 'court-physician', category: 'servant' },
  { title: 'The Seamstress', avatarId: 'maid', category: 'servant' },
  { title: 'The Bailiff', avatarId: 'guard-captain', category: 'servant' },
  { title: 'The Herald', avatarId: 'royal-envoy', category: 'noble' },
  { title: 'The Vintner', avatarId: 'merchant', category: 'servant' },
  { title: 'The Locksmith', avatarId: 'steward', category: 'servant' },
  { title: 'The Almoner', avatarId: 'monk', category: 'servant' },
  { title: 'The Confessor', avatarId: 'priest', category: 'servant' },
  { title: 'The Archivist', avatarId: 'scholar', category: 'noble' },
  { title: 'The Head Cook', avatarId: 'cook', category: 'servant' },
  { title: 'The Groundskeeper', avatarId: 'gardener', category: 'servant' },
  { title: 'The Chatelaine', avatarId: 'noblewoman', category: 'noble' },
  { title: 'The Master-at-Arms', avatarId: 'knight', category: 'servant' },
  { title: 'The Prisoner', avatarId: 'prisoner', category: 'servant' },
  { title: 'The Consort', avatarId: 'royal-consort', category: 'noble' },
  { title: 'The Heir', avatarId: 'royal-heir', category: 'noble' },
  { title: 'The Monarch', avatarId: 'monarch', category: 'noble' },
  { title: 'The Steward', avatarId: 'steward', category: 'servant' },
  { title: 'The Physician', avatarId: 'court-physician', category: 'servant' },
  { title: 'The Envoy', avatarId: 'royal-envoy', category: 'noble' },
  { title: 'The Scholar', avatarId: 'scholar', category: 'noble' },
];

// Templates for each predicate type's flavor `text`. `{name}` = target character's name (already
// includes "The"), other placeholders filled per predicate. Never parsed for correctness - only the
// structured `predicate` is - but kept sensible so a human can freely hand-edit generator output.
export const CLUE_TEMPLATES: Record<string, readonly string[]> = {
  'exact-chamber': [
    '{name} was seen in the {chamber}.',
    '{name} spent the evening in the {chamber}.',
    'A witness placed {name} in the {chamber}.',
    '{name} was last known to be in the {chamber}.',
  ],
  'on-prop': [
    '{name} was found seated in {prop}.',
    '{name} sat at {prop} for most of the night.',
    'Someone recalled {name} resting on {prop}.',
  ],
  'same-chamber': [
    '{name} and {other} were seen together, in the same room.',
    '{name} shared a chamber with {other} that night.',
  ],
  'different-chamber': [
    '{name} and {other} were never in the same room that night.',
    '{name} kept to a different chamber than {other}.',
  ],
  'chamber-occupant-count-zero': [
    '{name} was entirely alone in their chamber.',
    'No one else shared a room with {name}.',
  ],
  'chamber-occupant-count': [
    '{name} shared a chamber with exactly {count} other souls.',
    'Exactly {count} other people were in the room with {name}.',
  ],
  'in-corner': [
    '{name} kept to a corner of the estate, farthest from the rest.',
    '{name} was found tucked into one of the estate\'s far corners.',
  ],
  'not-beside-wall': [
    '{name} stood well away from any outer wall.',
    'Nothing bordered {name}\'s spot but more of the same room.',
  ],
  'category-not-beside-prop': [
    'None of the {category} were ever seen near {prop}.',
    'No {category} came within reach of {prop} that night.',
  ],
  'shares-prop-neighbor': [
    '{name} stood by {prop} — and was not the only one to do so.',
    'Someone else lingered by {prop} alongside {name}.',
  ],
  'diagonal-from': [
    '{name} sat on the diagonal from {other}, one room over and one room across.',
    'Trace a line corner-to-corner from {other} and you land on {name}.',
  ],
  'offset-from': [
    '{name} was {rowOffset} row(s) and {columnOffset} column(s) from {other}, by the estate\'s plan.',
    'Measured against {other}, {name} sat {rowOffset} row(s) down and {columnOffset} column(s) across.',
  ],
  'by-window': [
    '{name} was seen standing by the window.',
    '{name} liked to linger near the window that night.',
  ],
  'seated-character-count': [
    'Exactly {count} of the household were seated in a chair that night.',
    'Only {count} people ever sat down at all.',
  ],
  'prop-neighbor-count': [
    'Exactly {count} people stood near {prop} that night.',
    'A count puts exactly {count} people beside {prop}.',
  ],
};
