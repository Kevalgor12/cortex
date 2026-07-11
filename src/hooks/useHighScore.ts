import { useCallback, useState } from 'react';
import { readValue, writeValue } from '../lib/storage';

/**
 * Per-game personal best, persisted to localStorage. `recordScore` returns
 * true when the score beats the stored best (used to trigger the celebration).
 */
export function useHighScore(gameId: string) {
  const key = `highscore:${gameId}`;
  const [highScore, setHighScore] = useState(() => readValue<number>(key, 0));

  const recordScore = useCallback(
    (score: number) => {
      if (score > readValue<number>(key, 0)) {
        writeValue(key, score);
        setHighScore(score);
        return true;
      }
      return false;
    },
    [key],
  );

  return { highScore, recordScore };
}
