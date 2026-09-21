/**
 * Mes candidatures — liste groupée par étape.
 *
 * Les onglets sont des liens : l'état vit dans l'URL. Le site étant exporté
 * en fichiers statiques, l'en-tête et les chiffres clés sont rendus ici, les
 * onglets et la liste le sont par `ApplicationsList`, qui lit l'adresse dans
 * le navigateur. Le score affiché est celui figé au dépôt, jamais le score
 * courant, et l'état montré est toujours l'état projeté côté candidat.
 */

import { Suspense } from "react";
import { applicationBucket, type ApplicationBucket } from "@/components/account-shared";
import { IconBriefcase, IconTarget } from "@/components/icons";
import { ButtonLink, PageHeader, Stat } from "@/components/ui";
import { getApplications } from "@/data/queries";
import { TabbedListSkeleton } from "../list-skeleton";
import { ApplicationsList } from "./applications-client";

export const metadata = {
  title: "Mes candidatures — SIRA",
};

export default function ApplicationsPage() {
  const all = getApplications();
  const counts = all.reduce<Record<ApplicationBucket, number>>(
    (acc, application) => {
      acc[applicationBucket(application)] += 1;
      return acc;
    },
    { preparation: 0, envoyees: 0, terminees: 0, archivees: 0 },
  );

  return (
    <>
      <PageHeader
        title="Mes candidatures"
        description="Chaque dossier avec son état, son score figé au dépôt et l'action qui vous attend."
        action={
          <ButtonLink href="/mon-espace/opportunites" variant="primary" size="md">
            <IconBriefcase size={16} />
            Trouver une offre
          </ButtonLink>
        }
      />

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total" value={all.length} icon={<IconTarget size={16} />} tone="primary" />
        <Stat label="En préparation" value={counts.preparation} hint="À finaliser de votre côté" />
        <Stat label="Envoyées" value={counts.envoyees} hint="En attente de réponse" />
        <Stat label="Terminées" value={counts.terminees} hint="Réponse reçue" />
      </div>

      <Suspense fallback={<TabbedListSkeleton label="Chargement de vos candidatures…" rows={all.length || 3} />}>
        <ApplicationsList />
      </Suspense>

      <p className="mt-8 border-t border-[var(--color-border)] pt-4 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
        Le pourcentage affiché sur chaque ligne est le <strong className="font-semibold text-[var(--color-text)]">score
        figé au moment du dépôt</strong>. Il ne bouge plus ensuite, même si votre profil ou l&apos;offre évoluent.
        Estimation algorithmique, elle ne garantit pas le recrutement.
      </p>
    </>
  );
}
