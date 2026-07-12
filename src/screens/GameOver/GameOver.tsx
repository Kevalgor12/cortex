import type { Achievement } from '../../data/achievements';
import Button from '../../components/Button/Button';
import { HomeIcon, RefreshIcon, SparkleIcon, TrophyIcon } from '../../components/icons';
import './GameOver.scss';

interface GameOverProps {
  score: number;
  bestStreak: number;
  highScore: number;
  isNewHighScore: boolean;
  unlocked: Achievement[];
  onReplay: () => void;
  onExit: () => void;
}

export default function GameOver({
  score,
  bestStreak,
  highScore,
  isNewHighScore,
  unlocked,
  onReplay,
  onExit,
}: GameOverProps) {
  return (
    <div className="gameover">
      <div className={`gameover__medal${isNewHighScore ? ' is-record' : ''}`}>
        <TrophyIcon className="gameover__trophy" />
        {isNewHighScore && <span className="gameover__ring" />}
      </div>

      {isNewHighScore ? (
        <div className="gameover__record">
          <SparkleIcon />
          New personal best
        </div>
      ) : (
        <p className="gameover__eyebrow">Run complete</p>
      )}

      <div className="gameover__score">{score}</div>
      <p className="gameover__score-label">points</p>

      <div className="gameover__stats">
        <div className="gameover__stat">
          <span className="gameover__stat-value">{bestStreak}</span>
          <span className="gameover__stat-label">Best streak</span>
        </div>
        <div className="gameover__stat">
          <span className="gameover__stat-value">{highScore}</span>
          <span className="gameover__stat-label">All-time best</span>
        </div>
      </div>

      {unlocked.length > 0 && (
        <div className="gameover__unlocks">
          {unlocked.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div className="gameover__unlock" key={achievement.id}>
                <span className="gameover__unlock-icon">
                  <Icon />
                </span>
                <span className="gameover__unlock-text">
                  <span className="gameover__unlock-eyebrow">Achievement unlocked</span>
                  <span className="gameover__unlock-name">{achievement.name}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="gameover__actions">
        <Button variant="primary" size="lg" block onClick={onReplay}>
          <RefreshIcon />
          Play again
        </Button>
        <Button variant="ghost" size="lg" block onClick={onExit}>
          <HomeIcon />
          Home
        </Button>
      </div>
    </div>
  );
}
