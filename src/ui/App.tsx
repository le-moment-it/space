import { useEffect, useState } from 'react';
import './App.css';
import './ui.css';
import { useGameStore } from '../state/gameStore';
import { HubScreen } from './screens/HubScreen';
import { RunScreen } from './screens/RunScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const [entered, setEntered] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const appPhase = useGameStore((s) => s.appPhase);
  const runPhase = useGameStore((s) => s.run?.phase);
  const returnToHub = useGameStore((s) => s.returnToHub);

  // Only offer "abandon" during active play, not on the win/loss end screens.
  const inActiveRun = appPhase === 'run' && runPhase !== 'runWon' && runPhase !== 'runLost';

  useEffect(() => {
    if (!inActiveRun) setConfirmAbandon(false);
  }, [inActiveRun]);

  if (!entered) {
    return <TitleScreen onEngage={() => setEntered(true)} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar__brand">Space Roguelike</span>
        <div className="topbar__right">
          <span className="topbar__loc">{appPhase === 'hub' ? 'Bridge' : 'In transit'}</span>
          {inActiveRun &&
            (confirmAbandon ? (
              <span className="topbar__confirm">
                <span className="topbar__confirm-label">Abandon run?</span>
                <button
                  className="topbar__btn topbar__btn--danger"
                  onClick={() => {
                    returnToHub();
                    setConfirmAbandon(false);
                  }}
                >
                  Yes
                </button>
                <button className="topbar__btn" onClick={() => setConfirmAbandon(false)}>
                  No
                </button>
              </span>
            ) : (
              <button className="topbar__btn" onClick={() => setConfirmAbandon(true)}>
                Abandon run
              </button>
            ))}
        </div>
      </header>
      <main className="app-main">{appPhase === 'hub' ? <HubScreen /> : <RunScreen />}</main>
    </div>
  );
}
