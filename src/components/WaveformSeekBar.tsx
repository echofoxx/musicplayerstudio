import { useEffect, useRef, useState } from 'react';

interface Props {
  peaks: number[];
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  disabled?: boolean;
}

function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue('--accent').trim() || '#e2c084',
    border: styles.getPropertyValue('--border').trim() || '#2a2a30',
  };
}

export function WaveformSeekBar({ peaks, currentTime, duration, onSeek, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const progressFraction = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const { accent, border } = getThemeColors();

    ctx.clearRect(0, 0, width, height);
    const gap = 1;
    const barWidth = width / peaks.length;
    const progressX = width * progressFraction;

    peaks.forEach((peak, i) => {
      const barHeight = Math.max(2, peak * height);
      const x = i * barWidth;
      ctx.fillStyle = x < progressX ? accent : border;
      ctx.fillRect(x, (height - barHeight) / 2, Math.max(1, barWidth - gap), barHeight);
    });
  }, [peaks, progressFraction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.getContext('2d')?.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const seekFromClientX = (clientX: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(fraction * duration);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-8 select-none touch-none"
      style={{ cursor: disabled ? 'default' : dragging ? 'grabbing' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        seekFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        seekFromClientX(e.clientX);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
