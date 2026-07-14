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

// Find one solution that differs from `target`, or null if `target` is the
// only solution. Region-only clues rarely give uniqueness on their own, so
// this drives the repair loop below.
function findOtherSolution(size: number, regions: number[], target: number[]): number[] | null {
  const usedCol = new Array<boolean>(size).fill(false);
  const usedRegion = new Array<boolean>(size).fill(false);
  const cur = new Array<number>(size);
  let result: number[] | null = null;

  const rec = (row: number, prevCol: number) => {
    if (result) return;
    if (row === size) {
      for (let r = 0; r < size; r++) {
        if (cur[r] !== target[r]) {
          result = cur.slice();
          return;
        }
      }
      return; // identical to target — ignore
    }
    for (let c = 0; c < size; c++) {
      if (usedCol[c]) continue;
      if (row > 0 && Math.abs(c - prevCol) < 2) continue;
      const reg = regions[row * size + c];
      if (usedRegion[reg]) continue;
      usedCol[c] = true;
      usedRegion[reg] = true;
      cur[row] = c;
      rec(row + 1, c);
      usedCol[c] = false;
      usedRegion[reg] = false;
      if (result) return;
    }
  };

  rec(0, -99);
  return result;
}

// Would region `id` stay connected if cell `exclude` were removed from it?
function connectedWithout(size: number, regions: number[], id: number, exclude: number): boolean {
  const cells: number[] = [];
  for (let i = 0; i < size * size; i++) if (regions[i] === id && i !== exclude) cells.push(i);
  if (cells.length <= 1) return true;

  const set = new Set(cells);
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const c = stack.pop()!;
    for (const n of neighbors4(c, size)) {
      if (set.has(n) && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen.size === cells.length;
}

// Reshape regions to invalidate the alternate solution `other` while keeping
// the intended solution `cols` valid: move one of `other`'s queen cells (which
// is never a `cols` queen cell) into an adjacent region, forcing that region to
// hold two of `other`'s queens. Returns false if no safe reshape was found.
function breakSolution(size: number, regions: number[], cols: number[], other: number[]): boolean {
  const rows = shuffle(range(size).filter((r) => cols[r] !== other[r]));
  for (const r of rows) {
    const q = r * size + other[r];
    const region = regions[q];
    const neighbourRegions = neighbors4(q, size)
      .map((n) => regions[n])
      .filter((rg) => rg !== region);
    if (!neighbourRegions.length) continue;
    if (!connectedWithout(size, regions, region, q)) continue;

    regions[q] = neighbourRegions[Math.floor(Math.random() * neighbourRegions.length)];
    return true;
  }
  return false;
}

// Grow regions from the placement, then repair until the placement is the only
// solution.
export function createQueensPuzzle(size = 8): QueensPuzzle {
  for (let attempt = 0; attempt < 120; attempt++) {
    const cols = randomPlacement(size);
    if (!cols) continue;
    const regions = growRegions(size, cols);

    let repaired = true;
    for (let step = 0; step < 500; step++) {
      const other = findOtherSolution(size, regions, cols);
      if (!other) break;
      if (!breakSolution(size, regions, cols, other)) {
        repaired = false;
        break;
      }
      if (step === 499) repaired = false;
    }
    if (repaired && findOtherSolution(size, regions, cols) === null) {
      return { size, regions, solution: cols };
    }
  }

  // Fallback (should effectively never happen): best-effort layout.
  const cols = randomPlacement(size)!;
  const regions = growRegions(size, cols);
  for (let step = 0; step < 400; step++) {
    const other = findOtherSolution(size, regions, cols);
    if (!other || !breakSolution(size, regions, cols, other)) break;
  }
  return { size, regions, solution: cols };
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

export interface QueensHint {
  cell: number;
  reason: string;
}

// Suggest the next crown with a reason. Prefer a "naked single" a player can
// actually deduce — a region, row or column with exactly one square still free
// of every placed crown — and explain it. Otherwise fall back to the unique
// solution with a why-it-fits reason.
export function queensHint(marks: number[], puzzle: QueensPuzzle): QueensHint | null {
  const { size, regions, solution } = puzzle;
  const total = size * size;

  const crowns: number[] = [];
  marks.forEach((m, i) => m === 2 && crowns.push(i));

  const eliminated = new Array<boolean>(total).fill(false);
  crowns.forEach((cr) => {
    const cr_r = Math.floor(cr / size);
    const cr_c = cr % size;
    const cr_reg = regions[cr];
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / size);
      const c = i % size;
      if (r === cr_r || c === cr_c || regions[i] === cr_reg) eliminated[i] = true;
      if (Math.abs(r - cr_r) <= 1 && Math.abs(c - cr_c) <= 1) eliminated[i] = true;
    }
  });
  marks.forEach((m, i) => m === 1 && (eliminated[i] = true));

  const isCandidate = (i: number) => marks[i] !== 2 && !eliminated[i];
  const regionHasCrown = (reg: number) => crowns.some((cr) => regions[cr] === reg);

  for (let reg = 0; reg < size; reg++) {
    if (regionHasCrown(reg)) continue;
    const open: number[] = [];
    for (let i = 0; i < total; i++) if (regions[i] === reg && isCandidate(i)) open.push(i);
    if (open.length === 1)
      return { cell: open[0], reason: 'This is the only square left in its colour region, so the crown goes here.' };
  }
  for (let r = 0; r < size; r++) {
    if (crowns.some((cr) => Math.floor(cr / size) === r)) continue;
    const open: number[] = [];
    for (let c = 0; c < size; c++) if (isCandidate(r * size + c)) open.push(r * size + c);
    if (open.length === 1)
      return { cell: open[0], reason: 'Every other square in this row is ruled out, so the crown is here.' };
  }
  for (let c = 0; c < size; c++) {
    if (crowns.some((cr) => cr % size === c)) continue;
    const open: number[] = [];
    for (let r = 0; r < size; r++) if (isCandidate(r * size + c)) open.push(r * size + c);
    if (open.length === 1)
      return { cell: open[0], reason: 'Only one square is still open in this column, so the crown is here.' };
  }

  const target = solution.map((c, r) => r * size + c).find((cell) => marks[cell] !== 2);
  if (target === undefined) return null;
  return {
    cell: target,
    reason: 'This is the crown for its colour region — the one square that shares no row or column with another crown and never touches one.',
  };
}
