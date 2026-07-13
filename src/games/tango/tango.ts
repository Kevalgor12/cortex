// Tango puzzle generator. Fill a 6×6 grid with two symbols (0 = sun, 1 = moon)
// so that every row and column has three of each, no three of a symbol are
// consecutive, and every =/× edge clue is respected. Puzzles have a unique
// solution.
//
// We generate a full valid solution, seed it with all edge clues plus a given
// to break the flip symmetry, then prune to a minimal clue set that still
// forces exactly one answer.

export interface TangoConstraint {
  a: number;
  b: number;
  /** true = the two cells must match, false = they must differ. */
  eq: boolean;
}

export interface TangoPuzzle {
  size: number;
  /** -1 = blank (player fills), 0/1 = locked given. */
  given: number[];
  constraints: TangoConstraint[];
  solution: number[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildByCell(size: number, constraints: TangoConstraint[]) {
  const byCell: Array<Array<{ other: number; eq: boolean }>> = Array.from(
    { length: size * size },
    () => [],
  );
  for (const { a, b, eq } of constraints) {
    byCell[Math.max(a, b)].push({ other: Math.min(a, b), eq });
  }
  return byCell;
}

// Count solutions, capped at `limit`, respecting givens, balance, no-three, and
// all edge clues. Fills row-major so each cell's clues point at earlier cells.
function countSolutions(size: number, given: number[], constraints: TangoConstraint[], limit: number): number {
  const total = size * size;
  const half = size / 2;
  const byCell = buildByCell(size, constraints);
  const grid = new Array<number>(total).fill(-1);
  const rowCount = Array.from({ length: size }, () => [0, 0]);
  const colCount = Array.from({ length: size }, () => [0, 0]);
  let count = 0;

  const rec = (pos: number) => {
    if (count >= limit) return;
    if (pos === total) {
      count++;
      return;
    }
    const r = Math.floor(pos / size);
    const c = pos % size;
    const options = given[pos] >= 0 ? [given[pos]] : [0, 1];

    for (const v of options) {
      if (rowCount[r][v] >= half || colCount[c][v] >= half) continue;
      if (c >= 2 && grid[pos - 1] === v && grid[pos - 2] === v) continue;
      if (r >= 2 && grid[pos - size] === v && grid[pos - 2 * size] === v) continue;

      let ok = true;
      for (const { other, eq } of byCell[pos]) {
        const so = grid[other];
        if (so !== -1 && (eq ? so !== v : so === v)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      grid[pos] = v;
      rowCount[r][v]++;
      colCount[c][v]++;
      rec(pos + 1);
      grid[pos] = -1;
      rowCount[r][v]--;
      colCount[c][v]--;
      if (count >= limit) return;
    }
  };

  rec(0);
  return count;
}

function generateSolution(size: number): number[] {
  const total = size * size;
  const half = size / 2;
  const grid = new Array<number>(total).fill(-1);
  const rowCount = Array.from({ length: size }, () => [0, 0]);
  const colCount = Array.from({ length: size }, () => [0, 0]);

  const rec = (pos: number): boolean => {
    if (pos === total) return true;
    const r = Math.floor(pos / size);
    const c = pos % size;
    for (const v of Math.random() < 0.5 ? [0, 1] : [1, 0]) {
      if (rowCount[r][v] >= half || colCount[c][v] >= half) continue;
      if (c >= 2 && grid[pos - 1] === v && grid[pos - 2] === v) continue;
      if (r >= 2 && grid[pos - size] === v && grid[pos - 2 * size] === v) continue;

      grid[pos] = v;
      rowCount[r][v]++;
      colCount[c][v]++;
      if (rec(pos + 1)) return true;
      grid[pos] = -1;
      rowCount[r][v]--;
      colCount[c][v]--;
    }
    return false;
  };

  rec(0);
  return grid;
}

export function createTangoPuzzle(size = 6): TangoPuzzle {
  const solution = generateSolution(size);

  // Every adjacent pair as a candidate =/× clue.
  const allConstraints: TangoConstraint[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      if (c < size - 1) allConstraints.push({ a: i, b: i + 1, eq: solution[i] === solution[i + 1] });
      if (r < size - 1) allConstraints.push({ a: i, b: i + size, eq: solution[i] === solution[i + size] });
    }
  }

  let given = new Array<number>(size * size).fill(-1);
  let constraints = [...allConstraints];

  // One given breaks the all-edges flip symmetry; add more only if needed.
  const g0 = Math.floor(Math.random() * size * size);
  given[g0] = solution[g0];
  for (let i = 0; i < size * size && countSolutions(size, given, constraints, 2) !== 1; i++) {
    if (given[i] < 0) given[i] = solution[i];
  }

  // Prune redundant edge clues, then redundant givens — leaving a minimal set.
  for (const cn of shuffle(constraints)) {
    const trial = constraints.filter((x) => x !== cn);
    if (countSolutions(size, given, trial, 2) === 1) constraints = trial;
  }

  const givenCells: number[] = [];
  given.forEach((v, i) => v >= 0 && givenCells.push(i));
  for (const gi of shuffle(givenCells)) {
    const trial = given.slice();
    trial[gi] = -1;
    if (countSolutions(size, trial, constraints, 2) === 1) given = trial;
  }

  return { size, given, constraints, solution };
}

export interface TangoEval {
  solved: boolean;
  violations: Set<number>;
}

// Flag every cell in a broken rule; solved when full with no violations.
export function evaluateTango(values: number[], puzzle: TangoPuzzle): TangoEval {
  const { size, constraints } = puzzle;
  const half = size / 2;
  const violations = new Set<number>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      const v = values[i];
      if (v < 0) continue;
      if (c <= size - 3 && values[i + 1] === v && values[i + 2] === v) {
        violations.add(i).add(i + 1).add(i + 2);
      }
      if (r <= size - 3 && values[i + size] === v && values[i + 2 * size] === v) {
        violations.add(i).add(i + size).add(i + 2 * size);
      }
    }
  }

  const flagLine = (cells: number[]) => {
    const counts = [0, 0];
    for (const i of cells) if (values[i] >= 0) counts[values[i]]++;
    for (const s of [0, 1] as const) {
      if (counts[s] > half) for (const i of cells) if (values[i] === s) violations.add(i);
    }
  };
  for (let r = 0; r < size; r++) flagLine(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) flagLine(Array.from({ length: size }, (_, r) => r * size + c));

  for (const { a, b, eq } of constraints) {
    if (values[a] >= 0 && values[b] >= 0 && eq !== (values[a] === values[b])) {
      violations.add(a).add(b);
    }
  }

  const filled = values.every((v) => v >= 0);
  return { solved: filled && violations.size === 0, violations };
}
