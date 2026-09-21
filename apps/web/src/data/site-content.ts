/**
 * Contenu éditorial du site public.
 *
 * À REMPLACER AVANT LA MISE EN LIGNE
 * ----------------------------------
 * Les témoignages, les chiffres d'objectifs et les articles ci-dessous sont
 * des contenus de démonstration. Les témoignages en particulier sont fictifs :
 * ils doivent être remplacés par des retours réels et autorisés avant toute
 * publication, sans quoi ils induiraient les visiteurs en erreur.
 *
 * Règle appliquée aux photos : aucune photo d'une personne identifiable n'est
 * associée à un nom, une fonction ou une citation. Les photos illustrent des
 * situations ; les témoignages portent des avatars à initiales.
 *
 * Toutes les photos sont sous licence Unsplash, voir public/images/CREDITS.md.
 */

import { asset } from "@/lib/base-path";
import type { Job, Training } from "@/lib/types";

export interface SiteImage {
  src: string;
  alt: string;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export const IMG = {
  equipeOrdinateurs: {
    src: asset("/images/scenes/equipe-ordinateurs.jpg"),
    alt: "Une femme et un homme travaillent ensemble devant des écrans d'ordinateur",
  },
  reunionEquipe: {
    src: asset("/images/scenes/reunion-equipe.jpg"),
    alt: "Une équipe échange autour d'une table de réunion",
  },
  entretien: {
    src: asset("/images/scenes/entretien.jpg"),
    alt: "Deux femmes en entretien assises face à face près d'une fenêtre",
  },
  accompagnement: {
    src: asset("/images/scenes/accompagnement.jpg"),
    alt: "Deux professionnelles discutent debout dans un bureau lumineux",
  },
  salleReunion: {
    src: asset("/images/scenes/salle-reunion.jpg"),
    alt: "Une réunion de travail entre plusieurs femmes dans une salle claire",
  },
  diplomes: {
    src: asset("/images/scenes/diplomes.jpg"),
    alt: "Des diplômés lancent leur toque en l'air devant un bâtiment universitaire",
  },
  remiseDiplomes: {
    src: asset("/images/scenes/remise-diplomes.jpg"),
    alt: "Des diplômés de dos lancent leur toque vers le ciel",
  },
  poigneeMain: {
    src: asset("/images/scenes/poignee-main.jpg"),
    alt: "Plusieurs mains se rejoignent en signe d'accord",
  },
  salleFormation: {
    src: asset("/images/scenes/salle-formation.jpg"),
    alt: "Une salle de formation où des participants suivent une présentation",
  },
  villeSoir: {
    src: asset("/images/scenes/ville-soir.jpg"),
    alt: "Une femme regarde les lumières de la ville au crépuscule",
  },
  progression: {
    src: asset("/images/scenes/progression.jpg"),
    alt: "Une jeune pousse sort d'un tas de pièces de monnaie",
  },
  logistique: { src: asset("/images/metiers/logistique.jpg"), alt: "Allée d'un entrepôt aux rayonnages chargés" },
  entrepot: { src: asset("/images/metiers/entrepot.jpg"), alt: "Entrepôt de stockage rempli de colis" },
  developpement: { src: asset("/images/metiers/developpement.jpg"), alt: "Écran affichant du code informatique" },
  finance: { src: asset("/images/metiers/finance.jpg"), alt: "Documents comptables, calculatrice et tasse de café" },
  solaire: { src: asset("/images/metiers/solaire.jpg"), alt: "Champ de panneaux solaires sous un ciel bleu" },
  transport: { src: asset("/images/metiers/transport.jpg"), alt: "Camion sur une route de savane" },
  sante: { src: asset("/images/metiers/sante.jpg"), alt: "Médecin en blouse blanche consultant son téléphone" },
  agriculture: { src: asset("/images/metiers/agriculture.jpg"), alt: "Jeunes pousses de maïs dans un champ" },
  bureau: { src: asset("/images/metiers/bureau.jpg"), alt: "Mains sur un ordinateur portable et un carnet de notes" },
} satisfies Record<string, SiteImage>;

/**
 * Portraits sans nom : utilisés uniquement pour des personas génériques ou
 * dans la pile d'avatars de l'accueil, jamais pour signer un témoignage.
 */
export const PORTRAITS: SiteImage[] = [
  { src: asset("/images/portraits/femme-sourire.jpg"), alt: "" },
  { src: asset("/images/portraits/homme-lunettes.jpg"), alt: "" },
  { src: asset("/images/portraits/femme-lunettes-bleu.jpg"), alt: "" },
  { src: asset("/images/portraits/homme-bras-croises.jpg"), alt: "" },
  { src: asset("/images/portraits/femme-tresses.jpg"), alt: "" },
  { src: asset("/images/portraits/homme-exterieur.jpg"), alt: "" },
  { src: asset("/images/portraits/femme-portrait.jpg"), alt: "" },
  { src: asset("/images/portraits/homme-joyeux.jpg"), alt: "" },
];

const JOB_IMAGE: Record<string, SiteImage> = {
  job_01: IMG.logistique,
  job_02: IMG.developpement,
  job_03: IMG.accompagnement,
  job_04: IMG.finance,
  job_05: IMG.solaire,
  job_06: IMG.entretien,
  job_07: IMG.equipeOrdinateurs,
  job_08: IMG.sante,
  job_09: IMG.bureau,
  job_10: IMG.finance,
  job_11: IMG.salleFormation,
  job_12: IMG.reunionEquipe,
  job_13: IMG.entrepot,
  job_14: IMG.salleFormation,
  job_15: IMG.salleReunion,
  job_16: IMG.transport,
  job_17: IMG.bureau,
  job_18: IMG.accompagnement,
};

/** Image d'illustration d'une offre. Repli sur une scène de bureau. */
export function jobImage(job: Pick<Job, "id">): SiteImage {
  return JOB_IMAGE[job.id] ?? IMG.bureau;
}

const TRAINING_IMAGE: Record<string, SiteImage> = {
  Management: IMG.reunionEquipe,
  Bureautique: IMG.bureau,
  Logistique: IMG.logistique,
  Langues: IMG.accompagnement,
  "Ressources humaines": IMG.entretien,
  Numérique: IMG.developpement,
};

export function trainingImage(training: Pick<Training, "category">): SiteImage {
  return TRAINING_IMAGE[training.category] ?? IMG.salleFormation;
}

// ---------------------------------------------------------------------------
// Accueil
// ---------------------------------------------------------------------------

export const HOME_PERKS: { title: string; text: string; image: SiteImage }[] = [
  {
    title: "Un score qui s'explique",
    text: "Pour chaque offre, SIRA calcule une compatibilité sur 100 et détaille ce qui correspond, ce qui manque et comment progresser. Une estimation claire, jamais une promesse d'embauche.",
    image: IMG.reunionEquipe,
  },
  {
    title: "Une candidature prête en minutes",
    text: "CV adapté, lettre de motivation, e-mail et message sont préparés à partir de votre profil, sans rien inventer. Vous relisez, vous modifiez, vous validez avant tout envoi.",
    image: IMG.equipeOrdinateurs,
  },
  {
    title: "Les alertes sur WhatsApp",
    text: "Recevez les offres compatibles là où vous êtes déjà, et demandez à l'assistant pourquoi votre score est à 62 % ou de trouver un stage, directement depuis la conversation.",
    image: IMG.accompagnement,
  },
  {
    title: "Des formations pour combler l'écart",
    text: "Quand une compétence vous manque, SIRA vous oriente vers les formations qui la couvrent, proposées par des centres partenaires en présentiel ou en ligne.",
    image: IMG.salleFormation,
  },
];

export const HOME_SERVICES: { title: string; text: string; href: string; icon: "candidate" | "recruiter" | "trainer" }[] = [
  {
    title: "Pour les candidats",
    text: "Créez votre profil à partir de votre CV, recevez les offres qui vous correspondent et préparez des candidatures solides, avec un score expliqué à chaque étape.",
    href: "/inscription/candidat",
    icon: "candidate",
  },
  {
    title: "Pour les recruteurs",
    text: "Publiez gratuitement vos offres pendant le lancement, recevez des candidatures structurées et laissez l'IA suggérer un classement. La décision reste la vôtre.",
    href: "/recruteurs",
    icon: "recruiter",
  },
  {
    title: "Pour les formateurs",
    text: "Présentez vos formations aux candidats qui en ont réellement besoin : SIRA les recommande à partir des compétences qui manquent dans leurs profils.",
    href: "/formations",
    icon: "trainer",
  },
];

/**
 * Objectifs de développement à l'échelle africaine. Présentés comme tels à
 * l'écran : la plateforme n'a pas encore de chiffres réels à afficher.
 */
export const HOME_GOALS: { value: string; label: string; accent: boolean }[] = [
  { value: "500+", label: "organisations inscrites visées", accent: true },
  { value: "20 000", label: "candidats accompagnés visés", accent: false },
  { value: "5 000", label: "offres publiées visées", accent: false },
  { value: "15", label: "pays africains visés", accent: true },
];

// ---------------------------------------------------------------------------
// Témoignages — FICTIFS, à remplacer
// ---------------------------------------------------------------------------

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "J'ai enfin compris pourquoi mes candidatures n'aboutissaient pas. Le score m'a montré qu'il me manquait Excel avancé ; trois semaines de formation plus tard, j'étais en entretien.",
    name: "Aminata K.",
    role: "Gestionnaire de stock, Ouagadougou",
    initials: "AK",
    rating: 5,
  },
  {
    quote: "Nous recevions deux cents CV par offre sans aucune structure. Avec SIRA, les candidatures arrivent complètes et le classement suggéré nous fait gagner des jours.",
    name: "Issouf T.",
    role: "Responsable RH, secteur agroalimentaire",
    initials: "IT",
    rating: 5,
  },
  {
    quote: "Les alertes WhatsApp ont tout changé. Je n'ai plus besoin de passer mes soirées à chercher : les offres qui me correspondent viennent à moi.",
    name: "Salimata O.",
    role: "Jeune diplômée en communication",
    initials: "SO",
    rating: 5,
  },
  {
    quote: "La lettre de motivation générée partait de mon vrai parcours, sans rien exagérer. Je l'ai ajustée en dix minutes au lieu d'y passer la soirée.",
    name: "Boukary Z.",
    role: "Technicien en énergie solaire, Koudougou",
    initials: "BZ",
    rating: 5,
  },
  {
    quote: "La vérification des recruteurs rassure les candidats. Depuis que notre organisation a son badge, nous recevons des profils plus sérieux.",
    name: "Nafissatou S.",
    role: "Chargée de programme, ONG",
    initials: "NS",
    rating: 5,
  },
  {
    quote: "Nos formations sont désormais proposées aux candidats à qui il manque exactement ces compétences. Les inscriptions ont suivi.",
    name: "Hamidou D.",
    role: "Directeur d'un centre de formation",
    initials: "HD",
    rating: 4,
  },
  {
    quote: "J'ai trouvé mon stage de fin d'études en deux semaines, avec une convention en règle et une entreprise vérifiée.",
    name: "Rasmata Y.",
    role: "Étudiante en informatique",
    initials: "RY",
    rating: 5,
  },
  {
    quote: "Ce qui compte pour nous, c'est que l'IA ne décide jamais à notre place. Elle classe, elle résume, et nous gardons la main.",
    name: "Moussa C.",
    role: "Cabinet de recrutement, Bobo-Dioulasso",
    initials: "MC",
    rating: 5,
  },
];

// ---------------------------------------------------------------------------
// Conseils (blog)
// ---------------------------------------------------------------------------

export interface PostBlock {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: "CV" | "Entretien" | "Stage" | "Recrutement" | "Formation" | "Plateforme";
  date: string;
  readingMinutes: number;
  image: SiteImage;
  featured?: boolean;
  body: PostBlock[];
}

export const POSTS: Post[] = [
  {
    slug: "rediger-un-cv-qui-passe-le-premier-tri",
    title: "Rédiger un CV qui passe le premier tri",
    excerpt: "Un recruteur consacre moins d'une minute à un CV. Voici comment rendre le vôtre lisible, précis et fidèle à votre parcours.",
    category: "CV",
    date: "2026-09-08",
    readingMinutes: 6,
    image: IMG.bureau,
    featured: true,
    body: [
      {
        paragraphs: [
          "Le premier tri d'un CV est rapide. Le recruteur cherche trois choses : le poste visé, l'expérience pertinente et les compétences demandées dans l'offre. Tout ce qui les masque joue contre vous.",
        ],
      },
      {
        heading: "Commencer par le poste visé",
        paragraphs: [
          "Placez en tête un titre clair qui reprend l'intitulé de l'offre, suivi d'une phrase qui résume votre profil. « Gestionnaire logistique, 5 ans en agro-industrie » dit plus qu'un paragraphe d'objectifs généraux.",
        ],
      },
      {
        heading: "Chiffrer ce qui peut l'être",
        paragraphs: [
          "Une réalisation chiffrée se retient mieux qu'une liste de tâches. Taille de l'équipe encadrée, volume géré, délai réduit : chaque nombre donne une échelle au lecteur.",
        ],
        list: [
          "Réduction de 22 % des ruptures de stock en deux ans",
          "Encadrement d'une équipe de 12 personnes",
          "Gestion d'un entrepôt de 1 800 m²",
        ],
      },
      {
        heading: "Adapter sans jamais inventer",
        paragraphs: [
          "Adapter un CV à une offre, c'est mettre en avant ce qui est pertinent, pas ajouter ce que l'on n'a pas fait. C'est le principe appliqué par SIRA : l'assistant réorganise votre parcours réel, il n'ajoute jamais une expérience, un diplôme ou une compétence.",
        ],
      },
    ],
  },
  {
    slug: "preparer-un-entretien-en-cinq-etapes",
    title: "Préparer un entretien d'embauche en cinq étapes",
    excerpt: "Se renseigner, relire l'offre, préparer ses exemples : une méthode simple pour arriver serein et convaincant.",
    category: "Entretien",
    date: "2026-09-02",
    readingMinutes: 7,
    image: IMG.entretien,
    featured: true,
    body: [
      {
        paragraphs: [
          "Un entretien se gagne en grande partie avant d'entrer dans la salle. Cinq étapes suffisent pour transformer le stress en préparation.",
        ],
      },
      {
        heading: "Les cinq étapes",
        list: [
          "Relire l'offre et souligner les compétences demandées",
          "Se renseigner sur l'organisation, ses activités et ses projets récents",
          "Préparer trois exemples concrets tirés de son parcours",
          "Anticiper les questions sur ses points faibles",
          "Préparer deux questions à poser au recruteur",
        ],
      },
      {
        heading: "La méthode des exemples",
        paragraphs: [
          "Pour chaque exemple, décrivez la situation, ce que vous avez fait et le résultat obtenu. Cette structure courte évite de se perdre et montre votre contribution personnelle.",
        ],
      },
    ],
  },
  {
    slug: "comprendre-votre-score-de-compatibilite",
    title: "Comprendre votre score de compatibilité",
    excerpt: "Six composantes, des pondérations publiques et une règle simple : le score est une estimation, jamais une garantie.",
    category: "Plateforme",
    date: "2026-08-27",
    readingMinutes: 5,
    image: IMG.reunionEquipe,
    featured: true,
    body: [
      {
        paragraphs: [
          "Le score de compatibilité compare votre profil aux exigences d'une offre. Il ne prédit pas une embauche : il vous dit où vous en êtes et ce qui vous rapprocherait du poste.",
        ],
      },
      {
        heading: "Les six composantes",
        list: [
          "Compétences, 35 %",
          "Expérience, 20 %",
          "Formation, 15 %",
          "Localisation, 15 %",
          "Langues, 10 %",
          "Disponibilité, 5 %",
        ],
      },
      {
        heading: "Les critères indispensables",
        paragraphs: [
          "Certaines offres exigent un permis, un diplôme ou une inscription à un ordre professionnel. Tant qu'un tel critère n'est pas rempli, le score reste plafonné à 40, quelle que soit la qualité du reste du profil.",
        ],
      },
    ],
  },
  {
    slug: "trouver-un-stage",
    title: "Trouver un stage quand on débute",
    excerpt: "Où chercher, quand postuler et comment se démarquer quand on n'a pas encore d'expérience professionnelle.",
    category: "Stage",
    date: "2026-08-19",
    readingMinutes: 6,
    image: IMG.diplomes,
    body: [
      {
        paragraphs: [
          "Le stage est souvent la première porte d'entrée vers l'emploi. Les meilleures offres partent vite : s'organiser tôt fait la différence.",
        ],
      },
      {
        heading: "Où chercher",
        list: [
          "Les offres de stage publiées par les entreprises vérifiées sur SIRA",
          "Le service des relations entreprises de votre université ou de votre école",
          "Les ONG et institutions, qui recrutent régulièrement des stagiaires",
        ],
      },
      {
        heading: "Se démarquer sans expérience",
        paragraphs: [
          "Mettez en avant vos projets académiques, vos engagements associatifs et les outils que vous maîtrisez. Un projet mené de bout en bout vaut une première expérience.",
        ],
      },
    ],
  },
  {
    slug: "rediger-une-offre-qui-attire-les-bons-profils",
    title: "Recruteurs : rédiger une offre qui attire les bons profils",
    excerpt: "Un intitulé précis, des missions concrètes et des critères indispensables assumés : les clés d'une offre efficace.",
    category: "Recrutement",
    date: "2026-08-11",
    readingMinutes: 5,
    image: IMG.salleReunion,
    body: [
      {
        paragraphs: [
          "Une offre floue attire beaucoup de candidatures et peu de bons profils. Une offre précise fait le tri à votre place.",
        ],
      },
      {
        heading: "Ce qu'une bonne offre contient",
        list: [
          "Un intitulé que les candidats recherchent réellement",
          "Trois à cinq missions concrètes",
          "Les compétences requises, séparées des compétences souhaitées",
          "Les critères indispensables, clairement signalés",
          "Une fourchette de salaire, quand c'est possible",
        ],
      },
    ],
  },
  {
    slug: "se-former-sans-quitter-son-emploi",
    title: "Se former sans quitter son emploi",
    excerpt: "Formations du soir, parcours hybrides, certifications courtes : les options pour progresser tout en travaillant.",
    category: "Formation",
    date: "2026-08-04",
    readingMinutes: 4,
    image: IMG.salleFormation,
    body: [
      {
        paragraphs: [
          "Progresser ne demande pas toujours de mettre sa carrière entre parenthèses. De nombreux centres proposent des formats compatibles avec un emploi à temps plein.",
        ],
      },
      {
        heading: "Les formats à privilégier",
        list: [
          "Les formations hybrides, qui alternent séances en ligne et en présentiel",
          "Les parcours courts et certifiants, de 14 à 40 heures",
          "Les sessions du soir et du samedi",
        ],
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const OFFICES: { city: string; label: string; address: string; image: SiteImage }[] = [
  {
    city: "Ouagadougou",
    label: "Siège",
    address: "Avenue Kwame N'Krumah, Ouagadougou",
    image: IMG.salleReunion,
  },
  {
    city: "Bobo-Dioulasso",
    label: "Antenne régionale",
    address: "Boulevard de la Révolution, Bobo-Dioulasso",
    image: IMG.accompagnement,
  },
];

export const FAQ: { category: string; icon: "candidate" | "recruiter" | "payment" | "privacy"; items: { q: string; a: string }[] }[] = [
  {
    category: "Candidats",
    icon: "candidate",
    items: [
      {
        q: "L'inscription est-elle gratuite ?",
        a: "Oui. Le plan gratuit donne accès au profil, au CV, à la consultation des offres, à cinq recommandations par semaine et à deux préparations de candidature par mois.",
      },
      {
        q: "Le score de compatibilité garantit-il un recrutement ?",
        a: "Non. C'est une estimation algorithmique fondée sur les informations disponibles. Elle vous aide à comprendre où vous en êtes, mais la décision appartient toujours au recruteur.",
      },
      {
        q: "Mes documents sont-ils envoyés sans mon accord ?",
        a: "Jamais. Chaque dossier préparé par l'assistant doit être relu et validé par vous avant tout envoi.",
      },
    ],
  },
  {
    category: "Recruteurs",
    icon: "recruiter",
    items: [
      {
        q: "Combien coûte la publication d'une offre ?",
        a: "Rien pendant la phase de lancement : les organisations inscrites bénéficient du plan Pro offert, avec une date d'expiration annoncée à l'avance.",
      },
      {
        q: "Pourquoi faut-il vérifier mon organisation ?",
        a: "Pour protéger les candidats des fausses offres. Une organisation vérifiée publie immédiatement et reçoit un badge ; les autres voient leur première offre contrôlée avant mise en ligne.",
      },
      {
        q: "L'IA peut-elle refuser un candidat à ma place ?",
        a: "Non. Elle classe, résume et signale des points d'attention. Aucun candidat n'est jamais écarté sans une action de votre part.",
      },
    ],
  },
  {
    category: "Paiements",
    icon: "payment",
    items: [
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Orange Money, Moov Money et la carte bancaire. Les abonnements sont prépayés : aucun prélèvement automatique n'est effectué.",
      },
      {
        q: "Que se passe-t-il à la fin de mon abonnement ?",
        a: "Vous recevez un rappel sept, trois et un jour avant l'échéance, puis vous bénéficiez de cinq jours de grâce avant le retour au plan gratuit.",
      },
    ],
  },
  {
    category: "Données personnelles",
    icon: "privacy",
    items: [
      {
        q: "Puis-je supprimer mon compte ?",
        a: "Oui, à tout moment depuis vos paramètres. La suppression devient définitive après un délai de rétractation de 30 jours.",
      },
      {
        q: "Refuser les communications commerciales limite-t-il mon accès ?",
        a: "Non. Refuser le marketing n'entraîne aucune restriction sur les fonctions essentielles du service.",
      },
    ],
  },
];
