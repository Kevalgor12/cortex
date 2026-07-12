import { useEffect, useRef, useState } from 'react';
import type { GameId } from '../types/game';
import type { SessionState } from '../engine/useGameSession';
import { getGameStat, recordRun } from '../lib/stats';
import { syncAchievements } from '../lib/achievements';
import type { Achievement } from '../data/achievements';

/**
 * Watches a game's session and, the moment a run ends, folds the result into
 * persistent stats and evaluates achievements. Every game shares this, so
 * recording lives in exactly one place. It also surfaces the personal-best
 * flag and any freshly-unlocked achievements for the game-over screen.
 */
export function useRunRecorder(gameId: GameId, state: SessionState) {
  const [highScore, setHighScore] = useState(() => getGameStat(gameId).bestScore);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const recordedRef = useRef(false);

  useEffect(() => {
    if (state.status === 'playing') {
      // A fresh run — clear last run's celebration flags.
      recordedRef.current = false;
      setIsNewHighScore(false);
      setUnlocked([]);
    } else if (state.status === 'over' && !recordedRef.current) {
      recordedRef.current = true;
      const run = stateRef.current;
      const prevBest = getGameStat(gameId).bestScore;
      const stats = recordRun(gameId, {
        score: run.score,
        bestStreak: run.bestStreak,
        rounds: run.round,
      });
      setUnlocked(syncAchievements(stats));
      setIsNewHighScore(run.score > prevBest);
      setHighScore(stats[gameId]?.bestScore ?? run.score);
    }
  }, [state.status, gameId]);

  return { highScore, isNewHighScore, unlocked };
}
