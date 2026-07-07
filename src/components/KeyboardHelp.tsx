import { useEffect, useRef, useState } from 'react';

const SHORTCUTS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['← / →', 'Seek -5s / +5s'],
  ['Shift + ← / →', 'Previous / next track'],
  ['↑ / ↓', 'Volume up / down'],
  ['M', 'Mute / unmute'],
];

export function KeyboardHelp() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Keyboard shortcuts"
        aria-expanded={open}
        className="w-7 h-7 rounded-full border flex items-center justify-center cursor-pointer text-xs font-semibold"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        ?
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-2 py-2 px-3 rounded-lg border shadow-xl z-20 w-56"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
            Keyboard shortcuts
          </p>
          <dl className="space-y-1">
            {SHORTCUTS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-3 text-xs">
                <dt className="font-mono" style={{ color: 'var(--accent)' }}>
                  {key}
                </dt>
                <dd style={{ color: 'var(--text-muted)' }}>{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
