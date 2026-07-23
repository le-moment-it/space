import { useState } from 'react';
import './App.css';
import './ui.css';
import { useGameStore } from '../state/gameStore';
import { HubScreen } from './screens/HubScreen';
import { RunScreen } from './screens/RunScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const [entered, setEntered] = useState(false);
  const appPhase = useGameStore((s) => s.appPhase);

  if (!entered) {
    return <TitleScreen onEngage={() => setEntered(true)} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar__brand">Space Roguelike</span>
        <span className="topbar__loc">{appPhase === 'hub' ? 'Bridge' : 'In transit'}</span>
      </header>
      <main className="app-main">{appPhase === 'hub' ? <HubScreen /> : <RunScreen />}</main>
    </div>
  );
}
