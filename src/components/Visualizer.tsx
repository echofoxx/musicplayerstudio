import { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import type { VisualizerMode } from '../types';

interface Props {
  mode: VisualizerMode;
  isPlaying: boolean;
  large?: boolean;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
}

function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue('--accent').trim() || '#e2c084',
    accentStrong: styles.getPropertyValue('--accent-strong').trim() || '#f0d9a8',
    text: styles.getPropertyValue('--text-muted').trim() || '#9a9aa2',
    bg: styles.getPropertyValue('--bg').trim() || '#101012',
  };
}

/** Parses "#rrggbb" (the only format our theme vars use) into an [r,g,b] tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function Visualizer({ mode, isPlaying, large }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    if (!analyser) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const waveData = new Uint8Array(analyser.frequencyBinCount);
    let particles: Particle[] = [];
    let spectrogramReady = false;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const { accent, accentStrong, text, bg } = getThemeColors();

      if (mode !== 'spectrogram') ctx.clearRect(0, 0, width, height);

      if (mode === 'bars') {
        analyser.getByteFrequencyData(freqData);
        const bars = large ? 96 : 48;
        const step = Math.floor(freqData.length / bars);
        const barWidth = width / bars;
        for (let i = 0; i < bars; i++) {
          const v = freqData[i * step] / 255;
          const barHeight = Math.max(2, v * height);
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.35 + v * 0.65;
          ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
        }
        ctx.globalAlpha = 1;
      } else if (mode === 'wave') {
        analyser.getByteTimeDomainData(waveData);
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        const sliceWidth = width / waveData.length;
        let x = 0;
        for (let i = 0; i < waveData.length; i++) {
          const v = waveData[i] / 128 - 1;
          const y = height / 2 + v * (height / 2) * 0.9;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      } else if (mode === 'vinyl') {
        analyser.getByteFrequencyData(freqData);
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;
        const bars = large ? 128 : 64;
        for (let i = 0; i < bars; i++) {
          const v = freqData[i * Math.floor(freqData.length / bars)] / 255;
          const angle = (i / bars) * Math.PI * 2;
          const len = v * (Math.min(width, height) * 0.18);
          const x1 = cx + Math.cos(angle) * baseRadius;
          const y1 = cy + Math.sin(angle) * baseRadius;
          const x2 = cx + Math.cos(angle) * (baseRadius + len);
          const y2 = cy + Math.sin(angle) * (baseRadius + len);
          ctx.strokeStyle = accent;
          ctx.globalAlpha = 0.4 + v * 0.6;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = text;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mode === 'mirror') {
        analyser.getByteFrequencyData(freqData);
        const bars = large ? 96 : 48;
        const step = Math.floor(freqData.length / bars);
        const barWidth = width / bars;
        const midY = height / 2;
        for (let i = 0; i < bars; i++) {
          const v = freqData[i * step] / 255;
          const half = Math.max(1, (v * height) / 2);
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.35 + v * 0.65;
          ctx.fillRect(i * barWidth + 1, midY - half, barWidth - 2, half * 2);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = text;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (mode === 'particles') {
        analyser.getByteFrequencyData(freqData);
        const bassEnd = Math.floor(freqData.length * 0.15);
        let bassSum = 0;
        for (let i = 0; i < bassEnd; i++) bassSum += freqData[i];
        const bassAvg = bassSum / bassEnd / 255;

        let trebleSum = 0;
        for (let i = bassEnd; i < freqData.length; i++) trebleSum += freqData[i];
        const trebleAvg = trebleSum / (freqData.length - bassEnd) / 255;

        const spawnCount = Math.round(bassAvg * (large ? 4 : 2));
        for (let i = 0; i < spawnCount && particles.length < 200; i++) {
          particles.push({
            x: Math.random() * width,
            y: height + 4,
            r: 2 + Math.random() * (3 + bassAvg * 6),
            vy: 20 + Math.random() * 40 + bassAvg * 60,
            alpha: 0.5 + Math.random() * 0.5,
          });
        }

        const [ar, ag, ab] = hexToRgb(accent);
        const [sr, sg, sb] = hexToRgb(accentStrong);
        particles.forEach((p) => {
          p.y -= p.vy / 60;
          p.alpha -= 0.004 + trebleAvg * 0.006;
        });
        particles = particles.filter((p) => p.alpha > 0 && p.y > -10);

        for (const p of particles) {
          const mix = trebleAvg;
          ctx.beginPath();
          ctx.fillStyle = `rgba(${ar + (sr - ar) * mix}, ${ag + (sg - ag) * mix}, ${ab + (sb - ab) * mix}, ${p.alpha})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === 'spectrogram') {
        analyser.getByteFrequencyData(freqData);
        if (!spectrogramReady) {
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, width, height);
          spectrogramReady = true;
        }
        // getImageData/putImageData ignore the canvas's CTM and always work in
        // device pixels, unlike every other draw call here — so this scroll
        // step needs the raw backing-buffer size, not the CSS width/height
        // the rest of this function uses.
        const dpr = canvas.width / width;
        const img = ctx.getImageData(dpr, 0, canvas.width - dpr, canvas.height);
        ctx.putImageData(img, 0, 0);

        const [ar, ag, ab] = hexToRgb(accent);
        for (let y = 0; y < height; y++) {
          const bin = Math.floor(((height - y) / height) * (freqData.length * 0.6));
          const v = freqData[Math.min(bin, freqData.length - 1)] / 255;
          ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${Math.min(1, v * 1.4)})`;
          ctx.fillRect(width - 1, y, 1, 1);
        }
      }
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, large]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    // A window resize listener alone misses layout changes from CSS/prop
    // changes (e.g. entering fullscreen), so watch the element directly.
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  if (mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-[var(--radius-md,12px)] ${large ? 'h-full' : 'h-48'}`}
      style={{ opacity: isPlaying ? 1 : 0.4, transition: 'opacity 0.3s ease' }}
    />
  );
}
