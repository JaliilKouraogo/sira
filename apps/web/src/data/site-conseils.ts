/**
 * Données dérivées de la rubrique Conseils.
 *
 * Les articles eux-mêmes vivent dans `site-content.ts`. Ce fichier ne fait
 * que les ordonner, les regrouper par thème et associer à chaque thème un
 * encadré qui rappelle les règles de la plateforme. Toutes les fonctions sont
 * pures : elles servent aussi bien côté serveur que dans le navigateur, où se
 * fait le filtrage par l'adresse.
 */

import { POSTS, type Post } from "./site-content";

export type PostCategory = Post["category"];

/** Paramètre d'adresse utilisé pour filtrer la liste des articles. */
export const CATEGORY_PARAM = "categorie";

/** Articles du plus récent au plus ancien. */
export function sortedPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

/** Identifiant d'adresse d'un thème : « Recrutement » devient « recrutement ». */
export function categorySlug(category: PostCategory): string {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Thèmes présents, dans l'ordre de leur premier article, avec leur nombre d'articles. */
export function postCategories(): { label: PostCategory; slug: string; count: number }[] {
  const counts = new Map<PostCategory, number>();
  for (const post of sortedPosts()) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, slug: categorySlug(label), count }));
}

/** Thème correspondant à un identifiant d'adresse, ou `null` s'il est absent ou inconnu. */
export function categoryFromSlug(slug: string | null | undefined): PostCategory | null {
  if (!slug) return null;
  return postCategories().find((c) => c.slug === slug)?.label ?? null;
}

export function postsInCategory(category: PostCategory | null): Post[] {
  const all = sortedPosts();
  return category ? all.filter((p) => p.category === category) : all;
}

/** Articles mis à la une, les plus récents d'abord. */
export function featuredPosts(): Post[] {
  return sortedPosts().filter((p) => p.featured);
}

/** Articles à suggérer après la lecture : même thème d'abord, puis les plus récents. */
export function relatedPosts(post: Post, limit = 3): Post[] {
  const others = sortedPosts().filter((p) => p.slug !== post.slug);
  const sameTheme = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...sameTheme, ...rest].slice(0, limit);
}

/**
 * Fin du titre de chaque article à mettre en valeur en or, comme sur les
 * autres grands titres du site. Sans entrée, les deux derniers mots.
 */
const TITLE_HIGHLIGHT: Record<string, string> = {
  "rediger-un-cv-qui-passe-le-premier-tri": "le premier tri",
  "preparer-un-entretien-en-cinq-etapes": "en cinq étapes",
  "comprendre-votre-score-de-compatibilite": "score de compatibilité",
  "trouver-un-stage": "quand on débute",
  "rediger-une-offre-qui-attire-les-bons-profils": "les bons profils",
  "se-former-sans-quitter-son-emploi": "sans quitter son emploi",
};

/** Découpe un titre d'article en partie simple et partie mise en valeur. */
export function splitPostTitle(post: Pick<Post, "slug" | "title">): { head: string; highlight: string } {
  const wanted = TITLE_HIGHLIGHT[post.slug];
  if (wanted && post.title.endsWith(wanted)) {
    return { head: post.title.slice(0, -wanted.length), highlight: wanted };
  }
  const words = post.title.split(" ");
  const cut = Math.max(words.length - 2, 0);
  return { head: words.slice(0, cut).join(" ") + (cut > 0 ? " " : ""), highlight: words.slice(cut).join(" ") };
}

/** Temps de lecture lisible, par exemple « 6 min de lecture ». */
export function readingLabel(minutes: number): string {
  return `${minutes} min de lecture`;
}

/**
 * Encadré affiché à la fin de chaque article : ce que SIRA fait concrètement
 * sur le sujet, avec les garde-fous du cahier des charges.
 */
export const CATEGORY_NOTE: Record<PostCategory, { title: string; text: string }> = {
  CV: {
    title: "Sur SIRA, votre CV reste le vôtre",
    text: "L'assistant adapte votre CV à chaque offre à partir de votre parcours réel : il réorganise, il n'invente jamais une expérience, un diplôme ou une compétence. Rien n'est envoyé sans votre validation.",
  },
  Entretien: {
    title: "Préparez-vous avec votre score",
    text: "Le détail de votre score montre ce que l'offre attend et ce qui vous manque encore. C'est une estimation algorithmique : elle ne garantit pas le recrutement, et la décision appartient toujours au recruteur.",
  },
  Stage: {
    title: "Des stages publiés en confiance",
    text: "Les organisations vérifiées portent un badge et la première offre d'une organisation non vérifiée est contrôlée avant sa mise en ligne. Aucune candidature ne part sans votre validation.",
  },
  Recrutement: {
    title: "L'IA classe, vous décidez",
    text: "Sur SIRA, l'IA classe les candidatures, les résume et signale des points d'attention. Elle ne décide jamais : aucun candidat n'est écarté sans une action de votre part.",
  },
  Formation: {
    title: "Des formations qui comblent l'écart",
    text: "Quand une compétence vous manque pour une offre, SIRA vous oriente vers les formations qui la couvrent, proposées par des centres partenaires en présentiel ou en ligne.",
  },
  Plateforme: {
    title: "Une estimation, jamais une promesse",
    text: "Le score de compatibilité est une estimation algorithmique fondée sur les informations disponibles. Il ne garantit pas le recrutement : l'IA explique et classe, mais ne décide jamais.",
  },
};
