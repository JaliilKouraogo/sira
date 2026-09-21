/** 404 dédiée au détail d'une candidature. */

import { IconArrowRight } from "@/components/icons";
import { IllustrationNoApplications } from "@/components/illustrations";
import { Breadcrumb, ButtonLink, EmptyState } from "@/components/ui";

export const metadata = {
  title: "Candidature introuvable — SIRA",
};

export default function ApplicationNotFound() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mon espace", href: "/mon-espace" },
          { label: "Mes candidatures", href: "/mon-espace/candidatures" },
          { label: "Candidature introuvable" },
        ]}
      />

      <EmptyState
        icon={<IllustrationNoApplications size={180} accent="var(--color-zone-candidate)" />}
        title="Cette candidature n'existe pas"
        description="Le dossier a peut-être été supprimé, ou le lien que vous avez suivi n'est plus valable. Vos candidatures en cours restent accessibles depuis la liste."
        action={
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <ButtonLink href="/mon-espace/candidatures" variant="primary">
              Revenir à mes candidatures
              <IconArrowRight size={15} />
            </ButtonLink>
            <ButtonLink href="/mon-espace/opportunites" variant="outline">
              Explorer les offres
            </ButtonLink>
          </div>
        }
      />
    </>
  );
}
