import { useTranslation } from '../../i18n';
import { HeroShip } from '../components/HeroShip';
import './TitleScreen.css';

export function TitleScreen({ onEngage }: { onEngage: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="title">
      <div className="title__stage">
        <HeroShip animated />
      </div>

      <p className="title__eyebrow">{t('title.eyebrow')}</p>
      <h1 className="title__name">Space Roguelike</h1>
      <p className="title__tagline">
        {t('title.tagline1')}
        <br />
        {t('title.tagline2')}
      </p>

      <button className="btn-primary title__engage" onClick={onEngage}>
        {t('title.engage')}
      </button>

      <p className="title__hint">{t('title.hint')}</p>
    </div>
  );
}
