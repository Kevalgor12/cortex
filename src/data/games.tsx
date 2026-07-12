import type { GameMeta } from '../types/game';
import { LogicIcon, MathIcon, MemoryIcon, OddOneOutIcon, PatternIcon } from '../components/icons';
import PatternRecognitionGame from '../games/pattern-recognition/PatternRecognitionGame';
import QuickMathGame from '../games/quick-math/QuickMathGame';
import VisualMemoryGame from '../games/visual-memory/VisualMemoryGame';

// The full roster. Games without `available: true` are shown as "coming soon"
// on the home screen and get wired up in later phases.
export const GAMES: GameMeta[] = [
  {
    id: 'pattern-recognition',
    name: 'Pattern Recognition',
    tagline: 'Spot the rule, predict what comes next',
    description: 'A sequence follows a hidden rule. Read it fast and pick the tile that continues it.',
    skill: 'Reasoning',
    accent: '#6366f1',
    icon: PatternIcon,
    howTo: [
      'Study how the tiles change across the sequence.',
      'Pick the option that continues the pattern.',
      'Answer quickly — speed and streaks boost your score.',
    ],
    available: true,
    component: PatternRecognitionGame,
  },
  {
    id: 'quick-math',
    name: 'Quick Math',
    tagline: 'Mental arithmetic against the clock',
    description: 'Solve rapid-fire equations before the timer runs out. The maths gets harder as you go.',
    skill: 'Speed',
    accent: '#22c55e',
    icon: MathIcon,
    howTo: [
      'Solve the equation shown on screen.',
      'Tap the correct answer from the four options.',
      'Speed and streaks multiply your score.',
    ],
    available: true,
    component: QuickMathGame,
  },
  {
    id: 'visual-memory',
    name: 'Visual Memory',
    tagline: 'Remember the tiles that lit up',
    description: 'A grid of tiles flashes for a moment. Reproduce it from memory before the clock runs out.',
    skill: 'Memory',
    accent: '#38bdf8',
    icon: MemoryIcon,
    howTo: [
      'Watch which tiles light up, then they hide.',
      'Tap every tile that was lit — in any order.',
      'One wrong tile costs a life; clear the board to level up.',
    ],
    available: true,
    component: VisualMemoryGame,
  },
  {
    id: 'logic',
    name: 'Logic Challenge',
    tagline: 'Deduce the answer step by step',
    description: 'Work through compact logic puzzles under pressure.',
    skill: 'Logic',
    accent: '#f59e0b',
    icon: LogicIcon,
    howTo: [],
    available: false,
  },
  {
    id: 'odd-one-out',
    name: 'Odd One Out',
    tagline: 'Find the tile that breaks the set',
    description: 'One item does not belong. Spot it before time runs out.',
    skill: 'Focus',
    accent: '#f472b6',
    icon: OddOneOutIcon,
    howTo: [],
    available: false,
  },
];
