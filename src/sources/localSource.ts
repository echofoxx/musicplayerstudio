import type { Track } from '../types';
import type { MusicSource, SourceSearchResult } from './types';

/**
 * Wraps the in-memory library built from files the user has imported from
 * their own computer. Search filters that library client-side.
 */
export class LocalSource implements MusicSource {
  kind = 'local' as const;
  displayName = 'Your Library';
  private getLibrary: () => Track[];

  constructor(getLibrary: () => Track[]) {
    this.getLibrary = getLibrary;
  }

  isConnected(): boolean {
    return true;
  }

  async search(query: string): Promise<SourceSearchResult> {
    const q = query.trim().toLowerCase();
    const library = this.getLibrary();
    if (!q) return { tracks: library };
    const tracks = library.filter((t) =>
      [t.title, t.artist, t.album ?? ''].some((field) => field.toLowerCase().includes(q)),
    );
    return { tracks };
  }
}
