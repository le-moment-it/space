import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT_CONFIG } from '../combat/types';
import { applyCrewPassives, crewRepairAfterCombat } from './apply';
import type { CrewDefinition, CrewPassive } from './types';

const crew = (id: string, passive: CrewPassive): CrewDefinition => ({
  id,
  name: id,
  role: '',
  portrait: '',
  bio: '',
  recruitPrompt: '',
  passiveDescription: '',
  passive,
  dialogues: [],
});

const definitions: Record<string, CrewDefinition> = {
  engineer: crew('engineer', { kind: 'power', amount: 1 }),
  engineer2: crew('engineer2', { kind: 'power', amount: 2 }),
  gunner: crew('gunner', { kind: 'calibration', amount: 2 }),
  pilot: crew('pilot', { kind: 'evasion' }),
  analyst: crew('analyst', { kind: 'retainHand' }),
  navigator: crew('navigator', { kind: 'startingShield', amount: 10 }),
  medic: crew('medic', { kind: 'repairAfterCombat', amount: 6 }),
};

describe('applyCrewPassives', () => {
  it('returns the base config unchanged with no crew aboard', () => {
    expect(applyCrewPassives(DEFAULT_COMBAT_CONFIG, [], definitions)).toBe(DEFAULT_COMBAT_CONFIG);
  });

  it('ignores unknown crew ids', () => {
    expect(applyCrewPassives(DEFAULT_COMBAT_CONFIG, ['nobody'], definitions)).toBe(
      DEFAULT_COMBAT_CONFIG,
    );
  });

  it('maps each passive onto its config knob', () => {
    const result = applyCrewPassives(
      DEFAULT_COMBAT_CONFIG,
      ['engineer', 'gunner', 'pilot', 'analyst', 'navigator'],
      definitions,
    );

    expect(result.playerMaxPower).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower + 1);
    expect(result.startingCalibration).toBe(2);
    expect(result.nullifyFirstHit).toBe(true);
    expect(result.retainHand).toBe(true);
    expect(result.startingShield).toBe(10);
  });

  it('stacks numeric passives of the same kind', () => {
    const result = applyCrewPassives(DEFAULT_COMBAT_CONFIG, ['engineer', 'engineer2'], definitions);
    expect(result.playerMaxPower).toBe(DEFAULT_COMBAT_CONFIG.playerMaxPower + 3);
  });

  it('leaves the combat config alone for a between-fights passive', () => {
    // repairAfterCombat happens after the fight, so it must not appear in the config.
    expect(applyCrewPassives(DEFAULT_COMBAT_CONFIG, ['medic'], definitions)).toEqual(
      DEFAULT_COMBAT_CONFIG,
    );
  });
});

describe('crewRepairAfterCombat', () => {
  it('totals the repair from everyone aboard who grants it', () => {
    expect(crewRepairAfterCombat(['medic', 'gunner'], definitions)).toBe(6);
    expect(crewRepairAfterCombat(['medic', 'medic'], definitions)).toBe(12);
  });

  it('is zero with no repairing crew', () => {
    expect(crewRepairAfterCombat(['gunner', 'pilot', 'nobody'], definitions)).toBe(0);
  });
});
