import type { DifficultyConfig } from '../../engine/difficulty';
import type { GameProps } from '../../types/game';

import { createMathChallenge, type MathChallenge } from './math';
import GameFrame from '../../components/GameFrame/GameFrame';
import { useChallengeGame } from '../../engine/useChallengeGame';
import './QuickMathGame.scss';

// Mental arithmetic is quick, so the clock is tighter and levels come faster.
const DIFFICULTY: DifficultyConfig = {
  roundsPerLevel: 4,
  maxLevel: 8,
  baseTimeMs: 5500,
  minTimeMs: 2600,
  timeStepMs: 350,
};

export default function QuickMathGame({ meta, onExit }: GameProps) {
  const game = useChallengeGame<MathChallenge, number>({
    gameId: meta.id,
    difficulty: DIFFICULTY,
    generate: createMathChallenge,
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
        <div className={`math${result ? ` math--${result}` : ''}`}>
          <div className="math__equation">
            <span className="math__num">{challenge.left}</span>
            <span className="math__op">{challenge.symbol}</span>
            <span className="math__num">{challenge.right}</span>
            <span className="math__op">=</span>
            <span className="math__q">?</span>
          </div>

          <div className="math__options">
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
                  className={`math__option ${stateClass}`.trim()}
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
