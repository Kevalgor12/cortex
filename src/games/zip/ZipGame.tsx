import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GameProps } from '../../types/game';
import { readValue, writeValue } from '../../lib/storage';
import Button from '../../components/Button/Button';
import Confetti from '../../components/Confetti/Confetti';
import HintButton from '../../components/HintButton/HintButton';
import { useHintCooldown } from '../../hooks/useHintCooldown';
import { ArrowLeftIcon, HomeIcon, RefreshIcon } from '../../components/icons';
import { areAdjacent, createZipPuzzle, isSolved, type ZipPuzzle } from './zip';
import './ZipGame.scss';

const SIZE = 6;
const BEST_KEY = 'zip:best';

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function ZipGame({ meta, onExit }: GameProps) {
  const [puzzle, setPuzzle] = useState<ZipPuzzle>(() => createZipPuzzle(SIZE));
  const [path, setPath] = useState<number[]>(() => [puzzle.numbers.indexOf(1)]);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<number | null>(() => readValue<number | null>(BEST_KEY, null));
  const [isBest, setIsBest] = useState(false);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintMsg, setHintMsg] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const hint = useHintCooldown();

  const pathRef = useRef(path);
  pathRef.current = path;
  const solvedRef = useRef(false);
  solvedRef.current = solved;
  const startRef = useRef(performance.now());
  const drawingRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const hintUsedRef = useRef(false);
  const hintTimerRef = useRef<number>();

  // Stopwatch — a 1-tick interval is plenty for a m:ss display, and the final
  // time is measured precisely from performance.now on solve.
  useEffect(() => {
    if (solved) return;
    const id = window.setInterval(() => setElapsed(performance.now() - startRef.current), 250);
    return () => window.clearInterval(id);
  }, [solved, puzzle]);

  useEffect(() => () => window.clearTimeout(hintTimerRef.current), []);

  const newGame = useCallback(() => {
    const next = createZipPuzzle(SIZE);
    setPuzzle(next);
    setPath([next.numbers.indexOf(1)]);
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

  const clearPath = useCallback(() => {
    if (solvedRef.current) return;
    setPath([puzzle.numbers.indexOf(1)]);
  }, [puzzle]);

  // Reveal the next correct cell: the first place the drawn path leaves the
  // solution (or the next cell to extend if it's still on track).
  const useHint = useCallback(() => {
    if (!hint.ready || solvedRef.current) return;
    const solution = puzzle.solution;
    const p = pathRef.current;
    let k = 0;
    while (k < p.length && k < solution.length && p[k] === solution[k]) k++;
    const target = solution[Math.min(k, solution.length - 1)];
    const deviated = k < p.length;

    setHintCell(target);
    setHintMsg(deviated ? 'Backtrack — the route runs through the glowing cell.' : 'Draw to the glowing cell next.');
    setHintUsed(true);
    hintUsedRef.current = true;
    hint.use();

    window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintCell(null);
      setHintMsg('');
    }, 3000);
  }, [hint, puzzle]);

  const extendTo = useCallback(
    (cell: number) => {
      if (solvedRef.current) return;
      const prev = pathRef.current;
      if (prev.length === 0) return;

      const head = prev[prev.length - 1];
      let next: number[] | null = null;

      if (prev.length >= 2 && cell === prev[prev.length - 2]) {
        next = prev.slice(0, -1); // drag back over the line to erase
      } else if (cell !== head && !prev.includes(cell) && areAdjacent(cell, head, puzzle.size)) {
        const value = puzzle.numbers[cell];
        if (value !== 0) {
          const placed = prev.reduce((n, c) => n + (puzzle.numbers[c] > 0 ? 1 : 0), 0);
          if (value !== placed + 1) return; // numbers must be reached in order
        }
        next = [...prev, cell];
      }
      if (!next) return;

      pathRef.current = next;
      setPath(next);

      if (isSolved(next, puzzle)) {
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

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const target = el?.closest<HTMLElement>('[data-cell]');
    return target ? Number(target.dataset.cell) : null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell === null) return;
    // Begin a drag from the current head (or extend a tap onto a neighbour).
    if (cell === pathRef.current[pathRef.current.length - 1]) {
      drawingRef.current = true;
      gridRef.current?.setPointerCapture(e.pointerId);
    } else {
      extendTo(cell);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawingRef.current) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell !== null) extendTo(cell);
  };

  const endDrawing = () => {
    drawingRef.current = false;
  };

  const { size, numbers } = puzzle;
  const points = path.map((i) => `${(i % size) + 0.5},${Math.floor(i / size) + 0.5}`).join(' ');
  const headCell = path[path.length - 1];
  const filled = path.length;
  const accent = { ['--accent' as string]: meta.accent };

  return (
    <div className="zip" style={accent}>
      <header className="zip__bar container">
        <button className="zip__back" onClick={onExit} aria-label="Back to home">
          <ArrowLeftIcon />
        </button>
        <div className="zip__title">{meta.name}</div>
        <span className="zip__timer">{formatTime(elapsed)}</span>
      </header>

      <main className="zip__body container">
        {solved ? (
          <div className="zip__result">
            <Confetti />
            <p className="zip__result-eyebrow">Solved</p>
            <div className="zip__result-time">{formatTime(elapsed)}</div>
            {isBest && <p className="zip__result-best">New best time!</p>}
            {hintUsed && <p className="zip__result-detail">Solved with a hint</p>}
            {!isBest && !hintUsed && best !== null && (
              <p className="zip__result-detail">Best: {formatTime(best)}</p>
            )}
            <div className="zip__actions">
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
            <p className="zip__hint">
              Fill every cell — connect {puzzle.count} numbers in order.
              <span className="zip__progress">
                {filled}/{size * size}
              </span>
            </p>

            <div
              className="zip__grid"
              ref={gridRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrawing}
              onPointerCancel={endDrawing}
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
              <svg className="zip__lines" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
                {path.length > 1 && (
                  <polyline
                    points={points}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="0.34"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                )}
                <circle
                  cx={(headCell % size) + 0.5}
                  cy={Math.floor(headCell / size) + 0.5}
                  r="0.2"
                  fill="var(--accent)"
                />
              </svg>

              {numbers.map((value, i) => {
                const visited = path.includes(i);
                return (
                  <button
                    key={i}
                    className={`zip__cell${visited ? ' is-filled' : ''}${hintCell === i ? ' is-hint' : ''}`}
                    data-cell={i}
                    onClick={() => extendTo(i)}
                    aria-label={value ? `Cell ${i + 1}, number ${value}` : `Cell ${i + 1}`}
                  >
                    {value > 0 && <span className="zip__num">{value}</span>}
                  </button>
                );
              })}
            </div>

            <p className={`zip__hint-msg${hintMsg ? ' is-shown' : ''}`}>{hintMsg}</p>

            <div className="zip__controls">
              <HintButton
                ready={hint.ready}
                remainingSec={hint.remainingSec}
                progress={hint.progress}
                onUse={useHint}
              />
              <Button variant="subtle" onClick={clearPath}>
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
