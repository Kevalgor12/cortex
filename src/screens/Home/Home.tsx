import type { GameId, GameMeta } from '../../types/game';

import { isDoneToday, readDaily } from '../../lib/daily';

import { BrainIcon, CalendarIcon, ChartIcon, CheckIcon, FlameIcon, LockIcon } from '../../components/icons';
import './Home.scss';

interface HomeProps {
  games: GameMeta[];
  onSelect: (id: GameId) => void;
  onOpenStats: () => void;
  onOpenDaily: () => void;
}

export default function Home({ games, onSelect, onOpenStats, onOpenDaily }: HomeProps) {
  const daily = readDaily();
  const dailyDone = isDoneToday(daily);

  return (
    <div className="home container">
      <header className="home__top">
        <span className="home__brand">
          <BrainIcon className="home__brand-icon" />
          Cortex
        </span>
        <button className="home__stats-btn" onClick={onOpenStats}>
          <ChartIcon />
          Stats
        </button>
      </header>

      <main>
      <div className="home__hero">
        <h1 className="home__headline">
          Train your brain in <span>five minutes</span>.
        </h1>
        <p className="home__subhead">
          Fast, focused challenges for reasoning, memory and speed. Beat your best, build a streak.
        </p>
      </div>

      <button className={`daily-card${dailyDone ? ' is-done' : ''}`} onClick={onOpenDaily}>
        <span className="daily-card__icon">
          <CalendarIcon />
        </span>
        <span className="daily-card__text">
          <span className="daily-card__title">Daily Challenge</span>
          <span className="daily-card__sub">
            {dailyDone ? 'Completed today - see your result' : 'Four puzzles. One shot. Same for everyone.'}
          </span>
        </span>
        {daily.streak > 0 && (
          <span className="daily-card__streak">
            <FlameIcon />
            {daily.streak}
          </span>
        )}
        {dailyDone && (
          <span className="daily-card__done">
            <CheckIcon />
          </span>
        )}
      </button>

      <section className="home__grid" aria-label="Games">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onSelect={onSelect} />
        ))}
      </section>

      <footer className="home__footer">More games unlock as the collection grows.</footer>
      </main>
    </div>
  );
}

function GameCard({ game, onSelect }: { game: GameMeta; onSelect: (id: GameId) => void }) {
  const Icon = game.icon;

  return (
    <button
      className={`card${game.available ? '' : ' card--locked'}`}
      data-game={game.id}
      onClick={() => game.available && onSelect(game.id)}
      disabled={!game.available}
    >
      <span className="card__icon">
        <Icon />
      </span>
      <span className="card__body">
        <span className="card__name">{game.name}</span>
        <span className="card__tagline">{game.tagline}</span>
      </span>
      <span className="card__skill">{game.skill}</span>
      {!game.available && (
        <span className="card__soon">
          <LockIcon />
          Soon
        </span>
      )}
    </button>
  );
}
