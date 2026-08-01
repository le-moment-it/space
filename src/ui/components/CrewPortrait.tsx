import { crewDefinitions } from '../../data/crew';
import { useTranslation } from '../../i18n';
import { crewArt } from '../art/crew';
import './CrewPortrait.css';

/**
 * Large on the offer and dialogue screens, medium in the codex grid, small in a roster
 * row. One component rather than three, because these were previously three different
 * ad-hoc treatments — 60px framed, 40px framed, and an unframed 1.5rem emoji.
 */
export type PortraitSize = 'lg' | 'md' | 'sm';

/**
 * A crew member's portrait in a circular frame.
 *
 * Falls back to the emoji in `crewDefinitions` when there is no art yet, so portraits
 * can land one at a time without leaving a hole on screen. `crewId: null` is the codex's
 * not-yet-met entry.
 *
 * The image is `alt=""` on purpose: every site renders the crew member's name directly
 * beside it, so a described portrait would just make a screen reader say the name twice.
 */
export function CrewPortrait({
  crewId,
  size = 'md',
}: {
  crewId: string | null;
  size?: PortraitSize;
}) {
  const { crewName } = useTranslation();
  const className = `crewportrait crewportrait--${size}`;

  if (!crewId) {
    return (
      <span className={`${className} crewportrait--unknown`} aria-hidden="true">
        ?
      </span>
    );
  }

  const art = crewArt[crewId];
  if (!art) {
    return (
      <span className={className} aria-hidden="true">
        {crewDefinitions[crewId]?.portrait}
      </span>
    );
  }

  return (
    <span className={className}>
      <img
        className="crewportrait__img"
        src={art}
        alt=""
        data-crew={crewId}
        title={crewName(crewId)}
      />
    </span>
  );
}
