export const BASE_POINTS = 100;

const MAX_SPEED_BONUS = 60;
const MAX_STREAK_STEPS = 10;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Points for a correct answer reward three things: getting it right (base),
 * answering quickly (speed bonus scaled by the fraction of time left), and
 * momentum (a streak multiplier that caps out so it never runs away).
 */
export function scoreRound(timeLeftRatio: number, streak: number, level: number): number {
  const speedBonus = Math.round(clamp(timeLeftRatio, 0, 1) * MAX_SPEED_BONUS);
  const levelBonus = (level - 1) * 20;
  const base = BASE_POINTS + speedBonus + levelBonus;
  const multiplier = 1 + Math.min(streak, MAX_STREAK_STEPS) * 0.1;
  return Math.round(base * multiplier);
}
