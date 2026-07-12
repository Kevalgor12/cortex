import { useState } from 'react';
import type { GameId } from './types/game';
import { GAMES } from './data/games';
import Home from './screens/Home/Home';
import StatsScreen from './screens/Stats/StatsScreen';

type View = 'home' | 'stats' | GameId;

export default function App() {
  const [view, setView] = useState<View>('home');

  if (view === 'stats') {
    return (
      <div className="app">
        <StatsScreen onExit={() => setView('home')} />
      </div>
    );
  }

  const game = view === 'home' ? undefined : GAMES.find((g) => g.id === view);
  const Game = game?.component;

  return (
    <div className="app">
      {game && Game ? (
        <Game meta={game} onExit={() => setView('home')} />
      ) : (
        <Home games={GAMES} onSelect={setView} onOpenStats={() => setView('stats')} />
      )}
    </div>
  );
}
