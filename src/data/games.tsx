import type { GameMeta } from '../types/game';
import {
  ChessIcon,
  CrownIcon,
  LogicIcon,
  MathIcon,
  MemoryIcon,
  OddOneOutIcon,
  PatternIcon,
  SunIcon,
  ZipIcon,
} from '../components/icons';
import PatternRecognitionGame from '../games/pattern-recognition/PatternRecognitionGame';
import QuickMathGame from '../games/quick-math/QuickMathGame';
import VisualMemoryGame from '../games/visual-memory/VisualMemoryGame';
import LogicChallengeGame from '../games/logic/LogicChallengeGame';
import OddOneOutGame from '../games/odd-one-out/OddOneOutGame';
import ZipGame from '../games/zip/ZipGame';
import QueensGame from '../games/queens/QueensGame';
import TangoGame from '../games/tango/TangoGame';
import SoloChessGame from '../games/solo-chess/SoloChessGame';

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
    description: 'Each series follows a hidden rule. Work it out and pick the number that comes next.',
    skill: 'Logic',
    accent: '#f59e0b',
    icon: LogicIcon,
    howTo: [
      'Study how the numbers change across the series.',
      'Figure out the rule connecting them.',
      'Pick the number that comes next before time runs out.',
    ],
    available: true,
    component: LogicChallengeGame,
  },
  {
    id: 'odd-one-out',
    name: 'Odd One Out',
    tagline: 'Find the tile that breaks the set',
    description: 'Every tile shares one colour — except one. Spot the odd shade before time runs out.',
    skill: 'Focus',
    accent: '#f472b6',
    icon: OddOneOutIcon,
    howTo: [
      'All tiles look the same colour — but one is slightly off.',
      'Tap the odd tile as fast as you can.',
      'Each level adds more tiles and a subtler difference.',
    ],
    available: true,
    component: OddOneOutGame,
  },
  {
    id: 'zip',
    name: 'Zip',
    tagline: 'Draw one path through every cell',
    description: 'Connect the numbers in order with a single line that fills every square of the grid.',
    skill: 'Planning',
    accent: '#f97316',
    icon: ZipIcon,
    howTo: [
      'Start at 1 and draw a path to 2, 3, and so on in order.',
      'Your line must pass through every cell exactly once.',
      'Drag across the grid — trace back over the line to erase.',
    ],
    available: true,
    component: ZipGame,
  },
  {
    id: 'queens',
    name: 'Queens',
    tagline: 'One crown per row, column and colour',
    description: 'Place a crown in every row, column and colour region so that no two crowns touch.',
    skill: 'Deduction',
    accent: '#a855f7',
    icon: CrownIcon,
    howTo: [
      'Place exactly one crown in every row, column and colour region.',
      'No two crowns may touch — not even diagonally.',
      'Placing a crown auto-marks the squares it rules out.',
      'Tap a square to mark it, again for a crown, again to clear.',
    ],
    available: true,
    component: QueensGame,
  },
  {
    id: 'tango',
    name: 'Tango',
    tagline: 'Balance the suns and moons',
    description: 'Fill the grid so each row and column has three suns and three moons, obeying every = and × clue.',
    skill: 'Logic',
    accent: '#f43f5e',
    icon: SunIcon,
    howTo: [
      'Each row and column needs three suns and three moons.',
      'No more than two of the same symbol sit next to each other.',
      '= means neighbours match; × means they differ.',
    ],
    available: true,
    component: TangoGame,
  },
  {
    id: 'solo-chess',
    name: 'Solo Chess',
    tagline: 'Capture down to a single piece',
    description: 'Every move must be a capture and each piece moves at most twice. Clear the board to one piece.',
    skill: 'Tactics',
    accent: '#22d3ee',
    icon: ChessIcon,
    howTo: [
      'Tap a piece, then tap a piece it can capture.',
      'Every move must capture — and each piece moves at most twice.',
      'Reduce the board to a single piece to win.',
    ],
    available: true,
    component: SoloChessGame,
  },
];
