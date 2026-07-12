import { readValue, writeValue } from './storage';

// Persistent state for the once-a-day challenge and its day streak.
export interface DailyState {
  /** 'YYYY-MM-DD' of the last completed day, or null. */
  lastCompleted: string | null;
  /** Consecutive days completed. */
  streak: number;
  /** Best daily score ever. */
  best: number;
  lastScore: number;
  lastCorrect: number;
  lastTotal: number;
}

export interface DailyResult {
  score: number;
  correct: number;
  total: number;
}

const KEY = 'daily';
const EMPTY: DailyState = {
  lastCompleted: null,
  streak: 0,
  best: 0,
  lastScore: 0,
  lastCorrect: 0,
  lastTotal: 0,
};

export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Shift a 'YYYY-MM-DD' key by whole days using local-date arithmetic.
function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return todayKey(new Date(y, m - 1, d + delta));
}

// Stable seed for a date so everyone gets the same puzzle (FNV-1a).
export function dateSeed(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function readDaily(): DailyState {
  return readValue<DailyState>(KEY, EMPTY);
}

export function isDoneToday(state: DailyState = readDaily(), key = todayKey()): boolean {
  return state.lastCompleted === key;
}

export function completeDaily(result: DailyResult): DailyState {
  const prev = readDaily();
  const key = todayKey();
  if (prev.lastCompleted === key) return prev; // already recorded today

  const continued = prev.lastCompleted === shiftDay(key, -1);
  const next: DailyState = {
    lastCompleted: key,
    streak: continued ? prev.streak + 1 : 1,
    best: Math.max(prev.best, result.score),
    lastScore: result.score,
    lastCorrect: result.correct,
    lastTotal: result.total,
  };

  writeValue(KEY, next);
  return next;
}
