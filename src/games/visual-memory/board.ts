// Visual Memory board generator. A board is a square grid with some cells lit.
// Difficulty grows by lighting more cells (and widening the grid to fit them).
// The memorise window scales with the number of tiles so bigger boards still
// get a fair look; the recall window is generous — memory is the challenge,
// not raw speed.

export interface MemoryBoard {
  /** Grid is `size` x `size`. */
  size: number;
  /** Indices (0..size*size-1) of the lit cells to reproduce. */
  lit: number[];
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function sample(pool: number[], count: number): number[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export function createBoard(level: number): MemoryBoard {
  const litCount = Math.min(2 + level, 18);
  const size = litCount <= 5 ? 3 : litCount <= 9 ? 4 : litCount <= 14 ? 5 : 6;
  const cells = size * size;
  const count = Math.min(litCount, Math.floor(cells * 0.6));

  return { size, lit: sample(range(cells), count) };
}

export function memorizeDuration(board: MemoryBoard): number {
  return Math.min(3200, 900 + board.lit.length * 240);
}

export function recallDuration(board: MemoryBoard): number {
  return 3000 + board.lit.length * 700;
}
