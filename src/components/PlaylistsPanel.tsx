import { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import type { Playlist } from '../types';
import { TrackRow } from './TrackRow';
import { GripIcon, ListMusicIcon, PlayIcon, PlusIcon, TrashIcon } from './Icons';

function PlaylistDetail({ playlist, onBack }: { playlist: Playlist; onBack: () => void }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playPlaylist = usePlayerStore((s) => s.playPlaylist);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const removeTrackFromPlaylist = usePlayerStore((s) => s.removeTrackFromPlaylist);
  const reorderPlaylistTrack = usePlayerStore((s) => s.reorderPlaylistTrack);
  const renamePlaylist = usePlayerStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlayerStore((s) => s.deletePlaylist);

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const commitName = () => {
    setEditingName(false);
    if (name.trim() && name.trim() !== playlist.name) renamePlaylist(playlist.id, name);
    else setName(playlist.name);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 pt-3 pb-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onBack}
          title="Back to playlists"
          className="cursor-pointer px-1 text-lg leading-none"
          style={{ color: 'var(--text-muted)' }}
        >
          ‹
        </button>
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && commitName()}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold border-b"
            style={{ color: 'var(--text)', borderColor: 'var(--accent)' }}
          />
        ) : (
          <h2
            onClick={() => setEditingName(true)}
            title="Click to rename"
            className="flex-1 min-w-0 truncate text-sm font-semibold cursor-text"
            style={{ color: 'var(--text)' }}
          >
            {playlist.name}
          </h2>
        )}
        <button
          onClick={() => {
            deletePlaylist(playlist.id);
            onBack();
          }}
          title="Delete playlist"
          className="cursor-pointer p-1 shrink-0"
          style={{ color: 'var(--text-faint)' }}
        >
          <TrashIcon size={16} />
        </button>
      </div>

      <div className="px-3 py-2">
        <button
          onClick={() => playPlaylist(playlist.id)}
          disabled={playlist.tracks.length === 0}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          <PlayIcon size={14} />
          Play all
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
        {playlist.tracks.length === 0 ? (
          <p className="text-xs text-center px-4 py-6" style={{ color: 'var(--text-faint)' }}>
            Empty. Add tracks from Your Library or search results using the + button on each track.
          </p>
        ) : (
          playlist.tracks.map((track, i) => (
            <div
              key={track.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== i) reorderPlaylistTrack(playlist.id, dragIndex, i);
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              className="flex items-center gap-1 group rounded-lg"
              style={{ background: dragOverIndex === i ? 'var(--bg-panel)' : 'transparent', opacity: dragIndex === i ? 0.4 : 1 }}
            >
              <span className="cursor-grab opacity-30 group-hover:opacity-70 shrink-0 pl-1" style={{ color: 'var(--text-faint)' }}>
                <GripIcon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <TrackRow
                  track={track}
                  isActive={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onPlay={() => {
                    if (currentTrack?.id === track.id) togglePlay();
                    else playPlaylist(playlist.id, track);
                  }}
                />
              </div>
              <button
                onClick={() => removeTrackFromPlaylist(playlist.id, track.id)}
                title="Remove from playlist"
                className="p-1 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--text-faint)' }}
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function PlaylistsPanel() {
  const playlists = usePlayerStore((s) => s.playlists);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const selected = playlists.find((p) => p.id === selectedId) ?? null;
  if (selected) return <PlaylistDetail playlist={selected} onBack={() => setSelectedId(null)} />;

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{ borderColor: 'var(--border)' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          const id = createPlaylist(newName);
          setNewName('');
          setSelectedId(id);
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--text)' }}
        />
        <button type="submit" title="Create playlist" className="cursor-pointer" style={{ color: 'var(--accent)' }}>
          <PlusIcon size={18} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
        {playlists.length === 0 ? (
          <p className="text-xs text-center px-4 py-6" style={{ color: 'var(--text-faint)' }}>
            No playlists yet. Create one above, or use the + button on any track.
          </p>
        ) : (
          playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors"
              style={{ background: 'transparent' }}
            >
              <div
                className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}
              >
                <ListMusicIcon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate" style={{ color: 'var(--text)' }}>
                  {p.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {p.tracks.length} track{p.tracks.length === 1 ? '' : 's'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
