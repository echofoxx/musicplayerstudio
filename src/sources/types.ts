import type { SourceKind, Track } from '../types';

export interface SourceSearchResult {
  tracks: Track[];
  /** Set when the adapter can't perform a real query (e.g. no API key configured). */
  note?: string;
}

export interface MusicSource {
  kind: SourceKind;
  displayName: string;
  /** Whether this adapter can actually stream audio right now. */
  isConnected(): boolean;
  search(query: string): Promise<SourceSearchResult>;
}
