import { cardDefinitions, eliteRewardCardIds, runCardPool } from '../../data/cards';
import { CREW_CAP, CREW_OFFER_CHANCE } from '../../data/crew';
import { effectiveRarityOdds, type RarityChance } from '../../engine/cards/dropOdds';
import type { OfferSource } from '../../engine/cards/rarityOdds';
import { CARD_RARITIES, rarityOf, type CardRarity } from '../../engine/cards/types';
import { DEFAULT_COMBAT_CONFIG } from '../../engine/combat/types';
import { levelFor } from '../../engine/progression/level';
import { NODE_TYPE_WEIGHTS } from '../../engine/map/generate';
import { useTranslation, type UiKey } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import { Keyword, KEYWORDS } from '../components/Keyword';
import './RulesScreen.css';

const RARITY_LABEL: Record<CardRarity, UiKey> = {
  common: 'card.rarity.common',
  rare: 'card.rarity.rare',
  epic: 'card.rarity.epic',
  legendary: 'card.rarity.legendary',
};

/** Node glyph labels already exist for the map legend — reuse rather than re-write. */
const NODE_LABEL: Record<string, UiKey> = {
  combat: 'legend.battle',
  elite: 'legend.elite',
  event: 'legend.signal',
  rest: 'legend.repair',
  shop: 'legend.trade',
  treasure: 'legend.cache',
  garage: 'legend.garage',
};

const pct = (n: number) => (n >= 10 || n === 0 ? Math.round(n) : Math.round(n * 10) / 10);

/**
 * The reference screen: how a run works, what each keyword does, and — the reason it
 * exists — what you can actually expect to find, computed from your own unlock set
 * rather than the design table, which would promise tiers you cannot yet receive.
 */
export function RulesScreen() {
  const meta = useGameStore((s) => s.meta);
  const tr = useTranslation();
  const { t } = tr;

  // The same pools the engine draws from (see buildRunContent) — every card, not just
  // the ones unlocked for deck building. Level is what moves these numbers.
  const generalPool = runCardPool;
  const elitePool = eliteRewardCardIds;
  const level = levelFor(meta.xp);
  const oddsFor = (pool: string[], source: OfferSource) =>
    effectiveRarityOdds(pool, source, cardDefinitions, level);

  const totalByRarity = (rarity: CardRarity) =>
    Object.values(cardDefinitions).filter((c) => rarityOf(c) === rarity).length;
  const unlockedByRarity = (rarity: CardRarity) =>
    meta.unlockedCardIds.filter(
      (id) => cardDefinitions[id] && rarityOf(cardDefinitions[id]) === rarity,
    ).length;

  const drops: { key: string; label: UiKey; reward: string; odds: RarityChance[] }[] = [
    {
      key: 'combat',
      label: 'rules.drop.combat',
      reward: t('rules.drop.combat.reward', {
        salvage: t('rules.salvageByAct', { act1: 12, act2: 16, act3: 19 }),
      }),
      odds: oddsFor(generalPool, 'combat'),
    },
    {
      key: 'elite',
      label: 'rules.drop.elite',
      reward: t('rules.drop.elite.reward', {
        salvage: t('rules.salvageByAct', { act1: 25, act2: 33, act3: 40 }),
      }),
      odds: oddsFor(elitePool, 'elite'),
    },
    {
      key: 'shop',
      label: 'rules.drop.shop',
      reward: t('rules.drop.shop.reward', {
        price: t('rules.priceFormula', { base: 20, perCost: 15 }),
      }),
      odds: oddsFor(generalPool, 'shop'),
    },
    {
      key: 'cache',
      label: 'rules.drop.cache',
      reward: t('rules.drop.cache.reward', {
        salvage: t('rules.salvageByAct', { act1: 15, act2: 20, act3: 24 }),
      }),
      odds: oddsFor(generalPool, 'cache'),
    },
  ];

  // Weights are relative and sum to 107, so normalise for the common case.
  const nodeTotal = NODE_TYPE_WEIGHTS.reduce((sum, n) => sum + n.weight, 0);

  return (
    <section className="screen rules">
      <header className="screen__head">
        <p className="eyebrow">{t('rules.eyebrow')}</p>
        <h2>{t('rules.title')}</h2>
        <p className="screen__sub">{t('rules.sub')}</p>
      </header>

      <div className="rules__cols">
        <div className="panel">
          <p className="eyebrow">{t('rules.run')}</p>
          <ul className="rules__list">
            <li>{t('rules.run.acts')}</li>
            <li>{t('rules.run.deck')}</li>
            <li>{t('rules.run.death')}</li>
          </ul>
        </div>

        <div className="panel">
          <p className="eyebrow">{t('rules.combat')}</p>
          <ul className="rules__list">
            <li>
              {t('rules.combat.power', {
                power: DEFAULT_COMBAT_CONFIG.playerMaxPower,
                draw: DEFAULT_COMBAT_CONFIG.drawAmount,
              })}
            </li>
            <li>{t('rules.combat.shields')}</li>
            <li>{t('rules.combat.intent')}</li>
            <li>{t('rules.combat.discard')}</li>
          </ul>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">{t('rules.drops')}</p>
        <p className="rules__note">{t('rules.drops.sub')}</p>

        <div className="rules__scroll">
          <table className="rules__table">
            <thead>
              <tr>
                <th scope="col">{t('rules.drops.source')}</th>
                <th scope="col">{t('rules.drops.reward')}</th>
                {CARD_RARITIES.map((rarity) => (
                  <th key={rarity} scope="col" data-rarity={rarity} className="rules__th--rarity">
                    {t(RARITY_LABEL[rarity])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drops.map((drop) => (
                <tr key={drop.key}>
                  <th scope="row">{t(drop.label)}</th>
                  <td className="rules__reward">{drop.reward}</td>
                  {drop.odds.map((row) => (
                    <td
                      key={row.rarity}
                      data-rarity={row.rarity}
                      className={`rules__odds mono${row.percent === 0 ? ' rules__odds--none' : ''}`}
                      title={
                        row.percent === 0
                          ? t('rules.drops.locked')
                          : t('rules.drops.designed') + ` ${row.weight}%`
                      }
                    >
                      {pct(row.percent)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rules__note">{t('rules.drops.perCard')}</p>
      </div>

      <div className="panel">
        <p className="eyebrow">{t('rules.other')}</p>
        <ul className="rules__defs">
          <Definition term={t('rules.other.boss')} desc={t('rules.other.boss.desc')} />
          <Definition
            term={t('rules.other.rest')}
            desc={t('rules.other.rest.desc', { percent: 35 })}
          />
          <Definition term={t('rules.other.garage')} desc={t('rules.other.garage.desc')} />
          <Definition term={t('rules.other.event')} desc={t('rules.other.event.desc')} />
        </ul>
      </div>

      <div className="rules__cols">
        <div className="panel">
          <p className="eyebrow">{t('rules.rarity')}</p>
          <p className="rules__note">{t('rules.rarity.sub')}</p>
          <ul className="rules__defs">
            {CARD_RARITIES.map((rarity) => (
              <li key={rarity} className="rules__def" data-rarity={rarity}>
                <span className="rules__def-term rules__def-term--rarity">
                  {t(RARITY_LABEL[rarity])}
                </span>
                <span className="rules__def-desc mono">
                  {t('rules.rarity.count', {
                    count: unlockedByRarity(rarity),
                    total: totalByRarity(rarity),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <p className="eyebrow">{t('rules.map')}</p>
          <p className="rules__note">{t('rules.map.sub')}</p>
          <ul className="rules__defs">
            {NODE_TYPE_WEIGHTS.map((node) => (
              <Definition
                key={node.value}
                term={t(NODE_LABEL[node.value])}
                desc={`${Math.round((node.weight / nodeTotal) * 100)}%`}
                mono
              />
            ))}
          </ul>
          <p className="rules__note">{t('rules.map.note')}</p>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">{t('rules.keywords')}</p>
        <p className="rules__note">{t('rules.keywords.sub')}</p>
        <ul className="rules__defs">
          {Object.keys(KEYWORDS).map((id) => {
            const keyword = KEYWORDS[id as keyof typeof KEYWORDS];
            return (
              <li key={id} className="rules__def">
                <span className="rules__def-term">
                  <Keyword id={id as keyof typeof KEYWORDS} />
                </span>
                <span className="rules__def-desc">{t(keyword.desc)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rules__cols">
        <div className="panel">
          <p className="eyebrow">{t('rules.upgrades')}</p>
          <ul className="rules__list">
            <li>{t('rules.upgrades.tiers')}</li>
            <li>{t('rules.upgrades.step')}</li>
            <li>{t('rules.upgrades.where')}</li>
          </ul>
        </div>

        <div className="panel">
          <p className="eyebrow">{t('rules.crew')}</p>
          <ul className="rules__list">
            <li>{t('rules.crew.passive', { cap: CREW_CAP })}</li>
            <li>{t('rules.crew.offer', { chance: Math.round(CREW_OFFER_CHANCE * 100) })}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Definition({ term, desc, mono }: { term: string; desc: string; mono?: boolean }) {
  return (
    <li className="rules__def">
      <span className="rules__def-term">{term}</span>
      <span className={`rules__def-desc${mono ? ' mono' : ''}`}>{desc}</span>
    </li>
  );
}
