// A tiny seedable PRNG (mulberry32) so the daily challenge is identical for
// everyone on a given date. The existing puzzle generators call Math.random
// directly; rather than thread a random function through all of them,
// `withSeededRandom` swaps Math.random for a seeded stream just for the
// duration of a synchronous generation call, then restores it.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function withSeededRandom<T>(seed: number, generate: () => T): T {
  const original = Math.random;
  Math.random = mulberry32(seed);
  try {
    return generate();
  } finally {
    Math.random = original;
  }
}
