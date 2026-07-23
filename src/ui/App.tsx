import { useEffect, useState } from 'react';
import './App.css';
import './ui.css';
import { endingDefinitions } from '../data/endings';
import { useGameStore } from '../state/gameStore';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { DeckScreen } from './screens/DeckScreen';
import { EndingScene } from './screens/EndingScene';
import { RunScreen } from './screens/RunScreen';
import { StartScreen } from './screens/StartScreen';
import { TitleScreen } from './screens/TitleScreen';

type MenuTab = 'game' | 'deck' | 'achievements';

const TABS: { id: MenuTab; label: string }[] = [
  { id: 'game', label: 'Game' },
  { id: 'deck', label: 'Deck' },
  { id: 'achievements', label: 'Achievements' },
];

export function App() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<MenuTab>('game');
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const appPhase = useGameStore((s) => s.appPhase);
  const runPhase = useGameStore((s) => s.run?.phase);
  const returnToHub = useGameStore((s) => s.returnToHub);
  const pendingEndingId = useGameStore((s) => s.pendingEndingIds[0]);
  const dismissEnding = useGameStore((s) => s.dismissEnding);
  const pendingEnding = pendingEndingId
    ? endingDefinitions.find((e) => e.id === pendingEndingId)
    : undefined;

  const inRun = appPhase === 'run';
  // Only offer "abandon" during active play, not on the win/loss end screens.
  const inActiveRun = inRun && runPhase !== 'runWon' && runPhase !== 'runLost';

  useEffect(() => {
    if (!inActiveRun) setConfirmAbandon(false);
  }, [inActiveRun]);

  if (!entered) {
    return <TitleScreen onEngage={() => setEntered(true)} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__left">
          <span className="topbar__brand">Space Roguelike</span>
          <nav className="topnav" aria-label="Main menu">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`topnav__tab${tab === t.id ? ' topnav__tab--active' : ''}`}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === 'game' && inRun && (
                  <span className="topnav__dot" title="Run in progress" />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="topbar__right">
          {inActiveRun &&
            (confirmAbandon ? (
              <span className="topbar__confirm">
                <span className="topbar__confirm-label">Abandon run?</span>
                <button
                  className="topbar__btn topbar__btn--danger"
                  onClick={() => {
                    returnToHub();
                    setConfirmAbandon(false);
                    setTab('game');
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

      <main className="app-main">
        {tab === 'game' &&
          (inRun ? <RunScreen /> : <StartScreen onEditDeck={() => setTab('deck')} />)}
        {tab === 'deck' && <DeckScreen />}
        {tab === 'achievements' && <AchievementsScreen />}
      </main>

      {pendingEnding && (
        <EndingScene key={pendingEnding.id} ending={pendingEnding} onDismiss={dismissEnding} />
      )}
    </div>
  );
}
