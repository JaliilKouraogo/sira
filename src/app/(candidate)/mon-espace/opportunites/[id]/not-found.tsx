/**
 * 404 dédiée au détail d'offre : une offre retirée, expirée ou dont le lien
 * a été mal recopié ne doit pas renvoyer l'utilisatrice vers une impasse.
 */

import { IconBriefcase, IconSearch } from "@/components/icons";
import { ButtonLink, Card } from "@/components/ui";

export default function JobNotFound() {
  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
      <span
        className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]"
        aria-hidden
      >
        <IconBriefcase size={22} />
      </span>
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">Erreur 404</p>
      <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-[var(--color-text)]">
        Cette offre n&apos;est plus disponible
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
        Elle a peut-être été clôturée par le recruteur, retirée par la modération, ou l&apos;adresse est incorrecte.
        D&apos;autres opportunités correspondent à votre profil.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/mon-espace/opportunites" size="sm">
          <IconSearch size={15} />
          Voir les opportunités
        </ButtonLink>
        <ButtonLink href="/mon-espace/offres-enregistrees" variant="outline" size="sm">
          Mes offres enregistrées
        </ButtonLink>
        <ButtonLink href="/mon-espace" variant="ghost" size="sm">
          Tableau de bord
        </ButtonLink>
      </div>
    </Card>
  );
}
