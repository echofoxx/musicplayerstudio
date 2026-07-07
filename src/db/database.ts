import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Playlist, SourceKind, Track } from '../types';

interface StoredTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  source: SourceKind;
  youtubeVideoId?: string;
  /** Stable remote URL, used directly for non-local tracks (YouTube thumbnails etc). */
  artworkUrl?: string;
  /** Local tracks only — the original file, so a fresh blob: URL can be minted after reload. */
  fileBlob?: Blob;
  artworkBlob?: Blob;
  artworkType?: string;
  waveformPeaks?: number[];
  addedAt: number;
}

interface StoredPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

interface EchoDB extends DBSchema {
  tracks: { key: string; value: StoredTrack };
  playlists: { key: string; value: StoredPlaylist };
}

let dbPromise: Promise<IDBPDatabase<EchoDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EchoDB>('echo-player', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

/** Records (or updates) a track's persisted data. `file` is only present for local tracks. */
export async function saveTrack(track: Track, file?: File, artworkBlob?: Blob, artworkType?: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('tracks', track.id);
  const record: StoredTrack = {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    source: track.source,
    youtubeVideoId: track.youtubeVideoId,
    artworkUrl: track.source !== 'local' ? track.artworkUrl : undefined,
    fileBlob: file ?? existing?.fileBlob,
    artworkBlob: artworkBlob ?? existing?.artworkBlob,
    artworkType: artworkType ?? existing?.artworkType,
    waveformPeaks: track.waveformPeaks ?? existing?.waveformPeaks,
    addedAt: existing?.addedAt ?? Date.now(),
  };
  await db.put('tracks', record);
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tracks', id);
}

/** Reconstructs runtime Tracks with fresh object URLs, oldest-added first. */
export async function loadAllTracks(): Promise<Track[]> {
  const db = await getDB();
  const all = await db.getAll('tracks');
  all.sort((a, b) => a.addedAt - b.addedAt);
  return all.map((r): Track => ({
    id: r.id,
    title: r.title,
    artist: r.artist,
    album: r.album,
    duration: r.duration,
    source: r.source,
    youtubeVideoId: r.youtubeVideoId,
    streamUrl: r.fileBlob ? URL.createObjectURL(r.fileBlob) : undefined,
    artworkUrl: r.artworkBlob ? URL.createObjectURL(new Blob([r.artworkBlob], { type: r.artworkType })) : r.artworkUrl,
    waveformPeaks: r.waveformPeaks,
  }));
}

export async function savePlaylistMeta(playlist: Playlist): Promise<void> {
  const db = await getDB();
  const existing = await db.get('playlists', playlist.id);
  await db.put('playlists', {
    id: playlist.id,
    name: playlist.name,
    trackIds: playlist.tracks.map((t) => t.id),
    createdAt: existing?.createdAt ?? Date.now(),
  });
}

export async function deletePlaylistMeta(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

/** Reconstructs playlists, dropping any track references that no longer resolve. */
export async function loadAllPlaylists(trackMap: Map<string, Track>): Promise<Playlist[]> {
  const db = await getDB();
  const all = await db.getAll('playlists');
  all.sort((a, b) => a.createdAt - b.createdAt);
  return all.map((p) => ({
    id: p.id,
    name: p.name,
    tracks: p.trackIds.map((id) => trackMap.get(id)).filter((t): t is Track => !!t),
  }));
}
