/**
 * Verrou de défilement partagé.
 *
 * Deux éléments peuvent recouvrir l'écran en même temps sur téléphone : le
 * menu de navigation et l'assistant en bulle. Si chacun mémorise et restaure
 * de son côté la valeur de `overflow`, le dernier à se fermer peut remettre la
 * valeur « hidden » laissée par l'autre et bloquer la page définitivement.
 *
 * Le compteur ci-dessous évite ce cas : la page n'est débloquée que lorsque
 * plus personne ne demande le verrou.
 */

let holders = 0;
let previousOverflow = "";

/** Bloque le défilement de la page et renvoie la fonction qui le rétablit. */
export function lockBodyScroll(): () => void {
  if (holders === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  holders += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders = Math.max(0, holders - 1);
    if (holders === 0) document.body.style.overflow = previousOverflow;
  };
}
