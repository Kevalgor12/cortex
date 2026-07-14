import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../types/game';
import { readValue, writeValue } from '../../lib/storage';
import Button from '../../components/Button/Button';
import Confetti from '../../components/Confetti/Confetti';
import HintButton from '../../components/HintButton/HintButton';
import { useHintCooldown } from '../../hooks/useHintCooldown';
import { ArrowLeftIcon, CrownIcon, HomeIcon, RefreshIcon } from '../../components/icons';
import { createQueensPuzzle, evaluateQueens, queensHint, type QueensPuzzle } from './queens';
import './QueensGame.scss';

const SIZE = 8;
const BEST_KEY = 'queens:best';

// One distinct colour per region.
const REGION_COLORS = [
  '#818cf8',
  '#fb7185',
  '#34d399',
  '#fbbf24',
  '#c084fc',
  '#38bdf8',
  '#f472b6',
  '#a3e635',
  '#fb923c',
];

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Marks: 0 = empty, 1 = X note, 2 = queen.
export default function QueensGame({ meta, onExit }: GameProps) {
  const [puzzle, setPuzzle] = useState<QueensPuzzle>(() => createQueensPuzzle(SIZE));
  const [marks, setMarks] = useState<number[]>(() => new Array(puzzle.size * puzzle.size).fill(0));
  const [conflicts, setConflicts] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<number | null>(() => readValue<number | null>(BEST_KEY, null));
  const [isBest, setIsBest] = useState(false);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintMsg, setHintMsg] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const hint = useHintCooldown();

  const marksRef = useRef(marks);
  marksRef.current = marks;
  const solvedRef = useRef(false);
  solvedRef.current = solved;
  const startRef = useRef(performance.now());
  const hintUsedRef = useRef(false);
  const hintTimerRef = useRef<number>();

  useEffect(() => {
    if (solved) return;
    const id = window.setInterval(() => setElapsed(performance.now() - startRef.current), 250);
    return () => window.clearInterval(id);
  }, [solved, puzzle]);

  useEffect(() => () => window.clearTimeout(hintTimerRef.current), []);

  const resetBoard = useCallback((next: QueensPuzzle) => {
    setMarks(new Array(next.size * next.size).fill(0));
    setConflicts(new Set());
    setSolved(false);
    setIsBest(false);
    setElapsed(0);
    startRef.current = performance.now();
    window.clearTimeout(hintTimerRef.current);
    setHintCell(null);
    setHintMsg('');
    setHintUsed(false);
    hintUsedRef.current = false;
    hint.reset();
  }, [hint]);

  // Reveal a deducible crown and explain why it belongs there.
  const useHint = useCallback(() => {
    if (!hint.ready || solvedRef.current) return;
    const suggestion = queensHint(marksRef.current, puzzle);
    if (!suggestion) return;

    setHintCell(suggestion.cell);
    setHintMsg(suggestion.reason);
    setHintUsed(true);
    hintUsedRef.current = true;
    hint.use();

    window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintCell(null);
      setHintMsg('');
    }, 3000);
  }, [hint, puzzle]);

  const newGame = useCallback(() => {
    const next = createQueensPuzzle(SIZE);
    setPuzzle(next);
    resetBoard(next);
  }, [resetBoard]);

  const clearBoard = useCallback(() => {
    if (solvedRef.current) return;
    setMarks(new Array(puzzle.size * puzzle.size).fill(0));
    setConflicts(new Set());
  }, [puzzle]);

  const tap = useCallback(
    (cell: number) => {
      if (solvedRef.current) return;
      const next = [...marksRef.current];
      next[cell] = (next[cell] + 1) % 3;
      marksRef.current = next;
      setMarks(next);

      const queens: number[] = [];
      next.forEach((m, i) => {
        if (m === 2) queens.push(i);
      });
      const result = evaluateQueens(queens, puzzle);
      setConflicts(result.conflicts);

      if (result.solved) {
        const time = performance.now() - startRef.current;
        setElapsed(time);
        setSolved(true);
        const prevBest = readValue<number | null>(BEST_KEY, null);
        if (!hintUsedRef.current && (prevBest === null || time < prevBest)) {
          writeValue(BEST_KEY, time);
          setBest(time);
          setIsBest(true);
        }
      }
    },
    [puzzle],
  );

  const { size, regions } = puzzle;
  const queenCount = marks.filter((m) => m === 2).length;
  const accent = { ['--accent' as string]: meta.accent };

  return (
    <div className="queens" style={accent}>
      <header className="queens__bar container">
        <button className="queens__back" onClick={onExit} aria-label="Back to home">
          <ArrowLeftIcon />
        </button>
        <div className="queens__title">{meta.name}</div>
        <span className="queens__timer">{formatTime(elapsed)}</span>
      </header>

      <main className="queens__body container">
        {solved ? (
          <div className="queens__result">
            <Confetti />
            <p className="queens__result-eyebrow">Solved</p>
            <div className="queens__result-time">{formatTime(elapsed)}</div>
            {isBest && <p className="queens__result-best">New best time!</p>}
            {hintUsed && <p className="queens__result-detail">Solved with a hint</p>}
            {!isBest && !hintUsed && best !== null && (
              <p className="queens__result-detail">Best: {formatTime(best)}</p>
            )}
            <div className="queens__actions">
              <Button variant="primary" size="lg" block onClick={newGame}>
                <RefreshIcon />
                New puzzle
              </Button>
              <Button variant="ghost" size="lg" block onClick={onExit}>
                <HomeIcon />
                Home
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="queens__hint">
              One <CrownIcon className="queens__hint-icon" /> per row, column & colour — none
              touching.
              <span className="queens__progress">
                {queenCount}/{size}
              </span>
            </p>

            <div
              className="queens__grid"
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
              {regions.map((region, i) => {
                const mark = marks[i];
                const conflict = mark === 2 && conflicts.has(i);
                return (
                  <button
                    key={i}
                    className={`queens__cell${conflict ? ' is-conflict' : ''}${hintCell === i ? ' is-hint' : ''}`}
                    style={{ background: REGION_COLORS[region % REGION_COLORS.length] }}
                    onClick={() => tap(i)}
                    aria-label={`Cell ${i + 1}`}
                  >
                    {mark === 2 && <CrownIcon className="queens__queen" />}
                    {mark === 1 && <span className="queens__x" />}
                  </button>
                );
              })}
            </div>

            <p className={`queens__hint-msg${hintMsg ? ' is-shown' : ''}`}>{hintMsg}</p>

            <div className="queens__controls">
              <HintButton
                ready={hint.ready}
                remainingSec={hint.remainingSec}
                progress={hint.progress}
                onUse={useHint}
              />
              <Button variant="subtle" onClick={clearBoard}>
                <RefreshIcon />
                Clear
              </Button>
              <Button variant="ghost" onClick={newGame}>
                New puzzle
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
