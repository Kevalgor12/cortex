import { useCallback, useEffect, useRef, useState } from 'react';

export interface Countdown {
  /** Milliseconds remaining, updated each frame for a smooth timer bar. */
  remaining: number;
  /** Fraction of time remaining, 0..1. */
  progress: number;
  isRunning: boolean;
  start: (durationMs: number) => void;
  stop: () => void;
  /** Live progress read from refs — safe to call inside event handlers. */
  getProgress: () => number;
}

/**
 * A restartable countdown driven by requestAnimationFrame. Each round calls
 * `start(duration)`; `onExpire` fires once when it reaches zero. Using rAF
 * (instead of setInterval) keeps the timer bar buttery and self-correcting.
 */
export function useCountdown(onExpire: () => void): Countdown {
  const [remaining, setRemaining] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const rafRef = useRef<number | null>(null);
  const endRef = useRef(0);
  const durationRef = useRef(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const cancel = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const stop = useCallback(() => {
    cancel();
    setIsRunning(false);
  }, []);

  const tick = useCallback(() => {
    const left = Math.max(0, endRef.current - performance.now());
    setRemaining(left);
    if (left <= 0) {
      cancel();
      setIsRunning(false);
      onExpireRef.current();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(
    (durationMs: number) => {
      cancel();
      durationRef.current = durationMs;
      endRef.current = performance.now() + durationMs;
      setDuration(durationMs);
      setRemaining(durationMs);
      setIsRunning(true);
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  const getProgress = useCallback(() => {
    if (durationRef.current <= 0) return 0;
    const left = Math.max(0, endRef.current - performance.now());
    return left / durationRef.current;
  }, []);

  useEffect(() => cancel, []);

  const progress = duration > 0 ? remaining / duration : 0;
  return { remaining, progress, isRunning, start, stop, getProgress };
}
