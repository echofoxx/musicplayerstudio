export type SourceKind = 'local' | 'youtube' | 'spotify';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // seconds
  artworkUrl?: string;
  source: SourceKind;
  /** Playable URL for <audio>. For stubbed remote sources this stays undefined. */
  streamUrl?: string;
  /** True when the source adapter could not provide a real, playable stream. */
  unplayable?: boolean;
  /** YouTube video ID — playback for these goes through the IFrame Player, not the Web Audio engine. */
  youtubeVideoId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export type SidebarTab = SourceKind | 'playlists';

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'off' | 'bars' | 'wave' | 'vinyl' | 'particles' | 'spectrogram' | 'mirror';

export type ThemeName = 'modern-dark' | 'modern-light' | 'vintage';

export interface EQBand {
  label: string;
  frequency: number;
  gain: number; // dB, -12..12
}

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  'Bass Boost': [7, 5, 0, -1, -2],
  Vocal: [-3, 1, 5, 4, 1],
  Treble: [-2, -1, 0, 4, 7],
  'Vintage Warmth': [4, 2, -1, -3, -4],
};

export const EQ_FREQUENCIES = [60, 250, 1000, 4000, 12000];
