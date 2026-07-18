import type { GameId } from '../types/game';

import { readValue, writeValue } from './storage';

// All persistent play statistics live in one namespaced object. Everything the
// stats screen and the achievement system need is derived from here.
export interface GameStat {
  plays: number;
  bestScore: number;
  bestStreak: number;
  totalScore: number;
  rounds: number;
}

export type StatsByGame = Partial<Record<GameId, GameStat>>;

export interface RunResult {
  score: number;
  bestStreak: number;
  rounds: number;
}

export interface GlobalStats {
  totalPlays: number;
  totalScore: number;
  totalRounds: number;
  bestScore: number;
  bestStreak: number;
  gamesTried: number;
}

const KEY = 'stats';
const EMPTY: GameStat = { plays: 0, bestScore: 0, bestStreak: 0, totalScore: 0, rounds: 0 };

export function readStats(): StatsByGame {
  return readValue<StatsByGame>(KEY, {});
}

export function getGameStat(id: GameId): GameStat {
  return readStats()[id] ?? EMPTY;
}

// Fold a finished run into the stored stats and return the updated object.
export function recordRun(id: GameId, run: RunResult): StatsByGame {
  const stats = readStats();
  const prev = stats[id] ?? EMPTY;

  stats[id] = {
    plays: prev.plays + 1,
    bestScore: Math.max(prev.bestScore, run.score),
    bestStreak: Math.max(prev.bestStreak, run.bestStreak),
    totalScore: prev.totalScore + run.score,
    rounds: prev.rounds + run.rounds,
  };

  writeValue(KEY, stats);
  return stats;
}

export function globalStats(stats: StatsByGame): GlobalStats {
  const list = Object.values(stats) as GameStat[];
  return {
    totalPlays: list.reduce((sum, g) => sum + g.plays, 0),
    totalScore: list.reduce((sum, g) => sum + g.totalScore, 0),
    totalRounds: list.reduce((sum, g) => sum + g.rounds, 0),
    bestScore: list.reduce((max, g) => Math.max(max, g.bestScore), 0),
    bestStreak: list.reduce((max, g) => Math.max(max, g.bestStreak), 0),
    gamesTried: list.filter((g) => g.plays > 0).length,
  };
}
