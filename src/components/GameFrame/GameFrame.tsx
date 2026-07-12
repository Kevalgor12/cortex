import type { ReactNode } from 'react';
import type { GameMeta } from '../../types/game';
import type { GameStatus } from '../../engine/useGameSession';
import type { Achievement } from '../../data/achievements';
import Button from '../Button/Button';
import GameHud from '../GameHud/GameHud';
import TimerBar from '../TimerBar/TimerBar';
import GameOver from '../../screens/GameOver/GameOver';
import { ArrowLeftIcon } from '../icons';
import './GameFrame.scss';

interface GameFrameProps {
  meta: GameMeta;
  status: GameStatus;
  score: number;
  streak: number;
  lives: number;
  maxLives: number;
  bestStreak: number;
  highScore: number;
  isNewHighScore: boolean;
  unlocked: Achievement[];
  timerProgress: number;
  onStart: () => void;
  onReplay: () => void;
  onExit: () => void;
  children: ReactNode;
}

/**
 * The shared chrome for every mini-game: top bar, HUD + timer while playing,
 * the pre-game "ready" card, and the game-over screen. Each game supplies only
 * its round content via `children`.
 */
export default function GameFrame({
  meta,
  status,
  score,
  streak,
  lives,
  maxLives,
  bestStreak,
  highScore,
  isNewHighScore,
  unlocked,
  timerProgress,
  onStart,
  onReplay,
  onExit,
  children,
}: GameFrameProps) {
  const Icon = meta.icon;

  return (
    <div className="game-frame" style={{ ['--accent' as string]: meta.accent }}>
      <header className="game-frame__bar container">
        <button className="game-frame__back" onClick={onExit} aria-label="Back to home">
          <ArrowLeftIcon />
        </button>
        <div className="game-frame__title">
          <Icon className="game-frame__title-icon" />
          {meta.name}
        </div>
        <span className="game-frame__skill">{meta.skill}</span>
      </header>

      {status === 'playing' && (
        <div className="game-frame__status container">
          <GameHud score={score} streak={streak} lives={lives} maxLives={maxLives} />
          <TimerBar progress={timerProgress} />
        </div>
      )}

      <main className="game-frame__body container">
        {status === 'ready' && (
          <div className="game-frame__ready">
            <div className="game-frame__ready-icon">
              <Icon />
            </div>
            <h1 className="game-frame__ready-title">{meta.name}</h1>
            <p className="game-frame__ready-desc">{meta.description}</p>

            <ul className="game-frame__howto">
              {meta.howTo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <Button variant="primary" size="lg" block onClick={onStart}>
              Start
            </Button>
          </div>
        )}

        {status === 'playing' && <div className="game-frame__round">{children}</div>}

        {status === 'over' && (
          <GameOver
            score={score}
            bestStreak={bestStreak}
            highScore={highScore}
            isNewHighScore={isNewHighScore}
            unlocked={unlocked}
            onReplay={onReplay}
            onExit={onExit}
          />
        )}
      </main>
    </div>
  );
}
