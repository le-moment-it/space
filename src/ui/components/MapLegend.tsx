import type { NodeType } from '../../engine/map/types';
import { useTranslation, type UiKey } from '../../i18n';
import { NodeGlyph } from './NodeGlyph';
import './MapLegend.css';

/** Ordered so the two "fight" nodes sit together, then the soft stops, then boss. */
const LEGEND: { type: NodeType; label: UiKey; hint: UiKey }[] = [
  { type: 'combat', label: 'legend.battle', hint: 'legend.battle.hint' },
  { type: 'elite', label: 'legend.elite', hint: 'legend.elite.hint' },
  { type: 'event', label: 'legend.signal', hint: 'legend.signal.hint' },
  { type: 'rest', label: 'legend.repair', hint: 'legend.repair.hint' },
  { type: 'shop', label: 'legend.trade', hint: 'legend.trade.hint' },
  { type: 'treasure', label: 'legend.cache', hint: 'legend.cache.hint' },
  { type: 'boss', label: 'legend.boss', hint: 'legend.boss.hint' },
];

export function MapLegend() {
  const { t } = useTranslation();
  return (
    <div className="maplegend" aria-label="Chart legend">
      {LEGEND.map((item) => (
        <div key={item.type} className={`maplegend__item maplegend__item--${item.type}`}>
          <span className="maplegend__glyph">
            <NodeGlyph type={item.type} />
          </span>
          <span className="maplegend__text">
            <span className="maplegend__label">{t(item.label)}</span>
            <span className="maplegend__hint">{t(item.hint)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
