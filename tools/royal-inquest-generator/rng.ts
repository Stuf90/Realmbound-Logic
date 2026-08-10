// Seedable PRNG for the Royal Inquest level generator. Deterministic given a seed so a run can be
// reproduced exactly (`--seed <n>` on the CLI). Mulberry32 - small, fast, decent statistical
// quality for non-cryptographic procedural generation.

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max], inclusive on both ends. */
export function randInt(rng: Rng, min: number, max: number): number {
  if (max < min) throw new Error(`randInt: max (${max}) must be >= min (${min}).`);
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, array: readonly T[]): T {
  if (array.length === 0) throw new Error('pick: array must be non-empty.');
  return array[randInt(rng, 0, array.length - 1)]!;
}

/** Fisher-Yates shuffle, returns a new array (input is not mutated). */
export function shuffle<T>(rng: Rng, array: readonly T[]): T[] {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randInt(rng, 0, i);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Weighted random choice over `[value, weight]` entries. Weights must be > 0 for at least one entry. */
export function weightedPick<T>(rng: Rng, entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) throw new Error('weightedPick: total weight must be positive.');
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return entries[entries.length - 1]![0];
}

export function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}
