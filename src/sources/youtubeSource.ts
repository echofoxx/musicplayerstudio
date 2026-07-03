import type { Track } from '../types';
import type { MusicSource, SourceSearchResult } from './types';

/**
 * Placeholder adapter. Real YouTube Music search needs a YouTube Data API v3
 * key (and ideally OAuth for full "Music" catalog access), which this build
 * doesn't have configured. Swap the body of `search` for a `fetch` against
 * `https://www.googleapis.com/youtube/v3/search` once a key is available,
 * and use the YouTube IFrame Player API to actually play results.
 */
export class YouTubeSource implements MusicSource {
  kind = 'youtube' as const;
  displayName = 'YouTube Music';

  isConnected(): boolean {
    return false;
  }

  async search(query: string): Promise<SourceSearchResult> {
    const q = query.trim();
    if (!q) return { tracks: [], note: 'Connect a YouTube Data API key to search.' };

    const mock: Track[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `yt-mock-${q}-${i}`,
      title: `${q} — Result ${i + 1}`,
      artist: 'YouTube Music (preview)',
      duration: 180 + i * 17,
      source: 'youtube',
      unplayable: true,
    }));

    return {
      tracks: mock,
      note: 'Showing placeholder results. Connect a YouTube Data API key to enable real search and playback.',
    };
  }
}
