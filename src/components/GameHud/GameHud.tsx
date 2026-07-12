import { FlameIcon } from '../icons';
import './GameHud.scss';

interface GameHudProps {
  score: number;
  streak: number;
  lives: number;
  maxLives: number;
}

export default function GameHud({ score, streak, lives, maxLives }: GameHudProps) {
  return (
    <div className="hud">
      <div className="hud__block">
        <span className="hud__label">Score</span>
        {/* keying on the value replays the pop animation on every change */}
        <span key={score} className="hud__score">
          {score}
        </span>
      </div>

      <div className="hud__block hud__block--center">
        <span className="hud__label">Streak</span>
        <span
          key={streak}
          className={`hud__streak${streak >= 3 ? ' is-hot' : ''}${
            streak > 0 && streak % 5 === 0 ? ' is-milestone' : ''
          }`}
        >
          <FlameIcon className="hud__flame" />
          {streak}
        </span>
      </div>

      <div className="hud__block hud__block--right">
        <span className="hud__label">Lives</span>
        <span className="hud__lives">
          {Array.from({ length: maxLives }, (_, i) => (
            <span key={i} className={`hud__life${i < lives ? '' : ' is-lost'}`} />
          ))}
        </span>
      </div>
    </div>
  );
}
