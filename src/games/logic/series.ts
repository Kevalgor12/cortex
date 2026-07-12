// Logic Challenge round generator. Each round is a number series that follows
// one hidden rule; the player infers the rule and picks the next term. Rule
// families unlock with difficulty, and distractors are deliberately tempting
// (a step too far, the wrong operation, a near miss).

export interface LogicChallenge {
  /** The visible terms of the series. */
  sequence: number[];
  answer: number;
  options: number[];
  answerIndex: number;
}

const VISIBLE = 4;
const TOTAL = VISIBLE + 1;

function rand(min: number, max: number): number {
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

type Series = (level: number) => number[];

// Constant difference: 5, 8, 11, 14, ...
const arithmetic: Series = (level) => {
  const start = rand(1, 9);
  const diff = rand(2, 4 + level);
  return Array.from({ length: TOTAL }, (_, i) => start + i * diff);
};

// Difference grows each step: 1, 2, 4, 7, 11, ...
const growingDiff: Series = (level) => {
  const terms = [rand(1, 6)];
  let diff = rand(1, 3);
  const step = rand(1, 2 + Math.floor(level / 2));
  for (let i = 1; i < TOTAL; i++) {
    terms.push(terms[i - 1] + diff);
    diff += step;
  }
  return terms;
};

// Constant ratio: 3, 9, 27, 81, ...
const geometric: Series = (level) => {
  const start = rand(2, 5);
  const ratio = level >= 5 ? pick([2, 3]) : 2;
  return Array.from({ length: TOTAL }, (_, i) => start * ratio ** i);
};

// Each term is the sum of the previous two: 2, 3, 5, 8, 13, ...
const fibonacci: Series = () => {
  const a = rand(1, 4);
  const terms = [a, rand(a + 1, a + 5)];
  for (let i = 2; i < TOTAL; i++) terms.push(terms[i - 1] + terms[i - 2]);
  return terms;
};

// Difference alternates between two values: +3, +5, +3, +5, ...
const alternatingAdd: Series = () => {
  const terms = [rand(1, 7)];
  const d1 = rand(2, 5);
  let d2 = rand(2, 5);
  if (d2 === d1) d2 = d1 + 1;
  for (let i = 1; i < TOTAL; i++) terms.push(terms[i - 1] + (i % 2 === 1 ? d1 : d2));
  return terms;
};

function seriesForLevel(level: number): Series[] {
  if (level <= 1) return [arithmetic];
  if (level === 2) return [arithmetic, growingDiff];
  if (level === 3) return [arithmetic, growingDiff, geometric];
  if (level === 4) return [growingDiff, geometric, fibonacci];
  if (level === 5) return [geometric, fibonacci, alternatingAdd];
  return [geometric, fibonacci, alternatingAdd, growingDiff];
}

// Tempting wrong answers: near misses plus common "wrong rule" extrapolations.
function buildOptions(sequence: number[], answer: number): number[] {
  const last = sequence[sequence.length - 1];
  const lastDiff = answer - last;
  const candidates = [
    answer + 1,
    answer - 1,
    answer + 2,
    answer - 2,
    answer + 3,
    answer + lastDiff,
    last + lastDiff * 2,
    answer + Math.max(2, Math.round(lastDiff / 2)),
  ];

  const options = [answer];
  const accept = (v: number) =>
    v >= 0 && !options.includes(v) && !sequence.includes(v);

  for (const v of shuffle(candidates)) {
    if (options.length >= 4) break;
    if (accept(v)) options.push(v);
  }

  let extra = 4;
  while (options.length < 4) {
    if (accept(answer + extra)) options.push(answer + extra);
    extra++;
  }

  return shuffle(options);
}

export function createLogicChallenge(level: number): LogicChallenge {
  const generate = () => pick(seriesForLevel(level))(level);

  let terms = generate();
  // Keep numbers tidy: whole, non-negative, and no repeats in the run.
  let guard = 0;
  while (guard++ < 20 && !isClean(terms)) terms = generate();

  const sequence = terms.slice(0, VISIBLE);
  const answer = terms[VISIBLE];
  const options = buildOptions(sequence, answer);

  return { sequence, answer, options, answerIndex: options.indexOf(answer) };
}

function isClean(terms: number[]): boolean {
  return (
    terms.every((n) => Number.isInteger(n) && n >= 0) &&
    new Set(terms).size === terms.length
  );
}
