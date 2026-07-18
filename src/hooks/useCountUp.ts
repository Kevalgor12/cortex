import { useEffect, useRef, useState } from 'react';

// Snap instantly (no animation) when the tab is hidden or the user prefers
// reduced motion - so the final number is always shown, never stuck at 0.
function shouldSnap(): boolean {
  if (typeof document !== 'undefined' && document.hidden) return true;
  return (
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Counts up from 0 to `target` with an ease-out, for celebratory reveals. */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(() => (shouldSnap() ? target : 0));
  const rafRef = useRef<number>();

  useEffect(() => {
    if (shouldSnap()) {
      setValue(target);
      return;
    }

    const cancel = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    const onVisibility = () => {
      if (document.hidden) {
        cancel();
        setValue(target);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancel();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [target, durationMs]);

  return value;
}
