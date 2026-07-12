// Quick Math round generator. Each round is a single equation with four
// numeric options. Difficulty grows by unlocking harder operations and
// widening the operands. Subtraction never goes negative and division is
// always clean (whole-number result).

type Op = 'add' | 'sub' | 'mul' | 'div';

const SYMBOL: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

export interface MathChallenge {
  left: number;
  right: number;
  symbol: string;
  answer: number;
  options: number[];
  answerIndex: number;
}

function randRange(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function opsForLevel(level: number): Op[] {
  if (level >= 5) return ['add', 'sub', 'mul', 'div'];
  if (level >= 3) return ['add', 'sub', 'mul'];
  return ['add', 'sub'];
}

// Widen add/subtract operands as levels climb.
function addSubMax(level: number): number {
  return Math.min(99, 6 + level * 7);
}

// Multiplication factor ceiling grows with level, capped at the 12× table.
function factorMax(level: number): number {
  return Math.min(12, 5 + level);
}

function buildOperands(op: Op, level: number): { left: number; right: number; answer: number } {
  switch (op) {
    case 'add': {
      const max = addSubMax(level);
      const left = randRange(2, max);
      const right = randRange(2, max);
      return { left, right, answer: left + right };
    }
    case 'sub': {
      const max = addSubMax(level);
      const left = randRange(3, max);
      const right = randRange(1, left - 1);
      return { left, right, answer: left - right };
    }
    case 'mul': {
      const f = factorMax(level);
      const left = randRange(2, f);
      const right = randRange(2, f);
      return { left, right, answer: left * right };
    }
    case 'div': {
      const divisor = randRange(2, Math.min(9, 2 + level));
      const quotient = randRange(2, Math.min(12, 3 + level));
      return { left: divisor * quotient, right: divisor, answer: quotient };
    }
  }
}

// Four distinct options: the answer plus tempting near-misses.
function buildOptions(answer: number): number[] {
  const options = [answer];
  const deltas = shuffle([1, -1, 2, -2, 3, -3, 4, 5, 10, -10]);

  for (const d of deltas) {
    if (options.length >= 4) break;
    const value = answer + d;
    if (value >= 0 && !options.includes(value)) options.push(value);
  }

  // Guarantee four options even for tiny answers.
  let step = 6;
  while (options.length < 4) {
    if (!options.includes(answer + step)) options.push(answer + step);
    step += 3;
  }

  return shuffle(options);
}

export function createMathChallenge(level: number): MathChallenge {
  const op = pick(opsForLevel(level));
  const { left, right, answer } = buildOperands(op, level);
  const options = buildOptions(answer);

  return {
    left,
    right,
    symbol: SYMBOL[op],
    answer,
    options,
    answerIndex: options.indexOf(answer),
  };
}
