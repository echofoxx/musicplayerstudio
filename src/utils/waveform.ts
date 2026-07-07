/** Decodes an audio file and downsamples it into peak amplitudes (0..1) for a static waveform display. */
export async function computeWaveformPeaks(file: File, numPeaks = 200): Promise<number[] | undefined> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / numPeaks));

    const peaks: number[] = [];
    for (let i = 0; i < numPeaks; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }
      peaks.push(max);
    }

    const loudest = Math.max(...peaks, 0.0001);
    return peaks.map((p) => p / loudest);
  } catch {
    return undefined;
  }
}
