import { create } from 'zustand';
import { audioEngine } from '../audio/audioEngine';
import { LocalSource } from '../sources/localSource';
import { YouTubeSource } from '../sources/youtubeSource';
import { SpotifySource } from '../sources/spotifySource';
import type { MusicSource } from '../sources/types';
import {
  EQ_FREQUENCIES,
  EQ_PRESETS,
  type RepeatMode,
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
  activeSource: SourceKind;
  searchQuery: Record<SourceKind, string>;
  searchResults: Record<SourceKind, Track[]>;
  searchNotes: Partial<Record<SourceKind, string>>;
  isImporting: boolean;

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
  setActiveSource: (kind: SourceKind) => void;
  setSearchQuery: (kind: SourceKind, query: string) => void;
  runSearch: (kind: SourceKind) => Promise<void>;
}

const persistedTheme = (localStorage.getItem('echo:theme') as ThemeName | null) ?? 'modern-dark';

export const usePlayerStore = create<PlayerState>((set, get) => {
  const sources: Record<SourceKind, MusicSource> = {
    local: new LocalSource(() => get().library),
    youtube: new YouTubeSource(),
    spotify: new SpotifySource(),
  };

  audioEngine.onTimeUpdate(({ currentTime, duration }) => set({ currentTime, duration }));

  audioEngine.onEnded(() => {
    if (get().crossfade === 0) get().next(true);
  });

  audioEngine.onNearEnd(() => {
    const track = get().currentTrack;
    if (!track || audioEngine.hasCrossfadeTriggered(track.id)) return;
    audioEngine.markCrossfadeTriggered(track.id);
    get().next(true);
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
    sources,

    importFiles: async (files) => {
      set({ isImporting: true });
      const list = Array.from(files).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg|aac|oga|opus)$/i.test(f.name));
      const parsed = await Promise.all(list.map(parseTrackFile));
      set((s) => ({ library: [...s.library, ...parsed], isImporting: false }));
    },

    playFromList: async (track, list) => {
      if (track.unplayable || !track.streamUrl) return;
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
      await audioEngine.playTrack(track, { crossfade: crossfade > 0 });
    },

    togglePlay: () => {
      const { isPlaying, currentTrack } = get();
      if (!currentTrack) return;
      if (isPlaying) {
        audioEngine.pause();
        set({ isPlaying: false });
      } else {
        audioEngine.play();
        set({ isPlaying: true });
      }
    },

    next: (auto = false) => {
      const { playOrder, position, repeat, crossfade, currentTrack } = get();
      if (playOrder.length === 0) return;

      if (repeat === 'one' && auto) {
        if (currentTrack) audioEngine.playTrack(currentTrack, { crossfade: false });
        audioEngine.seek(0);
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
      audioEngine.playTrack(track, { crossfade: crossfade > 0 });
    },

    prev: () => {
      const { playOrder, position, repeat, currentTime, crossfade } = get();
      if (playOrder.length === 0) return;
      if (currentTime > 3) {
        audioEngine.seek(0);
        return;
      }
      let prevPos = position - 1;
      if (prevPos < 0) {
        if (repeat === 'all') prevPos = playOrder.length - 1;
        else prevPos = 0;
      }
      const track = playOrder[prevPos];
      set({ position: prevPos, currentTrack: track, isPlaying: true });
      audioEngine.playTrack(track, { crossfade: crossfade > 0 });
    },

    seek: (seconds) => {
      audioEngine.seek(seconds);
      set({ currentTime: seconds });
    },

    setVolume: (v) => {
      audioEngine.setMasterVolume(v);
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
  };
});
