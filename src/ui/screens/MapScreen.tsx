import type { RunState } from '../../engine/run/types';
import { useTranslation } from '../../i18n';
import { MapLegend } from '../components/MapLegend';
import { StarMap } from '../components/StarMap';
import { useGameStore } from '../../state/gameStore';

export function MapScreen({ run }: { run: RunState }) {
  const enterNode = useGameStore((s) => s.enterNode);
  const { t } = useTranslation();

  return (
    <section className="screen">
      <header className="screen__head">
        <p className="eyebrow">{t('map.eyebrow')}</p>
        <h2>{t('map.title', { act: run.act })}</h2>
        <p className="screen__sub">{t('map.sub')}</p>
      </header>
      <StarMap run={run} onEnter={enterNode} />
      <MapLegend />
    </section>
  );
}
