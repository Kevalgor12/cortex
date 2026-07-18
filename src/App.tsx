import { useState } from 'react';

import type { GameId } from './types/game';

import { GAMES } from './data/games';
import DailyChallenge from './screens/Daily/DailyChallenge';
import Home from './screens/Home/Home';
import StatsScreen from './screens/Stats/StatsScreen';

type View = 'home' | 'stats' | 'daily' | GameId;

export default function App() {
  const [view, setView] = useState<View>('home');
  const goHome = () => setView('home');

  if (view === 'stats') {
    return (
      <div className="app">
        <StatsScreen onExit={goHome} />
      </div>
    );
  }

  if (view === 'daily') {
    return (
      <div className="app">
        <DailyChallenge onExit={goHome} />
      </div>
    );
  }

  const game = view === 'home' ? undefined : GAMES.find((g) => g.id === view);
  const Game = game?.component;

  return (
    <div className="app">
      {game && Game ? (
        <Game meta={game} onExit={goHome} />
      ) : (
        <Home
          games={GAMES}
          onSelect={setView}
          onOpenStats={() => setView('stats')}
          onOpenDaily={() => setView('daily')}
        />
      )}
    </div>
  );
}
