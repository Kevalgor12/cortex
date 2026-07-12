// Small inline SVG icons. They inherit `currentColor` so CSS controls colour,
// which keeps the bundle free of any icon-library dependency.
interface IconProps {
  className?: string;
}

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function BrainIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 5a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 12a2.5 2.5 0 0 0 1.5 4.5A2.5 2.5 0 0 0 9 19c1 0 2-.6 2-1.8V6.8C11 5.6 10 5 9 5Z" />
      <path d="M15 5a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 12a2.5 2.5 0 0 1-1.5 4.5A2.5 2.5 0 0 1 15 19c-1 0-2-.6-2-1.8V6.8C13 5.6 14 5 15 5Z" />
    </svg>
  );
}

export function PatternIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
      <circle cx="7" cy="17" r="2.2" />
      <path d="M9.2 8.2 14.8 15.8" />
      <path d="M9.2 7h5.6M7 9.2v5.6" opacity="0" />
      <rect x="14.4" y="14.4" width="5.2" height="5.2" rx="1.4" />
    </svg>
  );
}

export function MathIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 8h6M8 5v6" />
      <path d="M14 7.5h5" />
      <path d="M6 16.5h5M6.5 14l4 5" />
      <path d="M14 15h5M14 18h5" />
    </svg>
  );
}

export function MemoryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function LogicIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M6 8.5v3a2 2 0 0 0 2 2h1M18 8.5v3a2 2 0 0 1-2 2h-1M12 13.5v2" />
    </svg>
  );
}

export function OddOneOutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <rect x="14.6" y="14.6" width="5.8" height="5.8" rx="1.4" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3c.6 2.4-.8 3.7-2 5-1.3 1.4-2.5 2.8-2.5 5A4.5 4.5 0 0 0 12 21a4.5 4.5 0 0 0 4.5-4.5c0-1.7-.7-2.9-1.6-4-.3.7-.8 1.2-1.5 1.4.6-2.4-.2-4.6-1.4-6.4Z" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 2.5M17 6h2.5A2.5 2.5 0 0 1 17 8.5" />
      <path d="M12 13v3M9 20h6M10 20l.5-4M14 20l-.5-4" />
    </svg>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M20 11a8 8 0 1 0-.9 4.5" />
      <path d="M20 5v5h-5" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3.5c.6 3.2 1.8 4.4 5 5-3.2.6-4.4 1.8-5 5-.6-3.2-1.8-4.4-5-5 3.2-.6 4.4-1.8 5-5Z" />
      <path d="M18.5 15c.3 1.4.8 1.9 2.2 2.2-1.4.3-1.9.8-2.2 2.2-.3-1.4-.8-1.9-2.2-2.2 1.4-.3 1.9-.8 2.2-2.2Z" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 4v15a1 1 0 0 0 1 1h14" />
      <rect x="8" y="12" width="3" height="5" rx="0.6" />
      <rect x="13" y="9" width="3" height="8" rx="0.6" />
      <rect x="18" y="6" width="3" height="11" rx="0.6" />
    </svg>
  );
}

export function MedalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M8 3 12 9 16 3" />
      <path d="M9.5 3h5" />
      <circle cx="12" cy="15" r="5.5" />
      <path d="M12 12.5 12.9 14.2 14.7 14.5 13.4 15.8 13.7 17.6 12 16.8 10.3 17.6 10.6 15.8 9.3 14.5 11.1 14.2Z" />
    </svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.8 1-5.8-4.2-4.1 5.9-.9Z" />
    </svg>
  );
}
