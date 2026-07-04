import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { formatTime } from '../utils/format';
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  SlidersIcon,
  VolumeIcon,
  WaveIcon,
} from './Icons';
import type { VisualizerMode } from '../types';

const VIS_MODES: { mode: VisualizerMode; label: string }[] = [
  { mode: 'off', label: 'Off' },
  { mode: 'bars', label: 'Bars' },
  { mode: 'mirror', label: 'Mirror Bars' },
  { mode: 'wave', label: 'Waveform' },
  { mode: 'vinyl', label: 'Vinyl Rings' },
  { mode: 'particles', label: 'Particles' },
  { mode: 'spectrogram', label: 'Spectrogram' },
];

interface Props {
  onToggleEQ: () => void;
  eqOpen: boolean;
}

export function PlayerBar({ onToggleEQ, eqOpen }: Props) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    crossfade,
    shuffle,
    repeat,
    visualizer,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    setCrossfade,
    toggleShuffle,
    cycleRepeat,
    setVisualizer,
  } = usePlayerStore();

  const disabled = !currentTrack;
  const isYouTube = currentTrack?.source === 'youtube';
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const [visMenuOpen, setVisMenuOpen] = useState(false);
  const visMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (visMenuRef.current && !visMenuRef.current.contains(e.target as Node)) setVisMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visMenuOpen]);

  return (
    <div
      className="border-t px-4 sm:px-6 py-3 flex flex-col gap-2"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs w-10 text-right tabular-nums" style={{ color: 'var(--text-faint)' }}>
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={disabled}
          className="flex-1"
          style={{
            background: `linear-gradient(to right, var(--accent) ${progressPct}%, var(--border) ${progressPct}%)`,
          }}
          aria-label="Seek"
        />
        <span className="text-xs w-10 tabular-nums" style={{ color: 'var(--text-faint)' }}>
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleShuffle}
            disabled={disabled}
            aria-pressed={shuffle}
            title="Shuffle"
            className="p-2 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: shuffle ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <ShuffleIcon size={18} />
          </button>
          <button onClick={prev} disabled={disabled} title="Previous" className="p-2 rounded-md cursor-pointer disabled:opacity-30" style={{ color: 'var(--text)' }}>
            <PrevIcon size={20} />
          </button>
          <button
            onClick={togglePlay}
            disabled={disabled}
            title={isPlaying ? 'Pause' : 'Play'}
            className="p-3 rounded-full cursor-pointer disabled:opacity-40 transition-transform active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <button onClick={() => next(false)} disabled={disabled} title="Next" className="p-2 rounded-md cursor-pointer disabled:opacity-30" style={{ color: 'var(--text)' }}>
            <NextIcon size={20} />
          </button>
          <button
            onClick={cycleRepeat}
            disabled={disabled}
            title={`Repeat: ${repeat}`}
            className="p-2 rounded-md cursor-pointer disabled:opacity-30"
            style={{ color: repeat !== 'off' ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {repeat === 'one' ? <RepeatOneIcon size={18} /> : <RepeatIcon size={18} />}
          </button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2" title={isYouTube ? 'Crossfade is unavailable for YouTube tracks' : 'Crossfade duration'}>
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
              Crossfade {crossfade}s
            </span>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={crossfade}
              disabled={isYouTube}
              onChange={(e) => setCrossfade(Number(e.target.value))}
              className="w-20 disabled:opacity-40"
            />
          </div>

          <div className="flex items-center gap-2" title="Volume">
            <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>
              <VolumeIcon size={18} muted={volume === 0} />
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="relative" ref={visMenuRef}>
            <button
              onClick={() => setVisMenuOpen((v) => !v)}
              title="Visualizer mode"
              aria-pressed={visMenuOpen}
              className="p-2 rounded-md cursor-pointer"
              style={{ color: visualizer !== 'off' ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <WaveIcon size={18} />
            </button>
            {visMenuOpen && (
              <div
                className="absolute bottom-full right-0 mb-2 py-1 rounded-lg border shadow-xl z-10 min-w-[9rem]"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
              >
                {VIS_MODES.map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setVisualizer(mode);
                      setVisMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm cursor-pointer"
                    style={{
                      color: visualizer === mode ? 'var(--accent)' : 'var(--text)',
                      background: visualizer === mode ? 'var(--bg-panel)' : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onToggleEQ}
            title="Equalizer"
            aria-pressed={eqOpen}
            className="p-2 rounded-md cursor-pointer"
            style={{ color: eqOpen ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <SlidersIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
