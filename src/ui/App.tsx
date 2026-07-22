import './App.css';
import { useGameStore } from '../state/gameStore';
import { HubScreen } from './screens/HubScreen';
import { RunScreen } from './screens/RunScreen';

export function App() {
  const appPhase = useGameStore((s) => s.appPhase);

  return (
    <main className="app-shell">
      <h1>Space Roguelike</h1>
      <p>Pre-alpha — M3: save system + meta-progression.</p>
      {appPhase === 'hub' ? <HubScreen /> : <RunScreen />}
    </main>
  );
}
