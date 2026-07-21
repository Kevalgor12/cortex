import { useCallback, useEffect, useRef, useState } from 'react';

import type { GameProps } from '../../types/game';
import type { PointerEvent as ReactPointerEvent } from 'react';

import { readValue, writeValue } from '../../lib/storage';

import { areAdjacent, createZipPuzzle, isSolved, zipHint, type ZipPuzzle } from './zip';
import Button from '../../components/Button/Button';
import HintBanner from '../../components/HintBanner/HintBanner';
import HintButton from '../../components/HintButton/HintButton';
import { RefreshIcon } from '../../components/icons';
import PuzzleBar from '../../components/PuzzleBar/PuzzleBar';
import PuzzleResult from '../../components/PuzzleResult/PuzzleResult';
import { useHintCooldown } from '../../hooks/useHintCooldown';
import './ZipGame.scss';

const SIZE = 6;
const BEST_KEY = 'zip:best';

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
  const hintCellRef = useRef<number | null>(null);
  hintCellRef.current = hintCell;

  // Stopwatch - a 1-tick interval is plenty for a m:ss display, and the final
  // time is measured precisely from performance.now on solve.
  useEffect(() => {
    if (solved) return;
    const id = window.setInterval(() => setElapsed(performance.now() - startRef.current), 250);
    return () => window.clearInterval(id);
  }, [solved, puzzle]);

  const dismissHint = useCallback(() => {
    setHintCell(null);
    setHintMsg('');
  }, []);

  const newGame = useCallback(() => {
    const next = createZipPuzzle(SIZE);
    setPuzzle(next);
    setPath([next.numbers.indexOf(1)]);
    setSolved(false);
    setIsBest(false);
    setElapsed(0);
    startRef.current = performance.now();
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

  // Reveal the next correct cell, and explain why. The hint stays until the path
  // reaches that cell (see extendTo) or the player dismisses it.
  const useHint = useCallback(() => {
    if (!hint.ready || solvedRef.current) return;
    const suggestion = zipHint(pathRef.current, puzzle);
    if (!suggestion) return;

    setHintCell(suggestion.cell);
    setHintMsg(suggestion.reason);
    setHintUsed(true);
    hintUsedRef.current = true;
    hint.use();
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

      // Reaching the suggested cell fulfils the hint - retire it.
      if (hintCellRef.current !== null && next.includes(hintCellRef.current)) {
        setHintCell(null);
        setHintMsg('');
      }

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

  return (
    <div className="zip" data-game={meta.id}>
      <PuzzleBar title={meta.name} rules={meta.howTo} elapsedMs={elapsed} onExit={onExit} />

      <main className="zip__body container">
        {solved ? (
          <PuzzleResult
            elapsedMs={elapsed}
            bestMs={best}
            isBest={isBest}
            hintUsed={hintUsed}
            onNew={newGame}
            onExit={onExit}
          />
        ) : (
          <>
            <p className="zip__hint">
              Fill every cell - connect {puzzle.count} numbers in order.
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

            <HintBanner message={hintMsg} onDismiss={dismissHint} />

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
