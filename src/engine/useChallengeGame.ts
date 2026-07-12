import { useCallback, useEffect, useRef, useState } from 'react';
import { STARTING_LIVES, useGameSession } from './useGameSession';
import { scoreRound } from './scoring';
import { levelForRound, timeForLevel, type DifficultyConfig } from './difficulty';
import { useCountdown } from '../hooks/useCountdown';
import { useRunRecorder } from '../hooks/useRunRecorder';
import type { GameId } from '../types/game';

export type ChallengePhase = 'answer' | 'reveal';

interface ChallengeGameOptions<C> {
  gameId: GameId;
  difficulty: DifficultyConfig;
  /** Build the next round's challenge for a given difficulty level. */
  generate: (level: number) => C;
  /** How long the correct/wrong reveal lingers before the next round. */
  revealMs?: { correct: number; wrong: number };
}

const DEFAULT_REVEAL = { correct: 650, wrong: 950 };

/**
 * The round lifecycle shared by every "read a challenge, pick an option"
 * game: generate a round, run the clock, score the answer (speed + streak),
 * reveal the result, then advance or end. Games supply a `generate` function
 * and render their own round; `<S>` is the type of a player's selection.
 */
export function useChallengeGame<C, S>({
  gameId,
  difficulty,
  generate,
  revealMs = DEFAULT_REVEAL,
}: ChallengeGameOptions<C>) {
  const { state, start: startSession, submit } = useGameSession();
  const { highScore, isNewHighScore, unlocked } = useRunRecorder(gameId, state);

  const [challenge, setChallenge] = useState<C | null>(null);
  const [selection, setSelection] = useState<S | null>(null);
  const [phase, setPhase] = useState<ChallengePhase>('answer');

  const stateRef = useRef(state);
  stateRef.current = state;
  const answeredRef = useRef(false);
  const advanceRef = useRef<number>();

  const timer = useCountdown(() => resolve(null, false));
  const { start: startTimer, stop: stopTimer, getProgress } = timer;

  const startRound = useCallback(
    (round: number) => {
      answeredRef.current = false;
      const level = levelForRound(round, difficulty);
      setChallenge(generate(level));
      setSelection(null);
      setPhase('answer');
      startTimer(timeForLevel(level, difficulty));
    },
    [difficulty, generate, startTimer],
  );

  // Resolve a round from the player's choice (or null on timeout).
  const resolve = useCallback(
    (choice: S | null, correct: boolean) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      stopTimer();

      const snapshot = stateRef.current;
      const points = correct
        ? scoreRound(getProgress(), snapshot.streak, levelForRound(snapshot.round, difficulty))
        : 0;

      setSelection(choice);
      setPhase('reveal');

      const willEnd = !correct && snapshot.lives <= 1;
      advanceRef.current = window.setTimeout(
        () => {
          submit(correct, points);
          if (!willEnd) startRound(snapshot.round + 1);
        },
        correct ? revealMs.correct : revealMs.wrong,
      );
    },
    [difficulty, getProgress, revealMs, startRound, stopTimer, submit],
  );

  const answer = useCallback((choice: S, correct: boolean) => resolve(choice, correct), [resolve]);

  const begin = useCallback(() => {
    window.clearTimeout(advanceRef.current);
    startSession();
    startRound(0);
  }, [startSession, startRound]);

  // Drop any pending advance when leaving the game.
  useEffect(
    () => () => {
      window.clearTimeout(advanceRef.current);
      stopTimer();
    },
    [stopTimer],
  );

  return {
    status: state.status,
    score: state.score,
    streak: state.streak,
    lives: state.lives,
    bestStreak: state.bestStreak,
    maxLives: STARTING_LIVES,
    challenge,
    selection,
    phase,
    timerProgress: timer.progress,
    highScore,
    isNewHighScore,
    unlocked,
    begin,
    answer,
  };
}
