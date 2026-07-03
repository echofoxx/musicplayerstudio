import type { Track } from '../types';
import { parseIso8601Duration } from '../utils/format';
import type { MusicSource, SourceSearchResult } from './types';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { default?: { url: string }; medium?: { url: string } };
  };
}

interface YTVideoItem {
  id: string;
  contentDetails: { duration: string };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Real YouTube Music search via the YouTube Data API v3, gated behind a
 * VITE_YOUTUBE_API_KEY env var (see .env.example). Playback happens through
 * the YouTube IFrame Player API (src/audio/youtubePlayer.ts) rather than our
 * Web Audio graph — YouTube's embed is a cross-origin black box, so EQ,
 * crossfade, and the visualizer don't apply to these tracks.
 *
 * Without a key configured, falls back to placeholder results so the UI
 * still demonstrates the panel.
 */
export class YouTubeSource implements MusicSource {
  kind = 'youtube' as const;
  displayName = 'YouTube Music';

  isConnected(): boolean {
    return Boolean(API_KEY);
  }

  async search(query: string): Promise<SourceSearchResult> {
    const q = query.trim();
    if (!q) return { tracks: [], note: 'Connect a YouTube Data API key to search.' };

    if (!API_KEY) {
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
        note: 'Showing placeholder results. Set VITE_YOUTUBE_API_KEY to enable real search and playback.',
      };
    }

    try {
      const searchParams = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        videoCategoryId: '10', // Music
        maxResults: '12',
        q,
        key: API_KEY,
      });
      const searchRes = await fetch(`${SEARCH_URL}?${searchParams}`);
      if (!searchRes.ok) {
        return { tracks: [], note: `YouTube search failed (${searchRes.status}). Check your API key/quota.` };
      }
      const searchData = (await searchRes.json()) as { items: YTSearchItem[] };
      const videoIds = searchData.items.map((item) => item.id.videoId).filter(Boolean);
      if (videoIds.length === 0) return { tracks: [] };

      const videosParams = new URLSearchParams({
        part: 'contentDetails',
        id: videoIds.join(','),
        key: API_KEY,
      });
      const videosRes = await fetch(`${VIDEOS_URL}?${videosParams}`);
      const videosData = videosRes.ok ? ((await videosRes.json()) as { items: YTVideoItem[] }) : { items: [] };
      const durationById = new Map(videosData.items.map((v) => [v.id, parseIso8601Duration(v.contentDetails.duration)]));

      const tracks: Track[] = searchData.items.map((item) => ({
        id: `yt-${item.id.videoId}`,
        title: decodeHtmlEntities(item.snippet.title),
        artist: decodeHtmlEntities(item.snippet.channelTitle),
        duration: durationById.get(item.id.videoId) ?? 0,
        artworkUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url,
        source: 'youtube',
        youtubeVideoId: item.id.videoId,
      }));

      return { tracks };
    } catch {
      return { tracks: [], note: 'YouTube search failed — check your network connection and API key.' };
    }
  }
}
