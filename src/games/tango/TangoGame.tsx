import { useCallback, useEffect, useRef, useState } from 'react';

import type { GameProps } from '../../types/game';

import { cssVars } from '../../lib/cssVars';
import { readValue, writeValue } from '../../lib/storage';

import { createTangoPuzzle, evaluateTango, tangoHint, type TangoPuzzle } from './tango';
import Button from '../../components/Button/Button';
import HintBanner from '../../components/HintBanner/HintBanner';
import HintButton from '../../components/HintButton/HintButton';
import { MoonIcon, RefreshIcon, SunIcon } from '../../components/icons';
import PuzzleBar from '../../components/PuzzleBar/PuzzleBar';
import PuzzleResult from '../../components/PuzzleResult/PuzzleResult';
import { useHintCooldown } from '../../hooks/useHintCooldown';
import './TangoGame.scss';

const SIZE = 6;
const BEST_KEY = 'tango:best';
// Hold off flagging a bad move for a beat, so a symbol isn't marked wrong the
// instant it's placed - the player gets a moment to see their own move first.
const VIOLATION_DELAY_MS = 2500;

export default function TangoGame({ meta, onExit }: GameProps) {
  const [puzzle, setPuzzle] = useState<TangoPuzzle>(() => createTangoPuzzle(SIZE));
  const [values, setValues] = useState<number[]>(() => puzzle.given.slice());
  const [history, setHistory] = useState<number[][]>([]);
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
  const hintCellRef = useRef<number | null>(null);
  hintCellRef.current = hintCell;
  const violationTimerRef = useRef<number>();

  useEffect(() => {
    if (solved) return;
    const id = window.setInterval(() => setElapsed(performance.now() - startRef.current), 250);
    return () => window.clearInterval(id);
  }, [solved, puzzle]);

  useEffect(() => () => window.clearTimeout(violationTimerRef.current), []);

  const newGame = useCallback(() => {
    const next = createTangoPuzzle(SIZE);
    setPuzzle(next);
    setValues(next.given.slice());
    setHistory([]);
    window.clearTimeout(violationTimerRef.current);
    setViolations(new Set());
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

  const dismissHint = useCallback(() => {
    setHintCell(null);
    setHintMsg('');
  }, []);

  // Reveal one deducible cell, and explain why it must be that symbol. The hint
  // stays until the player fills that cell correctly (see tap) or dismisses it.
  const useHint = useCallback(() => {
    if (!hint.ready || solvedRef.current) return;
    const suggestion = tangoHint(valuesRef.current, puzzle);
    if (!suggestion) return;

    setHintCell(suggestion.cell);
    setHintMsg(suggestion.reason);
    setHintUsed(true);
    hintUsedRef.current = true;
    hint.use();
  }, [hint, puzzle]);

  const clearBoard = useCallback(() => {
    if (solvedRef.current) return;
    const prev = valuesRef.current;
    const fresh = puzzle.given.slice();
    setHistory((h) => [...h, prev]);
    valuesRef.current = fresh;
    setValues(fresh);
    window.clearTimeout(violationTimerRef.current);
    setViolations(new Set());
  }, [puzzle]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      valuesRef.current = prev;
      setValues(prev);
      // Don't re-flag on undo - stay in step with the delayed-violation rule.
      window.clearTimeout(violationTimerRef.current);
      setViolations(new Set());
      return h.slice(0, -1);
    });
  }, []);

  const tap = useCallback(
    (cell: number) => {
      if (solvedRef.current || puzzle.given[cell] >= 0) return;
      const prev = valuesRef.current;
      const next = [...prev];
      next[cell] = next[cell] === -1 ? 0 : next[cell] === 0 ? 1 : -1;
      setHistory((h) => [...h, prev]);
      valuesRef.current = next;
      setValues(next);

      // Filling the hinted cell with the right symbol fulfils the hint.
      if (hintCellRef.current === cell && next[cell] === puzzle.solution[cell]) {
        setHintCell(null);
        setHintMsg('');
      }

      const result = evaluateTango(next, puzzle);
      window.clearTimeout(violationTimerRef.current);
      if (result.solved) {
        setViolations(new Set());
        const time = performance.now() - startRef.current;
        setElapsed(time);
        setSolved(true);
        const prevBest = readValue<number | null>(BEST_KEY, null);
        if (!hintUsedRef.current && (prevBest === null || time < prevBest)) {
          writeValue(BEST_KEY, time);
          setBest(time);
          setIsBest(true);
        }
        return;
      }
      // Hide any current flag while thinking, then reveal a wrong move after a beat.
      setViolations(new Set());
      violationTimerRef.current = window.setTimeout(() => {
        setViolations(result.violations);
      }, VIOLATION_DELAY_MS);
    },
    [puzzle],
  );

  const { size, given, constraints } = puzzle;
  const placed = values.filter((v) => v >= 0).length;

  const symbol = (v: number) =>
    v === 0 ? <SunIcon className="tango__sun" /> : v === 1 ? <MoonIcon className="tango__moon" /> : null;

  return (
    <div className="tango" data-game={meta.id}>
      <PuzzleBar title={meta.name} rules={meta.howTo} elapsedMs={elapsed} onExit={onExit} />

      <main className="tango__body container">
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
            <p className="tango__hint">
              Fill each row & column with three
              <SunIcon className="tango__hint-icon tango__sun" /> and three
              <MoonIcon className="tango__hint-icon tango__moon" />
              <span className="tango__progress">
                {placed}/{size * size}
              </span>
            </p>

            <div className="tango__grid">
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
                      ref={cssVars({ '--x': `${left}%`, '--y': `${top}%` })}
                    >
                      {eq ? '=' : '×'}
                    </span>
                  );
                })}
              </div>
            </div>

            <HintBanner message={hintMsg} onDismiss={dismissHint} />

            <div className="tango__controls">
              <HintButton
                ready={hint.ready}
                remainingSec={hint.remainingSec}
                progress={hint.progress}
                onUse={useHint}
              />
              <Button variant="subtle" onClick={undo} disabled={history.length === 0}>
                Undo
              </Button>
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
