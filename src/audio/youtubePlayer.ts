/**
 * Thin wrapper around the YouTube IFrame Player API. YouTube's API terms
 * require the player to stay visibly on-screen (no headless/hidden audio
 * extraction), so this always mounts into a real, visible container — the
 * UI swaps the vinyl record artwork for this player when a YouTube track is
 * playing (see components/NowPlaying.tsx) rather than hiding it.
 *
 * This is a separate playback path from the Web Audio engine: YouTube's
 * embed is a cross-origin iframe, so its audio can't be routed through our
 * AnalyserNode/EQ/GainNode graph. Play/pause/seek/volume work; EQ, crossfade,
 * and the visualizer don't apply to YouTube tracks.
 */

type YTPlayerState = -1 | 0 | 1 | 2 | 3 | 5;

interface YTPlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(videoId: string): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): YTPlayerState;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: YTPlayerState }) => void;
      };
    },
  ) => YTPlayerInstance;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ENDED = 0;

type Listener<T> = (payload: T) => void;

let apiReadyPromise: Promise<YTNamespace> | null = null;

function loadIframeApi(): Promise<YTNamespace> {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });
  return apiReadyPromise;
}

export class YouTubePlayerController {
  private player: YTPlayerInstance | null = null;
  private pollId: number | null = null;
  private timeListeners = new Set<Listener<{ currentTime: number; duration: number }>>();
  private endedListeners = new Set<Listener<void>>();
  private hasEndedForVideo = false;

  async mount(containerId: string) {
    const YT = await loadIframeApi();
    if (this.player) return;
    this.player = new YT.Player(containerId, {
      videoId: '',
      playerVars: { rel: 0, modestbranding: 1 },
      events: {
        onStateChange: (e) => {
          if (e.data === ENDED && !this.hasEndedForVideo) {
            this.hasEndedForVideo = true;
            this.endedListeners.forEach((l) => l(undefined));
          }
        },
      },
    });
    this.startPolling();
  }

  private startPolling() {
    if (this.pollId) return;
    this.pollId = window.setInterval(() => {
      if (!this.player) return;
      const duration = this.player.getDuration();
      const currentTime = this.player.getCurrentTime();
      if (duration > 0) this.timeListeners.forEach((l) => l({ currentTime, duration }));
    }, 250);
  }

  async loadVideo(videoId: string) {
    await this.mount('youtube-player-container');
    this.hasEndedForVideo = false;
    this.player!.loadVideoById(videoId);
  }

  play() {
    this.player?.playVideo();
  }

  pause() {
    this.player?.pauseVideo();
  }

  seek(seconds: number) {
    this.player?.seekTo(seconds, true);
  }

  setVolume(v: number) {
    this.player?.setVolume(Math.round(v * 100));
  }

  onTimeUpdate(cb: Listener<{ currentTime: number; duration: number }>) {
    this.timeListeners.add(cb);
    return () => this.timeListeners.delete(cb);
  }

  onEnded(cb: Listener<void>) {
    this.endedListeners.add(cb);
    return () => this.endedListeners.delete(cb);
  }

  destroy() {
    if (this.pollId) clearInterval(this.pollId);
    this.player?.destroy();
    this.player = null;
  }
}

export const youtubePlayer = new YouTubePlayerController();
