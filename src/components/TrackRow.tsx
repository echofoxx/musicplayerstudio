import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import type { Track } from '../types';
import { formatTime } from '../utils/format';
import { PauseIcon, PlayIcon, PlusIcon } from './Icons';

interface Props {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  showAddToPlaylist?: boolean;
}

export function TrackRow({ track, isActive, isPlaying, onPlay, showAddToPlaylist }: Props) {
  const playable = !track.unplayable && (!!track.streamUrl || !!track.youtubeVideoId);
  const playlists = usePlayerStore((s) => s.playlists);
  const addTrackToPlaylist = usePlayerStore((s) => s.addTrackToPlaylist);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={playable ? 0 : -1}
      onClick={() => playable && onPlay()}
      onKeyDown={(e) => {
        if (playable && (e.key === 'Enter' || e.key === ' ')) onPlay();
      }}
      aria-disabled={!playable}
      className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      style={{ background: isActive ? 'var(--bg-panel)' : 'transparent' }}
    >
      <div
        className="w-9 h-9 rounded-md overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
        ) : isActive && isPlaying ? (
          <PauseIcon size={14} />
        ) : (
          <PlayIcon size={14} className="opacity-0 group-hover:opacity-70" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-sm truncate"
          style={{ color: isActive ? 'var(--accent)' : 'var(--text)' }}
        >
          {track.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
          {track.artist}
        </p>
      </div>
      <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--text-faint)' }}>
        {playable ? formatTime(track.duration) : 'preview'}
      </span>

      {showAddToPlaylist && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            title="Add to playlist"
            className="p-1 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 aria-expanded:opacity-100"
            aria-expanded={menuOpen}
            style={{ color: 'var(--text-faint)' }}
          >
            <PlusIcon size={16} />
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full right-0 mt-1 py-1 rounded-lg border shadow-xl z-20 min-w-[10rem] max-h-56 overflow-y-auto"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              {playlists.length === 0 && (
                <p className="px-3 py-1.5 text-xs" style={{ color: 'var(--text-faint)' }}>
                  No playlists yet
                </p>
              )}
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    addTrackToPlaylist(p.id, track);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm truncate cursor-pointer"
                  style={{ color: 'var(--text)' }}
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => {
                  const id = createPlaylist(`New Playlist ${playlists.length + 1}`);
                  addTrackToPlaylist(id, track);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm cursor-pointer border-t"
                style={{ color: 'var(--accent)', borderColor: 'var(--border)' }}
              >
                + New playlist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
