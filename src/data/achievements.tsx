import type { ComponentType } from 'react';
import type { GlobalStats } from '../lib/stats';
import {
  BoltIcon,
  BrainIcon,
  FlameIcon,
  MedalIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
} from '../components/icons';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  /** Unlocked once this returns true for the player's aggregate stats. */
  test: (g: GlobalStats) => boolean;
}

// Threshold-based achievements evaluated against aggregate stats. Kept simple
// and global so any game can contribute toward them.
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Play your first game',
    icon: SparkleIcon,
    test: (g) => g.totalPlays >= 1,
  },
  {
    id: 'getting-warm',
    name: 'Getting Warm',
    description: 'Reach a 5-answer streak',
    icon: FlameIcon,
    test: (g) => g.bestStreak >= 5,
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    description: 'Reach a 10-answer streak',
    icon: BoltIcon,
    test: (g) => g.bestStreak >= 10,
  },
  {
    id: 'high-roller',
    name: 'High Roller',
    description: 'Score 500 in a single run',
    icon: TrophyIcon,
    test: (g) => g.bestScore >= 500,
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Score 1,000 in a single run',
    icon: TargetIcon,
    test: (g) => g.bestScore >= 1000,
  },
  {
    id: 'well-rounded',
    name: 'Well Rounded',
    description: 'Try all five games',
    icon: BrainIcon,
    test: (g) => g.gamesTried >= 5,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Play 25 games',
    icon: MedalIcon,
    test: (g) => g.totalPlays >= 25,
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Answer 100 rounds',
    icon: StarIcon,
    test: (g) => g.totalRounds >= 100,
  },
];
