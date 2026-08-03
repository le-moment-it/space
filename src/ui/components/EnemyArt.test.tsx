import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bossEnemyByAct, combatEnemiesByAct, eliteEnemiesByAct } from '../../data/enemies';
import { baseEnemyId, enemyArt, enemyArtFor } from '../art/enemies';
import { EnemyArt } from './EnemyArt';

/** Every enemy the game can actually put in front of you, act suffixes and all. */
const liveEnemyIds = [1, 2, 3].flatMap((act) => [
  ...combatEnemiesByAct[act].map((e) => e.id),
  ...eliteEnemiesByAct[act].map((e) => e.id),
  bossEnemyByAct[act].id,
]);

describe('enemy art registry', () => {
  /**
   * Filenames come from a manual art process, so a typo (`Gunship.png`, `void_reaver.png`)
   * would silently leave that enemy blank forever. Fail loudly instead.
   */
  it('maps every sprite file to a real enemy design id', () => {
    const designs = new Set(
      [1, 2, 3].flatMap((a) => [
        ...combatEnemiesByAct[a].map((e) => baseEnemyId(e.id)),
        ...eliteEnemiesByAct[a].map((e) => baseEnemyId(e.id)),
        bossEnemyByAct[a].id,
      ]),
    );
    const unknown = Object.keys(enemyArt).filter((id) => !designs.has(id));
    expect(unknown, `sprite files matching no enemy: ${unknown.join(', ')}`).toEqual([]);
  });

  /**
   * The one that matters: acts 2 and 3 rename their enemies to `gunship-act2`, so a
   * lookup that forgot to strip the suffix would draw art in act 1 and nothing after.
   */
  it('resolves art for every enemy in every act, suffixed or not', () => {
    const blank = liveEnemyIds.filter((id) => !enemyArtFor(id));
    expect(blank, `enemies with no sprite: ${[...new Set(blank)].join(', ')}`).toEqual([]);
  });

  it('strips the act suffix and leaves unsuffixed ids alone', () => {
    expect(baseEnemyId('gunship-act2')).toBe('gunship');
    expect(baseEnemyId('corsair-cutter-act3')).toBe('corsair-cutter');
    expect(baseEnemyId('the-harbinger')).toBe('the-harbinger');
    // Not a suffix: the design is genuinely called this.
    expect(baseEnemyId('void-reaver')).toBe('void-reaver');
  });

  it('draws the same sprite for a design however far it has been scaled', () => {
    expect(enemyArtFor('gunship-act3')).toBe(enemyArtFor('gunship'));
  });
});

describe('EnemyArt', () => {
  it('renders the sprite for an enemy that has one', () => {
    const { container } = render(<EnemyArt enemyId="gunship-act2" />);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('data-enemy', 'gunship-act2');
    // Decorative: the enemy's name is printed directly above it in the panel.
    expect(img).toHaveAttribute('alt', '');
  });

  it('renders nothing for a design with no art yet', () => {
    // No vector fallback exists for enemies, so the panel simply stands on its text.
    const { container } = render(<EnemyArt enemyId="not-an-enemy" />);
    expect(container).toBeEmptyDOMElement();
  });
});
