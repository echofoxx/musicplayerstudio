import type { Track } from '../types';
import { formatTime } from '../utils/format';
import { PauseIcon, PlayIcon } from './Icons';

interface Props {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}

export function TrackRow({ track, isActive, isPlaying, onPlay }: Props) {
  const playable = !track.unplayable && !!track.streamUrl;

  return (
    <button
      onClick={onPlay}
      disabled={!playable}
      className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
    </button>
  );
}
