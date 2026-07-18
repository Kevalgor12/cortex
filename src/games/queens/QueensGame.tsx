import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GameProps } from '../../types/game';

import { readValue, writeValue } from '../../lib/storage';

import { createQueensPuzzle, evaluateQueens, queensHint, type QueensPuzzle } from './queens';
import Button from '../../components/Button/Button';
import HintButton from '../../components/HintButton/HintButton';
import { CrownIcon, RefreshIcon } from '../../components/icons';
import PuzzleBar from '../../components/PuzzleBar/PuzzleBar';
import PuzzleResult from '../../components/PuzzleResult/PuzzleResult';
import { useHintCooldown } from '../../hooks/useHintCooldown';
import './QueensGame.scss';

const SIZE = 8;
const BEST_KEY = 'queens:best';

// One distinct colour per region - soft LinkedIn-style pastels.
const REGION_COLORS = [
  '#b8a6e6', // lavender
  '#a8d38b', // sage green
  '#f6bd7a', // peach
  '#9ac3ef', // sky blue
  '#f4917e', // coral
  '#dbe07a', // lime
  '#c6b49a', // taupe
  '#f2a8cd', // pink
  '#aeb8cc', // slate
];

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

  // Cells auto-eliminated by the crowns already placed: their whole row, whole
  // column, and the eight touching cells. Derived from the crowns, so removing
  // a crown clears its dots automatically.
  const autoX = useMemo(() => {
    const set = new Set<number>();
    marks.forEach((m, i) => {
      if (m !== 2) return;
      const r = Math.floor(i / SIZE);
      const c = i % SIZE;
      for (let k = 0; k < SIZE; k++) {
        set.add(r * SIZE + k);
        set.add(k * SIZE + c);
      }
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) set.add(rr * SIZE + cc);
        }
      }
    });
    marks.forEach((m, i) => m === 2 && set.delete(i));
    return set;
  }, [marks]);

  const marksRef = useRef(marks);
  marksRef.current = marks;
  const autoXRef = useRef(autoX);
  autoXRef.current = autoX;
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
      const cur = next[cell];
      // empty -> X -> crown -> empty. An already auto-X'd empty cell jumps
      // straight to a crown (it's visually a dot already).
      next[cell] = cur === 2 ? 0 : cur === 1 ? 2 : autoXRef.current.has(cell) ? 2 : 1;
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

  // Thick line where a cell meets a different colour region, thin within one.
  // Only top/left are drawn per cell (each shared edge once); the outer frame
  // is the grid's own border.
  const regionBorder = (i: number) => {
    const r = Math.floor(i / size);
    const c = i % size;
    const edge = (different: boolean) =>
      different ? '2px solid var(--q-line-strong)' : '1px solid var(--q-line-soft)';
    return {
      borderTop: r === 0 ? 'none' : edge(regions[i - size] !== regions[i]),
      borderLeft: c === 0 ? 'none' : edge(regions[i - 1] !== regions[i]),
    };
  };

  return (
    <div className="queens" style={accent}>
      <PuzzleBar title={meta.name} rules={meta.howTo} elapsedMs={elapsed} onExit={onExit} />

      <main className="queens__body container">
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
            <p className="queens__hint">
              One <CrownIcon className="queens__hint-icon" /> per row, column & colour - none
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
                const auto = mark === 0 && autoX.has(i);
                return (
                  <button
                    key={i}
                    className={`queens__cell${conflict ? ' is-conflict' : ''}${hintCell === i ? ' is-hint' : ''}`}
                    style={{ background: REGION_COLORS[region % REGION_COLORS.length], ...regionBorder(i) }}
                    onClick={() => tap(i)}
                    aria-label={`Cell ${i + 1}`}
                  >
                    {mark === 2 && <CrownIcon className="queens__queen" />}
                    {(mark === 1 || auto) && <span className={`queens__x${auto ? ' is-auto' : ''}`} />}
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
