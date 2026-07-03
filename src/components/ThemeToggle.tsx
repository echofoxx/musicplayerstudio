import { usePlayerStore } from '../store/playerStore';
import type { ThemeName } from '../types';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'modern-dark', label: 'Modern Dark' },
  { value: 'modern-light', label: 'Modern Light' },
  { value: 'vintage', label: 'Vintage' },
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
          className="px-3 py-1 text-xs rounded-full transition-colors cursor-pointer"
          style={{
            background: theme === t.value ? 'var(--accent)' : 'transparent',
            color: theme === t.value ? 'var(--accent-contrast)' : 'var(--text-muted)',
          }}
          aria-pressed={theme === t.value}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
