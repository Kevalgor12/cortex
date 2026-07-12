import { GAMES } from '../../data/games';
import { ACHIEVEMENTS } from '../../data/achievements';
import { getUnlockedIds } from '../../lib/achievements';
import { globalStats, readStats } from '../../lib/stats';
import { ArrowLeftIcon, LockIcon } from '../../components/icons';
import './StatsScreen.scss';

interface StatsScreenProps {
  onExit: () => void;
}

export default function StatsScreen({ onExit }: StatsScreenProps) {
  const stats = readStats();
  const globals = globalStats(stats);
  const unlocked = new Set(getUnlockedIds());
  const playable = GAMES.filter((game) => game.available);

  const summary = [
    { label: 'Games played', value: globals.totalPlays.toLocaleString() },
    { label: 'Total score', value: globals.totalScore.toLocaleString() },
    { label: 'Best streak', value: String(globals.bestStreak) },
    { label: 'Achievements', value: `${unlocked.size}/${ACHIEVEMENTS.length}` },
  ];

  return (
    <div className="stats container">
      <header className="stats__bar">
        <button className="stats__back" onClick={onExit} aria-label="Back to home">
          <ArrowLeftIcon />
        </button>
        <h1 className="stats__title">Your Stats</h1>
      </header>

      <section className="stats__summary">
        {summary.map((item) => (
          <div className="stats__tile" key={item.label}>
            <span className="stats__tile-value">{item.value}</span>
            <span className="stats__tile-label">{item.label}</span>
          </div>
        ))}
      </section>

      <h2 className="stats__heading">By game</h2>
      <section className="stats__games">
        {playable.map((game) => {
          const stat = stats[game.id];
          const Icon = game.icon;
          return (
            <div className="stats__game" key={game.id} style={{ ['--accent' as string]: game.accent }}>
              <span className="stats__game-icon">
                <Icon />
              </span>
              <span className="stats__game-name">{game.name}</span>
              <div className="stats__game-figures">
                <Figure value={stat?.bestScore ?? 0} label="Best" />
                <Figure value={stat?.bestStreak ?? 0} label="Streak" />
                <Figure value={stat?.plays ?? 0} label="Plays" />
              </div>
            </div>
          );
        })}
      </section>

      <h2 className="stats__heading">Achievements</h2>
      <section className="stats__achievements">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlocked.has(achievement.id);
          const Icon = achievement.icon;
          return (
            <div
              className={`stats__achievement${isUnlocked ? ' is-unlocked' : ''}`}
              key={achievement.id}
            >
              <span className="stats__achievement-icon">
                {isUnlocked ? <Icon /> : <LockIcon />}
              </span>
              <span className="stats__achievement-name">{achievement.name}</span>
              <span className="stats__achievement-desc">{achievement.description}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <span className="stats__figure">
      <span className="stats__figure-value">{value.toLocaleString()}</span>
      <span className="stats__figure-label">{label}</span>
    </span>
  );
}
