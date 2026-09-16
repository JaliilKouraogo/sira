/**
 * Contenu de la page employeurs (/recruteurs).
 *
 * Règles du cahier des charges reprises ici :
 * - un compte non vérifié ne publie rien, la vérification légère passe par
 *   une validation administrateur, le compte vérifié publie immédiatement
 *   sous modération a posteriori ;
 * - l'espace recruteur est gratuit pendant la phase de lancement, plan Pro
 *   offert avec une date d'expiration annoncée à l'avance ;
 * - l'IA classe, résume et signale, mais ne décide jamais.
 */

import type { PlanCode } from "@/lib/enums";
import { IMG, type SiteImage } from "./site-content";

/** Onglets « Trouvez le bon talent avec… ». */
export const RECRUITER_FEATURES: { title: string; text: string; image: SiteImage }[] = [
  {
    title: "Une publication gratuite",
    text: "Publiez vos offres d'emploi et de stage sans frais pendant la phase de lancement. Un formulaire guidé vous demande les missions, les compétences requises et les critères indispensables : ce sont eux qui rendent le classement des candidatures pertinent.",
    image: IMG.equipeOrdinateurs,
  },
  {
    title: "Un badge de confiance",
    text: "Déposez vos justificatifs pour obtenir le badge « Recruteur vérifié ». Il protège les candidats des fausses offres, vous distingue des comptes opportunistes et vous permet de publier sans attendre de validation.",
    image: IMG.poigneeMain,
  },
  {
    title: "Un classement suggéré",
    text: "Le matching IA vous propose un ordre de lecture argumenté : compétences correspondantes, expérience, critères indispensables satisfaits ou non. L'IA classe et résume chaque profil ; elle n'écarte jamais un candidat à votre place.",
    image: IMG.developpement,
  },
  {
    title: "Un suivi de bout en bout",
    text: "Chaque dossier arrive complet, avec un CV structuré et les pièces demandées : fini les candidatures d'une ligne envoyées par message. Vues, candidatures, délai moyen de traitement : vous savez quelle offre attire et laquelle doit être reformulée.",
    image: IMG.salleReunion,
  },
];

/** Grandes étapes du recrutement sur SIRA, en cartes horizontales. */
export const RECRUITER_STEPS: {
  n: string;
  title: string;
  text: string;
  image: SiteImage;
  href: string;
}[] = [
  {
    n: "01",
    title: "Créez votre compte organisation",
    text: "Renseignez la raison sociale, le type d'organisation et vos coordonnées. Un compte suffit pour toute l'équipe : vous invitez ensuite vos collègues avec le rôle propriétaire, recruteur ou lecteur.",
    image: IMG.accompagnement,
    href: "/inscription/recruteur",
  },
  {
    n: "02",
    title: "Faites vérifier votre organisation",
    text: "Déposez les justificatifs propres à votre type d'organisation. Ils ne sont jamais publics, seuls les administrateurs SIRA y accèdent. Le niveau obtenu détermine si vos offres sont publiées immédiatement ou après validation.",
    image: IMG.finance,
    href: "#verification",
  },
  {
    n: "03",
    title: "Publiez votre offre",
    text: "Un formulaire guidé vous demande les missions, les compétences requises et les critères indispensables. Ce sont eux qui rendent le classement des candidatures pertinent pour les talents de tout le continent.",
    image: IMG.bureau,
    href: "/conseils/rediger-une-offre-qui-attire-les-bons-profils",
  },
  {
    n: "04",
    title: "Recevez et traitez les candidatures",
    text: "Chaque dossier arrive complet dans votre tableau de suivi. Vous décidez ; SIRA se contente de vous proposer un ordre de lecture et un résumé de chaque profil.",
    image: IMG.entretien,
    href: "#tarifs",
  },
];

/** Les trois niveaux de vérification d'une organisation. */
export const VERIFICATION_LEVELS: {
  n: string;
  title: string;
  subtitle: string;
  status: string;
  points: string[];
}[] = [
  {
    n: "01",
    title: "Non vérifié",
    subtitle: "Compte créé, aucune pièce fournie",
    status: "Brouillons uniquement",
    points: [
      "Vous pouvez rédiger et enregistrer des offres en brouillon",
      "Aucune publication n'est possible tant qu'aucune vérification n'a eu lieu",
      "Aucun accès aux profils des candidats",
    ],
  },
  {
    n: "02",
    title: "Vérification légère",
    subtitle: "Identité et coordonnées contrôlées",
    status: "Publication après validation",
    points: [
      "Vos offres sont publiables, après validation par un administrateur SIRA",
      "Le délai d'examen est de un à deux jours ouvrés",
      "Les candidatures vous parviennent normalement une fois l'offre en ligne",
    ],
  },
  {
    n: "03",
    title: "Vérifié avec justificatifs",
    subtitle: "Pièces légales contrôlées",
    status: "Publication immédiate",
    points: [
      "Publication immédiate, sans validation préalable",
      "Badge « Recruteur vérifié » affiché sur vos offres et votre page",
      "Modération a posteriori : vos offres restent soumises aux règles de la plateforme",
      "Meilleure visibilité : les candidats postulent plus volontiers à une offre vérifiée",
    ],
  },
];

/** Comparatif des offres recruteur. */
export const RECRUITER_PLANS: {
  code: PlanCode;
  price: string;
  priceNote: string;
  tagline: string;
  highlight: boolean;
  badge?: string;
  features: string[];
  cta: string;
  href: string;
}[] = [
  {
    code: "recruteur_gratuit",
    price: "0 FCFA",
    priceNote: "Sans engagement, sans limite de durée",
    tagline: "Pour publier et recevoir des candidatures.",
    highlight: false,
    features: [
      "Compte organisation et invitation de collègues",
      "Publication d'offres d'emploi et de stage",
      "Réception des candidatures dans SIRA",
      "Profils de base des candidats",
      "Alertes WhatsApp sur les nouvelles candidatures",
    ],
    cta: "Créer un compte gratuit",
    href: "/inscription/recruteur",
  },
  {
    code: "recruteur_pro",
    price: "Offert",
    priceNote: "Pendant la phase de lancement, puis sur devis",
    tagline: "Pour trier vite quand les candidatures affluent.",
    highlight: true,
    badge: "Le plus complet",
    features: [
      "Tout ce que contient l'offre Gratuit",
      "Matching IA de l'offre vers les candidats",
      "Classement suggéré des candidatures",
      "Résumé automatique de chaque candidat",
      "Recherche avancée de profils",
      "Détection des critères indispensables non satisfaits",
      "Tableau de suivi des candidatures",
      "Statistiques d'offre et de recrutement",
      "Collaboration entre membres de l'équipe",
    ],
    cta: "Demander un accès Pro",
    href: "/inscription/recruteur?plan=pro",
  },
  {
    code: "recruteur_enterprise",
    price: "À venir",
    priceNote: "Tarif défini avec nos premiers clients",
    tagline: "Pour les groupes et les recrutements en volume.",
    highlight: false,
    badge: "À venir",
    features: [
      "Offre en cours de définition avec nos premiers clients",
      "Volumes élevés, multi-entités et intégrations sur mesure",
      "Accompagnement dédié",
    ],
    cta: "Être informé du lancement",
    href: "/contact",
  },
];

/** Témoignages mis en avant en premier : ceux qui parlent du recrutement. */
export const RECRUITER_TESTIMONIAL_NAMES = ["Issouf T.", "Moussa C.", "Nafissatou S."];
