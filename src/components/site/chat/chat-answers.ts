/**
 * Moteur de réponses de l'assistant SIRA.
 *
 * Il n'y a ici aucune intelligence artificielle : chaque réponse est écrite à
 * l'avance et choisie par mots-clés. Les seules données citées sont les offres
 * et les formations réellement publiées, transmises par le serveur
 * (`buildChatData`). L'assistant ne complète jamais une information manquante :
 * quand il ne sait pas, il le dit et renvoie vers la page ou l'équipe
 * concernée.
 *
 * Les règles de la plateforme rappelées dans les réponses sont celles du
 * cahier des charges : le score est une estimation, rien n'est envoyé sans la
 * validation du candidat, SIRA ne demande jamais de frais pour postuler et
 * l'inscription à une formation se fait chez l'organisme.
 */

import type { ChatData, ChatJob, ChatTraining } from "@/data/site-chat";

export interface ChatLink {
  label: string;
  href: string;
}

export interface ChatAnswer {
  /** Paragraphes de la réponse. */
  text: string[];
  /** Liens proposés sous la réponse. */
  links?: ChatLink[];
  /** Suggestions de question suivantes. */
  chips?: string[];
}

/** Minuscules sans accent ni ponctuation, pour comparer des mots. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mots trop courants pour aider à reconnaître une demande. */
const STOP_WORDS = new Set([
  "les", "des", "une", "un", "le", "la", "de", "du", "en", "au", "aux", "pour", "par", "sur", "avec", "sans",
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa",
  "ses", "que", "qui", "quoi", "est", "sont", "suis", "etre", "avoir", "ai", "as", "a", "quel", "quelle",
  "quels", "quelles", "comment", "pourquoi", "combien", "ou", "et", "dans", "cette", "ce", "ces", "cherche",
  "chercher", "voudrais", "veux", "peux", "peut", "faire", "fais", "svp", "merci", "bonjour", "salut",
]);

function words(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

function contentWords(value: string): string[] {
  return words(value).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

/** Nombre de mots-clés d'une intention présents dans la demande. */
function keywordScore(input: string, keywords: string[]): number {
  const text = ` ${normalize(input)} `;
  let score = 0;
  for (const keyword of keywords) {
    if (text.includes(` ${keyword} `) || text.includes(`${keyword} `) || text.includes(` ${keyword}`)) score += 1;
  }
  return score;
}

// ---------------------------------------------------------------------------
// Recherche dans les offres et les formations publiées
// ---------------------------------------------------------------------------

/**
 * Pertinence d'une offre pour une demande. Le métier pèse plus que la ville,
 * qui pèse plus que le contrat : « développeur à Ouagadougou » doit d'abord
 * proposer un poste de développeur.
 */
function jobMatches(job: ChatJob, tokens: string[]): number {
  const title = normalize(job.title);
  const skills = normalize(job.skills.join(" "));
  const place = normalize(`${job.city} ${job.country}`);
  const kind = normalize(`${job.type} ${job.contract}`);
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 3;
    else if (skills.includes(token)) score += 2;
    else if (place.includes(token)) score += 2;
    else if (kind.includes(token)) score += 1;
  }
  return score;
}

/** Type d'opportunité explicitement demandé, le cas échéant. */
function askedType(input: string): "Stage" | "Alternance" | "Emploi" | null {
  const text = ` ${normalize(input)} `;
  if (text.includes(" stage") || text.includes(" stages")) return "Stage";
  if (text.includes(" alternance") || text.includes(" apprentissage")) return "Alternance";
  if (text.includes(" cdi") || text.includes(" cdd")) return "Emploi";
  return null;
}

function trainingMatches(training: ChatTraining, tokens: string[]): number {
  const haystack = normalize([training.title, training.category, training.access, ...training.skills].join(" "));
  return tokens.filter((t) => haystack.includes(t)).length;
}

function jobLinks(jobs: ChatJob[]): ChatLink[] {
  return jobs.map((job) => ({ label: `${job.title} — ${job.city}`, href: `/offres/${job.slug}` }));
}

function trainingLinks(trainings: ChatTraining[]): ChatLink[] {
  return trainings.map((t) => ({ label: `${t.title} — ${t.access}`, href: `/formations/${t.slug}` }));
}

/** Ville citée dans la demande, parmi celles où des offres sont publiées. */
function citeeCity(input: string, data: ChatData): string | null {
  const text = normalize(input);
  return data.cities.find((city) => text.includes(normalize(city))) ?? null;
}

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

export const STARTER_CHIPS = [
  "Trouver une offre",
  "Comprendre mon score",
  "Voir les formations",
  "Publier une offre",
];

/** Premier message, affiché à l'ouverture de la bulle. */
export function openingAnswer(data: ChatData): ChatAnswer {
  return {
    text: [
      "Bonjour, je suis l'assistant SIRA.",
      `Je réponds à partir de réponses préparées et des ${data.jobCount} offres publiées sur la plateforme : je ne suis pas encore relié à une intelligence artificielle. Pour une demande particulière, l'équipe prend le relais.`,
    ],
    chips: STARTER_CHIPS,
  };
}

function offersAnswer(input: string, data: ChatData): ChatAnswer {
  const tokens = contentWords(input);
  const city = citeeCity(input, data);
  const type = askedType(input);
  // Un type demandé restreint la recherche, sauf s'il ne reste plus rien.
  const pool = type ? data.jobs.filter((job) => job.type === type) : data.jobs;
  const searched = pool.length > 0 ? pool : data.jobs;
  const ranked = searched
    .map((job) => ({ job, score: jobMatches(job, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.job);

  if (ranked.length > 0) {
    // Ville citée sans aucune offre sur place : le dire plutôt que laisser
    // croire que les offres proposées s'y trouvent.
    const elsewhere = city !== null && ranked.every((job) => job.city !== city);
    return {
      text: [
        elsewhere
          ? `Aucune offre publiée ne se trouve à ${city} pour cette recherche. Voici ce qui s'en rapproche le plus, ailleurs.`
          : ranked.length === 1
            ? "Voici l'offre publiée qui correspond le mieux à votre demande."
            : `Voici ${ranked.length} offres publiées qui correspondent à votre demande.`,
        "Ouvrez une offre pour voir les compétences attendues, les pièces à fournir et la date limite.",
      ],
      links: [...jobLinks(ranked), { label: "Voir toutes les offres", href: "/emplois" }],
      chips: ["Comment postuler ?", "Comprendre mon score", "Voir les formations"],
    };
  }

  if (city) {
    return {
      text: [
        `Je n'ai pas trouvé d'offre correspondant à ces mots à ${city}.`,
        "La recherche complète permet de filtrer par ville, domaine, contrat, mode de travail et expérience.",
      ],
      links: [{ label: `Voir les offres à ${city}`, href: `/emplois?city=${encodeURIComponent(city)}` }],
      chips: ["Voir les formations", "Recevoir des alertes", "Parler à l'équipe"],
    };
  }

  return {
    text: [
      `${data.jobCount} offres sont publiées en ce moment, dont ${data.internshipCount} stages ou alternances.`,
      "Dites-moi un métier, une compétence ou une ville, et je vous propose les offres correspondantes.",
    ],
    links: [
      { label: "Voir toutes les offres", href: "/emplois" },
      { label: "Voir les stages", href: "/stages" },
    ],
    chips: ["Offres à Ouagadougou", "Comment postuler ?", "Comprendre mon score"],
  };
}

function trainingsAnswer(input: string, data: ChatData): ChatAnswer {
  const tokens = contentWords(input);
  const ranked = data.trainings
    .map((training) => ({ training, score: trainingMatches(training, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.training);

  const rule =
    "SIRA référence les formations : l'inscription et le paiement se font directement auprès de l'organisme qui les dispense.";

  if (ranked.length > 0) {
    return {
      text: ["Voici les formations du catalogue qui couvrent ce sujet.", rule],
      links: [...trainingLinks(ranked), { label: "Voir tout le catalogue", href: "/formations" }],
      chips: ["Formations gratuites", "Comprendre mon score", "Trouver une offre"],
    };
  }

  return {
    text: [
      `Le catalogue compte ${data.trainings.length} formations, dont ${data.freeTrainingCount} gratuites. Vous pouvez filtrer par catégorie, accès, format et niveau.`,
      rule,
    ],
    links: [{ label: "Voir le catalogue", href: "/formations" }],
    chips: ["Formations gratuites", "Comprendre mon score", "Trouver une offre"],
  };
}

function freeTrainingsAnswer(data: ChatData): ChatAnswer {
  const free = data.trainings.filter((t) => t.free).slice(0, 3);
  return {
    text: [
      free.length > 0
        ? `${data.freeTrainingCount} formations du catalogue sont gratuites.`
        : "Aucune formation gratuite n'est référencée pour le moment.",
      "Les formations incluses avec Premium sont accessibles sans frais supplémentaires aux abonnés ; les autres sont facturées par l'organisme.",
    ],
    links: [...trainingLinks(free), { label: "Filtrer les formations gratuites", href: "/formations?access=public_gratuit" }],
    chips: ["Voir tout le catalogue", "Comprendre mon score", "Parler à l'équipe"],
  };
}

const SCORE_ANSWER: ChatAnswer = {
  text: [
    "Le score de compatibilité mesure l'écart entre votre profil et une offre : compétences, expérience, formation, langues, localisation et critères indispensables.",
    "C'est une estimation algorithmique. Elle ne garantit pas le recrutement, et la décision appartient toujours au recruteur. S'il manque un critère indispensable, le score est plafonné à 40.",
    "Le détail vous indique ce qui correspond, ce qui manque et quelle formation comble l'écart.",
  ],
  links: [
    { label: "Comment le score est calculé", href: "/a-propos#ia" },
    { label: "Article : comprendre votre score", href: "/conseils/comprendre-votre-score-de-compatibilite" },
  ],
  chips: ["Voir les formations", "Comment postuler ?", "Trouver une offre"],
};

const APPLY_ANSWER: ChatAnswer = {
  text: [
    "Depuis une offre, vous pouvez postuler directement ou demander la préparation de votre candidature.",
    "L'assistant adapte votre CV et rédige une première lettre à partir de votre parcours réel : il n'invente jamais une expérience, un diplôme ou une compétence. Vous relisez, vous modifiez, et rien n'est envoyé sans votre validation.",
  ],
  links: [
    { label: "Créer mon profil", href: "/inscription/candidat" },
    { label: "Voir les offres", href: "/emplois" },
    { label: "Article : un CV qui passe le premier tri", href: "/conseils/rediger-un-cv-qui-passe-le-premier-tri" },
  ],
  chips: ["Comprendre mon score", "Mes données personnelles", "Parler à l'équipe"],
};

const RECRUITER_ANSWER: ChatAnswer = {
  text: [
    "Côté recruteur : vous créez un compte organisation, vous faites vérifier votre structure, puis vous publiez vos offres avec les compétences et les critères indispensables.",
    "L'IA classe les candidatures et les résume ; elle n'écarte jamais un profil à votre place.",
  ],
  links: [
    { label: "Espace recruteurs", href: "/recruteurs" },
    { label: "Offres et tarifs", href: "/recruteurs#tarifs" },
    { label: "Créer un compte organisation", href: "/inscription/recruteur" },
  ],
  chips: ["Comment se passe la vérification ?", "Parler à l'équipe", "Trouver une offre"],
};

const VERIFICATION_ANSWER: ChatAnswer = {
  text: [
    "Une organisation dépose ses justificatifs, qui restent confidentiels : seuls les administrateurs SIRA y accèdent.",
    "Le niveau obtenu détermine si les offres sont publiées tout de suite ou après contrôle. Les organisations vérifiées portent un badge sur leurs offres.",
  ],
  links: [{ label: "Les niveaux de vérification", href: "/recruteurs#verification" }],
  chips: ["Publier une offre", "Parler à l'équipe"],
};

const ACCOUNT_ANSWER: ChatAnswer = {
  text: [
    "La création de compte se fait par e-mail ou par téléphone, avec une vérification en deux étapes possible.",
    "Trois espaces existent : candidat, recruteur et organisme de formation.",
  ],
  links: [
    { label: "Créer un compte", href: "/inscription" },
    { label: "Se connecter", href: "/connexion" },
  ],
  chips: ["Comment postuler ?", "Mes données personnelles", "Parler à l'équipe"],
};

const ALERTS_ANSWER: ChatAnswer = {
  text: [
    "Vous pouvez être prévenu des nouvelles offres correspondant à votre profil par e-mail, par notification ou par WhatsApp.",
    "Les alertes se règlent dans votre espace, et refuser les messages de promotion n'entraîne aucune restriction sur la plateforme.",
  ],
  links: [{ label: "Créer mon profil", href: "/inscription/candidat" }],
  chips: ["Trouver une offre", "Mes données personnelles"],
};

const DELETE_ACCOUNT_ANSWER: ChatAnswer = {
  text: [
    "Vous pouvez demander la suppression de votre compte depuis vos paramètres, ou en écrivant à donnees@sira.bf.",
    "La suppression efface votre profil et vos documents ; les candidatures déjà envoyées restent connues des recruteurs concernés, qui les conservent de leur côté.",
  ],
  links: [
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "Écrire à l'équipe", href: "/contact" },
  ],
  chips: ["Mes données personnelles", "Parler à l'équipe"],
};

const TRAINER_ANSWER: ChatAnswer = {
  text: [
    "Les organismes de formation ont leur propre espace : ils référencent leurs formations, suivent les inscriptions et voient les compétences les plus demandées.",
    "SIRA recommande ensuite ces formations aux candidats à qui il manque justement ces compétences. L'inscription et le paiement se font chez l'organisme.",
  ],
  links: [
    { label: "Référencer une formation", href: "/contact" },
    { label: "Voir le catalogue", href: "/formations" },
  ],
  chips: ["Voir les formations", "Parler à l'équipe"],
};

const INTERVIEW_ANSWER: ChatAnswer = {
  text: [
    "Pour préparer un entretien, partez du détail de votre score : il indique ce que l'offre attend et ce qui vous manque encore.",
    "L'article « Préparer un entretien » propose cinq étapes concrètes, de la préparation des exemples aux questions à poser au recruteur.",
  ],
  links: [
    { label: "Préparer un entretien en cinq étapes", href: "/conseils/preparer-un-entretien-en-cinq-etapes" },
    { label: "Tous les conseils", href: "/conseils" },
  ],
  chips: ["Comprendre mon score", "Comment postuler ?", "Trouver une offre"],
};

const DATA_ANSWER: ChatAnswer = {
  text: [
    "Vos données servent à vous proposer des offres et à préparer vos candidatures. Vous gardez la main : accès, rectification, export et suppression de votre compte.",
    "Pour toute demande sur vos données, écrivez à donnees@sira.bf.",
  ],
  links: [
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "Gestion des cookies", href: "/cookies" },
  ],
  chips: ["Parler à l'équipe", "Comment postuler ?"],
};

const FRAUD_ANSWER: ChatAnswer = {
  text: [
    "SIRA ne demande jamais d'argent pour postuler à une offre, ni pour « réserver » un poste.",
    "Si une annonce ou un interlocuteur vous réclame des frais, ne payez pas et signalez l'offre : le bouton « Signaler » se trouve sur chaque page d'offre.",
  ],
  links: [{ label: "Prévenir l'équipe", href: "/contact" }],
  chips: ["Trouver une offre", "Parler à l'équipe"],
};

const PRICING_ANSWER: ChatAnswer = {
  text: [
    "Pour les candidats, la recherche et la candidature sont gratuites ; une offre Premium ajoute des préparations de candidature supplémentaires et des formations incluses.",
    "Pour les recruteurs, les formules se comparent sur la page Recruteurs. Les paiements passent par les moyens locaux, dont le mobile money.",
  ],
  links: [{ label: "Offres et tarifs", href: "/recruteurs#tarifs" }],
  chips: ["Publier une offre", "Parler à l'équipe"],
};

const CONTACT_ANSWER: ChatAnswer = {
  text: [
    "L'équipe répond du lundi au vendredi, de 8 h à 17 h (heure de Ouagadougou).",
    "Écrivez à contact@sira.bf, appelez le +226 25 00 00 00, ou passez par le formulaire de contact.",
  ],
  links: [
    { label: "Formulaire de contact", href: "/contact" },
    { label: "Questions fréquentes", href: "/contact#faq" },
  ],
  chips: ["Trouver une offre", "Publier une offre"],
};

const ABOUT_ANSWER: ChatAnswer = {
  text: [
    "SIRA rapproche les talents et les recruteurs partout en Afrique : un score de compatibilité qui s'explique, des candidatures préparées sans rien inventer et des formations qui comblent les écarts.",
    "« Sira » signifie le chemin, la route, la voie en dioula et en bambara.",
  ],
  links: [
    { label: "À propos de SIRA", href: "/a-propos" },
    { label: "Nos garde-fous sur l'IA", href: "/a-propos#ia" },
  ],
  chips: ["Trouver une offre", "Publier une offre", "Parler à l'équipe"],
};

const ADVICE_ANSWER: ChatAnswer = {
  text: ["Les conseils couvrent le CV, l'entretien, la recherche de stage, le recrutement et la formation."],
  links: [
    { label: "Tous les conseils", href: "/conseils" },
    { label: "Préparer un entretien", href: "/conseils/preparer-un-entretien-en-cinq-etapes" },
    { label: "Trouver un stage", href: "/conseils/trouver-un-stage" },
  ],
  chips: ["Comprendre mon score", "Trouver une offre"],
};

const THANKS_ANSWER: ChatAnswer = {
  text: ["Avec plaisir. Je reste disponible si une autre question se présente."],
  chips: STARTER_CHIPS,
};

const HELLO_ANSWER: ChatAnswer = {
  text: ["Bonjour. Dites-moi ce que vous cherchez : une offre, une formation, votre score, ou comment publier une offre."],
  chips: STARTER_CHIPS,
};

/**
 * Intentions reconnues. L'ordre départage les égalités : les intentions les
 * plus précises sont placées avant les plus générales.
 */
const INTENTS: { id: string; keywords: string[]; answer: (input: string, data: ChatData) => ChatAnswer }[] = [
  {
    id: "fraude",
    keywords: ["arnaque", "frais", "payer pour postuler", "escroquerie", "faux", "suspect", "signaler"],
    answer: () => FRAUD_ANSWER,
  },
  {
    id: "suppression-compte",
    keywords: [
      "supprimer mon compte", "supprimer le compte", "supprimer compte", "suppression de mon compte",
      "fermer mon compte", "desinscrire", "desinscription", "effacer mes donnees",
    ],
    answer: () => DELETE_ACCOUNT_ANSWER,
  },
  {
    id: "score",
    keywords: ["score", "compatibilite", "matching", "pourcentage", "note", "classement", "algorithme", "ia"],
    answer: () => SCORE_ANSWER,
  },
  {
    id: "formateur",
    keywords: [
      "formateur", "formatrice", "organisme de formation", "centre de formation", "referencer une formation",
      "je forme", "dispenser",
    ],
    answer: () => TRAINER_ANSWER,
  },
  {
    id: "entretien",
    keywords: ["entretien", "entretiens", "embauche", "recruteur me recoit", "questions du recruteur"],
    answer: () => INTERVIEW_ANSWER,
  },
  {
    id: "formation-gratuite",
    keywords: ["gratuite", "gratuites", "gratuit"],
    answer: (_input, data) => freeTrainingsAnswer(data),
  },
  {
    id: "formation",
    keywords: ["formation", "formations", "cours", "certificat", "apprendre", "competence", "competences", "seformer"],
    answer: trainingsAnswer,
  },
  {
    id: "verification",
    keywords: ["verification", "verifie", "verifier", "justificatif", "justificatifs", "badge"],
    answer: () => VERIFICATION_ANSWER,
  },
  {
    id: "recruteur",
    keywords: ["recruteur", "recruteurs", "publier", "publication", "entreprise", "organisation", "recruter", "annonce"],
    answer: () => RECRUITER_ANSWER,
  },
  {
    id: "tarifs",
    keywords: ["tarif", "tarifs", "prix", "premium", "abonnement", "payant", "cout", "mobile money", "paiement"],
    answer: () => PRICING_ANSWER,
  },
  {
    id: "candidature",
    keywords: ["postuler", "candidature", "candidatures", "cv", "lettre", "motivation", "dossier", "preparer"],
    answer: () => APPLY_ANSWER,
  },
  {
    id: "compte",
    keywords: ["compte", "inscription", "inscrire", "connexion", "connecter", "mot de passe", "profil"],
    answer: () => ACCOUNT_ANSWER,
  },
  {
    id: "alertes",
    keywords: ["alerte", "alertes", "notification", "notifications", "whatsapp", "prevenir", "newsletter"],
    answer: () => ALERTS_ANSWER,
  },
  {
    id: "donnees",
    keywords: ["donnees", "confidentialite", "rgpd", "supprimer", "suppression", "cookies", "vie privee", "consentement"],
    answer: () => DATA_ANSWER,
  },
  {
    id: "contact",
    keywords: ["contact", "contacter", "humain", "equipe", "telephone", "appeler", "email", "mail", "support", "aide"],
    answer: () => CONTACT_ANSWER,
  },
  {
    id: "conseils",
    keywords: ["conseil", "conseils", "article", "articles", "blog", "preparation"],
    answer: () => ADVICE_ANSWER,
  },
  {
    id: "apropos",
    keywords: ["sira", "propos", "qui etes vous", "presentation", "mission", "plateforme"],
    answer: () => ABOUT_ANSWER,
  },
  {
    id: "offres",
    keywords: [
      "offre", "offres", "emploi", "emplois", "travail", "job", "poste", "stage", "stages", "alternance",
      "recherche", "mission", "cdi", "cdd", "salaire", "remuneration", "ouagadougou", "bobo", "abidjan", "dakar",
    ],
    answer: offersAnswer,
  },
  {
    id: "salutation",
    keywords: ["bonjour", "bonsoir", "salut", "coucou", "hello", "bonne journee"],
    answer: () => HELLO_ANSWER,
  },
  {
    id: "remerciement",
    keywords: ["merci", "parfait", "super", "au revoir", "bye", "a bientot"],
    answer: () => THANKS_ANSWER,
  },
];

function fallbackAnswer(input: string, data: ChatData): ChatAnswer {
  // Même sans intention reconnue, une offre peut correspondre aux mots employés.
  const tokens = contentWords(input);
  const ranked = data.jobs
    .map((job) => ({ job, score: jobMatches(job, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.job);

  if (ranked.length > 0) {
    return {
      text: ["Je ne suis pas certain d'avoir bien compris. Ces offres publiées correspondent aux mots que vous avez employés."],
      links: [...jobLinks(ranked), { label: "Voir toutes les offres", href: "/emplois" }],
      chips: STARTER_CHIPS,
    };
  }

  return {
    text: [
      "Je ne sais pas répondre à cette question : mes réponses sont préparées à l'avance et je préfère ne rien inventer.",
      "L'équipe SIRA peut vous répondre directement, ou vous pouvez reformuler avec un mot plus simple, par exemple « offre », « formation », « score » ou « compte ».",
    ],
    links: [
      { label: "Parler à l'équipe", href: "/contact" },
      { label: "Questions fréquentes", href: "/contact#faq" },
    ],
    chips: STARTER_CHIPS,
  };
}

/** Réponse à une demande libre ou à une suggestion cliquée. */
export function answerFor(input: string, data: ChatData): ChatAnswer {
  const trimmed = input.trim();
  if (!trimmed) return fallbackAnswer("", data);

  let best: { score: number; intent: (typeof INTENTS)[number] } | null = null;
  for (const intent of INTENTS) {
    const score = keywordScore(trimmed, intent.keywords);
    if (score > 0 && (!best || score > best.score)) best = { score, intent };
  }

  return best ? best.intent.answer(trimmed, data) : fallbackAnswer(trimmed, data);
}
