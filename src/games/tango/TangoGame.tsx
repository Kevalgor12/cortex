import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../types/game';
import { readValue, writeValue } from '../../lib/storage';
import Button from '../../components/Button/Button';
import Confetti from '../../components/Confetti/Confetti';
import HintButton from '../../components/HintButton/HintButton';
import { useHintCooldown } from '../../hooks/useHintCooldown';
import { ArrowLeftIcon, HomeIcon, MoonIcon, RefreshIcon, SunIcon } from '../../components/icons';
import { createTangoPuzzle, evaluateTango, type TangoPuzzle } from './tango';
import './TangoGame.scss';

const SIZE = 6;
const BEST_KEY = 'tango:best';

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function TangoGame({ meta, onExit }: GameProps) {
  const [puzzle, setPuzzle] = useState<TangoPuzzle>(() => createTangoPuzzle(SIZE));
  const [values, setValues] = useState<number[]>(() => puzzle.given.slice());
  const [violations, setViolations] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<number | null>(() => readValue<number | null>(BEST_KEY, null));
  const [isBest, setIsBest] = useState(false);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintMsg, setHintMsg] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const hint = useHintCooldown();

  const valuesRef = useRef(values);
  valuesRef.current = values;
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

  const newGame = useCallback(() => {
    const next = createTangoPuzzle(SIZE);
    setPuzzle(next);
    setValues(next.given.slice());
    setViolations(new Set());
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

  // Reveal the correct symbol for one still-empty cell.
  const useHint = useCallback(() => {
    if (!hint.ready || solvedRef.current) return;
    const vals = valuesRef.current;
    let target = -1;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === -1 && puzzle.given[i] < 0) {
        target = i;
        break;
      }
    }
    if (target === -1) return;

    setHintCell(target);
    setHintMsg(`The glowing cell is a ${puzzle.solution[target] === 0 ? 'sun' : 'moon'}.`);
    setHintUsed(true);
    hintUsedRef.current = true;
    hint.use();

    window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintCell(null);
      setHintMsg('');
    }, 3000);
  }, [hint, puzzle]);

  const clearBoard = useCallback(() => {
    if (solvedRef.current) return;
    setValues(puzzle.given.slice());
    setViolations(new Set());
  }, [puzzle]);

  const tap = useCallback(
    (cell: number) => {
      if (solvedRef.current || puzzle.given[cell] >= 0) return;
      const next = [...valuesRef.current];
      next[cell] = next[cell] === -1 ? 0 : next[cell] === 0 ? 1 : -1;
      valuesRef.current = next;
      setValues(next);

      const result = evaluateTango(next, puzzle);
      setViolations(result.violations);
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

  const { size, given, constraints } = puzzle;
  const placed = values.filter((v) => v >= 0).length;
  const accent = { ['--accent' as string]: meta.accent };

  const symbol = (v: number) =>
    v === 0 ? <SunIcon className="tango__sun" /> : v === 1 ? <MoonIcon className="tango__moon" /> : null;

  return (
    <div className="tango" style={accent}>
      <header className="tango__bar container">
        <button className="tango__back" onClick={onExit} aria-label="Back to home">
          <ArrowLeftIcon />
        </button>
        <div className="tango__title">{meta.name}</div>
        <span className="tango__timer">{formatTime(elapsed)}</span>
      </header>

      <main className="tango__body container">
        {solved ? (
          <div className="tango__result">
            <Confetti />
            <p className="tango__result-eyebrow">Solved</p>
            <div className="tango__result-time">{formatTime(elapsed)}</div>
            {isBest && <p className="tango__result-best">New best time!</p>}
            {hintUsed && <p className="tango__result-detail">Solved with a hint</p>}
            {!isBest && !hintUsed && best !== null && (
              <p className="tango__result-detail">Best: {formatTime(best)}</p>
            )}
            <div className="tango__actions">
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
            <p className="tango__hint">
              Fill each row & column with three
              <SunIcon className="tango__hint-icon tango__sun" /> and three
              <MoonIcon className="tango__hint-icon tango__moon" />
              <span className="tango__progress">
                {placed}/{size * size}
              </span>
            </p>

            <div className="tango__grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
              {values.map((v, i) => {
                const locked = given[i] >= 0;
                return (
                  <button
                    key={i}
                    className={`tango__cell${locked ? ' is-locked' : ''}${violations.has(i) ? ' is-bad' : ''}${hintCell === i ? ' is-hint' : ''}`}
                    onClick={() => tap(i)}
                    aria-label={`Cell ${i + 1}`}
                  >
                    {symbol(v)}
                    {hintCell === i && v === -1 && (
                      <span className="tango__ghost">{symbol(puzzle.solution[i])}</span>
                    )}
                  </button>
                );
              })}

              <div className="tango__clues" aria-hidden="true">
                {constraints.map(({ a, b, eq }, k) => {
                  const ra = Math.floor(a / size);
                  const ca = a % size;
                  const horizontal = b === a + 1;
                  const left = horizontal ? ((ca + 1) / size) * 100 : ((ca + 0.5) / size) * 100;
                  const top = horizontal ? ((ra + 0.5) / size) * 100 : ((ra + 1) / size) * 100;
                  return (
                    <span
                      key={k}
                      className="tango__clue"
                      style={{ left: `${left}%`, top: `${top}%` }}
                    >
                      {eq ? '=' : '×'}
                    </span>
                  );
                })}
              </div>
            </div>

            <p className={`tango__hint-msg${hintMsg ? ' is-shown' : ''}`}>{hintMsg}</p>

            <div className="tango__controls">
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
