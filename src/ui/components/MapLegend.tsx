import type { NodeType } from '../../engine/map/types';
import { NodeGlyph } from './NodeGlyph';
import './MapLegend.css';

/** Ordered so the two "fight" nodes sit together, then the soft stops, then boss. */
const LEGEND: { type: NodeType; label: string; hint: string }[] = [
  { type: 'combat', label: 'Battle', hint: 'A hostile contact' },
  { type: 'elite', label: 'Elite', hint: 'Tougher fight, better reward' },
  { type: 'event', label: 'Signal', hint: 'An unknown encounter' },
  { type: 'rest', label: 'Repair', hint: 'Mend hull or upgrade a card' },
  { type: 'shop', label: 'Trade', hint: 'Spend salvage' },
  { type: 'treasure', label: 'Cache', hint: 'Free loot' },
  { type: 'boss', label: 'Boss', hint: 'Guards the way out' },
];

export function MapLegend() {
  return (
    <div className="maplegend" aria-label="Chart legend">
      {LEGEND.map((item) => (
        <div key={item.type} className={`maplegend__item maplegend__item--${item.type}`}>
          <span className="maplegend__glyph">
            <NodeGlyph type={item.type} />
          </span>
          <span className="maplegend__text">
            <span className="maplegend__label">{item.label}</span>
            <span className="maplegend__hint">{item.hint}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
