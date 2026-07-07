import { ThemeToggle } from './ThemeToggle';
import { KeyboardHelp } from './KeyboardHelp';
import { MenuIcon } from './Icons';

interface Props {
  onToggleMenu: () => void;
}

export function Header({ onToggleMenu }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMenu}
          title="Menu"
          className="sm:hidden p-1 -ml-1 cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          <MenuIcon size={20} />
        </button>
        <span
          className="w-7 h-7 rounded-full inline-block"
          style={{ background: 'var(--accent)' }}
        />
        <span className="font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          Echo
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <KeyboardHelp />
      </div>
    </header>
  );
}
