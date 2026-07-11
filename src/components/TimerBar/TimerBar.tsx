import './TimerBar.scss';

interface TimerBarProps {
  /** Fraction of time remaining, 0..1. */
  progress: number;
}

export default function TimerBar({ progress }: TimerBarProps) {
  const pct = Math.max(0, Math.min(1, progress));
  const urgent = pct <= 0.3;

  return (
    <div className="timer-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
      <div
        className={`timer-bar__fill${urgent ? ' timer-bar__fill--urgent' : ''}`}
        style={{ transform: `scaleX(${pct})` }}
      />
    </div>
  );
}
