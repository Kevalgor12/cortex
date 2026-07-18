import type { DifficultyConfig } from '../../engine/difficulty';
import type { GameProps } from '../../types/game';

import PatternCell from './PatternCell';
import { createPatternChallenge, type PatternChallenge } from './patterns';
import GameFrame from '../../components/GameFrame/GameFrame';
import { useChallengeGame } from '../../engine/useChallengeGame';
import './PatternRecognitionGame.scss';

const DIFFICULTY: DifficultyConfig = {
  roundsPerLevel: 3,
  maxLevel: 6,
  baseTimeMs: 6500,
  minTimeMs: 3500,
  timeStepMs: 400,
};

export default function PatternRecognitionGame({ meta, onExit }: GameProps) {
  const game = useChallengeGame<PatternChallenge, number>({
    gameId: meta.id,
    difficulty: DIFFICULTY,
    generate: createPatternChallenge,
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
        <div className={`pattern${result ? ` pattern--${result}` : ''}`}>
          <div className="pattern__sequence">
            {challenge.sequence.map((cell, i) => (
              <div className="pattern__cell" key={i}>
                <PatternCell cell={cell} />
              </div>
            ))}
            <div className="pattern__cell pattern__cell--mystery">?</div>
          </div>

          <p className="pattern__prompt">Which comes next?</p>

          <div className="pattern__options">
            {challenge.options.map((cell, i) => {
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
                  className={`pattern__option ${stateClass}`.trim()}
                  onClick={() => game.answer(i, i === challenge.answerIndex)}
                  disabled={phase === 'reveal'}
                  aria-label={`Option ${i + 1}`}
                >
                  <PatternCell cell={cell} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
