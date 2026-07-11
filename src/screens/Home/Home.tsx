import type { GameId, GameMeta } from '../../types/game';
import { BrainIcon, LockIcon } from '../../components/icons';
import './Home.scss';

interface HomeProps {
  games: GameMeta[];
  onSelect: (id: GameId) => void;
}

export default function Home({ games, onSelect }: HomeProps) {
  return (
    <div className="home container">
      <header className="home__hero">
        <div className="home__brand">
          <BrainIcon className="home__brand-icon" />
          Cortex
        </div>
        <h1 className="home__headline">
          Train your brain in <span>five minutes</span>.
        </h1>
        <p className="home__subhead">
          Fast, focused challenges for reasoning, memory and speed. Beat your best, build a streak.
        </p>
      </header>

      <section className="home__grid" aria-label="Games">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onSelect={onSelect} />
        ))}
      </section>

      <footer className="home__footer">More games unlock as the collection grows.</footer>
    </div>
  );
}

function GameCard({ game, onSelect }: { game: GameMeta; onSelect: (id: GameId) => void }) {
  const Icon = game.icon;

  return (
    <button
      className={`card${game.available ? '' : ' card--locked'}`}
      style={{ ['--accent' as string]: game.accent }}
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
