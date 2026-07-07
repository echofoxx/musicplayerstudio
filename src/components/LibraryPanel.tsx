import { useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { TrackRow } from './TrackRow';
import { TrashIcon, UploadIcon } from './Icons';

export function LibraryPanel() {
  const library = usePlayerStore((s) => s.library);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isImporting = usePlayerStore((s) => s.isImporting);
  const importFiles = usePlayerStore((s) => s.importFiles);
  const playFromList = usePlayerStore((s) => s.playFromList);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const removeFromLibrary = usePlayerStore((s) => s.removeFromLibrary);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="m-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-colors"
        style={{
          borderColor: dragOver ? 'var(--accent)' : 'var(--border)',
          color: 'var(--text-muted)',
          background: dragOver ? 'var(--bg-panel)' : 'transparent',
        }}
      >
        <UploadIcon size={20} />
        <p className="text-xs text-center px-4">
          {isImporting ? 'Importing…' : 'Drop audio files here or click to import from your computer'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg,.aac,.opus"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) importFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
        {library.length === 0 ? (
          <p className="text-xs text-center px-4 py-6" style={{ color: 'var(--text-faint)' }}>
            No tracks yet. Files stay local in your browser — nothing is uploaded anywhere.
          </p>
        ) : (
          library.map((track) => (
            <div key={track.id} className="flex items-center gap-1 group">
              <div className="flex-1 min-w-0">
                <TrackRow
                  track={track}
                  isActive={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onPlay={() => {
                    if (currentTrack?.id === track.id) togglePlay();
                    else playFromList(track, library);
                  }}
                  showAddToPlaylist
                />
              </div>
              <button
                onClick={() => removeFromLibrary(track.id)}
                title="Remove from library"
                className="p-1 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--text-faint)' }}
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
