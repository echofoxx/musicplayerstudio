import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-7 h-7 rounded-full inline-block"
          style={{ background: 'var(--accent)' }}
        />
        <span className="font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          Echo
        </span>
      </div>
      <ThemeToggle />
    </header>
  );
}
