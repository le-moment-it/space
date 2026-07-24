import { cardDefinitions } from '../data/cards';
import { crewDefinitions } from '../data/crew';
import { endingDefinitions } from '../data/endings';
import { bossEnemyByAct, combatEnemiesByAct, eliteEnemiesByAct } from '../data/enemies';
import { eventDefinitions } from '../data/events';
import { milestoneDefinitions } from '../data/milestones';
import { shipSystemDefinitions } from '../data/shipSystems';
import type { Language } from './types';

/**
 * French overrides for game content, keyed by the content's id. English is not
 * duplicated here — it is read straight from the data files (the source of truth),
 * so a missing French key simply falls back to English. Enemy ids may be scaled
 * (e.g. `raider-skiff-act2`); `baseEnemyId` strips the suffix before lookup.
 */

const cardNames: Record<string, string> = {
  'kinetic-cannon': 'Canon cinétique',
  'flak-burst': 'Salve de flak',
  'heavy-railgun': 'Railgun lourd',
  'plasma-lance': 'Lance à plasma',
  'auto-turret': 'Tourelle automatique',
  'ion-torpedo': 'Torpille ionique',
  'pulse-blaster': 'Fuseur à impulsion',
  'micro-missiles': 'Micro-missiles',
  'twin-autocannons': 'Canons automatiques jumelés',
  'railcannon-mk2': 'Canon rail Mk2',
  'graviton-beam': 'Rayon à gravitons',
  'siege-cannon': 'Canon de siège',
  'antimatter-charge': 'Charge d’antimatière',
  'shrapnel-volley': 'Volée de shrapnel',
  'needle-array': 'Batterie d’aiguilles',
  'disruptor-cannon': 'Canon disrupteur',
  'flechette-spread': 'Gerbe de fléchettes',
  'boarding-charge': 'Charge d’abordage',
  'raise-shields': 'Lever les boucliers',
  'emergency-shield-boost': 'Renfort d’urgence des boucliers',
  'hull-patch': 'Rustine de coque',
  'target-scanners': 'Scanners de visée',
  'brace-for-impact': 'Parer au choc',
  'nanite-repair': 'Réparation par nanites',
  'sensor-jam': 'Brouillage de capteurs',
  'shield-capacitor': 'Condensateur de boucliers',
  'reinforced-plating': 'Blindage renforcé',
  'combat-medic': 'Médecin de combat',
  'emergency-nanites': 'Nanites d’urgence',
  'field-repair': 'Réparation de fortune',
  'jamming-pulse': 'Impulsion de brouillage',
  'disable-targeting': 'Neutraliser le ciblage',
  'recon-scan': 'Scan de reconnaissance',
  'data-uplink': 'Liaison de données',
  'adrenaline-shot': 'Injection d’adrénaline',
  'full-repair-kit': 'Kit de réparation complet',
  'aegis-shield': 'Bouclier Égide',
  'last-stand': 'Dernier rempart',
  'emp-burst': 'Salve IEM',
  'overcharge-reactor': 'Surcharge du réacteur',
  'reactor-surge': 'Surtension du réacteur',
  'fusion-core': 'Cœur à fusion',
  'backup-generator': 'Générateur de secours',
  'overdrive-coils': 'Bobines de surrégime',
  'capacitor-bank': 'Banc de condensateurs',
  'crew-overload-shot': 'Tir de surcharge',
  'crew-suppressing-fire': 'Tir de suppression',
  'crew-triage-protocol': 'Protocole de triage',
  'crew-stimulant-dose': 'Dose de stimulant',
  'crew-jury-rig': 'Bricolage',
  'crew-reroute-power': 'Réacheminer l’énergie',
  'crew-evasive-pattern': 'Manœuvre d’évitement',
  'crew-contraband-cache': 'Cache de contrebande',
  'crew-ghost-signal': 'Signal fantôme',
  'crew-deep-scan': 'Scan profond',
  'crew-stalwart-hymn': 'Hymne inébranlable',
  'crew-penance': 'Pénitence',
};

const enemyNames: Record<string, string> = {
  'scavenger-drone': 'Drone charognard',
  'raider-skiff': 'Esquif pillard',
  'mine-layer': 'Poseur de mines',
  'boarding-pod': 'Capsule d’abordage',
  'sensor-drone': 'Drone-capteur',
  gunship: 'Canonnière',
  interceptor: 'Intercepteur',
  'salvage-hauler': 'Remorqueur de débris',
  'plasma-skiff': 'Esquif à plasma',
  'void-drifter': 'Errant du vide',
  'corsair-cutter': 'Cotre corsaire',
  'void-sentinel': 'Sentinelle du vide',
  'reaper-drone': 'Drone faucheur',
  'void-reaver': 'Ravageur du vide',
  'dreadnought-core': 'Cœur de cuirassé',
  'the-harbinger': 'Le Héraut',
};

const shipSystemNames: Record<string, string> = {
  'reinforced-hull-plating': 'Blindage de coque renforcé',
  'auxiliary-power-core': 'Cœur d’énergie auxiliaire',
  'deflector-array': 'Réseau déflecteur',
  'expanded-cargo-bay': 'Soute agrandie',
  'redundant-systems': 'Systèmes redondants',
  'shield-capacitor-array': 'Réseau de condensateurs de boucliers',
  'overcharged-reactor': 'Réacteur surchargé',
  'nano-repair-matrix': 'Matrice de nano-réparation',
  'rapid-deployment-bay': 'Baie de déploiement rapide',
  'ablative-plating': 'Blindage ablatif',
  'secondary-reactor': 'Réacteur secondaire',
  'point-defense-grid': 'Grille de défense rapprochée',
  'hardened-bulkheads': 'Cloisons renforcées',
  'tertiary-capacitors': 'Condensateurs tertiaires',
  'auxiliary-databanks': 'Banques de données auxiliaires',
  'emergency-cutoff': 'Coupure d’urgence',
  'quantum-buffer': 'Tampon quantique',
  'overclocked-thrusters': 'Propulseurs overclockés',
};

const shipSystemDescriptions: Record<string, string> = {
  'reinforced-hull-plating': '+15 coque max.',
  'auxiliary-power-core': '+1 énergie de réacteur max par tour.',
  'deflector-array': 'Commence chaque tour avec 5 boucliers déjà actifs.',
  'expanded-cargo-bay': 'Pioche 1 carte de plus chaque tour.',
  'redundant-systems': '+10 coque max.',
  'shield-capacitor-array': 'Commence chaque tour avec 8 boucliers déjà actifs.',
  'overcharged-reactor': '+2 énergie de réacteur max par tour.',
  'nano-repair-matrix': '+20 coque max.',
  'rapid-deployment-bay': 'Pioche 2 cartes de plus chaque tour.',
  'ablative-plating': '+12 coque max.',
  'secondary-reactor': '+1 énergie de réacteur max par tour.',
  'point-defense-grid': 'Commence chaque tour avec 3 boucliers déjà actifs.',
  'hardened-bulkheads': '+8 coque max.',
  'tertiary-capacitors': 'Commence chaque tour avec 6 boucliers déjà actifs.',
  'auxiliary-databanks': 'Pioche 1 carte de plus chaque tour.',
  'emergency-cutoff': '+18 coque max.',
  'quantum-buffer': '+2 énergie de réacteur max par tour.',
  'overclocked-thrusters': 'Pioche 1 carte de plus chaque tour.',
};

const milestoneDescriptions: Record<string, string> = {
  'defeat-a-boss': 'Vaincre un boss de secteur une fois.',
  'defeat-5-elites': 'Vaincre 5 hostiles d’élite (toutes parties confondues).',
  'complete-10-runs': 'Terminer 10 parties, gagnées ou perdues.',
  'reach-act-2': 'Atteindre l’Acte 2.',
  'reach-act-3': 'Atteindre l’Acte 3.',
  'defeat-3-bosses': 'Vaincre 3 boss d’acte (toutes parties confondues).',
  'defeat-15-elites': 'Vaincre 15 hostiles d’élite (toutes parties confondues).',
  'complete-25-runs': 'Terminer 25 parties, gagnées ou perdues.',
};

interface FrEvent {
  title: string;
  prompt: string;
  choices: string[];
}

const events: Record<string, FrEvent> = {
  'derelict-signal': {
    title: 'Signal d’épave',
    prompt:
      'Les capteurs détectent un faible signal de détresse émanant d’une carcasse à la dérive tout près.',
    choices: ['S’arrimer et piller l’épave', 'Ne pas y toucher'],
  },
  'adrift-cargo-pod': {
    title: 'Capsule de fret à la dérive',
    prompt: 'Une capsule de fret sans équipage passe en tournoyant, sa balise clignotant encore.',
    choices: ['La remorquer', 'La démonter pour les pièces'],
  },
  'malfunctioning-relay-beacon': {
    title: 'Balise-relais défaillante',
    prompt: 'Une balise-relais abandonnée vibre d’une énergie instable. On pourrait la réutiliser.',
    choices: ['Détourner l’énergie du réacteur pour la stabiliser', 'La surcharger et la détruire'],
  },
};

interface FrEnding {
  title: string;
  subtitle: string;
  scene: string[];
}

const endings: Record<string, FrEnding> = {
  'first-contact': {
    title: 'Premier contact',
    subtitle: 'Vaincre le Héraut.',
    scene: [
      'Le Héraut se désagrège autour de vous — moins détruit qu’interrompu, comme une phrase coupée en plein mot.',
      'Pour la première fois de mémoire d’homme, la Faille est silencieuse. Plus de tonalités. Plus de recensement. Rien que l’obscurité ordinaire et le tic-tac de votre coque qui refroidit.',
      'Votre équipage ne dit rien. Ils ont tous déjà entendu ce silence — sur les enregistrements, dans leur sommeil. Ils savent qu’il ne signifie pas disparu.',
      'Quelque part, loin au-delà des épaves, quelque chose recommence — très doucement — à compter.',
    ],
  },
  'into-the-silence': {
    title: 'Dans le silence',
    subtitle: 'Vaincre la Faille avec tout l’équipage retrouvé.',
    scene: [
      'Vous avez tout entendu à présent — chaque journal, chaque tonalité à moitié décodée, chaque nom que le recensement a pris. Whisper avait raison : le signal a une faille. Un silence dans lequel il ne peut pas écouter.',
      'Frère Ancre trace le dernier cap de sa vie. Sable le pilote sans une seule ligne droite. Vous menez le vaisseau là où le Héraut n’a jamais su regarder.',
      'Le recensement bafouille. Cherche. Ne trouve rien là où votre vaisseau devrait être — et, ne sachant compter ce qu’il ne peut entendre, s’arrête.',
      'La Faille reste silencieuse, cette fois. Votre équipage, enfin, dort sans rêver en trois tonalités. Vous n’avez pas fait taire l’obscurité. Vous lui avez appris, enfin, à s’en aller.',
    ],
  },
};

interface FrCrew {
  name?: string;
  role: string;
  bio: string;
  recruitPrompt: string;
  dialogues: string[];
}

const crew: Record<string, FrCrew> = {
  'jax-korrin': {
    role: 'Sergent d’artillerie',
    bio: 'Ancien sergent d’artillerie de flotte du CSV Meridian, le vaisseau amiral perdu à la Faille de Vellborn. S’engage avec quiconque est encore prêt à riposter.',
    recruitPrompt:
      'Une silhouette armée vous hèle depuis un chasseur estropié : « Réacteur mort, canons vivants. Vous avez de la place pour un de plus ? »',
    dialogues: [
      'Je m’appelle Korrin. Je tire sur des choses. Voilà, présentations faites.',
      'Vous vous battez proprement. Les servants du Meridian aussi. Ça ne les a pas sauvés à la Faille.',
      'Vous voulez savoir pour la Faille ? Soit. Quelque chose attendait dans le noir. Pas des pillards. La flotte a tout tiré et n’a rien touché.',
      'Je continue de revenir ici parce qu’il faut bien quelqu’un la main sur la détente quand cette chose refera surface. Content que ce soit sur votre pont que je me tienne.',
    ],
  },
  'dr-elara-voss': {
    role: 'Médecin de bord',
    bio: 'Chirurgienne des urgences du vaisseau-hôpital Lumina — radiée du registre pour avoir refusé d’abandonner ses patients lors de l’évacuation de la station Vell.',
    recruitPrompt:
      'Une navette médicale dérive en puissance minimale. La femme à l’intérieur brandit une trousse de chirurgie : « Vous aurez besoin de moi. Tout le monde finit par en avoir besoin, ici. »',
    dialogues: [
      'Je rapièce les coques et les gens. D’expérience, les coques se plaignent moins.',
      'L’évacuation de la station Vell fut un chaos. Le registre a qualifié mes choix d’insubordination. Les quarante personnes que j’ai sorties les appellent autrement.',
      'Les rescapés de la Faille que j’ai soignés disaient tous le même mot avant de s’endormir : « à l’écoute ». Elle était à leur écoute. Je ne sais toujours pas ce que ça veut dire.',
      'J’ai décidé quelque chose, capitaine. Si nous croisons la chose qui a vidé ces capsules de sauvetage, je veux être là. Certaines plaies ne se referment qu’à la source.',
    ],
  },
  torque: {
    role: 'Ingénieur de récupération',
    bio: 'Automate minier remis à neuf ayant atteint la conscience de soi entre son 400e et son 401e correctif de firmware. Profondément attaché à ce bras précis de la galaxie.',
    recruitPrompt:
      'Un robot de maintenance trapu s’aimante à votre sas et demande l’asile, invoquant des « divergences créatives » avec son ancien équipage, tous morts.',
    dialogues: [
      'DÉSIGNATION D’UNITÉ : TORQUE. ÉQUIPAGE PRÉCÉDENT : NON FONCTIONNEL. CAUSE : PAS TORQUE. Clarifier cela tôt évite les malaises.',
      'Torque a réparé 11 204 brèches de coque. Les motifs de brèche de ce secteur sont nouveaux. Quelque chose découpe, ne percute pas. Torque trouve cela professionnellement intéressant et existentiellement alarmant.',
      'L’équipage précédent de Torque a trouvé un signal enfoui dans les débris de la Faille. Ils l’ont écouté six jours. Le septième, ils ont ouvert les sas. Torque ne traite pas l’audio. Torque est le seul témoin.',
      'Question : si une machine choisit son équipage, est-ce de la loyauté ou du firmware ? Torque a décidé que cela n’a pas d’importance. Torque reste.',
    ],
  },
  'sable-nyx': {
    role: 'Pilote & contrebandière',
    bio: 'A fait passer de la contrebande par la Faille de Vellborn pendant une décennie, avant que les routes ne se taisent. Connaît chaque voie obscure du secteur, et exactement lesquelles ne plus jamais emprunter.',
    recruitPrompt:
      'Un vaisseau-coureur élancé aligne son vecteur sur le vôtre. « Mes routes ont disparu et mes clients sont morts. Vous avez l’air d’avoir besoin d’une vraie pilote — et je ne hante pas au rabais. »',
    dialogues: [
      'Règle un sur mes anciennes routes : ne vole pas en ligne droite. Règle deux : ne demande pas ce qui est arrivé au dernier pilote. Tu t’en sortiras.',
      'Je courais les voies de la Faille les yeux bandés. Puis un jour chaque balise de la route s’est mise à répéter les trois mêmes tonalités. J’ai fait demi-tour. Pas mes concurrents.',
      'Tu l’entends aussi, pas vrai ? Sous le bruit des moteurs, quand le pont se tait. Trois tonalités. J’ai commencé à en rêver.',
      'J’ai semé des patrouilles, des pirates et deux ex-maris. Je ne peux pas semer cette chose. Alors soit — pour une fois dans ma vie, je fonce *vers* les ennuis. Ne me faites pas le regretter, capitaine.',
    ],
  },
  whisper: {
    role: 'Analyste des transmissions',
    bio: 'Officier du renseignement des transmissions ayant passé trois ans seul sur un poste d’écoute au bord de la Faille. Officiellement démobilisé. Officieusement, toujours à l’écoute.',
    recruitPrompt:
      'Une bouée d’écoute se déplie en un habitat compact. Son unique occupant parle avant que vous ne le hêliez : « Je sais pourquoi vous êtes ici. Emmenez-moi et je vous le dirai. »',
    dialogues: [
      'Trois ans à écouter le vide t’apprennent deux choses. Un : il n’est jamais vide. Deux : ne réponds pas.',
      'Le signal de la Faille n’est pas un appel de détresse. C’est un recensement. Il compte chaque vaisseau qui l’entend. Nous sommes numérotés, vous et moi.',
      'J’en ai décodé plus que je ne l’ai rapporté. Ce n’est pas un langage. C’est un appétit, structuré. Le Héraut n’est pas son nom — c’est sa fonction.',
      'Voici ce que je n’ai jamais dit à la flotte : le signal a une faille. Un silence dans lequel il ne peut pas écouter. Accordez-y votre réacteur, et nous pourrions nous approcher assez pour compter.',
    ],
  },
  'brother-anchor': {
    name: 'Frère Ancre',
    role: 'Navigateur du vide',
    bio: 'Dernier navigateur de l’Ordre de l’Étoile Fixe, un ordre monastique de cartographes dont la flotte s’est évanouie à la Faille de Vellborn. Navigue d’après des champs d’étoiles mémorisés plus anciens que les cartes coloniales.',
    recruitPrompt:
      'Un antique vaisseau-cartographe tient la position devant vous, son unique occupant en robe et serein : « Chaque cap de ce secteur ploie vers le même lieu obscur, capitaine. Vous voudrez un navigateur qui y est déjà allé. »',
    dialogues: [
      'L’Ordre a cartographié les étoiles durant neuf générations. Je suis ce qu’il en reste. Je cartographie encore. L’habitude est une forme de foi.',
      'Notre flotte a répondu à un appel de détresse à la Faille. Cent sept vaisseaux y sont entrés. Mon vaisseau-cartographe était encalminé dans les bas-fonds — l’arithmétique m’a épargné, rien de plus noble.',
      'Les étoiles autour de la Faille sont fausses, capitaine. Pas déplacées — *réarrangées*. Quelque chose là-dehors corrige le ciel, et le recensement des vaisseaux raccourcit chaque année.',
      'J’ai achevé ma dernière carte. Elle s’arrête là où le Héraut attend. Quand vous serez prêt à y cingler, je poserai le cap — et cette fois je ne serai pas encalminé.',
    ],
  },
};

// --- lookup helpers ---------------------------------------------------------

const baseEnemyId = (id: string): string => id.replace(/-act\d+$/, '');

const enemyNameById: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const all = [
    ...Object.values(combatEnemiesByAct).flat(),
    ...Object.values(eliteEnemiesByAct).flat(),
    ...Object.values(bossEnemyByAct),
  ];
  for (const enemy of all) map[enemy.id] = enemy.name;
  return map;
})();

export interface ContentTranslator {
  cardName: (id: string) => string;
  enemyName: (id: string) => string;
  shipSystemName: (id: string) => string;
  shipSystemDescription: (id: string) => string;
  milestoneDescription: (id: string) => string;
  crewName: (id: string) => string;
  crewRole: (id: string) => string;
  crewBio: (id: string) => string;
  crewRecruitPrompt: (id: string) => string;
  crewDialogue: (id: string, index: number) => string;
  eventTitle: (id: string) => string;
  eventPrompt: (id: string) => string;
  eventChoice: (id: string, index: number) => string;
  endingTitle: (id: string) => string;
  endingSubtitle: (id: string) => string;
  endingScene: (id: string) => string[];
}

export function makeContentTranslator(lang: Language): ContentTranslator {
  const en = lang === 'en';
  return {
    cardName: (id) => (en ? undefined : cardNames[id]) ?? cardDefinitions[id]?.name ?? id,
    enemyName: (id) => (en ? undefined : enemyNames[baseEnemyId(id)]) ?? enemyNameById[id] ?? id,
    shipSystemName: (id) =>
      (en ? undefined : shipSystemNames[id]) ?? shipSystemDefinitions[id]?.name ?? id,
    shipSystemDescription: (id) =>
      (en ? undefined : shipSystemDescriptions[id]) ?? shipSystemDefinitions[id]?.description ?? '',
    milestoneDescription: (id) => {
      const def = milestoneDefinitions.find((m) => m.id === id);
      return (en ? undefined : milestoneDescriptions[id]) ?? def?.description ?? id;
    },
    crewName: (id) => (en ? undefined : crew[id]?.name) ?? crewDefinitions[id]?.name ?? id,
    crewRole: (id) => (en ? undefined : crew[id]?.role) ?? crewDefinitions[id]?.role ?? '',
    crewBio: (id) => (en ? undefined : crew[id]?.bio) ?? crewDefinitions[id]?.bio ?? '',
    crewRecruitPrompt: (id) =>
      (en ? undefined : crew[id]?.recruitPrompt) ?? crewDefinitions[id]?.recruitPrompt ?? '',
    crewDialogue: (id, index) =>
      (en ? undefined : crew[id]?.dialogues[index]) ?? crewDefinitions[id]?.dialogues[index] ?? '',
    eventTitle: (id) => {
      const def = eventDefinitions.find((e) => e.id === id);
      return (en ? undefined : events[id]?.title) ?? def?.title ?? id;
    },
    eventPrompt: (id) => {
      const def = eventDefinitions.find((e) => e.id === id);
      return (en ? undefined : events[id]?.prompt) ?? def?.prompt ?? '';
    },
    eventChoice: (id, index) => {
      const def = eventDefinitions.find((e) => e.id === id);
      return (en ? undefined : events[id]?.choices[index]) ?? def?.choices[index]?.label ?? '';
    },
    endingTitle: (id) => {
      const def = endingDefinitions.find((e) => e.id === id);
      return (en ? undefined : endings[id]?.title) ?? def?.title ?? id;
    },
    endingSubtitle: (id) => {
      const def = endingDefinitions.find((e) => e.id === id);
      return (en ? undefined : endings[id]?.subtitle) ?? def?.subtitle ?? '';
    },
    endingScene: (id) => {
      const def = endingDefinitions.find((e) => e.id === id);
      return (en ? undefined : endings[id]?.scene) ?? def?.scene ?? [];
    },
  };
}
