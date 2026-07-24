import { cardDefinitions } from '../../data/cards';
import { LOADOUT_SIZE } from '../../engine/save/types';
import { useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import { HeroShip } from '../components/HeroShip';
import './StartScreen.css';

/** Shown on the Game tab when no run is in progress: the ready room to launch. */
export function StartScreen({ onEditDeck }: { onEditDeck: () => void }) {
  const meta = useGameStore((s) => s.meta);
  const startNewRun = useGameStore((s) => s.startNewRun);
  const { t, cardName } = useTranslation();
  const loadout = meta.loadoutCardIds;
  const ready = loadout.length === LOADOUT_SIZE;

  // Group the loadout into "name ×n" manifest rows.
  const counts = new Map<string, number>();
  for (const id of loadout) counts.set(id, (counts.get(id) ?? 0) + 1);

  return (
    <section className="screen start">
      <div className="start__hero">
        <HeroShip animated />
      </div>

      <p className="eyebrow">{t('start.readyRoom')}</p>
      <h2>{t('start.title')}</h2>
      <p className="screen__sub">{t('start.sub', { size: LOADOUT_SIZE })}</p>

      <div className="start__manifest">
        {[...counts.entries()].map(([id, n]) => (
          <span key={id} className="manifest-chip" data-type={cardDefinitions[id].type}>
            {cardName(id)}
            {n > 1 && <span className="manifest-chip__n mono">×{n}</span>}
          </span>
        ))}
      </div>

      <div className="start__actions">
        <button className="btn-primary" disabled={!ready} onClick={startNewRun}>
          {t('start.launch')}
        </button>
        <button onClick={onEditDeck}>{t('start.editDeck')}</button>
      </div>

      {!ready && (
        <p className="start__warn">
          {t('start.warn', { size: LOADOUT_SIZE, have: loadout.length })}
        </p>
      )}
    </section>
  );
}
