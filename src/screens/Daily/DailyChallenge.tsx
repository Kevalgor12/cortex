import { useMemo, useRef, useState } from 'react';

import { cssVars } from '../../lib/cssVars';
import { completeDaily, dateSeed, isDoneToday, readDaily, todayKey, type DailyState } from '../../lib/daily';
import { withSeededRandom } from '../../lib/rng';

import Button from '../../components/Button/Button';
import Confetti from '../../components/Confetti/Confetti';
import { ArrowLeftIcon, CalendarIcon, CheckIcon, FlameIcon, HomeIcon } from '../../components/icons';
import { createLogicChallenge, type LogicChallenge } from '../../games/logic/series';
import { createOddChallenge, type OddChallenge } from '../../games/odd-one-out/odd';
import PatternCell from '../../games/pattern-recognition/PatternCell';
import { createPatternChallenge, type PatternChallenge } from '../../games/pattern-recognition/patterns';
import { createMathChallenge, type MathChallenge } from '../../games/quick-math/math';
import { useCountUp } from '../../hooks/useCountUp';
import './DailyChallenge.scss';

const POINTS_PER_CORRECT = 100;
const REVEAL_MS = 850;
const LEVEL = 3;

type DailyRound =
  | { kind: 'pattern'; challenge: PatternChallenge }
  | { kind: 'math'; challenge: MathChallenge }
  | { kind: 'logic'; challenge: LogicChallenge }
  | { kind: 'odd'; challenge: OddChallenge };

// Build the four rounds deterministically from the date seed, so the day's
// challenge is the same for everyone.
function buildRounds(seed: number): DailyRound[] {
  return [
    { kind: 'pattern', challenge: withSeededRandom(seed + 1, () => createPatternChallenge(LEVEL)) },
    { kind: 'math', challenge: withSeededRandom(seed + 2, () => createMathChallenge(LEVEL)) },
    { kind: 'logic', challenge: withSeededRandom(seed + 3, () => createLogicChallenge(LEVEL)) },
    { kind: 'odd', challenge: withSeededRandom(seed + 4, () => createOddChallenge(LEVEL)) },
  ];
}

const ROUND_LABEL: Record<DailyRound['kind'], string> = {
  pattern: 'Pattern',
  math: 'Quick Math',
  logic: 'Logic',
  odd: 'Odd One Out',
};

function correctIndexOf(round: DailyRound): number {
  return round.kind === 'odd' ? round.challenge.oddIndex : round.challenge.answerIndex;
}

interface DailyChallengeProps {
  onExit: () => void;
}

type Phase = 'intro' | 'playing' | 'done';

export default function DailyChallenge({ onExit }: DailyChallengeProps) {
  const rounds = useMemo(() => buildRounds(dateSeed(todayKey())), []);
  // Captured once at mount: recomputing would flip to true the moment we record
  // today's result, mislabelling the screen we just finished.
  const [alreadyDone] = useState(() => isDoneToday());

  const [phase, setPhase] = useState<Phase>(alreadyDone ? 'done' : 'intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<DailyState>(() => readDaily());
  const advanceRef = useRef<number>();

  const round = rounds[roundIndex];

  const start = () => {
    setPhase('playing');
    setRoundIndex(0);
    setSelected(null);
    setRevealing(false);
    setCorrectCount(0);
  };

  const pick = (index: number) => {
    if (revealing) return;
    const correct = index === correctIndexOf(round);
    const nextCorrect = correctCount + (correct ? 1 : 0);
    setSelected(index);
    setRevealing(true);
    setCorrectCount(nextCorrect);

    advanceRef.current = window.setTimeout(() => {
      if (roundIndex + 1 >= rounds.length) {
        const score = nextCorrect * POINTS_PER_CORRECT;
        setResult(completeDaily({ score, correct: nextCorrect, total: rounds.length }));
        setPhase('done');
      } else {
        setRoundIndex((i) => i + 1);
        setSelected(null);
        setRevealing(false);
      }
    }, REVEAL_MS);
  };

  return (
    <div className="daily container">
      <header className="daily__bar">
        <button className="daily__back" onClick={onExit} aria-label="Back to home">
          <ArrowLeftIcon />
        </button>
        <div className="daily__title">
          <CalendarIcon className="daily__title-icon" />
          Daily Challenge
        </div>
        {phase === 'playing' && (
          <span className="daily__progress">
            {roundIndex + 1}/{rounds.length}
          </span>
        )}
      </header>

      <main className="daily__body">
        {phase === 'intro' && <Intro streak={result.streak} onStart={start} />}

        {phase === 'playing' && (
          <div className="daily__round">
            <span className="daily__round-tag">{ROUND_LABEL[round.kind]}</span>
            <RoundView round={round} selected={selected} revealing={revealing} onPick={pick} />
          </div>
        )}

        {phase === 'done' && (
          <Result state={result} justPlayed={!alreadyDone} onExit={onExit} />
        )}
      </main>
    </div>
  );
}

function Intro({ streak, onStart }: { streak: number; onStart: () => void }) {
  return (
    <div className="daily__intro">
      <div className="daily__intro-icon">
        <CalendarIcon />
      </div>
      <h1 className="daily__intro-title">Today's Challenge</h1>
      <p className="daily__intro-desc">
        Four quick puzzles, one from each game. Everyone gets the same challenge today - come back
        daily to keep your streak alive.
      </p>
      {streak > 0 && (
        <p className="daily__intro-streak">
          <FlameIcon /> {streak}-day streak
        </p>
      )}
      <Button variant="primary" size="lg" block onClick={onStart}>
        Start
      </Button>
    </div>
  );
}

function Result({
  state,
  justPlayed,
  onExit,
}: {
  state: DailyState;
  justPlayed: boolean;
  onExit: () => void;
}) {
  const shownScore = useCountUp(state.lastScore);
  const perfect = justPlayed && state.lastTotal > 0 && state.lastCorrect === state.lastTotal;

  return (
    <div className="daily__result">
      {perfect && <Confetti />}
      <div className="daily__result-check">
        <CheckIcon />
      </div>
      <p className="daily__result-eyebrow">{justPlayed ? 'Daily complete' : 'Already done today'}</p>
      <div className="daily__result-score">{shownScore}</div>
      <p className="daily__result-detail">
        {state.lastCorrect}/{state.lastTotal} correct
      </p>

      <div className="daily__result-stats">
        <div className="daily__result-stat">
          <span className="daily__result-stat-value">
            <FlameIcon /> {state.streak}
          </span>
          <span className="daily__result-stat-label">Day streak</span>
        </div>
        <div className="daily__result-stat">
          <span className="daily__result-stat-value">{state.best}</span>
          <span className="daily__result-stat-label">Best daily</span>
        </div>
      </div>

      <p className="daily__result-note">Come back tomorrow for a new challenge.</p>
      <Button variant="primary" size="lg" block onClick={onExit}>
        <HomeIcon />
        Home
      </Button>
    </div>
  );
}

function RoundView({
  round,
  selected,
  revealing,
  onPick,
}: {
  round: DailyRound;
  selected: number | null;
  revealing: boolean;
  onPick: (index: number) => void;
}) {
  const correct = correctIndexOf(round);
  const optionClass = (i: number) =>
    revealing
      ? i === correct
        ? 'is-correct'
        : i === selected
          ? 'is-wrong'
          : 'is-dim'
      : '';

  if (round.kind === 'odd') {
    const { size, baseColor, oddColor, oddIndex } = round.challenge;
    return (
      <>
        <p className="daily__prompt">Tap the odd one out</p>
        <div className="daily__odd-grid" ref={cssVars({ '--cols': size })}>
          {Array.from({ length: size * size }, (_, i) => (
            <button
              key={i}
              className={`daily__odd-tile ${optionClass(i)}`.trim()}
              ref={cssVars({ '--tile': i === oddIndex ? oddColor : baseColor })}
              onClick={() => onPick(i)}
              disabled={revealing}
              aria-label={`Tile ${i + 1}`}
            />
          ))}
        </div>
      </>
    );
  }

  if (round.kind === 'pattern') {
    const { sequence, options } = round.challenge;
    return (
      <>
        <div className="daily__sequence">
          {sequence.map((cell, i) => (
            <div className="daily__cell" key={i}>
              <PatternCell cell={cell} />
            </div>
          ))}
          <div className="daily__cell daily__cell--q">?</div>
        </div>
        <p className="daily__prompt">Which comes next?</p>
        <div className="daily__options daily__options--tiles">
          {options.map((cell, i) => (
            <button
              key={i}
              className={`daily__option ${optionClass(i)}`.trim()}
              onClick={() => onPick(i)}
              disabled={revealing}
              aria-label={`Option ${i + 1}`}
            >
              <PatternCell cell={cell} />
            </button>
          ))}
        </div>
      </>
    );
  }

  // math + logic share a number-prompt layout
  const prompt =
    round.kind === 'math'
      ? `${round.challenge.left} ${round.challenge.symbol} ${round.challenge.right} = ?`
      : `${round.challenge.sequence.join('   ')}   ?`;
  return (
    <>
      <p className="daily__equation">{prompt}</p>
      <div className="daily__options">
        {round.challenge.options.map((value, i) => (
          <button
            key={i}
            className={`daily__option daily__option--num ${optionClass(i)}`.trim()}
            onClick={() => onPick(i)}
            disabled={revealing}
          >
            {value}
          </button>
        ))}
      </div>
    </>
  );
}
