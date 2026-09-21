"use client";

/**
 * Emplacement du panneau de préparation sur le détail d'offre.
 *
 * `?action=preparer` ouvre le panneau au-dessus de l'offre. La page étant
 * exportée en fichiers statiques, l'adresse est lue dans le navigateur : le
 * panneau apparaît aussi bien au chargement direct du lien qu'après un clic
 * sur « Préparer ma candidature ».
 */

import { useSearchParams } from "next/navigation";
import { PreparationPanel } from "./preparation-panel";

export function PreparationSlot(props: {
  jobTitle: string;
  consumed: number;
  limit: number | null;
  period: string;
  applicationsHref: string;
}) {
  const params = useSearchParams();
  if (params.get("action") !== "preparer") return null;
  return <PreparationPanel {...props} />;
}
