import { usePlayerStore } from '../store/playerStore';
import type { SourceKind } from '../types';
import { TrackRow } from './TrackRow';
import { SearchIcon } from './Icons';

interface Props {
  kind: SourceKind;
}

export function StreamingPanel({ kind }: Props) {
  const query = usePlayerStore((s) => s.searchQuery[kind]);
  const results = usePlayerStore((s) => s.searchResults[kind]);
  const note = usePlayerStore((s) => s.searchNotes[kind]);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setSearchQuery = usePlayerStore((s) => s.setSearchQuery);
  const runSearch = usePlayerStore((s) => s.runSearch);
  const source = usePlayerStore((s) => s.sources[kind]);
  const playFromList = usePlayerStore((s) => s.playFromList);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{ borderColor: 'var(--border)' }}
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(kind);
        }}
      >
        <span style={{ color: 'var(--text-faint)' }}>
          <SearchIcon size={16} />
        </span>
        <input
          value={query}
          onChange={(e) => setSearchQuery(kind, e.target.value)}
          placeholder={`Search ${source.displayName}…`}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--text)' }}
        />
      </form>

      {!source.isConnected() && (
        <div
          className="mx-3 mb-3 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Not connected. {kind === 'youtube' ? 'Add a YouTube Data API key' : 'Sign in with Spotify (Premium + OAuth)'} to enable
          real search and playback — results below are placeholders.
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
        {results.length === 0 ? (
          <p className="text-xs text-center px-4 py-6" style={{ color: 'var(--text-faint)' }}>
            {note ?? `Search ${source.displayName} to see results here.`}
          </p>
        ) : (
          results.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isActive={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              onPlay={() => {
                if (currentTrack?.id === track.id) togglePlay();
                else playFromList(track, results);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
