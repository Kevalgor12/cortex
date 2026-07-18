import type { DifficultyConfig } from '../../engine/difficulty';
import type { GameProps } from '../../types/game';

import { createLogicChallenge, type LogicChallenge } from './series';
import GameFrame from '../../components/GameFrame/GameFrame';
import { useChallengeGame } from '../../engine/useChallengeGame';
import './LogicChallengeGame.scss';

// Logic needs more thinking time than mental math, so the clock is roomier.
const DIFFICULTY: DifficultyConfig = {
  roundsPerLevel: 3,
  maxLevel: 7,
  baseTimeMs: 8000,
  minTimeMs: 4000,
  timeStepMs: 600,
};

export default function LogicChallengeGame({ meta, onExit }: GameProps) {
  const game = useChallengeGame<LogicChallenge, number>({
    gameId: meta.id,
    difficulty: DIFFICULTY,
    generate: createLogicChallenge,
  });

  const { challenge, phase, selection } = game;
  const result =
    phase === 'reveal' && challenge
      ? selection === challenge.answerIndex
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
        <div className={`logic${result ? ` logic--${result}` : ''}`}>
          <p className="logic__prompt">Find the next number</p>

          <div className="logic__sequence">
            {challenge.sequence.map((term, i) => (
              <span className="logic__term" key={i}>
                {term}
              </span>
            ))}
            <span className="logic__term logic__term--q">?</span>
          </div>

          <div className="logic__options">
            {challenge.options.map((value, i) => {
              const stateClass =
                phase === 'reveal'
                  ? i === challenge.answerIndex
                    ? 'is-correct'
                    : i === selection
                      ? 'is-wrong'
                      : 'is-dim'
                  : '';
              return (
                <button
                  key={i}
                  className={`logic__option ${stateClass}`.trim()}
                  onClick={() => game.answer(i, i === challenge.answerIndex)}
                  disabled={phase === 'reveal'}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
