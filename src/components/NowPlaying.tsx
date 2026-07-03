import { usePlayerStore } from '../store/playerStore';
import { Visualizer } from './Visualizer';

export function NowPlaying() {
  const track = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const visualizer = usePlayerStore((s) => s.visualizer);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 py-10 min-h-0">
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0">
        <div
          className={`absolute inset-0 rounded-full shadow-2xl record-spin ${isPlaying ? '' : 'paused'}`}
          style={{
            background:
              'repeating-radial-gradient(circle at center, var(--record-face) 0px, var(--record-face) 3px, var(--record-groove) 4px, var(--record-face) 5px)',
            boxShadow: '0 20px 60px var(--shadow)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-[38%] h-[38%] rounded-full overflow-hidden border-4 flex items-center justify-center"
              style={{ borderColor: 'var(--record-face)', background: 'var(--bg-panel)' }}
            >
              {track?.artworkUrl ? (
                <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl" style={{ color: 'var(--text-faint)' }}>
                  ♪
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className="absolute rounded-full"
          style={{
            width: 14,
            height: 14,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg)',
            border: '2px solid var(--border)',
          }}
        />
      </div>

      <div className="text-center min-h-[3.5rem]">
        <h1 className="text-xl font-semibold truncate max-w-md" style={{ color: 'var(--text)' }}>
          {track?.title ?? 'Nothing playing'}
        </h1>
        <p className="text-sm mt-1 truncate max-w-md" style={{ color: 'var(--text-muted)' }}>
          {track ? `${track.artist}${track.album ? ' — ' + track.album : ''}` : 'Import tracks or pick a source to begin'}
        </p>
      </div>

      {visualizer !== 'off' && (
        <div className="w-full max-w-lg">
          <Visualizer mode={visualizer} isPlaying={isPlaying} />
        </div>
      )}
    </div>
  );
}
