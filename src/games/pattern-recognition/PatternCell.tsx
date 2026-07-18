import type { Cell } from './patterns';

import { PATTERN_COLORS } from './patterns';

// Renders a single pattern cell as an SVG glyph. Rotation is applied to the
// whole SVG so it can animate smoothly and stays crisp at any angle.
const SHAPES: Record<Cell['shape'], JSX.Element> = {
  triangle: <path d="M50 16 L82 78 L18 78 Z" />,
  arrow: <path d="M18 40 H54 V24 L86 50 L54 76 V60 H18 Z" />,
  chevron: <path d="M30 20 L60 50 L30 80 L44 80 L74 50 L44 20 Z" />,
  circle: <circle cx="50" cy="50" r="30" />,
  square: <rect x="22" y="22" width="56" height="56" rx="9" />,
  plus: <path d="M40 20 H60 V40 H80 V60 H60 V80 H40 V60 H20 V40 H40 Z" />,
};

interface PatternCellProps {
  cell: Cell;
}

export default function PatternCell({ cell }: PatternCellProps) {
  const color = PATTERN_COLORS[cell.colorIndex];

  return (
    <svg
      className="pattern-glyph"
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${cell.rotation}deg)`, color }}
      aria-hidden="true"
    >
      <g fill="currentColor">{SHAPES[cell.shape]}</g>
    </svg>
  );
}
