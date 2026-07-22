import type { EventDefinition } from '../engine/events/types';

export const eventDefinitions: EventDefinition[] = [
  {
    id: 'derelict-signal',
    title: 'Derelict Signal',
    prompt: 'Sensors pick up a faint distress signal from a derelict hulk drifting nearby.',
    choices: [
      {
        label: 'Dock and salvage the wreck',
        effects: [
          { kind: 'hull', amount: -8 },
          { kind: 'salvage', amount: 25 },
        ],
      },
      { label: 'Leave it be', effects: [{ kind: 'nothing' }] },
    ],
  },
  {
    id: 'adrift-cargo-pod',
    title: 'Adrift Cargo Pod',
    prompt: 'An unmanned cargo pod tumbles past, its beacon still blinking.',
    choices: [
      { label: 'Reel it in', effects: [{ kind: 'salvage', amount: 15 }] },
      { label: 'Strip it for parts', effects: [{ kind: 'addCard', cardId: 'hull-patch' }] },
    ],
  },
  {
    id: 'malfunctioning-relay-beacon',
    title: 'Malfunctioning Relay Beacon',
    prompt: 'A derelict relay beacon hums with unstable power. It could be repurposed.',
    choices: [
      {
        label: 'Divert reactor power to stabilize it',
        effects: [
          { kind: 'hull', amount: -5 },
          { kind: 'addCard', cardId: 'overcharge-reactor' },
        ],
      },
      { label: 'Overload and destroy it', effects: [{ kind: 'salvage', amount: 10 }] },
    ],
  },
];
