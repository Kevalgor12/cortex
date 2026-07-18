import { useCallback, useEffect, useRef, useState } from 'react';

import type { GameProps } from '../../types/game';

import { readValue, writeValue } from '../../lib/storage';

import {
  captureTargets,
  countPieces,
  createSoloChessPuzzle,
  hasAnyMove,
  soloHint,
  type Board,
  type PieceType,
} from './soloChess';
import Button from '../../components/Button/Button';
import HintButton from '../../components/HintButton/HintButton';
import { RefreshIcon } from '../../components/icons';
import PuzzleBar from '../../components/PuzzleBar/PuzzleBar';
import PuzzleResult from '../../components/PuzzleResult/PuzzleResult';
import { useHintCooldown } from '../../hooks/useHintCooldown';
import './SoloChessGame.scss';

const SIZE = 6;
const PIECES = 7;
const BEST_KEY = 'solo-chess:best';

const GLYPH: Record<PieceType, string> = {
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
};

const clone = (board: Board): Board => board.map((p) => (p ? { ...p } : null));

export default function SoloChessGame({ meta, onExit }: GameProps) {
  const [initial, setInitial] = useState<Board>(() => createSoloChessPuzzle(SIZE, PIECES).board);
  const [board, setBoard] = useState<Board>(() => clone(initial));
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<Board[]>([]);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<number | null>(() => readValue<number | null>(BEST_KEY, null));
  const [isBest, setIsBest] = useState(false);
  const [hintMove, setHintMove] = useState<{ from: number; to: number } | null>(null);
  const [hintMsg, setHintMsg] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const hint = useHintCooldown();

  const solvedRef = useRef(false);
  solvedRef.current = solved;
  const startRef = useRef(performance.now());
  const hintUsedRef = useRef(false);
  const hintTimerRef = useRef<number>();

  useEffect(() => {
    if (solved) return;
    const id = window.setInterval(() => setElapsed(performance.now() - startRef.current), 250);
    return () => window.clearInterval(id);
  }, [solved, board]);

  useEffect(() => () => window.clearTimeout(hintTimerRef.current), []);

  const reset = useCallback(
    (base: Board) => {
      setBoard(clone(base));
      setSelected(null);
      setHistory([]);
      setSolved(false);
      setIsBest(false);
      setElapsed(0);
      startRef.current = performance.now();
      window.clearTimeout(hintTimerRef.current);
      setHintMove(null);
      setHintMsg('');
      setHintUsed(false);
      hintUsedRef.current = false;
      hint.reset();
    },
    [hint],
  );

  // Suggest a solvable capture and explain why it's the move to make now.
  const useHint = useCallback(() => {
    if (!hint.ready || solvedRef.current) return;
    const suggestion = soloHint(board, SIZE);
    if (!suggestion) return;

    setHintMove({ from: suggestion.from, to: suggestion.to });
    setHintMsg(suggestion.reason);
    setHintUsed(true);
    hintUsedRef.current = true;
    setSelected(suggestion.from);
    hint.use();

    window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintMove(null);
      setHintMsg('');
    }, 3500);
  }, [board, hint]);

  const newGame = useCallback(() => {
    const next = createSoloChessPuzzle(SIZE, PIECES).board;
    setInitial(next);
    reset(next);
  }, [reset]);

  const restart = useCallback(() => {
    if (solvedRef.current) return;
    reset(initial);
  }, [initial, reset]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setBoard(h[h.length - 1]);
      setSelected(null);
      return h.slice(0, -1);
    });
  }, []);

  const targets = selected !== null ? captureTargets(board, selected, SIZE) : [];

  const clickSquare = useCallback(
    (cell: number) => {
      if (solvedRef.current) return;
      const piece = board[cell];

      // Selecting / reselecting a piece.
      if (selected === null || cell === selected || (piece && !targets.includes(cell))) {
        if (cell === selected) {
          setSelected(null);
        } else if (piece && piece.moves < 2) {
          setSelected(cell);
        } else {
          setSelected(null);
        }
        return;
      }

      // Capturing.
      if (targets.includes(cell)) {
        const mover = board[selected]!;
        const next = clone(board);
        next[cell] = { type: mover.type, moves: mover.moves + 1 };
        next[selected] = null;

        setHistory((h) => [...h, clone(board)]);
        setBoard(next);
        setSelected(null);

        if (countPieces(next) === 1) {
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
      }
    },
    [board, selected, targets],
  );

  const remaining = countPieces(board);
  const stuck = !solved && remaining > 1 && !hasAnyMove(board, SIZE);
  const accent = { ['--accent' as string]: meta.accent };

  return (
    <div className="chess" style={accent}>
      <PuzzleBar title={meta.name} rules={meta.howTo} elapsedMs={elapsed} onExit={onExit} />

      <main className="chess__body container">
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
            <p className="chess__hint">
              {stuck ? 'No moves left - undo or restart.' : 'Capture until one piece remains.'}
              <span className="chess__progress">{remaining} left</span>
            </p>

            <div className="chess__board" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
              {board.map((piece, i) => {
                const dark = (Math.floor(i / SIZE) + (i % SIZE)) % 2 === 1;
                const isSel = selected === i;
                const isTarget = targets.includes(i);
                const classes = [
                  'chess__sq',
                  dark ? 'is-dark' : 'is-light',
                  isSel ? 'is-selected' : '',
                  isTarget ? 'is-target' : '',
                  hintMove?.from === i ? 'is-hint-from' : '',
                  hintMove?.to === i ? 'is-hint-to' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button key={i} className={classes} onClick={() => clickSquare(i)} aria-label={`Square ${i + 1}`}>
                    {piece && (
                      <span className={`chess__piece${piece.moves >= 2 ? ' is-spent' : ''}`}>
                        {GLYPH[piece.type]}
                        {piece.moves > 0 && (
                          <span className="chess__moves">
                            {Array.from({ length: piece.moves }, (_, m) => (
                              <span key={m} className="chess__pip" />
                            ))}
                          </span>
                        )}
                      </span>
                    )}
                    {isTarget && <span className="chess__ring" />}
                  </button>
                );
              })}
            </div>

            <p className={`chess__hint-msg${hintMsg ? ' is-shown' : ''}`}>{hintMsg}</p>

            <div className="chess__controls">
              <HintButton
                ready={hint.ready}
                remainingSec={hint.remainingSec}
                progress={hint.progress}
                onUse={useHint}
              />
              <Button variant="subtle" onClick={undo} disabled={history.length === 0}>
                Undo
              </Button>
              <Button variant="subtle" onClick={restart}>
                <RefreshIcon />
                Restart
              </Button>
              <Button variant="ghost" onClick={newGame}>
                New
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
