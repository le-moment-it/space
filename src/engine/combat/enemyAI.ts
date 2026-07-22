import type { Intent } from './types';

/** M1 enemies use a fixed, repeating pattern — no randomness, fully telegraphed. */
export function intentForTurn(pattern: readonly Intent[], turnIndex: number): Intent {
  if (pattern.length === 0) {
    throw new Error('Enemy intent pattern must not be empty');
  }
  return pattern[turnIndex % pattern.length];
}
