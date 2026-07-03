import { parseBlob, selectCover } from 'music-metadata';
import type { Track } from '../types';

function titleCaseFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

let counter = 0;

function readDurationFallback(url: string): Promise<number> {
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = url;
    const done = () => resolve(Number.isFinite(probe.duration) ? probe.duration : 0);
    probe.addEventListener('loadedmetadata', done, { once: true });
    probe.addEventListener('error', () => resolve(0), { once: true });
  });
}

export async function parseTrackFile(file: File): Promise<Track> {
  const id = `local-${Date.now()}-${counter++}`;
  const streamUrl = URL.createObjectURL(file);

  try {
    const meta = await parseBlob(file);
    const cover = selectCover(meta.common.picture);
    const artworkUrl = cover
      ? URL.createObjectURL(new Blob([new Uint8Array(cover.data).slice().buffer], { type: cover.format }))
      : undefined;
    const duration = meta.format.duration || (await readDurationFallback(streamUrl));

    return {
      id,
      title: meta.common.title || titleCaseFromFilename(file.name),
      artist: meta.common.artist || meta.common.albumartist || 'Unknown Artist',
      album: meta.common.album,
      duration,
      artworkUrl,
      source: 'local',
      streamUrl,
    };
  } catch {
    return {
      id,
      title: titleCaseFromFilename(file.name),
      artist: 'Unknown Artist',
      duration: await readDurationFallback(streamUrl),
      source: 'local',
      streamUrl,
    };
  }
}
