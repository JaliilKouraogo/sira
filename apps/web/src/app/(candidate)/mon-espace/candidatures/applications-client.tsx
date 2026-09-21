"use client";

/**
 * Onglets et liste de « Mes candidatures ».
 *
 * Les onglets restent des liens : l'état vit dans l'URL (`?etat=`). Pour
 * l'export statique, l'adresse est lue dans le navigateur avec
 * `useSearchParams()`. Le score affiché est celui figé au dépôt, jamais le
 * score courant, et l'état montré est toujours l'état projeté côté candidat.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BUCKET_LABEL,
  CandidateStateChip,
  ChannelBadge,
  TabLinks,
  applicationBucket,
  type ApplicationBucket,
} from "@/components/account-shared";
import { IconArrowRight } from "@/components/icons";
import { IllustrationNoApplications } from "@/components/illustrations";
import { ScoreBadge } from "@/components/score";
import { Avatar, ButtonLink, EmptyState, formatDate, relativeDays } from "@/components/ui";
import { getApplications, getJobById, getOrganization } from "@/data/queries";
import { PREPARATION_STATUS_LABEL } from "@/lib/enums";
import type { Application } from "@/lib/types";

type TabKey = "toutes" | ApplicationBucket;

const TAB_ORDER: TabKey[] = ["toutes", "preparation", "envoyees", "terminees", "archivees"];

/** Action proposée sur la ligne, selon l'avancement de la préparation. */
function rowAction(application: Application): { label: string; primary: boolean } {
  if (application.isArchived) return { label: "Consulter", primary: false };
  switch (application.preparationStatus) {
    case "brouillon":
      return { label: "Reprendre la préparation", primary: true };
    case "generee":
    case "a_verifier":
      return { label: "Vérifier et valider", primary: true };
    case "validee":
      return {
        label: application.channelUsed === "externe" ? "Télécharger et envoyer" : "Envoyer ma candidature",
        primary: true,
      };
    case "envoyee":
      return { label: "Suivre", primary: false };
  }
}

export function ApplicationsList() {
  const requested = useSearchParams().get("etat") ?? "";
  const current: TabKey = (TAB_ORDER as string[]).includes(requested) ? (requested as TabKey) : "toutes";

  const all = getApplications();
  const counts = all.reduce<Record<ApplicationBucket, number>>(
    (acc, application) => {
      acc[applicationBucket(application)] += 1;
      return acc;
    },
    { preparation: 0, envoyees: 0, terminees: 0, archivees: 0 },
  );

  const visible = current === "toutes" ? all : all.filter((a) => applicationBucket(a) === current);

  const tabs = TAB_ORDER.map((key) => ({
    key,
    label: key === "toutes" ? "Toutes" : BUCKET_LABEL[key],
    href: key === "toutes" ? "/mon-espace/candidatures" : `/mon-espace/candidatures?etat=${key}`,
    count: key === "toutes" ? all.length : counts[key],
  }));

  /** Regroupement affiché : une section par étape dans l'onglet « Toutes ». */
  const sections: { bucket: ApplicationBucket; items: Application[] }[] = (
    ["preparation", "envoyees", "terminees", "archivees"] as ApplicationBucket[]
  )
    .map((bucket) => ({ bucket, items: visible.filter((a) => applicationBucket(a) === bucket) }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <TabLinks tabs={tabs} current={current} label="Filtrer les candidatures par état" />

      {visible.length === 0 ? (
        <EmptyState
          icon={<IllustrationNoApplications size={180} accent="var(--color-zone-candidate)" />}
          title={
            current === "toutes"
              ? "Aucune candidature pour le moment"
              : `Aucune candidature dans « ${BUCKET_LABEL[current as ApplicationBucket]} »`
          }
          description="Dès que vous préparez un dossier depuis une offre, il apparaît ici avec son état et son historique."
          action={
            <ButtonLink href="/mon-espace/opportunites" variant="primary">
              Voir les offres qui me correspondent
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-7">
          {sections.map((section) => (
            <section key={section.bucket}>
              <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]">
                {BUCKET_LABEL[section.bucket]}
                <span className="rounded-full bg-[var(--color-surface-3)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--color-text-muted)]">
                  {section.items.length}
                </span>
              </h2>
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {section.items.map((application) => (
                  <ApplicationRow key={application.id} application={application} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function ApplicationRow({ application }: { application: Application }) {
  const job = getJobById(application.jobId);
  const organization = job ? getOrganization(job.organizationId) : undefined;
  const action = rowAction(application);
  const href = `/mon-espace/candidatures/${application.id}`;
  const dateLabel = application.submittedAt
    ? `Envoyée le ${formatDate(application.submittedAt)}`
    : `Mise à jour ${relativeDays(application.updatedAt)}`;

  return (
    <li className="relative py-4 transition-colors hover:bg-[var(--color-surface-2)]">
      <div className="flex gap-3.5">
        <Avatar
          initials={organization?.logoInitials ?? "??"}
          color={organization?.logoColor}
          size={44}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-semibold leading-snug text-[var(--color-text)]">
                <Link href={href} className="before:absolute before:inset-0 hover:text-[var(--color-primary)]">
                  {job?.title ?? "Offre indisponible"}
                </Link>
              </h3>
              <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">
                {organization?.tradeName ?? organization?.legalName ?? "Organisation"}
                {job ? ` · ${job.city}` : null}
              </p>
            </div>
            {application.frozenScore !== undefined ? (
              <span className="flex flex-col items-end gap-0.5">
                <ScoreBadge score={application.frozenScore} size="sm" />
                <span className="text-[11px] text-[var(--color-text-subtle)]">score figé au dépôt</span>
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <CandidateStateChip application={application} />
            <ChannelBadge channel={application.channelUsed} />
            {application.preparationStatus !== "envoyee" ? (
              <span className="text-[12px] text-[var(--color-text-subtle)]">
                Préparation : {PREPARATION_STATUS_LABEL[application.preparationStatus]}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12.5px] text-[var(--color-text-muted)]">
              {dateLabel} · {application.documents.length} document
              {application.documents.length > 1 ? "s" : ""}
            </span>
            <Link
              href={href}
              className={
                action.primary
                  ? "relative z-10 inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-[13px] font-medium text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)]"
                  : "relative z-10 inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] px-3 text-[13px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
              }
            >
              {action.label}
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
