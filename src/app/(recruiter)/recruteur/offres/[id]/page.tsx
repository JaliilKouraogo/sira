/**
 * Édition d'une offre existante.
 * Mêmes champs pré-remplis que la publication, plus les statistiques de
 * l'offre et les transitions d'état.
 *
 * Direction épurée : les blocs sont posés sur fond blanc et séparés par des
 * filets de 1 pixel, sans carte empilée ni ombre.
 *
 * Export statique : seules les offres de l'organisation du recruteur de
 * démonstration sont pré-générées ; toute autre offre reste en 404.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById, getOrganization, getRecruiterJobs } from "@/data/queries";
import { RECRUITER_ORG_ID, getRecruiterPipeline } from "@/components/recruiter-data";
import { JobStateActions } from "@/components/recruiter-job-actions";
import { RecruiterJobForm } from "@/components/recruiter-job-form";
import { JobStatusChip, VerificationPolicyPanel } from "@/components/recruiter-ui";
import { ScoreDisclaimer } from "@/components/score";
import {
  Badge,
  Breadcrumb,
  PageHeader,
  Progress,
  cx,
  daysUntil,
  formatDate,
  relativeDays,
} from "@/components/ui";
import { REVIEW_STATUSES, REVIEW_STATUS_LABEL } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Modifier une offre",
};

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return getRecruiterJobs(RECRUITER_ORG_ID).map((job) => ({ id: job.id }));
}

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJobById(id);
  const organization = getOrganization(RECRUITER_ORG_ID);

  if (!job || !organization || job.organizationId !== RECRUITER_ORG_ID) {
    notFound();
  }

  const pipeline = getRecruiterPipeline().filter((a) => a.jobId === job.id);
  const remaining = daysUntil(job.deadline);
  const conversion = job.viewCount > 0 ? Math.round((job.applicationCount / job.viewCount) * 1000) / 10 : 0;
  const averageScore =
    pipeline.length > 0 ? Math.round(pipeline.reduce((s, a) => s + a.score.score, 0) / pipeline.length) : 0;

  const byStatus = REVIEW_STATUSES.map((status) => ({
    status,
    count: pipeline.filter((a) => a.reviewStatus === status).length,
  }));

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Espace recruteur", href: "/recruteur" },
          { label: "Mes offres", href: "/recruteur/offres" },
          { label: job.title },
        ]}
      />

      <PageHeader
        title={job.title}
        description={`${job.city} · publiée ${relativeDays(job.publishedAt)} · date limite au ${formatDate(job.deadline)}`}
        action={<JobStatusChip status={job.status} />}
      />

      {/* ---- Statistiques de l'offre ---- */}
      <div className="grid gap-10 border-t border-[var(--color-border)] pt-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-labelledby="stats-offre" className="min-w-0">
          <h2 id="stats-offre" className="text-[17px] font-semibold text-[var(--color-text)]">
            Statistiques de cette offre
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Depuis la mise en ligne.</p>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] pt-4 sm:grid-cols-4">
            {[
              { label: "Vues", value: job.viewCount.toLocaleString("fr-FR") },
              { label: "Candidatures", value: job.applicationCount.toLocaleString("fr-FR") },
              { label: "Taux de conversion", value: `${conversion} %` },
              { label: "Score moyen", value: averageScore > 0 ? `${averageScore} %` : "—" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-[12.5px] text-[var(--color-text-muted)]">{s.label}</dt>
                <dd className="mt-0.5 text-[20px] font-semibold tabular-nums text-[var(--color-text)]">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <ScoreDisclaimer />
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-4">
            <h3 className="text-[14px] font-semibold text-[var(--color-text)]">
              Répartition des {pipeline.length} dossiers ouverts
            </h3>
            {pipeline.length === 0 ? (
              <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
                Aucun dossier dans la file de traitement pour cette offre.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {byStatus
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <li key={s.status}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                        <span className="text-[var(--color-text)]">{REVIEW_STATUS_LABEL[s.status]}</span>
                        <span className="tabular-nums text-[var(--color-text-muted)]">{s.count}</span>
                      </div>
                      <Progress value={(s.count / pipeline.length) * 100} label={REVIEW_STATUS_LABEL[s.status]} />
                    </li>
                  ))}
              </ul>
            )}
            <Link
              href={`/recruteur/candidatures?offre=${job.id}`}
              className="mt-4 inline-block text-[13px] font-medium text-[var(--color-primary)] hover:underline"
            >
              Ouvrir les candidatures de cette offre
            </Link>
          </div>
        </section>

        <aside className="min-w-0">
          <section aria-labelledby="transitions">
            <h2 id="transitions" className="text-[14px] font-semibold text-[var(--color-text)]">
              Transitions d&apos;état
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Effet immédiat sur la visibilité de l&apos;offre.
            </p>
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <JobStateActions status={job.status} title={job.title} />
            </div>
          </section>

          <section aria-labelledby="echeance" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 id="echeance" className="text-[14px] font-semibold text-[var(--color-text)]">
              Échéance
            </h2>
            <p
              className={cx(
                "mt-1 text-[13px] leading-relaxed",
                remaining < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]",
              )}
            >
              {remaining < 0
                ? `Date limite dépassée depuis ${Math.abs(remaining)} jour${Math.abs(remaining) > 1 ? "s" : ""}. L'offre n'accepte plus de candidature.`
                : `Il reste ${remaining} jour${remaining > 1 ? "s" : ""} avant la clôture automatique.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="neutral">Origine : publiée sur SIRA</Badge>
              <Badge tone="neutral">{job.requiredDocuments.length} pièce(s) demandée(s)</Badge>
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-10 border-t border-[var(--color-border)] pt-8">
        <RecruiterJobForm
          mode="edit"
          initial={job}
          organization={organization}
          verificationStatus={organization.verificationStatus}
          policy={<VerificationPolicyPanel status={organization.verificationStatus} />}
        />
      </div>
    </>
  );
}
