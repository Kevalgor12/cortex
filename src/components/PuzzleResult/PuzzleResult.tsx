import { formatTime } from '../../lib/time';

import Button from '../Button/Button';
import Confetti from '../Confetti/Confetti';
import { HomeIcon, RefreshIcon } from '../icons';
import './PuzzleResult.scss';

interface PuzzleResultProps {
  elapsedMs: number;
  bestMs: number | null;
  isBest: boolean;
  hintUsed: boolean;
  onNew: () => void;
  onExit: () => void;
}

// The "Solved" screen shared by the solve-based puzzles.
export default function PuzzleResult({
  elapsedMs,
  bestMs,
  isBest,
  hintUsed,
  onNew,
  onExit,
}: PuzzleResultProps) {
  return (
    <div className="puzzle-result">
      <Confetti />
      <p className="puzzle-result__eyebrow">Solved</p>
      <div className="puzzle-result__time">{formatTime(elapsedMs)}</div>

      {isBest && <p className="puzzle-result__best">New best time!</p>}
      {hintUsed && <p className="puzzle-result__detail">Solved with a hint</p>}
      {!isBest && !hintUsed && bestMs !== null && (
        <p className="puzzle-result__detail">Best: {formatTime(bestMs)}</p>
      )}

      <div className="puzzle-result__actions">
        <Button variant="primary" size="lg" block onClick={onNew}>
          <RefreshIcon />
          New puzzle
        </Button>
        <Button variant="ghost" size="lg" block onClick={onExit}>
          <HomeIcon />
          Home
        </Button>
      </div>
    </div>
  );
}
