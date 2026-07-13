// Queens puzzle generator. Place N queens on an N×N grid so there's exactly
// one per row, one per column, one per coloured region, and no two queens
// touch (not even diagonally). Puzzles are generated to have a UNIQUE solution.
//
// Strategy: build a valid placement first, grow connected colour regions from
// each queen, then verify with a solver that the placement is the only answer.

export interface QueensPuzzle {
  size: number;
  /** Region id (0..size-1) per cell. Cell index = row * size + col. */
  regions: number[];
  /** The unique solution as a column per row. */
  solution: number[];
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function neighbors4(cell: number, size: number): number[] {
  const r = Math.floor(cell / size);
  const c = cell % size;
  const out: number[] = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
}

// A placement: one column per row, all distinct, and consecutive rows at least
// two columns apart (which is exactly the "no touching" rule, since only
// adjacent rows can ever touch).
function randomPlacement(size: number): number[] | null {
  const cols = new Array<number>(size);
  const usedCol = new Array<boolean>(size).fill(false);

  const place = (row: number): boolean => {
    if (row === size) return true;
    for (const c of shuffle(range(size))) {
      if (usedCol[c]) continue;
      if (row > 0 && Math.abs(c - cols[row - 1]) < 2) continue;
      usedCol[c] = true;
      cols[row] = c;
      if (place(row + 1)) return true;
      usedCol[c] = false;
    }
    return false;
  };

  return place(0) ? cols.slice() : null;
}

// Flood connected regions outward from each queen, so every region is connected
// and holds exactly one queen (its seed). Growth is round-robin — every region
// claims one cell per pass — which keeps regions balanced and compact, and (in
// practice) far more likely to yield a uniquely-solvable puzzle.
function growRegions(size: number, cols: number[]): number[] {
  const total = size * size;
  const region = new Array<number>(total).fill(-1);
  const frontiers: number[][] = cols.map((c, r) => {
    region[r * size + c] = r;
    return [r * size + c];
  });

  let remaining = total - size;
  while (remaining > 0) {
    let progressed = false;
    for (let rg = 0; rg < size && remaining > 0; rg++) {
      const front = frontiers[rg];
      const candidates: number[] = [];
      for (const cell of front) {
        for (const nb of neighbors4(cell, size)) {
          if (region[nb] === -1) candidates.push(nb);
        }
      }
      if (!candidates.length) continue;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      region[pick] = rg;
      front.push(pick);
      remaining--;
      progressed = true;
    }
    if (!progressed) break;
  }
  return region;
}

// Count solutions (capped at `limit`) for the region layout under all rules.
function countSolutions(size: number, regions: number[], limit: number): number {
  const usedCol = new Array<boolean>(size).fill(false);
  const usedRegion = new Array<boolean>(size).fill(false);
  let count = 0;

  const rec = (row: number, prevCol: number) => {
    if (count >= limit) return;
    if (row === size) {
      count++;
      return;
    }
    for (let c = 0; c < size; c++) {
      if (usedCol[c]) continue;
      if (row > 0 && Math.abs(c - prevCol) < 2) continue;
      const reg = regions[row * size + c];
      if (usedRegion[reg]) continue;
      usedCol[c] = true;
      usedRegion[reg] = true;
      rec(row + 1, c);
      usedCol[c] = false;
      usedRegion[reg] = false;
      if (count >= limit) return;
    }
  };

  rec(0, -99);
  return count;
}

export function createQueensPuzzle(size = 8): QueensPuzzle {
  for (let attempt = 0; attempt < 500; attempt++) {
    const cols = randomPlacement(size);
    if (!cols) continue;
    const regions = growRegions(size, cols);
    if (countSolutions(size, regions, 2) === 1) {
      return { size, regions, solution: cols };
    }
  }
  // Extremely unlikely fallback: accept a non-unique layout.
  const cols = randomPlacement(size)!;
  return { size, regions: growRegions(size, cols), solution: cols };
}

export interface QueensEval {
  solved: boolean;
  conflicts: Set<number>;
}

// Evaluate the player's queens: flag every queen involved in a clash, and
// report solved when all N are placed with no clashes at all.
export function evaluateQueens(queenCells: number[], puzzle: QueensPuzzle): QueensEval {
  const { size, regions } = puzzle;
  const conflicts = new Set<number>();

  for (let a = 0; a < queenCells.length; a++) {
    for (let b = a + 1; b < queenCells.length; b++) {
      const ca = queenCells[a];
      const cb = queenCells[b];
      const ra = Math.floor(ca / size);
      const rb = Math.floor(cb / size);
      const cca = ca % size;
      const ccb = cb % size;

      const sameRow = ra === rb;
      const sameCol = cca === ccb;
      const sameRegion = regions[ca] === regions[cb];
      const touching = Math.abs(ra - rb) <= 1 && Math.abs(cca - ccb) <= 1;

      if (sameRow || sameCol || sameRegion || touching) {
        conflicts.add(ca);
        conflicts.add(cb);
      }
    }
  }

  return { solved: queenCells.length === size && conflicts.size === 0, conflicts };
}
