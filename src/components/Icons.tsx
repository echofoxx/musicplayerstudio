type IconProps = { size?: number; className?: string };

const base = (size = 20) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none' });

export function PlayIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 5v14l12-7-12-7z" fill="currentColor" />
    </svg>
  );
}
export function PauseIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="6" y="5" width="4" height="14" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" fill="currentColor" />
    </svg>
  );
}
export function NextIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 5v14l10-7L6 5z" fill="currentColor" />
      <rect x="17" y="5" width="2.2" height="14" fill="currentColor" />
    </svg>
  );
}
export function PrevIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M18 5v14L8 12l10-7z" fill="currentColor" />
      <rect x="4.8" y="5" width="2.2" height="14" fill="currentColor" />
    </svg>
  );
}
export function ShuffleIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h3.5c2 0 3 1 4.3 3M3 18h3.5c2 0 3-1 4.3-3M15 6h3.2M15 18h3.2" />
      <path d="M17 4l3 2-3 2M17 16l3 2-3 2" />
      <path d="M10.8 12c1.3 2 2.3 3 4.3 3M15.1 9c-.6.9-1.1 1.6-1.7 2.2" />
    </svg>
  );
}
export function RepeatIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h13a3 3 0 0 1 3 3v2" />
      <path d="M8 4 4 7l4 3" />
      <path d="M20 17H7a3 3 0 0 1-3-3v-2" />
      <path d="M16 20l4-3-4-3" />
    </svg>
  );
}
export function RepeatOneIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h13a3 3 0 0 1 3 3v2" />
      <path d="M8 4 4 7l4 3" />
      <path d="M20 17H7a3 3 0 0 1-3-3v-2" />
      <path d="M16 20l4-3-4-3" />
      <text x="10.5" y="15" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
    </svg>
  );
}
export function VolumeIcon({ size, className, muted }: IconProps & { muted?: boolean }) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {!muted && <path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11" />}
      {muted && <path d="M16 9l5 6M21 9l-5 6" />}
    </svg>
  );
}
export function SlidersIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 21V13M5 9V3M12 21v-5M12 12V3M19 21v-3M19 14V3" />
      <circle cx="5" cy="11" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function WaveIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 12h2l2-7 3 14 3-11 2 4h2l2-4 3 8h1" />
    </svg>
  );
}
export function UploadIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
export function SearchIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
export function ExpandIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
    </svg>
  );
}
