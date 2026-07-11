import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../types/game';
import { useGameSession } from '../../engine/useGameSession';
import { scoreRound } from '../../engine/scoring';
import { useCountdown } from '../../hooks/useCountdown';
import { useHighScore } from '../../hooks/useHighScore';
import GameFrame from '../../components/GameFrame/GameFrame';
import PatternCell from './PatternCell';
import { createPatternChallenge, type PatternChallenge } from './patterns';
import './PatternRecognitionGame.scss';

const MAX_LIVES = 3;
const REVEAL_MS = { correct: 650, wrong: 950 };

// Difficulty ramps every few rounds; time per round tightens with it.
function levelForRound(round: number): number {
  return Math.min(6, Math.floor(round / 3) + 1);
}
function roundDuration(level: number): number {
  return Math.max(3500, 6500 - (level - 1) * 400);
}

type Phase = 'answer' | 'reveal';

export default function PatternRecognitionGame({ meta, onExit }: GameProps) {
  const session = useGameSession();
  const { state, start: startSession, submit } = session;
  const { highScore, recordScore } = useHighScore(meta.id);

  const [challenge, setChallenge] = useState<PatternChallenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('answer');
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Refs mirror the values the deferred handlers (timer expiry, reveal delay)
  // need, so those callbacks never read a stale closure.
  const challengeRef = useRef<PatternChallenge | null>(null);
  challengeRef.current = challenge;
  const stateRef = useRef(state);
  stateRef.current = state;
  const answeredRef = useRef(false);
  const advanceRef = useRef<number>();

  // useCountdown returns a fresh wrapper each render, but its functions are
  // stable — depend on those, never the wrapper object.
  const timer = useCountdown(() => resolve(null));
  const { start: startTimer, stop: stopTimer, getProgress } = timer;

  const startRound = useCallback(
    (round: number) => {
      answeredRef.current = false;
      const level = levelForRound(round);
      setChallenge(createPatternChallenge(level));
      setSelected(null);
      setPhase('answer');
      startTimer(roundDuration(level));
    },
    [startTimer],
  );

  // Resolve the current round from a chosen option (or null on timeout).
  const resolve = useCallback(
    (optionIndex: number | null) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      stopTimer();

      const current = challengeRef.current;
      const snapshot = stateRef.current;
      const correct = current !== null && optionIndex === current.answerIndex;

      const points = correct
        ? scoreRound(getProgress(), snapshot.streak, levelForRound(snapshot.round))
        : 0;

      setSelected(optionIndex);
      setPhase('reveal');

      // A wrong answer on the last life ends the run — don't queue a next round.
      const willEnd = !correct && snapshot.lives <= 1;

      advanceRef.current = window.setTimeout(
        () => {
          submit(correct, points);
          if (!willEnd) startRound(snapshot.round + 1);
        },
        correct ? REVEAL_MS.correct : REVEAL_MS.wrong,
      );
    },
    [submit, startRound, stopTimer, getProgress],
  );

  const begin = useCallback(() => {
    window.clearTimeout(advanceRef.current);
    setIsNewHighScore(false);
    startSession();
    startRound(0);
  }, [startSession, startRound]);

  // Persist the personal best the moment a run ends.
  useEffect(() => {
    if (state.status === 'over') {
      setIsNewHighScore(recordScore(state.score));
    }
  }, [state.status, state.score, recordScore]);

  // Clean up any pending timers when leaving the game.
  useEffect(
    () => () => {
      window.clearTimeout(advanceRef.current);
      stopTimer();
    },
    [stopTimer],
  );

  const result =
    phase === 'reveal' && challenge
      ? selected !== null && selected === challenge.answerIndex
        ? 'correct'
        : 'wrong'
      : null;

  return (
    <GameFrame
      meta={meta}
      status={state.status}
      score={state.score}
      streak={state.streak}
      lives={state.lives}
      maxLives={MAX_LIVES}
      bestStreak={state.bestStreak}
      highScore={highScore}
      isNewHighScore={isNewHighScore}
      timerProgress={timer.progress}
      onStart={begin}
      onReplay={begin}
      onExit={onExit}
    >
      {challenge && (
        <div className={`pattern${result ? ` pattern--${result}` : ''}`}>
          <div className="pattern__sequence">
            {challenge.sequence.map((cell, i) => (
              <div className="pattern__cell" key={i}>
                <PatternCell cell={cell} />
              </div>
            ))}
            <div className="pattern__cell pattern__cell--mystery">?</div>
          </div>

          <p className="pattern__prompt">Which comes next?</p>

          <div className="pattern__options">
            {challenge.options.map((cell, i) => {
              const stateClass =
                phase === 'reveal'
                  ? i === challenge.answerIndex
                    ? 'is-correct'
                    : i === selected
                      ? 'is-wrong'
                      : 'is-dim'
                  : '';
              return (
                <button
                  key={i}
                  className={`pattern__option ${stateClass}`.trim()}
                  onClick={() => resolve(i)}
                  disabled={phase === 'reveal'}
                  aria-label={`Option ${i + 1}`}
                >
                  <PatternCell cell={cell} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
