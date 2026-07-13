import type { ComponentType } from 'react';

// The full roster is declared up front so the home screen can advertise the
// roadmap. Only games with `available: true` (and a `component`) are playable.
export type GameId =
  | 'pattern-recognition'
  | 'quick-math'
  | 'visual-memory'
  | 'logic'
  | 'odd-one-out'
  | 'zip'
  | 'queens';

export interface GameMeta {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  /** The mental skill this game trains, shown as a tag. */
  skill: string;
  /** Hex accent used for the card and in-game theming. */
  accent: string;
  icon: ComponentType<{ className?: string }>;
  /** Short bullet list rendered on the pre-game "ready" screen. */
  howTo: string[];
  available: boolean;
  component?: ComponentType<GameProps>;
}

export interface GameProps {
  meta: GameMeta;
  onExit: () => void;
}
