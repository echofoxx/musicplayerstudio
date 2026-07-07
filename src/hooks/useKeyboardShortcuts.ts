import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

/**
 * Global playback shortcuts: Space play/pause, arrows seek/volume,
 * Shift+arrows prev/next, M mute. Disabled while typing in a field, and
 * ignores presses with modifier keys so browser/OS shortcuts still work.
 */
export function useKeyboardShortcuts() {
  const volumeBeforeMute = useRef(0.85);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;

      const { currentTrack, currentTime, duration, volume, togglePlay, seek, next, prev, setVolume } =
        usePlayerStore.getState();
      if (!currentTrack && e.key !== ' ') return;

      switch (e.key) {
        case ' ':
          if (currentTrack) {
            e.preventDefault();
            togglePlay();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) next(false);
          else seek(Math.min(duration || 0, currentTime + 5));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) prev();
          else seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          if (volume > 0) {
            volumeBeforeMute.current = volume;
            setVolume(0);
          } else {
            setVolume(volumeBeforeMute.current || 0.85);
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
