import type { DifficultyConfig } from '../../engine/difficulty';
import type { GameProps } from '../../types/game';

import { cssVars } from '../../lib/cssVars';

import { createOddChallenge, type OddChallenge } from './odd';
import GameFrame from '../../components/GameFrame/GameFrame';
import { useChallengeGame } from '../../engine/useChallengeGame';
import './OddOneOutGame.scss';

const DIFFICULTY: DifficultyConfig = {
  roundsPerLevel: 2,
  maxLevel: 8,
  baseTimeMs: 6000,
  minTimeMs: 3500,
  timeStepMs: 350,
};

export default function OddOneOutGame({ meta, onExit }: GameProps) {
  const game = useChallengeGame<OddChallenge, number>({
    gameId: meta.id,
    difficulty: DIFFICULTY,
    generate: createOddChallenge,
  });

  const { challenge, phase, selection } = game;
  const result =
    phase === 'reveal' && challenge
      ? selection === challenge.oddIndex
        ? 'correct'
        : 'wrong'
      : null;

  return (
    <GameFrame
      meta={meta}
      status={game.status}
      score={game.score}
      streak={game.streak}
      lives={game.lives}
      maxLives={game.maxLives}
      bestStreak={game.bestStreak}
      highScore={game.highScore}
      isNewHighScore={game.isNewHighScore}
      unlocked={game.unlocked}
      timerProgress={game.timerProgress}
      onStart={game.begin}
      onReplay={game.begin}
      onExit={onExit}
    >
      {challenge && (
        <div className={`odd${result ? ` odd--${result}` : ''}`}>
          <p className="odd__prompt">Tap the odd one out</p>

          <div className="odd__grid" ref={cssVars({ '--cols': challenge.size })}>
            {Array.from({ length: challenge.size * challenge.size }, (_, i) => {
              const isOdd = i === challenge.oddIndex;
              const stateClass =
                phase === 'reveal'
                  ? isOdd
                    ? 'is-correct'
                    : i === selection
                      ? 'is-wrong'
                      : 'is-dim'
                  : '';
              return (
                <button
                  key={i}
                  className={`odd__tile ${stateClass}`.trim()}
                  ref={cssVars({ '--tile': isOdd ? challenge.oddColor : challenge.baseColor })}
                  onClick={() => game.answer(i, isOdd)}
                  disabled={phase === 'reveal'}
                  aria-label={`Tile ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
