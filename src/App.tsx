import { useEffect, useState } from 'react';
import { usePlayerStore } from './store/playerStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { NowPlaying } from './components/NowPlaying';
import { PlayerBar } from './components/PlayerBar';
import { EQPanel } from './components/EQPanel';

function App() {
  const theme = usePlayerStore((s) => s.theme);
  const [eqOpen, setEqOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header onToggleMenu={() => setMobileMenuOpen((v) => !v)} />
      <div className="relative flex flex-1 min-h-0">
        <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          <NowPlaying />
        </main>
      </div>
      {eqOpen && <EQPanel />}
      <PlayerBar eqOpen={eqOpen} onToggleEQ={() => setEqOpen((v) => !v)} />
    </div>
  );
}

export default App;
