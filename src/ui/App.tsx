import './App.css';
import { BattleScreen } from './screens/BattleScreen';

export function App() {
  return (
    <main className="app-shell">
      <h1>Space Roguelike</h1>
      <p>Pre-alpha — M1 vertical slice: one battle, no map yet.</p>
      <BattleScreen />
    </main>
  );
}
