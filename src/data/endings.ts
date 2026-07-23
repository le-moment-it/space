import { recruitableCrewIds } from './crew';
import type { EndingDefinition } from '../engine/progression/endings';

/**
 * Two endings, both gated by lifetime meta-progression (docs/GAME_DESIGN.md §7).
 * The story they pay off is the crew's: the Vellborn Reach, the signal that is a
 * census, and the gap in it that Whisper decoded ("a silence it can't hear into").
 */
export const endingDefinitions: EndingDefinition[] = [
  {
    id: 'first-contact',
    title: 'First Contact',
    subtitle: 'Defeat the Harbinger.',
    scene: [
      'The Harbinger comes apart around you — not destroyed so much as interrupted, like a sentence cut off mid-word.',
      'For the first time in living memory, the Reach is silent. No tones. No census. Just the ordinary dark and the ticking of your cooling hull.',
      'Your crew says nothing. They have all heard that silence before, on the recordings, in their sleep. They know it is not the same as gone.',
      'Somewhere far out, past the wrecks, something begins — very quietly — to count again.',
    ],
    isUnlocked: (meta) => meta.stats.runsWon >= 1,
  },
  {
    id: 'into-the-silence',
    title: 'Into the Silence',
    subtitle: 'Win the Reach with the whole crew recovered.',
    scene: [
      'You have heard all of it now — every log, every half-decoded tone, every name the census took. Whisper was right: the signal has a gap. A silence it cannot hear into.',
      'Brother Anchor lays in the last course of his life. Sable flies it without a single straight line. You take the ship into the place the Harbinger has never been able to look.',
      'The census stutters. Searches. Finds nothing where your ship should be — and, not knowing how to count what it cannot hear, stops.',
      'The Reach stays quiet this time. Your crew, at last, sleeps without dreaming in three tones. You did not silence the dark. You taught it, finally, to leave.',
    ],
    isUnlocked: (meta) =>
      meta.stats.runsWon >= 1 &&
      recruitableCrewIds.every((id) => (meta.crew[id]?.timesRecruited ?? 0) >= 1),
  },
];
