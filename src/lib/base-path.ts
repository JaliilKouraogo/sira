/**
 * Chemin de base du site.
 *
 * En local, le site est servi à la racine. Sur GitHub Pages, il est servi
 * sous `/sira` et exporté en fichiers statiques. Next.js préfixe
 * automatiquement les liens `<Link>`, mais PAS :
 * - les `src` d'images passés sous forme de chaîne ;
 * - les attributs `action` des formulaires ;
 * - les liens `<a href>` bruts vers des pages du site.
 * Ces trois cas doivent passer par les fonctions ci-dessous.
 */

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Vrai quand le site est exporté pour GitHub Pages. */
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

/** Chemin d'un fichier de `public/`, par exemple une image. */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * Adresse d'une page pour un formulaire ou un lien brut. Ajoute la barre
 * oblique finale en export statique, où chaque page est un dossier.
 */
export function route(path: string): string {
  const [pathname, query] = path.split("?");
  const withSlash =
    IS_STATIC_EXPORT && pathname !== "/" && !pathname.endsWith("/") ? `${pathname}/` : pathname;
  return `${BASE_PATH}${withSlash}${query ? `?${query}` : ""}`;
}
