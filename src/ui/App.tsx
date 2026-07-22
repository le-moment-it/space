import './App.css';
import { RunScreen } from './screens/RunScreen';

export function App() {
  return (
    <main className="app-shell">
      <h1>Space Roguelike</h1>
      <p>Pre-alpha — M2 vertical slice: one full act, no meta-progression yet.</p>
      <RunScreen />
    </main>
  );
}
