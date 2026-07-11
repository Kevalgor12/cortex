import { useCallback, useState } from 'react';

export type GameStatus = 'ready' | 'playing' | 'over';

export const STARTING_LIVES = 3;

export interface SessionState {
  status: GameStatus;
  score: number;
  streak: number;
  bestStreak: number;
  lives: number;
  round: number;
}

const initialState: SessionState = {
  status: 'ready',
  score: 0,
  streak: 0,
  bestStreak: 0,
  lives: STARTING_LIVES,
  round: 0,
};

/**
 * Shared session state for every mini-game: score, streak, lives and round
 * count plus the small set of transitions each game drives. Games own their
 * own round content and timing; this hook only tracks the outcome.
 */
export function useGameSession() {
  const [state, setState] = useState<SessionState>(initialState);

  const start = useCallback(() => {
    setState({ ...initialState, status: 'playing' });
  }, []);

  const submit = useCallback((correct: boolean, points = 0) => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;

      if (correct) {
        const streak = prev.streak + 1;
        return {
          ...prev,
          score: prev.score + points,
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          round: prev.round + 1,
        };
      }

      const lives = prev.lives - 1;
      return {
        ...prev,
        streak: 0,
        lives,
        round: prev.round + 1,
        status: lives <= 0 ? 'over' : 'playing',
      };
    });
  }, []);

  const finish = useCallback(() => {
    setState((prev) => (prev.status === 'playing' ? { ...prev, status: 'over' } : prev));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { state, start, submit, finish, reset };
}
