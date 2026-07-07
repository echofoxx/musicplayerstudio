import { usePlayerStore } from '../store/playerStore';
import type { ThemeName } from '../types';

const THEMES: { value: ThemeName; label: string; shortLabel: string }[] = [
  { value: 'modern-dark', label: 'Modern Dark', shortLabel: 'Dark' },
  { value: 'modern-light', label: 'Modern Light', shortLabel: 'Light' },
  { value: 'vintage', label: 'Vintage', shortLabel: 'Vintage' },
];

export function ThemeToggle() {
  const theme = usePlayerStore((s) => s.theme);
  const setTheme = usePlayerStore((s) => s.setTheme);

  return (
    <div className="flex items-center gap-1 rounded-full border p-1" style={{ borderColor: 'var(--border)' }}>
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className="px-2 sm:px-3 py-1 text-xs rounded-full transition-colors cursor-pointer"
          style={{
            background: theme === t.value ? 'var(--accent)' : 'transparent',
            color: theme === t.value ? 'var(--accent-contrast)' : 'var(--text-muted)',
          }}
          aria-pressed={theme === t.value}
        >
          <span className="sm:hidden">{t.shortLabel}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
