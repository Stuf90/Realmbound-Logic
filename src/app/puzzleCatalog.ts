export type PuzzleFamilyId =
  | 'royal-inquest'
  | 'siege-lines'
  | 'leyline-weaving'
  | 'celestial-binding'
  | 'living-laws';

export interface PuzzleFamily {
  id: PuzzleFamilyId;
  name: string;
  discipline: string;
  description: string;
  available: boolean;
  accent: 'crimson' | 'blue' | 'gold';
  levelOne?: {
    title: string;
    puzzleId: string;
  };
}

export const PUZZLE_FAMILIES: PuzzleFamily[] = [
  {
    id: 'royal-inquest',
    name: 'Royal Inquest',
    discipline: 'Investigation',
    description: 'Place six persons within the keep and expose the traitor through spatial deduction.',
    available: true,
    accent: 'crimson',
    levelOne: { title: 'The Treason at Blackwood Keep', puzzleId: 'blackwood-keep' },
  },
  {
    id: 'siege-lines',
    name: 'Siege Lines',
    discipline: 'Architecture',
    description: 'Restore the King’s highway as one exact route through the besieged valley.',
    available: true,
    accent: 'blue',
    levelOne: { title: 'The Highgate Passage', puzzleId: 'highgate-passage' },
  },
  {
    id: 'leyline-weaving',
    name: 'Leyline Weaving',
    discipline: 'Runecraft',
    description: 'Rotate rune tiles to carry magic from its source through a connected field.',
    available: false,
    accent: 'gold',
  },
  {
    id: 'celestial-binding',
    name: 'Celestial Binding',
    discipline: 'Astromancy',
    description: 'Trace every required bond between the stars in one continuous journey.',
    available: false,
    accent: 'blue',
  },
  {
    id: 'living-laws',
    name: 'Living Laws',
    discipline: 'True Naming',
    description: 'Rearrange magical laws to transform the rules governing the realm.',
    available: false,
    accent: 'crimson',
  },
];

export function getPuzzleFamily(id: PuzzleFamilyId): PuzzleFamily {
  const family = PUZZLE_FAMILIES.find((candidate) => candidate.id === id);
  if (!family) throw new Error(`Unknown puzzle family: ${id}`);
  return family;
}
