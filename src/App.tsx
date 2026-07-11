import { useState } from 'react';
import type { GameId } from './types/game';
import { GAMES } from './data/games';
import Home from './screens/Home/Home';

type View = 'home' | GameId;

export default function App() {
  const [view, setView] = useState<View>('home');

  const game = view === 'home' ? undefined : GAMES.find((g) => g.id === view);
  const Game = game?.component;

  return (
    <div className="app">
      {game && Game ? (
        <Game meta={game} onExit={() => setView('home')} />
      ) : (
        <Home games={GAMES} onSelect={setView} />
      )}
    </div>
  );
}
