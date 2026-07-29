import type { Language } from './types';

/**
 * UI chrome strings. `en` is the source of truth; `fr` must mirror its keys exactly
 * (enforced by the `Record<UiKey, string>` type below). Placeholders use `{name}` form
 * and are filled by `t(key, params)`. Strings with inline emphasis are split into
 * fragment keys and reassembled as JSX in the relevant component.
 */
const en = {
  // Shared
  'common.continue': 'Continue',
  'common.close': 'Close',

  // Title screen
  'title.eyebrow': 'Working title · a deck-building descent',
  'title.tagline1': 'Your ship is a deck. The Reach is listening.',
  'title.tagline2': 'Don’t answer.',
  'title.engage': 'Engage',
  'title.hint': 'Pre-alpha build · unfinished',

  // Top bar / navigation
  'nav.game': 'Game',
  'nav.deck': 'Deck',
  'nav.achievements': 'Achievements',
  'nav.rules': 'Rules',
  'nav.mainMenu': 'Main menu',
  'nav.runInProgress': 'Run in progress',
  'nav.abandonRun': 'Abandon run',
  'nav.abandonConfirm': 'Abandon run?',
  'nav.yes': 'Yes',
  'nav.no': 'No',

  // Settings
  'settings.open': 'Settings',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.languageHint': 'Applies everywhere, right away.',
  'settings.close': 'Close',
  'settings.cancel': 'Cancel',
  'settings.saveData': 'Save data',
  'settings.saveDataHint': 'Your progress is stored in this browser only.',
  'settings.export': 'Export',
  'settings.exportHint': 'Download your progress as a JSON file.',
  'settings.exportDone': 'Save exported.',
  'settings.import': 'Import',
  'settings.importHint': 'Load progress from a file you exported.',
  'settings.importConfirm': 'Replace your progress with this file?',
  'settings.importSummary': '{wins} runs won · {cards} cards unlocked · {run}',
  'settings.importRunYes': 'run in progress',
  'settings.importRunNo': 'no run in progress',
  'settings.importApply': 'Replace progress',
  'settings.importDone': 'Progress imported.',
  'settings.importRunDropped':
    'Progress imported. The unfinished run in that file was damaged, so it was dropped.',
  'settings.importFailed': 'That file isn’t a save. Choose a file you exported from here.',
  'settings.reset': 'Reset',
  'settings.resetHint': 'Erase all progress and start over. Your language stays.',
  'settings.resetConfirm': 'Erase all progress? This cannot be undone.',
  'settings.resetApply': 'Erase everything',
  'settings.resetDone': 'Progress erased.',

  // Run stats
  'stat.hull': 'Hull',
  'stat.act': 'Act',
  'stat.salvage': 'Salvage',
  'stat.deck': 'Deck',
  'stat.systems': 'Systems',
  'stat.crew': 'Crew',

  // Run end
  'run.wonEyebrow': 'Sector cleared',
  'run.wonTitle': 'The Reach falls quiet',
  'run.wonSub': 'You defeated the final boss and completed the run.',
  'run.lostEyebrow': 'Signal lost',
  'run.lostTitle': 'Your ship was destroyed',
  'run.lostSub': 'The Reach keeps its census.',
  'run.returnToBridge': 'Return to bridge',

  // Map
  'map.eyebrow': 'Navigation',
  'map.title': 'Star chart — Act {act}',
  'map.sub': 'Plot a course. Every path bends toward the boss.',

  // Map legend
  'legend.battle': 'Battle',
  'legend.battle.hint': 'A hostile contact',
  'legend.elite': 'Elite',
  'legend.elite.hint': 'Tougher fight, better reward',
  'legend.signal': 'Signal',
  'legend.signal.hint': 'An unknown encounter',
  'legend.repair': 'Repair',
  'legend.repair.hint': 'Restore hull',
  'legend.trade': 'Trade',
  'legend.trade.hint': 'Spend salvage',
  'legend.cache': 'Cache',
  'legend.cache.hint': 'Free loot',
  'legend.garage': 'Garage',
  'legend.garage.hint': 'Upgrade a card for this run',
  'legend.boss': 'Boss',
  'legend.boss.hint': 'Guards the way out',

  // Card type labels
  'card.type.weapon': 'Weapon',
  'card.type.maneuver': 'Maneuver',
  'card.type.shipSystem': 'System',

  // Upgrade preview (right-click a card)
  'upgrade.title': 'Upgrade path',
  'upgrade.tierBase': 'Base',
  'upgrade.current': 'Current',
  'upgrade.next': 'Next',
  'upgrade.maxed': 'Fully upgraded — no further tiers.',
  'upgrade.hint': 'Right-click a card to see its upgrade path.',

  // Card rarity
  'card.rarity.common': 'Common',
  'card.rarity.rare': 'Rare',
  'card.rarity.epic': 'Epic',
  'card.rarity.legendary': 'Legendary',

  // Card effect fragments (reassembled with emphasis in <EffectText>)
  'effect.deal': 'Deal',
  'effect.damage': 'damage',
  'effect.gain': 'Gain',
  'effect.shields': 'shields',
  'effect.repair': 'Repair',
  'effect.hull': 'hull',
  'effect.power': 'power',
  'effect.thisTurn': 'this turn',
  'effect.weaken': 'Weaken',
  'effect.for': 'for',
  'effect.turn': 'turn',
  'effect.turns': 'turns',
  'effect.draw': 'Draw',
  'effect.card': 'card',
  'effect.cards': 'cards',
  'effect.apply': 'Apply',
  'effect.corrosion': 'Corrosion',
  'effect.breach': 'Breach',
  'effect.perAttack': 'per attack this fight',
  'effect.perShield': 'to every shield gain this fight',
  'effect.double': 'Double your',
  'effect.nextAttack': 'next attack',
  'effect.nextShield': 'next shield gain',
  'effect.nextRepair': 'next repair',
  // Rules keywords — label printed on the card, desc shown on right-click
  'keyword.exhaust': 'Exhaust',
  'keyword.exhaust.desc':
    'When you play this card, it leaves the fight instead of going to your discard pile, so you cannot draw it again this combat. It returns to your deck for the next fight.',

  'keyword.corrosion': 'Corrosion',
  'keyword.corrosion.desc':
    'Damage over time. At the end of your turn the enemy loses hull equal to its Corrosion, then the Corrosion drops by 1. Applying more adds to it, so it pays off most when applied early.',
  'keyword.breach': 'Breach',
  'keyword.breach.desc':
    'While Breached, the enemy takes 50% more damage from every attack. It lasts for the listed number of turns, so it is worth opening a big turn with.',
  'keyword.multihit': 'Multiple hits',
  'keyword.multihit.desc':
    'This attack lands as separate hits. Enemy shields absorb from each hit individually, so it is weaker against shields — but every per-attack bonus, like Calibration, counts on every hit.',
  'keyword.weaken': 'Weaken',
  'keyword.weaken.desc':
    'The enemy deals that much less damage with its attacks, for the listed number of turns. Applying more adds to it.',
  'keyword.calibration': 'Calibration',
  'keyword.calibration.desc':
    'Every attack you make deals this much extra damage for the rest of the combat. It applies to each hit of a multi-hit attack.',
  'keyword.deflector': 'Deflector Tuning',
  'keyword.deflector.desc':
    'Every time you gain shields for the rest of the combat, you gain this much extra.',
  'keyword.charge': 'Charge',
  'keyword.charge.desc':
    'Your next effect of the matching kind is doubled, then the charge is spent. A charge is used once per card, not once per hit of a multi-hit attack.',
  'keyword.evasion': 'Evasion',
  'keyword.evasion.desc':
    'The first damage that would reach your hull this fight is cancelled instead. A hit fully absorbed by shields does not spend it, and it refreshes every fight.',

  // Battle screen
  'battle.hostileContact': 'Hostile contact',
  'battle.yourShip': 'Your ship',
  'battle.incomingAttack': 'Incoming attack',
  'battle.bracing': 'Bracing',
  'battle.shields': 'Shields',
  'battle.reactorPower': 'Reactor power {current}/{max}',
  'battle.powerAria': 'Power {current} of {max}',
  'battle.draw': 'Draw',
  'battle.discard': 'Discard',
  'battle.turn': 'Turn',
  'battle.endTurn': 'End turn',
  'battle.yourHand': 'Your hand',
  'battle.dropHint': 'Drag a card here to play it',
  'battle.contactNeutralized': 'Contact neutralized',
  'battle.victory': 'Victory',
  'battle.hullBreach': 'Hull breach',
  'battle.shipLost': 'Ship lost',

  // Combat statuses — chip label, the line when applied, and the damage tick
  'status.weaken': 'Weakened',
  'status.weaken.applied': 'Enemy weakened by {amount}.',
  'status.corrosion': 'Corrosion',
  'status.corrosion.applied': 'Applied {amount} Corrosion.',
  'status.corrosion.tick': 'Corrosion eats {amount} hull.',
  'status.breach': 'Breached',
  'status.breach.applied': 'Hull breached — the enemy takes extra damage.',
  'status.calibration': 'Calibration',
  'status.calibration.applied': 'Gunnery calibrated: +{amount} damage per attack.',
  'status.deflector': 'Deflectors',
  'status.deflector.applied': 'Deflectors tuned: +{amount} to every shield gain.',
  'status.chargeDamage': 'Charged',
  'status.chargeDamage.applied': 'Weapons charged — your next attack is doubled.',
  'status.chargeShield': 'Braced',
  'status.chargeShield.applied': 'Capacitors braced — your next shield gain is doubled.',
  'status.chargeHeal': 'Primed',
  'status.chargeHeal.applied': 'Repair bay primed — your next repair is doubled.',
  'status.evasion': 'Evasion',
  'status.evasion.applied': 'Evasive pattern running — the first hit that lands is nullified.',
  'status.evasion.tick': 'Evaded the attack — {amount} damage nullified.',

  // Combat log
  'battlelog.title': 'Combat log',
  'log.turn': 'Turn {turn}',
  'log.contact': 'Contact: {name} ({hull} hull).',
  'log.notEnoughPower': 'Not enough reactor power to play {name}.',
  'log.played': 'Played {name}.',
  'log.damage': '{name} deals {amount} damage{suffix}.',
  'log.absorbedEnemy': ' ({absorbed} absorbed by enemy shields)',
  'log.absorbedSelf': ' ({absorbed} absorbed by shields)',
  'log.shield': 'Shields raised by {amount}.',
  'log.heal': 'Hull repaired by {amount}.',
  'log.power': 'Reactor overcharged (+{amount} power).',
  'log.drawOne': 'Drew {amount} card.',
  'log.drawMany': 'Drew {amount} cards.',
  'log.reshuffle': 'Discard pile reshuffled into draw pile.',
  'log.enemyAttack': '{name} attacks for {amount} damage{suffix}.',
  'log.enemyShield': '{name} raises shields (+{amount}).',
  'log.enemyDestroyed': '{name} destroyed!',

  // Start screen
  'start.readyRoom': 'Ready room',
  'start.title': 'Launch a run',
  'start.sub': 'Your ship carries a {size}-card deck into the Reach. Build it in the Deck tab.',
  'start.launch': 'Launch new run',
  'start.editDeck': 'Edit deck',
  'start.warn': 'Your deck needs {size} cards ({have}/{size}). Edit it in the Deck tab.',

  // Deck screen
  'deck.loadout': 'Loadout',
  'deck.title': 'Your deck',
  'deck.sub': 'Choose the {size} cards you launch with. Click a card to add or remove it.',
  'deck.changesApply': ' Changes apply to your next run.',
  'deck.deck': 'Deck',
  'deck.reset': 'Reset',
  'deck.empty': 'Empty — add cards from your collection below.',
  'deck.collection': 'Collection ({count})',

  // Achievements screen
  'ach.eyebrow': 'Log',
  'ach.title': 'Achievements',
  'ach.sub': 'The crew you’ve met, the levels you’ve earned, the endings you’ve reached.',
  'ach.runsStarted': 'Runs started',
  'ach.runsWon': 'Runs won',
  'ach.runsLost': 'Runs lost',
  'ach.elitesDowned': 'Elites downed',
  'ach.bossesDowned': 'Bosses downed',
  'ach.milestones': 'Progress',
  'ach.crewCodex': 'Crew codex',
  'ach.endings': 'Endings',
  'ach.unknownDrifter': 'Unknown drifter',
  'ach.unknownBio': 'Somewhere among the wrecks. Recruit to learn more.',
  'ach.metTimes': '{role} · met {count}×',
  'ach.recruitAgain': 'Recruit again to hear more…',
  'ach.lockedEnding': 'Locked ending',
  'ach.endingReplay': '{subtitle} · replay',

  // Event screen
  'event.eyebrow': 'Anomaly',
  // What a choice costs and pays, printed on its button.
  'event.outcome.hullLoss': '−{amount} hull',
  'event.outcome.hullGain': '+{amount} hull',
  'event.outcome.salvage': '+{amount} salvage',
  'event.outcome.card': '+ {name} (to deck)',
  'event.outcome.nothing': 'No effect',

  // Crew screens
  'crew.distressSignal': 'Distress signal',
  'crew.comms': 'Comms',
  'crew.grantsPassive': 'While aboard',
  'crew.roster': 'Crew aboard',
  'crew.rosterEmpty': 'No crew aboard yet. You meet them at signal nodes.',
  'crew.full': 'Your berth is full ({count}/{cap}). Choose who stands down.',
  'crew.replaceWith': 'Replace',
  'crew.standDown': '{name} stands down',
  'crew.welcomeAboard': 'Welcome aboard',
  'crew.leaveThem': 'Leave them',

  // Garage screen
  'garage.eyebrow': 'Refit bay',
  'garage.title': 'Upgrade a card',
  'garage.sub': 'Pick one card to improve. This refit lasts for this run only.',
  'garage.leave': 'Leave',
  'garage.maxed': 'Every card is fully upgraded.',
  'garage.alreadyMax': 'Already fully upgraded',

  // Rest screen
  'rest.eyebrow': 'Repair bay',
  'rest.title': 'Systems restored',
  'rest.hullPatchedTo': 'Hull patched to',

  // Card reward (after a combat win)
  'reward.cardEyebrow': 'Combat spoils',
  'reward.cardTitle': 'Add a card to your deck',
  'reward.cardSub': 'Pick one card to keep, or skip it.',
  'reward.skip': 'Skip',
  'reward.viewDeck': 'View deck ({count})',

  // Reward screen (boss: choose one)
  'reward.eyebrow': 'Boss reward',
  'reward.title': 'Choose one reward',
  'reward.sub': 'A ship system for this run, or a card upgrade that lasts forever.',
  'reward.systemLane': 'Install a ship system',
  'reward.systemLaneHint': 'Bolted on for the rest of this run.',
  'reward.upgradeLane': 'Upgrade a card forever',
  'reward.upgradeLaneHint': 'Permanent — this loadout slot stays upgraded in every future run.',
  'reward.noUpgrades': 'No starting-deck card can be upgraded further.',
  'reward.continue': 'Continue without a reward',

  // Card list modal (run deck + combat piles)
  'deckView.title': 'Current deck',
  'cardList.count': '{count} cards',
  'cardList.empty': 'Empty',
  'run.viewDeckHint': 'View current deck',

  // Combat piles
  'pile.draw': 'Draw pile',
  'pile.discard': 'Discard pile',
  'pile.exhaust': 'Exhausted',
  'pile.drawNote': 'Sorted — the real draw order stays hidden.',
  'pile.exhaustNote': 'Out for this fight. Back in your deck next combat.',
  'log.exhausted': '{name} exhausted.',

  // Shop screen
  'shop.eyebrow': 'Salvage trader',
  'shop.title': 'Trade for parts',
  'shop.bought': 'Bought',
  'shop.buy': 'Buy · {price}',
  'shop.leave': 'Leave',

  // Treasure screen
  'treasure.eyebrow': 'Derelict cache',
  'treasure.title': 'Recovered from the wreck',
  'treasure.salvaged': 'Salvaged',
  'treasure.scrapAndSchematic': 'scrap and a schematic:',
  'treasure.scrapOnly': 'scrap.',

  // Ending scene
  'ending.eyebrow': 'Ending',
  'ending.label': 'Ending: {title}',
  'ending.next': 'Next',
  // Rules screen
  'rules.eyebrow': 'Reference',
  'rules.title': 'Rules',
  'rules.sub': 'How a run works, what every keyword does, and what you can expect to find.',

  'rules.run': 'The run',
  'rules.run.acts':
    'A run is 3 acts. Each act is a fresh star chart ending in a boss; clearing it restores your hull in full and draws the next chart.',
  'rules.run.deck':
    'Cards you pick up belong to that run only. What you unlock permanently is the pool you build your starting deck from, in the Deck tab.',
  'rules.run.death':
    'Reaching 0 hull ends the run. Hull carries between fights within an act — only rest stops and repairs bring it back.',

  'rules.combat': 'A fight',
  'rules.combat.power':
    'You start each turn with {power} reactor power and draw back up to {draw} cards.',
  'rules.combat.shields':
    'Shields absorb damage, then reset to 0 at the start of your turn — they are for the hit you can see coming, not savings.',
  'rules.combat.intent':
    'The enemy shows its next move before you act, so every turn is a decision with full information.',
  'rules.combat.discard':
    'Whatever is left in your hand is discarded at end of turn. Your discard pile is reshuffled when you run out of cards to draw.',

  'rules.keywords': 'Keywords',
  'rules.keywords.sub': 'Right-click any keyword, anywhere in the game, to see this again.',

  'rules.rarity': 'Rarity',
  'rules.rarity.sub':
    'Higher rarity means a stronger card at the same cost — and a rarer one. Every card can drop from your very first run; your commander level is what raises the odds. The count below is how much of each tier you can build decks with.',
  'rules.rarity.count': '{count} of {total} in your collection',

  'rules.upgrades': 'Upgrades',
  'rules.upgrades.tiers':
    'Every card has two upgrades, + and ++. Right-click a card to see its path.',
  'rules.upgrades.step':
    'Each card sets its own upgrade, so a cheap card and a heavy weapon do not gain the same amount. A card’s preview shows every tier.',
  'rules.upgrades.where':
    'A Garage upgrades one card for the current run. Beating an act boss can instead upgrade a starting-deck card permanently.',

  'rules.crew': 'Crew',
  'rules.crew.passive':
    'Crew grant a passive for the rest of the run and add nothing to your deck. Up to {cap} can be aboard; when full, you choose who stands down.',
  'rules.crew.offer':
    'Signal nodes have a {chance}% chance of a crew offer while anyone is still un-recruited.',

  'rules.drops': 'What you find',
  'rules.drops.sub':
    'These are your real chances at your current level, and they rise every time you level up.',
  'rules.drops.source': 'Source',
  'rules.drops.reward': 'Reward',
  'rules.drops.designed': 'Designed',
  'rules.drops.locked': 'none unlocked',
  'rules.drops.perCard': 'Chances are per card offered.',

  'rules.drop.combat': 'Combat win',
  'rules.drop.combat.reward': 'Choose 1 of 3 cards · {salvage}',
  'rules.drop.elite': 'Elite win',
  'rules.drop.elite.reward': 'Choose 1 of 3 cards · {salvage}',
  'rules.drop.shop': 'Trader',
  'rules.drop.shop.reward': '3 cards for sale · priced {price}',
  'rules.drop.cache': 'Derelict cache',
  'rules.drop.cache.reward': '1 free card · {salvage}',

  'rules.other': 'Other nodes',
  'rules.other.boss': 'Boss win',
  'rules.other.boss.desc':
    'No card and no salvage. Choose 1 of 3 ship systems, or permanently upgrade a starting-deck card. Your hull is fully restored for the next act.',
  'rules.other.rest': 'Repair bay',
  'rules.other.rest.desc': 'Restores {percent}% of your maximum hull.',
  'rules.other.garage': 'Garage',
  'rules.other.garage.desc': 'Upgrade one card in your deck, free, for the rest of this run.',
  'rules.other.event': 'Signal',
  'rules.other.event.desc':
    'A crew offer, or a choice with a consequence — salvage, hull, or a card.',

  'rules.map': 'The star chart',
  'rules.map.sub': 'Roughly how often each node type appears, once past the opening layers.',
  'rules.map.note':
    'The first layer is always combat, elites never appear in the first two, and a repair bay or garage never follows another.',

  'rules.salvageByAct': '{act1} / {act2} / {act3} salvage by act',
  'rules.priceFormula': '{base} + {perCost} per energy, plus rarity',
  // Commander level (XP)
  'level.short': 'LV {level}',
  'level.title': 'Commander level',
  'level.label': 'Level',
  'level.xp': 'XP',
  'level.progress': '{into} / {span} XP to level {next}',
  'level.max': 'Maximum level reached.',
  'level.maxShort': 'MAX',
  'level.xpOf': '{into} / {span} XP',
  'level.sub':
    'Every encounter you win pays XP. Higher levels raise the odds of better cards and open more of the collection for deck building.',
  'level.nextUnlock': 'Level {level} unlocks {count} more cards.',
  'level.earned': '+{xp} XP this run',
  'level.leveledUp': 'Level up — you are now level {level}.',
  'level.unlockedNow': 'New cards are available in the Deck tab.',
} as const;

export type UiKey = keyof typeof en;

const fr: Record<UiKey, string> = {
  // Shared
  'common.continue': 'Continuer',
  'common.close': 'Fermer',

  // Title screen
  'title.eyebrow': 'Titre provisoire · une descente en deck-building',
  'title.tagline1': 'Votre vaisseau est un deck. La Faille écoute.',
  'title.tagline2': 'Ne répondez pas.',
  'title.engage': 'Démarrer',
  'title.hint': 'Version pré-alpha · inachevée',

  // Top bar / navigation
  'nav.game': 'Jeu',
  'nav.deck': 'Deck',
  'nav.achievements': 'Succès',
  'nav.rules': 'Règles',
  'nav.mainMenu': 'Menu principal',
  'nav.runInProgress': 'Partie en cours',
  'nav.abandonRun': 'Abandonner',
  'nav.abandonConfirm': 'Abandonner la partie ?',
  'nav.yes': 'Oui',
  'nav.no': 'Non',

  // Settings
  'settings.open': 'Paramètres',
  'settings.title': 'Paramètres',
  'settings.language': 'Langue',
  'settings.languageHint': 'S’applique partout, immédiatement.',
  'settings.close': 'Fermer',
  'settings.cancel': 'Annuler',
  'settings.saveData': 'Données de sauvegarde',
  'settings.saveDataHint': 'Votre progression est stockée dans ce navigateur uniquement.',
  'settings.export': 'Exporter',
  'settings.exportHint': 'Téléchargez votre progression au format JSON.',
  'settings.exportDone': 'Sauvegarde exportée.',
  'settings.import': 'Importer',
  'settings.importHint': 'Chargez une progression depuis un fichier exporté.',
  'settings.importConfirm': 'Remplacer votre progression par ce fichier ?',
  'settings.importSummary': '{wins} parties gagnées · {cards} cartes débloquées · {run}',
  'settings.importRunYes': 'partie en cours',
  'settings.importRunNo': 'aucune partie en cours',
  'settings.importApply': 'Remplacer la progression',
  'settings.importDone': 'Progression importée.',
  'settings.importRunDropped':
    'Progression importée. La partie en cours de ce fichier était corrompue, elle a été abandonnée.',
  'settings.importFailed':
    'Ce fichier n’est pas une sauvegarde. Choisissez un fichier exporté depuis cet écran.',
  'settings.reset': 'Réinitialiser',
  'settings.resetHint':
    'Effacez toute la progression et repartez de zéro. Votre langue est conservée.',
  'settings.resetConfirm': 'Effacer toute la progression ? Cette action est irréversible.',
  'settings.resetApply': 'Tout effacer',
  'settings.resetDone': 'Progression effacée.',

  // Run stats
  'stat.hull': 'Coque',
  'stat.act': 'Acte',
  'stat.salvage': 'Ferraille',
  'stat.deck': 'Deck',
  'stat.systems': 'Systèmes',
  'stat.crew': 'Équipage',

  // Run end
  'run.wonEyebrow': 'Secteur nettoyé',
  'run.wonTitle': 'La Faille se tait',
  'run.wonSub': 'Vous avez vaincu le boss final et terminé la partie.',
  'run.lostEyebrow': 'Signal perdu',
  'run.lostTitle': 'Votre vaisseau a été détruit',
  'run.lostSub': 'La Faille tient son recensement.',
  'run.returnToBridge': 'Retour à la passerelle',

  // Map
  'map.eyebrow': 'Navigation',
  'map.title': 'Carte stellaire — Acte {act}',
  'map.sub': 'Tracez une route. Tous les chemins mènent au boss.',

  // Map legend
  'legend.battle': 'Combat',
  'legend.battle.hint': 'Un contact hostile',
  'legend.elite': 'Élite',
  'legend.elite.hint': 'Combat plus dur, meilleure récompense',
  'legend.signal': 'Signal',
  'legend.signal.hint': 'Une rencontre inconnue',
  'legend.repair': 'Réparation',
  'legend.repair.hint': 'Réparer la coque',
  'legend.trade': 'Négoce',
  'legend.trade.hint': 'Dépenser de la ferraille',
  'legend.cache': 'Cache',
  'legend.cache.hint': 'Butin gratuit',
  'legend.garage': 'Garage',
  'legend.garage.hint': 'Améliorer une carte pour cette partie',
  'legend.boss': 'Boss',
  'legend.boss.hint': 'Garde la sortie',

  // Card type labels
  'card.type.weapon': 'Arme',
  'card.type.maneuver': 'Manœuvre',
  'card.type.shipSystem': 'Système',

  // Upgrade preview (right-click a card)
  'upgrade.title': 'Progression d’amélioration',
  'upgrade.tierBase': 'Base',
  'upgrade.current': 'Actuel',
  'upgrade.next': 'Suivant',
  'upgrade.maxed': 'Entièrement améliorée — plus aucun palier.',
  'upgrade.hint': 'Clic droit sur une carte pour voir sa progression d’amélioration.',

  // Card rarity
  'card.rarity.common': 'Commune',
  'card.rarity.rare': 'Rare',
  'card.rarity.epic': 'Épique',
  'card.rarity.legendary': 'Légendaire',

  // Card effect fragments
  'effect.deal': 'Infliger',
  'effect.damage': 'dégâts',
  'effect.gain': 'Gagner',
  'effect.shields': 'boucliers',
  'effect.repair': 'Réparer',
  'effect.hull': 'de coque',
  'effect.power': 'énergie',
  'effect.thisTurn': 'ce tour-ci',
  'effect.weaken': 'Affaiblir',
  'effect.for': 'pendant',
  'effect.turn': 'tour',
  'effect.turns': 'tours',
  'effect.draw': 'Piocher',
  'effect.card': 'carte',
  'effect.cards': 'cartes',
  'effect.apply': 'Appliquer',
  'effect.corrosion': 'Corrosion',
  'effect.breach': 'Brèche',
  'effect.perAttack': 'par attaque ce combat',
  'effect.perShield': 'à chaque gain de boucliers ce combat',
  'effect.double': 'Doublez votre',
  'effect.nextAttack': 'prochaine attaque',
  'effect.nextShield': 'prochain gain de boucliers',
  'effect.nextRepair': 'prochaine réparation',
  // Rules keywords — label printed on the card, desc shown on right-click
  'keyword.exhaust': 'Épuisement',
  'keyword.exhaust.desc':
    'Quand vous jouez cette carte, elle quitte le combat au lieu d’aller dans votre défausse : vous ne pouvez plus la piocher pendant ce combat. Elle revient dans votre deck au combat suivant.',

  'keyword.corrosion': 'Corrosion',
  'keyword.corrosion.desc':
    'Dégâts sur la durée. À la fin de votre tour, l’ennemi perd autant de coque que sa Corrosion, puis la Corrosion baisse de 1. En appliquer davantage s’additionne : elle rapporte donc le plus quand elle est appliquée tôt.',
  'keyword.breach': 'Brèche',
  'keyword.breach.desc':
    'Tant qu’il est en Brèche, l’ennemi subit 50 % de dégâts en plus de chaque attaque. Cela dure le nombre de tours indiqué : idéal pour ouvrir un gros tour.',
  'keyword.multihit': 'Coups multiples',
  'keyword.multihit.desc':
    'Cette attaque touche en plusieurs coups distincts. Les boucliers ennemis absorbent sur chaque coup séparément — elle est donc plus faible contre les boucliers, mais chaque bonus par attaque, comme le Calibrage, compte sur chaque coup.',
  'keyword.weaken': 'Affaiblissement',
  'keyword.weaken.desc':
    'L’ennemi inflige d’autant moins de dégâts avec ses attaques, pendant le nombre de tours indiqué. En appliquer davantage s’additionne.',
  'keyword.calibration': 'Calibrage',
  'keyword.calibration.desc':
    'Chacune de vos attaques inflige autant de dégâts supplémentaires pour le reste du combat. S’applique à chaque coup d’une attaque à coups multiples.',
  'keyword.deflector': 'Réglage des déflecteurs',
  'keyword.deflector.desc':
    'Chaque fois que vous gagnez des boucliers pour le reste du combat, vous en gagnez autant en plus.',
  'keyword.charge': 'Charge',
  'keyword.charge.desc':
    'Votre prochain effet du type correspondant est doublé, puis la charge est consommée. Une charge s’utilise une fois par carte, pas une fois par coup d’une attaque à coups multiples.',
  'keyword.evasion': 'Esquive',
  'keyword.evasion.desc':
    'Les premiers dégâts qui atteindraient votre coque ce combat sont annulés. Une attaque entièrement absorbée par les boucliers ne la consomme pas, et elle se réarme à chaque combat.',

  // Battle screen
  'battle.hostileContact': 'Contact hostile',
  'battle.yourShip': 'Votre vaisseau',
  'battle.incomingAttack': 'Attaque entrante',
  'battle.bracing': 'En garde',
  'battle.shields': 'Boucliers',
  'battle.reactorPower': 'Énergie du réacteur {current}/{max}',
  'battle.powerAria': 'Énergie {current} sur {max}',
  'battle.draw': 'Pioche',
  'battle.discard': 'Défausse',
  'battle.turn': 'Tour',
  'battle.endTurn': 'Finir le tour',
  'battle.yourHand': 'Votre main',
  'battle.dropHint': 'Faites glisser une carte ici pour la jouer',
  'battle.contactNeutralized': 'Contact neutralisé',
  'battle.victory': 'Victoire',
  'battle.hullBreach': 'Brèche dans la coque',
  'battle.shipLost': 'Vaisseau perdu',

  // Combat statuses — chip label, the line when applied, and the damage tick
  'status.weaken': 'Affaibli',
  'status.weaken.applied': 'Ennemi affaibli de {amount}.',
  'status.corrosion': 'Corrosion',
  'status.corrosion.applied': '{amount} Corrosion appliquée.',
  'status.corrosion.tick': 'La corrosion ronge {amount} de coque.',
  'status.breach': 'Brèche',
  'status.breach.applied': 'Coque percée — l’ennemi subit des dégâts accrus.',
  'status.calibration': 'Calibrage',
  'status.calibration.applied': 'Artillerie calibrée : +{amount} dégâts par attaque.',
  'status.deflector': 'Déflecteurs',
  'status.deflector.applied': 'Déflecteurs réglés : +{amount} à chaque gain de boucliers.',
  'status.chargeDamage': 'Chargé',
  'status.chargeDamage.applied': 'Armes chargées — votre prochaine attaque est doublée.',
  'status.chargeShield': 'Paré',
  'status.chargeShield.applied':
    'Condensateurs parés — votre prochain gain de boucliers est doublé.',
  'status.evasion': 'Esquive',
  'status.evasion.applied':
    'Manœuvre d’esquive active — les premiers dégâts qui passent sont annulés.',
  'status.evasion.tick': 'Attaque esquivée — {amount} dégâts annulés.',
  'status.chargeHeal': 'Amorcé',
  'status.chargeHeal.applied':
    'Baie de réparation amorcée — votre prochaine réparation est doublée.',

  // Combat log
  'battlelog.title': 'Journal de combat',
  'log.turn': 'Tour {turn}',
  'log.contact': 'Contact : {name} ({hull} de coque).',
  'log.notEnoughPower': 'Énergie du réacteur insuffisante pour jouer {name}.',
  'log.played': '{name} jouée.',
  'log.damage': '{name} inflige {amount} dégâts{suffix}.',
  'log.absorbedEnemy': ' ({absorbed} absorbés par les boucliers ennemis)',
  'log.absorbedSelf': ' ({absorbed} absorbés par les boucliers)',
  'log.shield': 'Boucliers renforcés de {amount}.',
  'log.heal': 'Coque réparée de {amount}.',
  'log.power': 'Réacteur surchargé (+{amount} énergie).',
  'log.drawOne': '{amount} carte piochée.',
  'log.drawMany': '{amount} cartes piochées.',
  'log.reshuffle': 'Défausse remélangée dans la pioche.',
  'log.enemyAttack': '{name} attaque pour {amount} dégâts{suffix}.',
  'log.enemyShield': '{name} lève ses boucliers (+{amount}).',
  'log.enemyDestroyed': '{name} détruit !',

  // Start screen
  'start.readyRoom': 'Salle de préparation',
  'start.title': 'Lancer une partie',
  'start.sub':
    'Votre vaisseau emporte un deck de {size} cartes dans la Faille. Composez-le dans l’onglet Deck.',
  'start.launch': 'Lancer une nouvelle partie',
  'start.editDeck': 'Modifier le deck',
  'start.warn':
    'Votre deck doit compter {size} cartes ({have}/{size}). Modifiez-le dans l’onglet Deck.',

  // Deck screen
  'deck.loadout': 'Équipement',
  'deck.title': 'Votre deck',
  'deck.sub':
    'Choisissez les {size} cartes de départ. Cliquez sur une carte pour l’ajouter ou la retirer.',
  'deck.changesApply': ' Les changements s’appliquent à votre prochaine partie.',
  'deck.deck': 'Deck',
  'deck.reset': 'Réinitialiser',
  'deck.empty': 'Vide — ajoutez des cartes depuis votre collection ci-dessous.',
  'deck.collection': 'Collection ({count})',

  // Achievements screen
  'ach.eyebrow': 'Journal',
  'ach.title': 'Succès',
  'ach.sub': 'L’équipage rencontré, les niveaux atteints, les fins découvertes.',
  'ach.runsStarted': 'Parties commencées',
  'ach.runsWon': 'Parties gagnées',
  'ach.runsLost': 'Parties perdues',
  'ach.elitesDowned': 'Élites abattues',
  'ach.bossesDowned': 'Boss abattus',
  'ach.milestones': 'Progression',
  'ach.crewCodex': 'Codex d’équipage',
  'ach.endings': 'Fins',
  'ach.unknownDrifter': 'Vagabond inconnu',
  'ach.unknownBio': 'Quelque part parmi les épaves. Recrutez-le pour en savoir plus.',
  'ach.metTimes': '{role} · rencontré {count}×',
  'ach.recruitAgain': 'Recrutez-le à nouveau pour en entendre plus…',
  'ach.lockedEnding': 'Fin verrouillée',
  'ach.endingReplay': '{subtitle} · rejouer',

  // Event screen
  'event.eyebrow': 'Anomalie',
  'event.outcome.hullLoss': '−{amount} coque',
  'event.outcome.hullGain': '+{amount} coque',
  'event.outcome.salvage': '+{amount} ferraille',
  'event.outcome.card': '+ {name} (dans le deck)',
  'event.outcome.nothing': 'Aucun effet',

  // Crew screens
  'crew.distressSignal': 'Signal de détresse',
  'crew.comms': 'Comms',
  'crew.grantsPassive': 'À bord',
  'crew.roster': 'Équipage à bord',
  'crew.rosterEmpty': 'Aucun équipier à bord. Vous les rencontrez aux nœuds de signal.',
  'crew.full': 'Votre bord est complet ({count}/{cap}). Choisissez qui se retire.',
  'crew.replaceWith': 'Remplacer',
  'crew.standDown': '{name} se retire',
  'crew.welcomeAboard': 'Bienvenue à bord',
  'crew.leaveThem': 'Les laisser',

  // Garage screen
  'garage.eyebrow': 'Atelier de refonte',
  'garage.title': 'Améliorer une carte',
  'garage.sub': 'Choisissez une carte à améliorer. Cette refonte ne dure que pour cette partie.',
  'garage.leave': 'Partir',
  'garage.maxed': 'Toutes vos cartes sont au maximum.',
  'garage.alreadyMax': 'Déjà au maximum',

  // Rest screen
  'rest.eyebrow': 'Baie de réparation',
  'rest.title': 'Systèmes restaurés',
  'rest.hullPatchedTo': 'Coque réparée à',

  // Card reward (after a combat win)
  'reward.cardEyebrow': 'Butin de combat',
  'reward.cardTitle': 'Ajoutez une carte à votre deck',
  'reward.cardSub': 'Choisissez une carte à garder, ou passez.',
  'reward.skip': 'Passer',
  'reward.viewDeck': 'Voir le deck ({count})',

  // Reward screen (boss: choose one)
  'reward.eyebrow': 'Récompense de boss',
  'reward.title': 'Choisissez une récompense',
  'reward.sub':
    'Un système de vaisseau pour cette partie, ou une amélioration de carte définitive.',
  'reward.systemLane': 'Installer un système de vaisseau',
  'reward.systemLaneHint': 'Monté pour le reste de cette partie.',
  'reward.upgradeLane': 'Améliorer une carte définitivement',
  'reward.upgradeLaneHint':
    'Définitif — cet emplacement de deck reste amélioré dans toutes vos prochaines parties.',
  'reward.noUpgrades': 'Aucune carte de deck de départ ne peut être améliorée davantage.',
  'reward.continue': 'Continuer sans récompense',

  // Card list modal (run deck + combat piles)
  'deckView.title': 'Deck actuel',
  'cardList.count': '{count} cartes',
  'cardList.empty': 'Vide',
  'run.viewDeckHint': 'Voir le deck actuel',

  // Combat piles
  'pile.draw': 'Pioche',
  'pile.discard': 'Défausse',
  'pile.exhaust': 'Épuisées',
  'pile.drawNote': 'Triée — l’ordre de pioche réel reste caché.',
  'pile.exhaustNote': 'Hors jeu pour ce combat. De retour au combat suivant.',
  'log.exhausted': '{name} épuisée.',

  // Shop screen
  'shop.eyebrow': 'Négociant en débris',
  'shop.title': 'Échanger des pièces',
  'shop.bought': 'Acheté',
  'shop.buy': 'Acheter · {price}',
  'shop.leave': 'Partir',

  // Treasure screen
  'treasure.eyebrow': 'Cache abandonnée',
  'treasure.title': 'Récupéré dans l’épave',
  'treasure.salvaged': 'Récupéré',
  'treasure.scrapAndSchematic': 'de ferraille et un schéma :',
  'treasure.scrapOnly': 'de ferraille.',

  // Ending scene
  'ending.eyebrow': 'Fin',
  'ending.label': 'Fin : {title}',
  'ending.next': 'Suivant',

  // Rules screen
  'rules.eyebrow': 'Référence',
  'rules.title': 'Règles',
  'rules.sub':
    'Le déroulement d’une partie, ce que fait chaque mot-clé, et ce que vous pouvez y trouver.',

  'rules.run': 'La partie',
  'rules.run.acts':
    'Une partie compte 3 actes. Chaque acte est une nouvelle carte stellaire se terminant par un boss ; le vaincre restaure toute votre coque et génère la carte suivante.',
  'rules.run.deck':
    'Les cartes ramassées n’appartiennent qu’à cette partie. Ce que vous débloquez durablement, c’est le pool servant à composer votre deck de départ, dans l’onglet Deck.',
  'rules.run.death':
    'À 0 de coque, la partie s’arrête. La coque est conservée entre les combats d’un acte : seuls les réparations et les baies de réparation la remontent.',

  'rules.combat': 'Un combat',
  'rules.combat.power':
    'Chaque tour, vous disposez de {power} énergie de réacteur et repiochez jusqu’à {draw} cartes.',
  'rules.combat.shields':
    'Les boucliers absorbent les dégâts, puis retombent à 0 au début de votre tour : ils servent au coup que vous voyez venir, pas à épargner.',
  'rules.combat.intent':
    'L’ennemi annonce son prochain coup avant que vous jouiez : chaque tour est une décision prise en pleine connaissance de cause.',
  'rules.combat.discard':
    'Ce qu’il reste en main est défaussé en fin de tour. Votre défausse est remélangée quand la pioche est vide.',

  'rules.keywords': 'Mots-clés',
  'rules.keywords.sub': 'Clic droit sur un mot-clé, n’importe où dans le jeu, pour revoir ceci.',

  'rules.rarity': 'Rareté',
  'rules.rarity.sub':
    'Plus la rareté est élevée, plus la carte est forte à coût égal — et plus elle est rare. Toute carte peut apparaître dès votre première partie ; c’est votre niveau de commandant qui augmente les chances. Le compte ci-dessous indique ce que vous pouvez utiliser pour composer vos decks.',
  'rules.rarity.count': '{count} sur {total} dans votre collection',

  'rules.upgrades': 'Améliorations',
  'rules.upgrades.tiers':
    'Chaque carte a deux améliorations, + et ++. Clic droit sur une carte pour voir sa progression.',
  'rules.upgrades.step':
    'Chaque carte définit sa propre amélioration : une carte bon marché et une arme lourde ne gagnent pas autant l’une que l’autre. L’aperçu d’une carte montre chaque palier.',
  'rules.upgrades.where':
    'Un Garage améliore une carte pour la partie en cours. Vaincre le boss d’un acte permet à la place d’améliorer définitivement une carte du deck de départ.',

  'rules.crew': 'Équipage',
  'rules.crew.passive':
    'Un équipier confère un passif pour le reste de la partie et n’ajoute rien à votre deck. Jusqu’à {cap} à bord ; une fois complet, vous choisissez qui se retire.',
  'rules.crew.offer':
    'Les nœuds de signal ont {chance} % de chances de proposer un équipier tant qu’il en reste à recruter.',

  'rules.drops': 'Ce que vous trouvez',
  'rules.drops.sub':
    'Ce sont vos chances réelles à votre niveau actuel, et elles augmentent à chaque niveau gagné.',
  'rules.drops.source': 'Source',
  'rules.drops.reward': 'Récompense',
  'rules.drops.designed': 'Théorique',
  'rules.drops.locked': 'aucune débloquée',
  'rules.drops.perCard': 'Les chances s’entendent par carte proposée.',

  'rules.drop.combat': 'Combat gagné',
  'rules.drop.combat.reward': '1 carte au choix sur 3 · {salvage}',
  'rules.drop.elite': 'Élite vaincue',
  'rules.drop.elite.reward': '1 carte au choix sur 3 · {salvage}',
  'rules.drop.shop': 'Marchand',
  'rules.drop.shop.reward': '3 cartes en vente · au prix de {price}',
  'rules.drop.cache': 'Épave à piller',
  'rules.drop.cache.reward': '1 carte offerte · {salvage}',

  'rules.other': 'Autres nœuds',
  'rules.other.boss': 'Boss vaincu',
  'rules.other.boss.desc':
    'Ni carte ni ferraille. Choisissez 1 système de vaisseau sur 3, ou améliorez définitivement une carte du deck de départ. Votre coque est entièrement restaurée pour l’acte suivant.',
  'rules.other.rest': 'Baie de réparation',
  'rules.other.rest.desc': 'Restaure {percent} % de votre coque maximale.',
  'rules.other.garage': 'Garage',
  'rules.other.garage.desc':
    'Améliorez une carte de votre deck, gratuitement, pour le reste de la partie.',
  'rules.other.event': 'Signal',
  'rules.other.event.desc':
    'Une proposition d’équipier, ou un choix avec des conséquences — ferraille, coque ou carte.',

  'rules.map': 'La carte stellaire',
  'rules.map.sub': 'Fréquence approximative de chaque type de nœud, passé les premières couches.',
  'rules.map.note':
    'La première couche est toujours un combat, les élites n’apparaissent jamais dans les deux premières, et une baie de réparation ou un garage ne suit jamais un autre.',

  'rules.salvageByAct': '{act1} / {act2} / {act3} de ferraille selon l’acte',
  'rules.priceFormula': '{base} + {perCost} par énergie, plus la rareté',

  // Commander level (XP)
  'level.short': 'NV {level}',
  'level.title': 'Niveau de commandant',
  'level.label': 'Niveau',
  'level.xp': 'XP',
  'level.progress': '{into} / {span} XP jusqu’au niveau {next}',
  'level.max': 'Niveau maximum atteint.',
  'level.maxShort': 'MAX',
  'level.xpOf': '{into} / {span} XP',
  'level.sub':
    'Chaque rencontre gagnée rapporte de l’XP. Les niveaux supérieurs augmentent les chances d’obtenir de meilleures cartes et ouvrent davantage de la collection pour composer votre deck.',
  'level.nextUnlock': 'Le niveau {level} débloque {count} cartes de plus.',
  'level.earned': '+{xp} XP cette partie',
  'level.leveledUp': 'Niveau supérieur — vous êtes désormais niveau {level}.',
  'level.unlockedNow': 'De nouvelles cartes sont disponibles dans l’onglet Deck.',
};

export const uiStrings: Record<Language, Record<UiKey, string>> = { en, fr };
