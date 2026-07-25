import type { StatusId, Statuses } from '../../engine/combat/status';
import { useTranslation } from '../../i18n';
import { STATUS_IS_BUFF, STATUS_LABEL_KEY } from './statusText';
import './StatusChips.css';

/**
 * The active statuses on one combatant. Replaces the old hardcoded single-status
 * line, so any number of statuses show on either side.
 */
export function StatusChips({ statuses }: { statuses: Statuses }) {
  const { t } = useTranslation();
  const entries = (Object.keys(statuses) as StatusId[])
    .map((id) => ({ id, state: statuses[id] }))
    .filter((e) => (e.state?.amount ?? 0) > 0);

  if (entries.length === 0) return null;

  return (
    <div className="statuschips">
      {entries.map(({ id, state }) => (
        <span
          key={id}
          className={`statuschip statuschip--${STATUS_IS_BUFF[id] ? 'buff' : 'debuff'}`}
          title={t(STATUS_LABEL_KEY[id])}
        >
          <span className="statuschip__name">{t(STATUS_LABEL_KEY[id])}</span>
          <span className="statuschip__value mono">{state?.amount}</span>
          {state?.turns !== undefined && (
            <span className="statuschip__turns mono">{state.turns}t</span>
          )}
        </span>
      ))}
    </div>
  );
}
