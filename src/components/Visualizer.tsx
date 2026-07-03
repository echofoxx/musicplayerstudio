import { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import type { VisualizerMode } from '../types';

interface Props {
  mode: VisualizerMode;
  isPlaying: boolean;
  large?: boolean;
}

function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue('--accent').trim() || '#e2c084',
    text: styles.getPropertyValue('--text-muted').trim() || '#9a9aa2',
  };
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

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const { accent, text } = getThemeColors();
      ctx.clearRect(0, 0, width, height);

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
