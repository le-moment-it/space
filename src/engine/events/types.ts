export type EventEffect =
  | { kind: 'hull'; amount: number }
  | { kind: 'salvage'; amount: number }
  | { kind: 'addCard'; cardId: string }
  | { kind: 'nothing' };

export interface EventChoice {
  label: string;
  effects: EventEffect[];
}

export interface EventDefinition {
  id: string;
  title: string;
  prompt: string;
  choices: EventChoice[];
}
