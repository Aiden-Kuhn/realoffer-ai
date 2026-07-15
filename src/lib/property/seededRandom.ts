/**
 * Deterministic pseudo-random number generation. Never use Math.random for
 * anything that needs to be reproducible for the same input address —
 * these helpers derive a stable seed from a string and generate a
 * repeatable sequence from it.
 */

export function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

/** mulberry32 PRNG — small, fast, deterministic for a given seed. */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max], inclusive, using a seeded generator. */
export function randomIntBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Random float in [min, max) using a seeded generator. */
export function randomFloatBetween(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function pickFrom<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}
