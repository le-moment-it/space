import type { CrewDefinition } from '../engine/crew/types';

/**
 * The 6 recruitable crew members. Their dialogues form a slowly-unfolding story
 * about the Harbinger (the Act 3 boss) and what happened to the last fleet that
 * faced it — recruit the same person across several runs to hear more.
 */
const list: CrewDefinition[] = [
  {
    id: 'jax-korrin',
    name: 'Jax Korrin',
    role: 'Gunnery Sergeant',
    portrait: '🎯',
    bio: 'Former fleet gunnery sergeant of the CSV Meridian, the flagship lost at the Vellborn Reach. Signs on with anyone still willing to shoot back.',
    recruitPrompt:
      'A gun-slung figure hails you from a crippled fighter: "Reactor\'s dead, guns aren\'t. Got room for one more?"',
    cardIds: ['crew-overload-shot', 'crew-suppressing-fire'],
    passive: null,
    dialogues: [
      "Name's Korrin. I shoot things. That's the whole introduction.",
      "You fight tidy. The Meridian's gun crews fought tidy too. Didn't save them at the Reach.",
      'You want to know about the Reach? Fine. Something was waiting in the dark. Not raiders. The fleet fired everything it had and hit nothing.',
      "I keep sailing back out here because someone has to be holding a trigger when that thing surfaces again. Glad it's your ship I'm standing on.",
    ],
  },
  {
    id: 'dr-elara-voss',
    name: 'Dr. Elara Voss',
    role: "Ship's Medic",
    portrait: '⚕️',
    bio: 'Trauma surgeon from the hospital ship Lumina — struck off the registry for refusing to abandon patients during the evacuation of Vell Station.',
    recruitPrompt:
      'A medical shuttle drifts on minimal power. The woman inside holds up a surgeon\'s kit: "You\'ll be needing me. Everyone out here eventually does."',
    cardIds: ['crew-triage-protocol', 'crew-stimulant-dose'],
    passive: { kind: 'maxHull', amount: 8 },
    dialogues: [
      'I patch hulls and people. In my experience the hulls complain less.',
      "Vell Station's evacuation was a shambles. The registry called my choices insubordination. The forty people I got out call them something else.",
      'The survivors I treated from the Reach all said the same word before they slept: "listening". It was listening to them. I still don\'t know what that means.',
      "I've decided something, captain. If we meet the thing that emptied those escape pods, I want to be there. Some wounds you can only close at the source.",
    ],
  },
  {
    id: 'torque',
    name: 'Torque',
    role: 'Salvage Engineer',
    portrait: '🔧',
    bio: 'A refurbished mining automaton that achieved self-awareness somewhere between its 400th and 401st firmware patch. Deeply attached to this particular arm of the galaxy.',
    recruitPrompt:
      'A squat maintenance robot magnetizes itself to your airlock and requests asylum, citing "creative differences" with its previous crew, who are all dead.',
    cardIds: ['crew-jury-rig', 'crew-reroute-power'],
    passive: { kind: 'baselineShield', amount: 2 },
    dialogues: [
      'UNIT DESIGNATION: TORQUE. PREVIOUS CREW: NONFUNCTIONAL. CAUSE: NOT TORQUE. Clarifying this early prevents awkwardness.',
      'Torque has repaired 11,204 hull breaches. The breach patterns in this sector are new. Something is cutting, not impacting. Torque finds this professionally interesting and existentially alarming.',
      "Torque's previous crew found a signal buried in the Reach debris. They listened to it for six days. On the seventh they opened the airlocks. Torque does not process audio. Torque is the only witness.",
      'Query: if a machine chooses its crew, is that loyalty or firmware? Torque has decided it does not matter. Torque is staying.',
    ],
  },
  {
    id: 'sable-nyx',
    name: 'Sable Nyx',
    role: 'Pilot & Smuggler',
    portrait: '🌒',
    bio: 'Ran contraband through the Vellborn Reach for a decade before the routes went silent. Knows every dark lane in the sector, and exactly which ones to never use again.',
    recruitPrompt:
      'A sleek runner ship matches your vector. "My routes are gone and my buyers are dead. You look like you could use a real pilot — and I don\'t haunt cheap."',
    cardIds: ['crew-evasive-pattern', 'crew-contraband-cache'],
    passive: null,
    dialogues: [
      "Rule one on my old routes: don't fly straight lines. Rule two: don't ask what happened to the last pilot. You'll do fine.",
      "I used to run the Reach lanes blindfolded. Then one day every beacon on the route started repeating the same three tones. I turned around. My competitors didn't.",
      "You hear it too, don't you? Under the engine noise, when the deck goes quiet. Three tones. I've started dreaming in them.",
      "I've outrun patrols, pirates, and two ex-husbands. I can't outrun this thing. So fine — for once in my life, I'm flying *toward* the trouble. Don't make me regret it, captain.",
    ],
  },
  {
    id: 'whisper',
    name: 'Whisper',
    role: 'Signals Analyst',
    portrait: '📡',
    bio: 'A signals intelligence officer who spent three years alone on a listening post at the edge of the Reach. Officially decommissioned. Unofficially, still listening.',
    recruitPrompt:
      'A listening buoy unfolds into a compact habitat. Its sole occupant speaks before you hail: "I know why you\'re out here. Take me with you and I\'ll tell you."',
    cardIds: ['crew-ghost-signal', 'crew-deep-scan'],
    passive: null,
    dialogues: [
      "Three years listening to the void teaches you two things. One: it's never empty. Two: don't answer.",
      "The signal from the Reach isn't a distress call. It's a census. It counts every ship that hears it. We're numbered, you and I.",
      "I decoded more of it than I reported. It isn't language. It's an appetite, structured. The Harbinger isn't its name — it's its function.",
      "Here's the part I never told the fleet: the signal has a gap. A silence it can't hear into. Keep your reactor tuned to it, and we might get close enough to matter.",
    ],
  },
  {
    id: 'brother-anchor',
    name: 'Brother Anchor',
    role: 'Void Navigator',
    portrait: '⚓',
    bio: 'Last navigator of the Order of the Fixed Star, a monastic charting order whose fleet vanished at the Vellborn Reach. Navigates by memorized starfields older than the colony charts.',
    recruitPrompt:
      'An ancient chartship holds station ahead, its lone occupant robed and calm: "Every course in this sector bends toward the same dark place, captain. You will want a navigator who has been there."',
    cardIds: ['crew-stalwart-hymn', 'crew-penance'],
    passive: { kind: 'maxHull', amount: 5 },
    dialogues: [
      'The Order charted stars for nine generations. I am what remains of it. I still chart. Habit is a kind of faith.',
      'Our fleet answered a distress call at the Reach. One hundred and seven ships went in. My chartship was becalmed in the shallows — arithmetic spared me, nothing nobler.',
      'The stars around the Reach are wrong, captain. Not moved — *rearranged*. Something out there is editing the sky, and the census of ships grows shorter every year.',
      'I have finished my last chart. It ends where the Harbinger waits. When you are ready to sail there, I will lay in the course — and this time I will not be becalmed.',
    ],
  },
];

export const crewDefinitions: Record<string, CrewDefinition> = Object.fromEntries(
  list.map((crew) => [crew.id, crew]),
);

/** All crew are recruitable from the first run — their *stories* are the meta-progression. */
export const recruitableCrewIds: string[] = list.map((crew) => crew.id);

/** Chance an event node offers an unrecruited crew member instead of a regular event. */
export const CREW_OFFER_CHANCE = 0.35;
