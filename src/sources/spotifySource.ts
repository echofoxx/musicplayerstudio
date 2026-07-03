import type { Track } from '../types';
import type { MusicSource, SourceSearchResult } from './types';

/**
 * Placeholder adapter. Real Spotify playback needs the Web Playback SDK plus
 * an OAuth app (Client ID) and a Premium account on the listener's side.
 * Swap the body of `search` for the Spotify Web API `/v1/search` endpoint
 * once OAuth is wired up, and initialize `Spotify.Player` for playback.
 */
export class SpotifySource implements MusicSource {
  kind = 'spotify' as const;
  displayName = 'Spotify';

  isConnected(): boolean {
    return false;
  }

  async search(query: string): Promise<SourceSearchResult> {
    const q = query.trim();
    if (!q) return { tracks: [], note: 'Connect your Spotify account to search.' };

    const mock: Track[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `sp-mock-${q}-${i}`,
      title: `${q} — Track ${i + 1}`,
      artist: 'Spotify (preview)',
      duration: 200 + i * 12,
      source: 'spotify',
      unplayable: true,
    }));

    return {
      tracks: mock,
      note: 'Showing placeholder results. Connect Spotify (OAuth + Premium) to enable real search and playback.',
    };
  }
}
