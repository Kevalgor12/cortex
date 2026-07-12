import './TimerBar.scss';

interface TimerBarProps {
  /** Fraction of time remaining, 0..1. */
  progress: number;
}

// Three visual stages ramp up the pressure as the clock drains.
function stageFor(pct: number): 'calm' | 'warn' | 'danger' {
  if (pct <= 0.25) return 'danger';
  if (pct <= 0.5) return 'warn';
  return 'calm';
}

export default function TimerBar({ progress }: TimerBarProps) {
  const pct = Math.max(0, Math.min(1, progress));
  const stage = stageFor(pct);

  return (
    <div
      className="timer-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div
        className={`timer-bar__fill timer-bar__fill--${stage}`}
        style={{ transform: `scaleX(${pct})` }}
      />
    </div>
  );
}
