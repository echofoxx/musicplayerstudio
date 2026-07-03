import { useEffect, useState } from 'react';
import { usePlayerStore } from './store/playerStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { NowPlaying } from './components/NowPlaying';
import { PlayerBar } from './components/PlayerBar';
import { EQPanel } from './components/EQPanel';

function App() {
  const theme = usePlayerStore((s) => s.theme);
  const [eqOpen, setEqOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header />
      <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
        <Sidebar />
        <main className="flex-1 min-h-0 flex flex-col">
          <NowPlaying />
        </main>
      </div>
      {eqOpen && <EQPanel />}
      <PlayerBar eqOpen={eqOpen} onToggleEQ={() => setEqOpen((v) => !v)} />
    </div>
  );
}

export default App;
