import { BulbIcon } from '../icons';
import './HintButton.scss';

interface HintButtonProps {
  ready: boolean;
  remainingSec: number;
  /** Cooldown elapsed, 0..1 — fills the progress bar as it counts down. */
  progress: number;
  onUse: () => void;
}

export default function HintButton({ ready, remainingSec, progress, onUse }: HintButtonProps) {
  return (
    <button
      type="button"
      className={`hint-btn${ready ? ' is-ready' : ''}`}
      onClick={onUse}
      disabled={!ready}
      title={ready ? 'Reveal a hint' : `Next hint in ${remainingSec}s`}
      aria-label={ready ? 'Reveal a hint' : `Hint available in ${remainingSec} seconds`}
      style={{ ['--hint-progress' as string]: progress }}
    >
      <span className="hint-btn__icon">
        <BulbIcon />
      </span>
      <span className="hint-btn__label">{ready ? 'Hint' : `${remainingSec}s`}</span>
    </button>
  );
}
