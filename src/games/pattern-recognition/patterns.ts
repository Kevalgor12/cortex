// Pattern Recognition round generator.
//
// Each cell has a shape, a colour and a rotation. A round picks a rule that
// advances one or more of those properties by a fixed step per position. The
// player sees the first few cells and must choose the next one. Difficulty
// grows by activating more properties and using larger rotation steps.

export type PatternShape = 'triangle' | 'arrow' | 'chevron' | 'circle' | 'square' | 'plus';

export interface Cell {
  shape: PatternShape;
  colorIndex: number;
  rotation: number;
}

export interface PatternChallenge {
  sequence: Cell[]; // the visible cells
  options: Cell[]; // the answer choices
  answerIndex: number; // index of the correct option
}

export const PATTERN_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#38bdf8'];

// Shapes whose rotation is visible vs. those that look the same when rotated.
const DIRECTIONAL: PatternShape[] = ['triangle', 'arrow', 'chevron'];
const SYMMETRIC: PatternShape[] = ['circle', 'square', 'plus'];

const VISIBLE_CELLS = 4;
const OPTION_COUNT = 4;

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function pick<T>(arr: T[]): T {
  return arr[randInt(arr.length)];
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

const isDirectional = (shape: PatternShape) => DIRECTIONAL.includes(shape);

// Two cells look identical when shape and colour match and - for symmetric
// shapes - rotation is irrelevant. Used to keep options visually distinct.
function visualKey(cell: Cell): string {
  const rot = isDirectional(cell.shape) ? mod(cell.rotation, 360) : 0;
  return `${cell.shape}:${cell.colorIndex}:${rot}`;
}

interface Rule {
  rotationStep: number;
  colorStep: number;
  shapeStep: number;
}

function pickRule(level: number): Rule {
  const dims = shuffle(['rotation', 'color', 'shape']);
  const activeCount = level <= 1 ? 1 : level === 2 ? (Math.random() < 0.5 ? 1 : 2) : 2;
  const active = new Set(dims.slice(0, activeCount));

  return {
    rotationStep: active.has('rotation') ? pick([90, 90, -90, 45]) : 0,
    colorStep: active.has('color') ? 1 : 0,
    shapeStep: active.has('shape') ? 1 : 0,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createPatternChallenge(level: number): PatternChallenge {
  const rule = pickRule(level);
  const rotates = rule.rotationStep !== 0;

  // When rotation is part of the pattern, restrict to shapes where a turn is
  // actually visible; otherwise any shape is fair game.
  const shapePool = rotates ? DIRECTIONAL : [...DIRECTIONAL, ...SYMMETRIC];
  const shapeStartIndex = randInt(shapePool.length);
  const startColor = randInt(PATTERN_COLORS.length);
  const startRotation = rotates ? pick([0, 90, 180, 270]) : 0;

  const cellAt = (i: number): Cell => ({
    shape: shapePool[mod(shapeStartIndex + i * rule.shapeStep, shapePool.length)],
    colorIndex: mod(startColor + i * rule.colorStep, PATTERN_COLORS.length),
    rotation: mod(startRotation + i * rule.rotationStep, 360),
  });

  const sequence = Array.from({ length: VISIBLE_CELLS }, (_, i) => cellAt(i));
  const answer = cellAt(VISIBLE_CELLS);

  const options = buildOptions(answer, rule, shapePool);
  return { sequence, options, answerIndex: options.indexOf(answer) };
}

// Builds one correct answer plus distractors, each a plausible near-miss made
// by nudging a single property of the answer. All options look distinct.
function buildOptions(answer: Cell, rule: Rule, shapePool: PatternShape[]): Cell[] {
  const options: Cell[] = [answer];
  const seen = new Set([visualKey(answer)]);
  let guard = 0;

  while (options.length < OPTION_COUNT && guard++ < 60) {
    const candidate = mutate(answer, rule, shapePool);
    const key = visualKey(candidate);
    if (!seen.has(key)) {
      seen.add(key);
      options.push(candidate);
    }
  }

  // Extremely unlikely fallback if the option space was too small to fill.
  while (options.length < OPTION_COUNT) {
    const candidate: Cell = {
      ...answer,
      colorIndex: mod(answer.colorIndex + options.length, PATTERN_COLORS.length),
    };
    if (!seen.has(visualKey(candidate))) {
      seen.add(visualKey(candidate));
      options.push(candidate);
    } else {
      break;
    }
  }

  return shuffle(options);
}

function mutate(answer: Cell, rule: Rule, shapePool: PatternShape[]): Cell {
  // Prefer nudging a property the rule actually uses so distractors feel on-topic.
  const usable: Array<'rotation' | 'color' | 'shape'> = [];
  if (rule.rotationStep !== 0 && isDirectional(answer.shape)) usable.push('rotation');
  if (PATTERN_COLORS.length > 1) usable.push('color');
  if (shapePool.length > 1) usable.push('shape');

  const dim = pick(usable.length ? usable : ['color']);
  const next: Cell = { ...answer };

  switch (dim) {
    case 'rotation':
      next.rotation = mod(answer.rotation + pick([90, -90, 45, 180]), 360);
      break;
    case 'color':
      next.colorIndex = mod(answer.colorIndex + pick([1, 2, 3, 4]), PATTERN_COLORS.length);
      break;
    case 'shape': {
      const others = shapePool.filter((s) => s !== answer.shape);
      next.shape = others.length ? pick(others) : answer.shape;
      if (!isDirectional(next.shape)) next.rotation = 0;
      break;
    }
  }

  return next;
}
