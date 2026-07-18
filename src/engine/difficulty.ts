// Shared difficulty scaling. Each game tunes the numbers via a config; the
// ramp logic (how a round maps to a level, and how much time a level gets)
// lives here so every game scales the same, predictable way.
export interface DifficultyConfig {
  /** Rounds cleared before the level goes up. */
  roundsPerLevel: number;
  /** Level cap - difficulty plateaus here. */
  maxLevel: number;
  /** Seconds-on-the-clock at level 1, in ms. */
  baseTimeMs: number;
  /** Fastest the clock ever gets, in ms. */
  minTimeMs: number;
  /** How much time each level removes, in ms. */
  timeStepMs: number;
}

export function levelForRound(round: number, cfg: DifficultyConfig): number {
  return Math.min(cfg.maxLevel, Math.floor(round / cfg.roundsPerLevel) + 1);
}

export function timeForLevel(level: number, cfg: DifficultyConfig): number {
  return Math.max(cfg.minTimeMs, cfg.baseTimeMs - (level - 1) * cfg.timeStepMs);
}
