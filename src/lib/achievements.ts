import { ACHIEVEMENTS, type Achievement } from '../data/achievements';
import { globalStats, type StatsByGame } from './stats';
import { readValue, writeValue } from './storage';

const KEY = 'achievements';

export function getUnlockedIds(): string[] {
  return readValue<string[]>(KEY, []);
}

// Re-evaluate every achievement against current stats, persist any that just
// unlocked, and return only the newly-unlocked ones (for the reveal).
export function syncAchievements(stats: StatsByGame): Achievement[] {
  const already = new Set(getUnlockedIds());
  const globals = globalStats(stats);
  const newly = ACHIEVEMENTS.filter((a) => !already.has(a.id) && a.test(globals));

  if (newly.length > 0) {
    writeValue(KEY, [...already, ...newly.map((a) => a.id)]);
  }

  return newly;
}
