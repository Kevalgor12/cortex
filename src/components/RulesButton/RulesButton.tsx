import { useState } from 'react';

import { HelpIcon } from '../icons';
import './RulesButton.scss';

interface RulesButtonProps {
  title: string;
  rules: string[];
}

// A small "how to play" button that opens the game's rules in a dialog.
export default function RulesButton({ title, rules }: RulesButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rules-btn"
        onClick={() => setOpen(true)}
        aria-label="How to play"
        title="How to play"
      >
        <HelpIcon />
      </button>

      {open && (
        <div
          className="rules-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`How to play: ${title}`}
          onClick={() => setOpen(false)}
        >
          <div className="rules-modal__card" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal__head">
              <span className="rules-modal__title">How to play · {title}</span>
              <button className="rules-modal__close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <ul className="rules-modal__list">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
