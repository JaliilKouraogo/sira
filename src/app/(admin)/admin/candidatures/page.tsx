/**
 * Back-office — candidatures, en lecture seule [T §21.3].
 *
 * Aucune action n'est offerte ici, volontairement : la décision de recrutement
 * appartient au recruteur, la candidature appartient au candidat.
 * L'administration n'observe que le fonctionnement du service.
 *
 * Direction épurée : tableau posé à même la page, séparé par un filet, et
 * chiffres clés neutres.
 */

import type { Metadata } from "next";
import {
  BarChart,
  PREPARATION_TONE,
  REVIEW_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
  fullName,
  orgName,
} from "@/components/admin-kit";
import { ScoreBadge } from "@/components/score";
import { Alert, Badge, PageHeader, Stat, formatDate, relativeDays } from "@/components/ui";
import { getApplications, getCandidateProfile, getJobById, getOrganization, getUserById } from "@/data/queries";
import {
  APPLICATION_CHANNEL_LABEL,
  PREPARATION_STATUSES,
  PREPARATION_STATUS_LABEL,
  REVIEW_STATUSES,
  REVIEW_STATUS_LABEL,
  SCORE_DISCLAIMER,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Candidatures | Administration SIRA",
};

export default function AdminApplicationsPage() {
  const applications = getApplications();
  const profile = getCandidateProfile();
  const candidate = getUserById(profile.userId);

  const sent = applications.filter((a) => a.preparationStatus === "envoyee");
  const aiAssisted = applications.filter((a) => a.documents.some((d) => d.aiJobId));
  const humanEdited = applications.filter((a) => a.documents.some((d) => d.editedByHuman));

  const byPreparation = PREPARATION_STATUSES.map((status) => ({
    label: PREPARATION_STATUS_LABEL[status],
    value: applications.filter((a) => a.preparationStatus === status).length,
  })).filter((row) => row.value > 0);

  const byReview = REVIEW_STATUSES.map((status) => ({
    label: REVIEW_STATUS_LABEL[status],
    value: applications.filter((a) => a.reviewStatus === status).length,
  })).filter((row) => row.value > 0);

  return (
    <>
      <PageHeader
        title="Candidatures"
        description="Consultation en lecture seule. Cet écran sert à mesurer le fonctionnement du service et à instruire un litige, jamais à peser sur une sélection."
      />

      <Alert tone="warning" title="L'administration n'intervient pas dans les décisions de recrutement">
        Aucun bouton d&apos;action n&apos;existe sur cet écran. Un administrateur ne peut ni modifier un état
        d&apos;examen, ni retirer une candidature, ni consulter le contenu des documents produits : il voit la
        mécanique, pas les pièces. En cas de litige, la procédure passe par la modération et laisse une trace au
        journal d&apos;audit.
      </Alert>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Candidatures préparées" value={formatInt(applications.length)} />
        <Stat label="Candidatures envoyées" value={formatInt(sent.length)} />
        <Stat
          label="Préparées avec l'IA"
          value={formatPercent(applications.length === 0 ? 0 : (aiAssisted.length / applications.length) * 100, 0)}
          hint={`${aiAssisted.length} sur ${applications.length}`}
        />
        <Stat
          label="Relues par la personne"
          value={formatPercent(applications.length === 0 ? 0 : (humanEdited.length / applications.length) * 100, 0)}
          hint="Documents modifiés à la main avant envoi"
        />
      </div>

      {/* ---- Liste ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">{applications.length} candidatures</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Deux axes d&apos;état : la préparation côté candidat, l&apos;examen côté recruteur. Le candidat ne voit
            jamais l&apos;état interne du recruteur.
          </p>
        </div>
        <Table
          head={["Candidat", "Offre", "Organisation", "Préparation", "Examen", "Score gelé", "Canal", "Envoyée"]}
          minWidth={1100}
        >
          {applications.map((app) => {
            const job = getJobById(app.jobId);
            const org = job ? getOrganization(job.organizationId) : undefined;
            return (
              <Tr key={app.id}>
                <Td className="font-medium">{fullName(candidate)}</Td>
                <Td className="max-w-[240px]">
                  <p className="truncate">{job?.title ?? "Offre supprimée"}</p>
                  <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                    {app.documents.length} document(s) · mise à jour {relativeDays(app.updatedAt)}
                  </p>
                </Td>
                <TdMuted>{orgName(org)}</TdMuted>
                <Td>
                  <Badge tone={PREPARATION_TONE[app.preparationStatus]}>
                    {PREPARATION_STATUS_LABEL[app.preparationStatus]}
                  </Badge>
                </Td>
                <Td>
                  {app.reviewStatus ? (
                    <Badge tone={REVIEW_TONE[app.reviewStatus]}>{REVIEW_STATUS_LABEL[app.reviewStatus]}</Badge>
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-subtle)]">Pas encore envoyée</span>
                  )}
                </Td>
                <Td>{app.frozenScore != null ? <ScoreBadge score={app.frozenScore} size="sm" /> : "—"}</Td>
                <TdMuted>{APPLICATION_CHANNEL_LABEL[app.channelUsed]}</TdMuted>
                <TdMuted>{app.submittedAt ? formatDate(app.submittedAt) : "—"}</TdMuted>
              </Tr>
            );
          })}
        </Table>
        <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--color-text-subtle)]">{SCORE_DISCLAIMER}</p>
      </section>

      {/* ---- Répartitions ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par état de préparation</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Axe candidat</p>
          <div className="mt-4">
            <BarChart items={byPreparation} tone="info" />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par état d&apos;examen</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Axe recruteur, sur les candidatures envoyées
          </p>
          <div className="mt-4">
            <BarChart items={byReview} tone="primary" emptyLabel="Aucune candidature encore examinée" />
          </div>
        </div>
      </section>
    </>
  );
}
