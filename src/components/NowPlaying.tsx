import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { Visualizer } from './Visualizer';
import { ExpandIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from './Icons';

/** Radians of drag rotation mapped to seconds of scrub — ~5s per full turn. */
const SECONDS_PER_RADIAN = 0.8;
const MIN_RATE = 0.4;
const MAX_RATE = 2.5;

function angleFromPoint(clientX: number, clientY: number, el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(clientY - cy, clientX - cx);
}

function normalizeAngleDelta(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function useFullscreen(ref: React.RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [ref]);

  const toggle = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await ref.current?.requestFullscreen();
  };

  return { isFullscreen, toggle };
}

export function NowPlaying() {
  const track = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const visualizer = usePlayerStore((s) => s.visualizer);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const setScratching = usePlayerStore((s) => s.setScratching);
  const setScratchPlaybackRate = usePlayerStore((s) => s.setScratchPlaybackRate);

  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(containerRef);
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimer = useRef<number | undefined>(undefined);

  const [dragAngleDeg, setDragAngleDeg] = useState<number | null>(null);
  const dragState = useRef<{ lastAngle: number; lastTime: number } | null>(null);
  const isYouTube = track?.source === 'youtube';
  const showRecordArea = !isFullscreen;

  useEffect(() => {
    if (!isFullscreen) {
      setControlsVisible(true);
      return;
    }
    const resetTimer = () => {
      setControlsVisible(true);
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setControlsVisible(false), 2500);
    };
    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.clearTimeout(idleTimer.current);
    };
  }, [isFullscreen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!track) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const angle = angleFromPoint(e.clientX, e.clientY, e.currentTarget);
    dragState.current = { lastAngle: angle, lastTime: performance.now() };
    setDragAngleDeg((angle * 180) / Math.PI);
    setScratching(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !track) return;
    const now = performance.now();
    const angle = angleFromPoint(e.clientX, e.clientY, e.currentTarget);
    const delta = normalizeAngleDelta(angle - dragState.current.lastAngle);
    const dt = Math.max((now - dragState.current.lastTime) / 1000, 1 / 120);

    const { currentTime, duration } = usePlayerStore.getState();
    const timeDelta = delta * SECONDS_PER_RADIAN;
    const newTime = Math.min(Math.max(currentTime + timeDelta, 0), duration || 0);
    seek(newTime);

    const angularSpeed = delta / dt;
    const rate =
      delta >= 0
        ? Math.min(MAX_RATE, Math.max(1, 1 + angularSpeed * 0.15))
        : Math.max(MIN_RATE, 1 + angularSpeed * 0.05);
    setScratchPlaybackRate(rate);

    dragState.current = { lastAngle: angle, lastTime: now };
    setDragAngleDeg((prevDeg) => (prevDeg ?? 0) + (delta * 180) / Math.PI);
  };

  const endScratch = () => {
    if (!dragState.current) return;
    dragState.current = null;
    setDragAngleDeg(null);
    setScratching(false);
    setScratchPlaybackRate(1);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center flex-1 gap-6 px-6 py-8 min-h-0"
      style={isFullscreen ? { background: 'var(--bg)' } : undefined}
    >
      {/* Always mounted so the YouTube IFrame Player (which takes ownership of this
          DOM node outside React) never gets unmounted/remounted by React. YouTube's
          API terms require the player to stay visible while content plays, so it's
          shown in place of the vinyl art rather than hidden — never in fullscreen,
          since there's no visualizer data for YouTube tracks to go fullscreen with. */}
      <div
        className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          display: isYouTube && showRecordArea ? 'block' : 'none',
          boxShadow: '0 20px 60px var(--shadow)',
        }}
      >
        <div id="youtube-player-container" className="w-full h-full" />
      </div>

      {showRecordArea && !isYouTube && (
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endScratch}
            onPointerCancel={endScratch}
            className={`absolute inset-0 rounded-full shadow-2xl record-spin select-none touch-none ${
              isPlaying && dragAngleDeg === null ? '' : 'paused'
            }`}
            style={{
              background:
                'repeating-radial-gradient(circle at center, var(--record-face) 0px, var(--record-face) 3px, var(--record-groove) 4px, var(--record-face) 5px)',
              boxShadow: '0 20px 60px var(--shadow)',
              cursor: track ? (dragAngleDeg !== null ? 'grabbing' : 'grab') : 'default',
              transform: dragAngleDeg !== null ? `rotate(${dragAngleDeg}deg)` : undefined,
            }}
            title={track ? 'Drag to scratch' : undefined}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-[38%] h-[38%] rounded-full overflow-hidden border-4 flex items-center justify-center"
                style={{ borderColor: 'var(--record-face)', background: 'var(--bg-panel)' }}
              >
                {track?.artworkUrl ? (
                  <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <span className="text-2xl" style={{ color: 'var(--text-faint)' }}>
                    ♪
                  </span>
                )}
              </div>
            </div>
            <div
              className="absolute rounded-full"
              style={{
                width: 14,
                height: 14,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'var(--bg)',
                border: '2px solid var(--border)',
              }}
            />
          </div>
        </div>
      )}

      <div
        className="text-center min-h-[3.5rem]"
        style={{ opacity: isFullscreen && !controlsVisible ? 0 : 1, transition: 'opacity 0.5s ease' }}
      >
        <h1 className={`font-semibold truncate max-w-md ${isFullscreen ? 'text-2xl' : 'text-xl'}`} style={{ color: 'var(--text)' }}>
          {track?.title ?? 'Nothing playing'}
        </h1>
        <p className="text-sm mt-1 truncate max-w-md" style={{ color: 'var(--text-muted)' }}>
          {track ? `${track.artist}${track.album ? ' — ' + track.album : ''}` : 'Import tracks or pick a source to begin'}
        </p>
        {isYouTube && !isFullscreen && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
            Playing via YouTube — EQ, crossfade, and the visualizer only apply to local files
          </p>
        )}
      </div>

      {visualizer !== 'off' && !isYouTube && (
        <div className={isFullscreen ? 'w-full max-w-4xl flex-1' : 'w-full max-w-2xl'}>
          <Visualizer mode={visualizer} isPlaying={isPlaying} large={isFullscreen} />
        </div>
      )}

      {!isYouTube && (
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen visualizer'}
          className="cursor-pointer p-2 rounded-full"
          style={{
            position: isFullscreen ? 'absolute' : 'static',
            top: isFullscreen ? 16 : undefined,
            right: isFullscreen ? 16 : undefined,
            color: 'var(--text-faint)',
            opacity: isFullscreen && !controlsVisible ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}
        >
          <ExpandIcon size={18} />
        </button>
      )}

      {isFullscreen && (
        <div
          className="absolute bottom-8 flex items-center gap-4 px-5 py-3 rounded-full"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            opacity: controlsVisible ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          <button onClick={prev} className="cursor-pointer" style={{ color: 'var(--text)' }} title="Previous">
            <PrevIcon size={18} />
          </button>
          <button
            onClick={togglePlay}
            className="cursor-pointer p-2 rounded-full"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>
          <button onClick={() => next(false)} className="cursor-pointer" style={{ color: 'var(--text)' }} title="Next">
            <NextIcon size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
