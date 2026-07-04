import { create } from 'zustand';
import { audioEngine } from '../audio/audioEngine';
import { youtubePlayer } from '../audio/youtubePlayer';
import { LocalSource } from '../sources/localSource';
import { YouTubeSource } from '../sources/youtubeSource';
import { SpotifySource } from '../sources/spotifySource';
import type { MusicSource } from '../sources/types';
import {
  EQ_FREQUENCIES,
  EQ_PRESETS,
  type Playlist,
  type RepeatMode,
  type SidebarTab,
  type SourceKind,
  type ThemeName,
  type Track,
  type VisualizerMode,
} from '../types';
import { parseTrackFile } from '../utils/metadata';

function shuffleKeeping(list: Track[], keepId: string | undefined): Track[] {
  const rest = list.filter((t) => t.id !== keepId);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const keep = list.find((t) => t.id === keepId);
  return keep ? [keep, ...rest] : rest;
}

function isPlayable(track: Track): boolean {
  if (track.unplayable) return false;
  return Boolean(track.streamUrl) || Boolean(track.youtubeVideoId);
}

interface PlayerState {
  library: Track[];
  queueSource: Track[];
  playOrder: Track[];
  position: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  crossfade: number;
  shuffle: boolean;
  repeat: RepeatMode;
  eqEnabled: boolean;
  eqGains: number[];
  eqPreset: string;
  theme: ThemeName;
  visualizer: VisualizerMode;
  activeSource: SidebarTab;
  searchQuery: Record<SourceKind, string>;
  searchResults: Record<SourceKind, Track[]>;
  searchNotes: Partial<Record<SourceKind, string>>;
  isImporting: boolean;
  isScratching: boolean;
  playlists: Playlist[];

  sources: Record<SourceKind, MusicSource>;

  importFiles: (files: FileList | File[]) => Promise<void>;
  playFromList: (track: Track, list: Track[]) => Promise<void>;
  togglePlay: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  setCrossfade: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setEQGain: (index: number, gain: number) => void;
  applyEQPreset: (name: string) => void;
  toggleEQEnabled: () => void;
  setTheme: (theme: ThemeName) => void;
  setVisualizer: (mode: VisualizerMode) => void;
  setActiveSource: (kind: SidebarTab) => void;
  setSearchQuery: (kind: SourceKind, query: string) => void;
  runSearch: (kind: SourceKind) => Promise<void>;
  setScratching: (scratching: boolean) => void;
  setScratchPlaybackRate: (rate: number) => void;

  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTrack: (playlistId: string, fromIndex: number, toIndex: number) => void;
  playPlaylist: (playlistId: string, startTrack?: Track) => Promise<void>;
}

let playlistCounter = 0;

const persistedTheme = (localStorage.getItem('echo:theme') as ThemeName | null) ?? 'modern-dark';

export const usePlayerStore = create<PlayerState>((set, get) => {
  const sources: Record<SourceKind, MusicSource> = {
    local: new LocalSource(() => get().library),
    youtube: new YouTubeSource(),
    spotify: new SpotifySource(),
  };

  const playViaEngine = async (track: Track, opts: { crossfade?: boolean } = {}) => {
    if (track.source === 'youtube' && track.youtubeVideoId) {
      audioEngine.pause();
      await youtubePlayer.loadVideo(track.youtubeVideoId);
      youtubePlayer.setVolume(get().volume);
      youtubePlayer.play();
    } else {
      youtubePlayer.pause();
      await audioEngine.playTrack(track, opts);
    }
  };

  audioEngine.onTimeUpdate(({ currentTime, duration }) => {
    if (get().currentTrack?.source !== 'youtube') set({ currentTime, duration });
  });

  audioEngine.onEnded(() => {
    if (get().currentTrack?.source === 'youtube' || get().isScratching) return;
    if (get().crossfade === 0) get().next(true);
  });

  audioEngine.onNearEnd(() => {
    const track = get().currentTrack;
    if (!track || track.source === 'youtube' || get().isScratching || audioEngine.hasCrossfadeTriggered(track.id)) return;
    audioEngine.markCrossfadeTriggered(track.id);
    get().next(true);
  });

  youtubePlayer.onTimeUpdate(({ currentTime, duration }) => {
    if (get().currentTrack?.source === 'youtube') set({ currentTime, duration });
  });

  youtubePlayer.onEnded(() => {
    if (get().currentTrack?.source === 'youtube' && !get().isScratching) get().next(true);
  });

  return {
    library: [],
    queueSource: [],
    playOrder: [],
    position: -1,
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    crossfade: 4,
    shuffle: false,
    repeat: 'off',
    eqEnabled: true,
    eqGains: EQ_FREQUENCIES.map(() => 0),
    eqPreset: 'Flat',
    theme: persistedTheme,
    visualizer: 'bars',
    activeSource: 'local',
    searchQuery: { local: '', youtube: '', spotify: '' },
    searchResults: { local: [], youtube: [], spotify: [] },
    searchNotes: {},
    isImporting: false,
    isScratching: false,
    playlists: [],
    sources,

    importFiles: async (files) => {
      set({ isImporting: true });
      const list = Array.from(files).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg|aac|oga|opus)$/i.test(f.name));
      const parsed = await Promise.all(list.map(parseTrackFile));
      set((s) => ({ library: [...s.library, ...parsed], isImporting: false }));
    },

    playFromList: async (track, list) => {
      if (!isPlayable(track)) return;
      const { shuffle, crossfade } = get();
      const playOrder = shuffle ? shuffleKeeping(list, track.id) : list;
      const position = playOrder.findIndex((t) => t.id === track.id);
      set({
        queueSource: list,
        playOrder,
        position,
        currentTrack: track,
        isPlaying: true,
      });
      await playViaEngine(track, { crossfade: crossfade > 0 });
    },

    togglePlay: () => {
      const { isPlaying, currentTrack } = get();
      if (!currentTrack) return;
      const engine = currentTrack.source === 'youtube' ? youtubePlayer : audioEngine;
      if (isPlaying) {
        engine.pause();
        set({ isPlaying: false });
      } else {
        engine.play();
        set({ isPlaying: true });
      }
    },

    next: (auto = false) => {
      const { playOrder, position, repeat, crossfade, currentTrack } = get();
      if (playOrder.length === 0) return;

      if (repeat === 'one' && auto && currentTrack) {
        playViaEngine(currentTrack, { crossfade: false });
        return;
      }

      let nextPos = position + 1;
      if (nextPos >= playOrder.length) {
        if (repeat === 'all') nextPos = 0;
        else {
          set({ isPlaying: false });
          return;
        }
      }
      const track = playOrder[nextPos];
      set({ position: nextPos, currentTrack: track, isPlaying: true });
      playViaEngine(track, { crossfade: crossfade > 0 });
    },

    prev: () => {
      const { playOrder, position, repeat, currentTime, crossfade, currentTrack } = get();
      if (playOrder.length === 0) return;
      if (currentTime > 3 && currentTrack) {
        const engine = currentTrack.source === 'youtube' ? youtubePlayer : audioEngine;
        engine.seek(0);
        return;
      }
      let prevPos = position - 1;
      if (prevPos < 0) {
        if (repeat === 'all') prevPos = playOrder.length - 1;
        else prevPos = 0;
      }
      const track = playOrder[prevPos];
      set({ position: prevPos, currentTrack: track, isPlaying: true });
      playViaEngine(track, { crossfade: crossfade > 0 });
    },

    seek: (seconds) => {
      const engine = get().currentTrack?.source === 'youtube' ? youtubePlayer : audioEngine;
      engine.seek(seconds);
      set({ currentTime: seconds });
    },

    setVolume: (v) => {
      audioEngine.setMasterVolume(v);
      youtubePlayer.setVolume(v);
      set({ volume: v });
    },

    setCrossfade: (seconds) => {
      audioEngine.setCrossfadeDuration(seconds);
      set({ crossfade: seconds });
    },

    toggleShuffle: () => {
      const { shuffle, queueSource, currentTrack, playOrder } = get();
      const next = !shuffle;
      if (next) {
        const reshuffled = shuffleKeeping(queueSource, currentTrack?.id);
        set({ shuffle: true, playOrder: reshuffled, position: 0 });
      } else {
        const position = currentTrack ? queueSource.findIndex((t) => t.id === currentTrack.id) : 0;
        set({ shuffle: false, playOrder: queueSource.length ? queueSource : playOrder, position: Math.max(position, 0) });
      }
    },

    cycleRepeat: () => {
      const order: RepeatMode[] = ['off', 'all', 'one'];
      const idx = order.indexOf(get().repeat);
      set({ repeat: order[(idx + 1) % order.length] });
    },

    setEQGain: (index, gain) => {
      audioEngine.setEQGain(index, gain);
      set((s) => {
        const eqGains = [...s.eqGains];
        eqGains[index] = gain;
        return { eqGains, eqPreset: 'Custom' };
      });
    },

    applyEQPreset: (name) => {
      const gains = EQ_PRESETS[name];
      if (!gains) return;
      gains.forEach((g, i) => audioEngine.setEQGain(i, g));
      set({ eqGains: gains, eqPreset: name });
    },

    toggleEQEnabled: () => {
      const enabled = !get().eqEnabled;
      const gains = enabled ? get().eqGains : EQ_FREQUENCIES.map(() => 0);
      gains.forEach((g, i) => audioEngine.setEQGain(i, g));
      set({ eqEnabled: enabled });
    },

    setTheme: (theme) => {
      localStorage.setItem('echo:theme', theme);
      set({ theme });
    },

    setVisualizer: (mode) => set({ visualizer: mode }),

    setActiveSource: (kind) => set({ activeSource: kind }),

    setSearchQuery: (kind, query) =>
      set((s) => ({ searchQuery: { ...s.searchQuery, [kind]: query } })),

    runSearch: async (kind) => {
      const query = get().searchQuery[kind];
      const result = await sources[kind].search(query);
      set((s) => ({
        searchResults: { ...s.searchResults, [kind]: result.tracks },
        searchNotes: { ...s.searchNotes, [kind]: result.note },
      }));
    },

    setScratching: (scratching) => {
      if (get().currentTrack?.source === 'local') audioEngine.setScratching(scratching);
      set({ isScratching: scratching });
    },

    setScratchPlaybackRate: (rate) => {
      if (get().currentTrack?.source === 'local') audioEngine.setPlaybackRate(rate);
    },

    createPlaylist: (name) => {
      const id = `playlist-${Date.now()}-${playlistCounter++}`;
      const trimmed = name.trim() || 'Untitled Playlist';
      set((s) => ({ playlists: [...s.playlists, { id, name: trimmed, tracks: [] }] }));
      return id;
    },

    renamePlaylist: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: trimmed } : p)) }));
    },

    deletePlaylist: (id) => {
      set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
    },

    addTrackToPlaylist: (playlistId, track) => {
      set((s) => ({
        playlists: s.playlists.map((p) =>
          p.id === playlistId && !p.tracks.some((t) => t.id === track.id)
            ? { ...p, tracks: [...p.tracks, track] }
            : p,
        ),
      }));
    },

    removeTrackFromPlaylist: (playlistId, trackId) => {
      set((s) => ({
        playlists: s.playlists.map((p) =>
          p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p,
        ),
      }));
    },

    reorderPlaylistTrack: (playlistId, fromIndex, toIndex) => {
      set((s) => ({
        playlists: s.playlists.map((p) => {
          if (p.id !== playlistId) return p;
          const tracks = [...p.tracks];
          const [moved] = tracks.splice(fromIndex, 1);
          tracks.splice(toIndex, 0, moved);
          return { ...p, tracks };
        }),
      }));
    },

    playPlaylist: async (playlistId, startTrack) => {
      const playlist = get().playlists.find((p) => p.id === playlistId);
      if (!playlist || playlist.tracks.length === 0) return;
      const track = startTrack ?? playlist.tracks.find(isPlayable);
      if (!track) return;
      await get().playFromList(track, playlist.tracks);
    },
  };
});
