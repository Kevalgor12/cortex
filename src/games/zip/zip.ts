// Zip puzzle generator. A puzzle is a grid with numbered checkpoints; the
// player draws one continuous path that covers every cell exactly once and
// hits the numbers 1, 2, 3 … in order.
//
// We generate the solution first (a random Hamiltonian path over the whole
// grid) and drop the numbers onto it, so every puzzle is guaranteed solvable.

export interface ZipPuzzle {
  size: number;
  /** Per-cell label, 0 = blank. Cell index = row * size + col. */
  numbers: number[];
  /** Highest number (also the number of checkpoints). */
  count: number;
  /** A valid full solution path (cell indices in order). */
  solution: number[];
}

function neighbors(cell: number, size: number): number[] {
  const r = Math.floor(cell / size);
  const c = cell % size;
  const out: number[] = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
}

export function areAdjacent(a: number, b: number, size: number): boolean {
  return neighbors(a, size).includes(b);
}

// A boustrophedon (snake) path — a simple guaranteed Hamiltonian path.
function snakePath(size: number): number[] {
  const path: number[] = [];
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) for (let c = 0; c < size; c++) path.push(r * size + c);
    else for (let c = size - 1; c >= 0; c--) path.push(r * size + c);
  }
  return path;
}

// Randomise a Hamiltonian path with the "backbite" shuffle: repeatedly grab a
// neighbour of an endpoint and reverse the tail. Always stays a valid path, so
// it never fails the way naive backtracking can.
function randomHamiltonian(size: number): number[] {
  const total = size * size;
  const path = snakePath(size);
  const pos = new Array<number>(total);
  path.forEach((cell, i) => (pos[cell] = i));

  for (let it = 0; it < total * 20; it++) {
    if (Math.random() < 0.5) {
      path.reverse();
      for (let i = 0; i < total; i++) pos[path[i]] = i;
    }
    const tail = path[total - 1];
    const options = neighbors(tail, size).filter((v) => v !== path[total - 2]);
    if (options.length === 0) continue;
    const pivot = pos[options[Math.floor(Math.random() * options.length)]];

    let lo = pivot + 1;
    let hi = total - 1;
    while (lo < hi) {
      const a = path[lo];
      const b = path[hi];
      path[lo] = b;
      path[hi] = a;
      pos[b] = lo;
      pos[a] = hi;
      lo++;
      hi--;
    }
  }
  return path;
}

export function createZipPuzzle(size = 6): ZipPuzzle {
  const total = size * size;
  const solution = randomHamiltonian(size);
  const count = size + 2;

  const numbers = new Array<number>(total).fill(0);
  const seen = new Set<number>();
  for (let k = 0; k < count; k++) {
    let p = Math.round((k * (total - 1)) / (count - 1));
    while (seen.has(p)) p++;
    seen.add(p);
    numbers[solution[p]] = k + 1;
  }

  return { size, numbers, count, solution };
}

// A completed path covers every cell, starts at 1, ends at the highest number,
// stays connected, and meets the numbers in order.
export function isSolved(path: number[], puzzle: ZipPuzzle): boolean {
  const { numbers, count, size } = puzzle;
  if (path.length !== size * size) return false;
  if (new Set(path).size !== path.length) return false;
  if (numbers[path[0]] !== 1) return false;
  if (numbers[path[path.length - 1]] !== count) return false;

  let expected = 1;
  for (let i = 0; i < path.length; i++) {
    if (i > 0 && !areAdjacent(path[i], path[i - 1], size)) return false;
    const value = numbers[path[i]];
    if (value !== 0) {
      if (value !== expected) return false;
      expected++;
    }
  }
  return expected === count + 1;
}

interface ZipHint {
  cell: number;
  reason: string;
}

// Suggest the next cell to draw, with a reason. If the drawn line has left the
// unique solution, point back to where it diverged.
export function zipHint(path: number[], puzzle: ZipPuzzle): ZipHint | null {
  const { size, solution, numbers } = puzzle;

  let k = 0;
  while (k < path.length && k < solution.length && path[k] === solution[k]) k++;

  if (k < path.length) {
    return { cell: solution[Math.min(k, solution.length - 1)], reason: 'Your line has left the only route that fills the grid — backtrack to the glowing cell.' };
  }
  if (k >= solution.length) return null;

  const target = solution[k];
  const head = path[path.length - 1];
  const placed = path.reduce((n, c) => n + (numbers[c] > 0 ? 1 : 0), 0);

  if (numbers[target] === placed + 1) {
    return { cell: target, reason: `You must reach ${placed + 1} next, and this cell is the step toward it.` };
  }
  const openNeighbours = neighbors(head, size).filter((n) => !path.includes(n));
  if (openNeighbours.length === 1) {
    return { cell: target, reason: 'Every other neighbour is already used, so this is the only way forward.' };
  }
  return { cell: target, reason: 'This keeps the single line on the path that reaches every remaining cell.' };
}
