import { useEffect, useState } from 'react';
import './App.css';
import './ui.css';
import { endingDefinitions } from '../data/endings';
import { useTranslation, type UiKey } from '../i18n';
import { useGameStore } from '../state/gameStore';
import { SettingsPanel } from './components/SettingsPanel';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { DeckScreen } from './screens/DeckScreen';
import { EndingScene } from './screens/EndingScene';
import { RunScreen } from './screens/RunScreen';
import { StartScreen } from './screens/StartScreen';
import { TitleScreen } from './screens/TitleScreen';

type MenuTab = 'game' | 'deck' | 'achievements';

const TABS: { id: MenuTab; label: UiKey }[] = [
  { id: 'game', label: 'nav.game' },
  { id: 'deck', label: 'nav.deck' },
  { id: 'achievements', label: 'nav.achievements' },
];

export function App() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<MenuTab>('game');
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useTranslation();
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
          <nav className="topnav" aria-label={t('nav.mainMenu')}>
            {TABS.map((item) => (
              <button
                key={item.id}
                className={`topnav__tab${tab === item.id ? ' topnav__tab--active' : ''}`}
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => setTab(item.id)}
              >
                {t(item.label)}
                {item.id === 'game' && inRun && (
                  <span className="topnav__dot" title={t('nav.runInProgress')} />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="topbar__right">
          {inActiveRun &&
            (confirmAbandon ? (
              <span className="topbar__confirm">
                <span className="topbar__confirm-label">{t('nav.abandonConfirm')}</span>
                <button
                  className="topbar__btn topbar__btn--danger"
                  onClick={() => {
                    returnToHub();
                    setConfirmAbandon(false);
                    setTab('game');
                  }}
                >
                  {t('nav.yes')}
                </button>
                <button className="topbar__btn" onClick={() => setConfirmAbandon(false)}>
                  {t('nav.no')}
                </button>
              </span>
            ) : (
              <button className="topbar__btn" onClick={() => setConfirmAbandon(true)}>
                {t('nav.abandonRun')}
              </button>
            ))}
          <button className="topbar__btn" onClick={() => setSettingsOpen(true)}>
            {t('settings.open')}
          </button>
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

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
