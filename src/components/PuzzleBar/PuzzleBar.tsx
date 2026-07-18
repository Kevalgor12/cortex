import { formatTime } from '../../lib/time';

import { ArrowLeftIcon } from '../icons';
import RulesButton from '../RulesButton/RulesButton';
import './PuzzleBar.scss';

interface PuzzleBarProps {
  title: string;
  rules: string[];
  elapsedMs: number;
  onExit: () => void;
}

// Top bar shared by the solve-based puzzles: back, title, rules, stopwatch.
export default function PuzzleBar({ title, rules, elapsedMs, onExit }: PuzzleBarProps) {
  return (
    <header className="puzzle-bar container">
      <button className="puzzle-bar__back" onClick={onExit} aria-label="Back to home">
        <ArrowLeftIcon />
      </button>
      <div className="puzzle-bar__title">{title}</div>
      <RulesButton title={title} rules={rules} />
      <span className="puzzle-bar__timer">{formatTime(elapsedMs)}</span>
    </header>
  );
}
