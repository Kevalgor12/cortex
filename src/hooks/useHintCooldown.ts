import { useCallback, useEffect, useState } from 'react';

export const HINT_COOLDOWN_MS = 20000;

export interface HintCooldown {
  ready: boolean;
  remainingSec: number;
  /** Cooldown elapsed, 0..1 - used to fill the countdown ring. */
  progress: number;
  /** Start the cooldown (call when a hint is consumed). */
  use: () => void;
  /** Make a hint available immediately (call on a new puzzle). */
  reset: () => void;
}

// Gates hints behind a cooldown. `readyAt` is the timestamp a hint becomes
// available again (0 = ready now); a light interval ticks the countdown while
// it's cooling down and stops itself once ready.
export function useHintCooldown(cooldownMs = HINT_COOLDOWN_MS): HintCooldown {
  const [readyAt, setReadyAt] = useState(0);
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (readyAt === 0) return;
    const id = window.setInterval(() => {
      const t = performance.now();
      if (t >= readyAt) setReadyAt(0);
      setNow(t);
    }, 150);
    return () => window.clearInterval(id);
  }, [readyAt]);

  const remainingMs = readyAt === 0 ? 0 : Math.max(0, readyAt - now);
  const ready = remainingMs <= 0;

  const use = useCallback(() => {
    const t = performance.now();
    setNow(t);
    setReadyAt(t + cooldownMs);
  }, [cooldownMs]);

  const reset = useCallback(() => setReadyAt(0), []);

  return {
    ready,
    remainingSec: Math.ceil(remainingMs / 1000),
    progress: cooldownMs > 0 ? 1 - remainingMs / cooldownMs : 1,
    use,
    reset,
  };
}
