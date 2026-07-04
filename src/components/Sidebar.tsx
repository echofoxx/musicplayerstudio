import { usePlayerStore } from '../store/playerStore';
import type { SidebarTab } from '../types';
import { LibraryPanel } from './LibraryPanel';
import { StreamingPanel } from './StreamingPanel';
import { PlaylistsPanel } from './PlaylistsPanel';

const TABS: { kind: SidebarTab; label: string }[] = [
  { kind: 'local', label: 'Your Library' },
  { kind: 'playlists', label: 'Playlists' },
  { kind: 'youtube', label: 'YouTube Music' },
  { kind: 'spotify', label: 'Spotify' },
];

export function Sidebar() {
  const activeSource = usePlayerStore((s) => s.activeSource);
  const setActiveSource = usePlayerStore((s) => s.setActiveSource);

  return (
    <aside
      className="w-full sm:w-80 shrink-0 flex flex-col border-r min-h-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
    >
      <div className="flex px-2 pt-2 gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            onClick={() => setActiveSource(tab.kind)}
            className="flex-1 text-xs px-2 py-2 rounded-t-lg cursor-pointer transition-colors truncate whitespace-nowrap"
            style={{
              color: activeSource === tab.kind ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeSource === tab.kind ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeSource === 'local' && <LibraryPanel />}
        {activeSource === 'playlists' && <PlaylistsPanel />}
        {activeSource === 'youtube' && <StreamingPanel kind="youtube" />}
        {activeSource === 'spotify' && <StreamingPanel kind="spotify" />}
      </div>
    </aside>
  );
}
