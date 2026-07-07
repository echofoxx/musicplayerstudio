import { parseBlob, selectCover } from 'music-metadata';
import type { Track } from '../types';
import { computeWaveformPeaks } from './waveform';

function titleCaseFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

let counter = 0;

export interface ParsedTrack {
  track: Track;
  artworkBlob?: Blob;
  artworkType?: string;
}

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

export async function parseTrackFile(file: File): Promise<ParsedTrack> {
  const id = `local-${Date.now()}-${counter++}`;
  const streamUrl = URL.createObjectURL(file);
  const waveformPeaks = await computeWaveformPeaks(file);

  try {
    const meta = await parseBlob(file);
    const cover = selectCover(meta.common.picture);
    const artworkBlob = cover ? new Blob([new Uint8Array(cover.data).slice().buffer], { type: cover.format }) : undefined;
    const artworkUrl = artworkBlob ? URL.createObjectURL(artworkBlob) : undefined;
    const duration = meta.format.duration || (await readDurationFallback(streamUrl));

    return {
      track: {
        id,
        title: meta.common.title || titleCaseFromFilename(file.name),
        artist: meta.common.artist || meta.common.albumartist || 'Unknown Artist',
        album: meta.common.album,
        duration,
        artworkUrl,
        source: 'local',
        streamUrl,
        waveformPeaks,
      },
      artworkBlob,
      artworkType: cover?.format,
    };
  } catch {
    return {
      track: {
        id,
        title: titleCaseFromFilename(file.name),
        artist: 'Unknown Artist',
        duration: await readDurationFallback(streamUrl),
        source: 'local',
        streamUrl,
        waveformPeaks,
      },
    };
  }
}
