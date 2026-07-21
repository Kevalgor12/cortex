import { CloseIcon } from '../icons';
import './HintBanner.scss';

interface HintBannerProps {
  message: string;
  onDismiss: () => void;
}

// The hint text sits until the player acts on it or dismisses it - no auto-hide,
// since reading and understanding a hint can take a while.
export default function HintBanner({ message, onDismiss }: HintBannerProps) {
  return (
    <div className={`hint-banner${message ? ' is-shown' : ''}`} role="status">
      {message && (
        <>
          <span className="hint-banner__text">{message}</span>
          <button
            type="button"
            className="hint-banner__close"
            onClick={onDismiss}
            aria-label="Dismiss hint"
          >
            <CloseIcon />
          </button>
        </>
      )}
    </div>
  );
}
