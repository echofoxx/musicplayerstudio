import { usePlayerStore } from '../store/playerStore';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../types';

function formatFreq(freq: number): string {
  return freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`;
}

export function EQPanel() {
  const eqEnabled = usePlayerStore((s) => s.eqEnabled);
  const eqGains = usePlayerStore((s) => s.eqGains);
  const eqPreset = usePlayerStore((s) => s.eqPreset);
  const setEQGain = usePlayerStore((s) => s.setEQGain);
  const applyEQPreset = usePlayerStore((s) => s.applyEQPreset);
  const toggleEQEnabled = usePlayerStore((s) => s.toggleEQEnabled);

  return (
    <div
      className="border-t px-6 py-4 flex flex-col gap-4"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Equalizer
          </h2>
          <button
            onClick={toggleEQEnabled}
            className="text-xs px-2 py-1 rounded-full cursor-pointer border"
            style={{
              borderColor: 'var(--border)',
              color: eqEnabled ? 'var(--accent)' : 'var(--text-faint)',
            }}
          >
            {eqEnabled ? 'On' : 'Off'}
          </button>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {Object.keys(EQ_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyEQPreset(name)}
              className="text-xs px-2.5 py-1 rounded-full cursor-pointer transition-colors"
              style={{
                background: eqPreset === name ? 'var(--accent)' : 'transparent',
                color: eqPreset === name ? 'var(--accent-contrast)' : 'var(--text-muted)',
                border: `1px solid ${eqPreset === name ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 px-2">
        {EQ_FREQUENCIES.map((freq, i) => (
          <div key={freq} className="flex flex-col items-center gap-2">
            <span className="text-xs tabular-nums w-8 text-center" style={{ color: 'var(--text-faint)' }}>
              {eqGains[i] > 0 ? '+' : ''}
              {eqGains[i]}
            </span>
            <input
              type="range"
              className="vertical"
              min={-12}
              max={12}
              step={1}
              value={eqGains[i]}
              disabled={!eqEnabled}
              onChange={(e) => setEQGain(i, Number(e.target.value))}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatFreq(freq)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
