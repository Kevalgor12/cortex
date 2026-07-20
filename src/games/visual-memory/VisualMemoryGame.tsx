import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GameProps } from '../../types/game';

import { cssVars } from '../../lib/cssVars';

import { createBoard, memorizeDuration, recallDuration, type MemoryBoard } from './board';
import GameFrame from '../../components/GameFrame/GameFrame';
import { scoreRound } from '../../engine/scoring';
import { STARTING_LIVES, useGameSession } from '../../engine/useGameSession';
import { useCountdown } from '../../hooks/useCountdown';
import { useRunRecorder } from '../../hooks/useRunRecorder';
import './VisualMemoryGame.scss';

const MAX_LEVEL = 16;
const REVEAL_MS = { clear: 550, fail: 1100 };

type Phase = 'memorize' | 'recall' | 'reveal';

export default function VisualMemoryGame({ meta, onExit }: GameProps) {
  const { state, start: startSession, submit } = useGameSession();
  const { highScore, isNewHighScore, unlocked } = useRunRecorder(meta.id, state);

  const [board, setBoard] = useState<MemoryBoard | null>(null);
  const [phase, setPhase] = useState<Phase>('memorize');
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);

  // Refs keep the timer/deferred callbacks reading current values.
  const boardRef = useRef<MemoryBoard | null>(null);
  boardRef.current = board;
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const foundRef = useRef<number[]>(found);
  foundRef.current = found;
  const stateRef = useRef(state);
  stateRef.current = state;
  const resolvedRef = useRef(false);
  const advanceRef = useRef<number>();

  const timer = useCountdown(() => handleExpire());
  const { start: startTimer, stop: stopTimer, getProgress } = timer;

  const litSet = useMemo(() => new Set(board?.lit ?? []), [board]);

  const startRound = useCallback(
    (round: number) => {
      resolvedRef.current = false;
      const level = Math.min(round + 1, MAX_LEVEL);
      const next = createBoard(level);
      setBoard(next);
      setFound([]);
      setWrong(null);
      setPhase('memorize');
      startTimer(memorizeDuration(next));
    },
    [startTimer],
  );

  const beginRecall = useCallback(() => {
    const current = boardRef.current;
    if (!current) return;
    setPhase('recall');
    startTimer(recallDuration(current));
  }, [startTimer]);

  // Settle the board as a win (all tiles found) or a loss (wrong tile / timeout).
  const finishRound = useCallback(
    (success: boolean) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      stopTimer();

      const snapshot = stateRef.current;
      const level = Math.min(snapshot.round + 1, MAX_LEVEL);
      const points = success ? scoreRound(getProgress(), snapshot.streak, level) : 0;

      setPhase('reveal');
      const willEnd = !success && snapshot.lives <= 1;
      advanceRef.current = window.setTimeout(
        () => {
          submit(success, points);
          if (!willEnd) startRound(snapshot.round + 1);
        },
        success ? REVEAL_MS.clear : REVEAL_MS.fail,
      );
    },
    [getProgress, startRound, stopTimer, submit],
  );

  const handleExpire = useCallback(() => {
    if (phaseRef.current === 'memorize') beginRecall();
    else if (phaseRef.current === 'recall') finishRound(false);
  }, [beginRecall, finishRound]);

  const handleTile = useCallback(
    (index: number) => {
      if (phaseRef.current !== 'recall' || resolvedRef.current) return;
      if (foundRef.current.includes(index)) return;

      const current = boardRef.current;
      if (!current) return;

      if (current.lit.includes(index)) {
        const next = [...foundRef.current, index];
        setFound(next);
        if (next.length === current.lit.length) finishRound(true);
      } else {
        setWrong(index);
        finishRound(false);
      }
    },
    [finishRound],
  );

  const begin = useCallback(() => {
    window.clearTimeout(advanceRef.current);
    startSession();
    startRound(0);
  }, [startSession, startRound]);

  useEffect(
    () => () => {
      window.clearTimeout(advanceRef.current);
      stopTimer();
    },
    [stopTimer],
  );

  const size = board?.size ?? 3;
  const litTotal = board?.lit.length ?? 0;
  const cleared = found.length === litTotal && litTotal > 0;

  const label =
    phase === 'memorize'
      ? `Memorise ${litTotal} ${litTotal === 1 ? 'tile' : 'tiles'}`
      : phase === 'recall'
        ? `Your turn - ${found.length}/${litTotal}`
        : cleared
          ? 'Cleared!'
          : 'Missed some';

  const tileState = (index: number): string => {
    if (found.includes(index)) return 'is-found';
    if (wrong === index) return 'is-wrong';
    if (phase === 'memorize' && litSet.has(index)) return 'is-lit';
    if (phase === 'reveal' && litSet.has(index)) return 'is-missed';
    return '';
  };

  return (
    <GameFrame
      meta={meta}
      status={state.status}
      score={state.score}
      streak={state.streak}
      lives={state.lives}
      maxLives={STARTING_LIVES}
      bestStreak={state.bestStreak}
      highScore={highScore}
      isNewHighScore={isNewHighScore}
      unlocked={unlocked}
      timerProgress={timer.progress}
      onStart={begin}
      onReplay={begin}
      onExit={onExit}
    >
      {board && (
        <div className="memory">
          <p className={`memory__label memory__label--${phase}`}>{label}</p>

          <div
            className={`memory__grid${phase === 'reveal' && !cleared ? ' is-shake' : ''}`}
            ref={cssVars({ '--cols': size })}
          >
            {Array.from({ length: size * size }, (_, index) => (
              <button
                key={index}
                className={`memory__tile ${tileState(index)}`.trim()}
                onClick={() => handleTile(index)}
                disabled={phase !== 'recall'}
                aria-label={`Tile ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
