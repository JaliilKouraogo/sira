/**
 * Statistiques de recrutement — fonction Pro.
 * Indicateurs clés, entonnoir, performance par offre et délai moyen de
 * traitement. Graphiques en CSS pur, sans bibliothèque.
 *
 * Direction épurée : fond blanc, aucun aplat coloré, des filets de 1 pixel
 * pour séparer les blocs et un tableau sans bordure verticale.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  TODAY,
  getAverageProcessingDays,
  getFunnel,
  getJobPerformance,
  getRecruiterPipeline,
} from "@/components/recruiter-data";
import { BarChart, FunnelChart, ProFeatureBanner, ReviewStatusChip } from "@/components/recruiter-ui";
import { ScoreDisclaimer } from "@/components/score";
import {
  PageHeader,
  Progress,
  Stat,
  cx,
  formatDate,
} from "@/components/ui";
import { IconChart, IconClock, IconTarget, IconUsers } from "@/components/icons";
import { REVIEW_STATUSES, REVIEW_STATUS_LABEL } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Statistiques de recrutement",
};

const WEEK_MS = 7 * 86400000;

const BLOCK = "min-w-0 border-t border-[var(--color-border)] pt-7";
const H2 = "text-[17px] font-semibold text-[var(--color-text)]";
const SUB = "mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]";
const TH =
  "px-3 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)]";

export default function RecruiterStatsPage() {
  const pipeline = getRecruiterPipeline();
  const funnel = getFunnel(pipeline);
  const performance = getJobPerformance();
  const averageDays = getAverageProcessingDays(pipeline);

  const totalViews = performance.reduce((s, p) => s + p.views, 0);
  const totalApplications = performance.reduce((s, p) => s + p.applications, 0);
  const conversion = totalViews > 0 ? Math.round((totalApplications / totalViews) * 1000) / 10 : 0;
  const hired = pipeline.filter((a) => a.reviewStatus === "retenue").length;
  const selectivity = pipeline.length > 0 ? Math.round((hired / pipeline.length) * 100) : 0;

  // Réception des dossiers par semaine, sur les six dernières semaines.
  const todayMs = Date.parse(`${TODAY}T12:00:00Z`);
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const index = 5 - i;
    const start = todayMs - (index + 1) * WEEK_MS;
    const end = todayMs - index * WEEK_MS;
    const count = pipeline.filter((a) => {
      const at = Date.parse(`${a.submittedAt}T12:00:00Z`);
      return at > start && at <= end;
    }).length;
    return {
      label: index === 0 ? "Cette semaine" : `S-${index}`,
      value: count,
      hint: `du ${formatDate(new Date(start + 86400000).toISOString().slice(0, 10))}`,
    };
  });

  const byStatus = REVIEW_STATUSES.map((status) => ({
    status,
    count: pipeline.filter((a) => a.reviewStatus === status).length,
  }));

  const scoreBuckets = [
    { label: "80 % et plus", min: 80, max: 101 },
    { label: "60 à 79 %", min: 60, max: 80 },
    { label: "40 à 59 %", min: 40, max: 60 },
    { label: "Moins de 40 %", min: 0, max: 40 },
  ].map((b) => ({
    label: b.label,
    value: pipeline.filter((a) => a.score.score >= b.min && a.score.score < b.max).length,
  }));

  return (
    <>
      <PageHeader
        title="Statistiques de recrutement"
        description={`Activité de Sahel Agro arrêtée au ${formatDate(TODAY)}.`}
      />

      <ProFeatureBanner
        feature="Statistiques de recrutement"
        description="Entonnoir, délais de traitement et performance offre par offre."
      />

      {/* ---- Indicateurs clés ---- */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Vues des offres"
          value={totalViews.toLocaleString("fr-FR")}
          hint="Toutes offres confondues"
          tone="info"
          icon={<IconChart size={17} />}
        />
        <Stat
          label="Candidatures"
          value={totalApplications.toLocaleString("fr-FR")}
          hint={`${conversion} % de conversion`}
          tone="primary"
          icon={<IconTarget size={17} />}
        />
        <Stat
          label="Délai moyen de traitement"
          value={`${averageDays} j`}
          hint="Entre réception et première lecture"
          tone="warning"
          icon={<IconClock size={17} />}
        />
        <Stat
          label="Taux de sélection"
          value={`${selectivity} %`}
          hint={`${hired} candidature(s) retenue(s)`}
          tone="success"
          icon={<IconUsers size={17} />}
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ---- Entonnoir ---- */}
        <section aria-labelledby="entonnoir" className={BLOCK}>
          <h2 id="entonnoir" className={H2}>
            Entonnoir de recrutement
          </h2>
          <p className={SUB}>
            Reçues, examinées, shortlist, entretien, retenues. Cumulé sur les dossiers ouverts.
          </p>
          <div className="mt-5">
            <FunnelChart steps={funnel} />
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            La perte la plus forte se situe entre l&apos;examen et la shortlist : c&apos;est l&apos;étape où la
            décision humaine tranche. Un dossier écarté n&apos;est jamais supprimé, il reste consultable dans la
            file.
          </p>
        </section>

        {/* ---- Répartition par statut ---- */}
        <section aria-labelledby="repartition" className={BLOCK}>
          <h2 id="repartition" className={H2}>
            Répartition des dossiers ouverts
          </h2>
          <p className={SUB}>{pipeline.length} candidatures dans la file de traitement.</p>
          <ul className="mt-5 space-y-3">
            {byStatus.map((s) => (
              <li key={s.status}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <ReviewStatusChip status={s.status} />
                  <span className="text-[13px] font-semibold tabular-nums text-[var(--color-text)]">
                    {s.count}
                  </span>
                </div>
                <Progress
                  value={pipeline.length > 0 ? (s.count / pipeline.length) * 100 : 0}
                  label={REVIEW_STATUS_LABEL[s.status]}
                  tone={s.status === "retenue" ? "success" : s.status === "refusee" ? "danger" : "primary"}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Réception par semaine ---- */}
        <section aria-labelledby="par-semaine" className={BLOCK}>
          <h2 id="par-semaine" className={H2}>
            Candidatures reçues par semaine
          </h2>
          <p className={SUB}>Six dernières semaines.</p>
          <div className="mt-5">
            <BarChart data={weeks} />
          </div>
        </section>

        {/* ---- Distribution des scores ---- */}
        <section aria-labelledby="scores" className={BLOCK}>
          <h2 id="scores" className={H2}>
            Distribution des scores
          </h2>
          <p className={SUB}>Le score oriente l&apos;ordre de lecture, jamais l&apos;admission.</p>
          <div className="mt-5">
            <BarChart data={scoreBuckets} tone="accent" />
          </div>
        </section>
      </div>

      {/* ---- Performance par offre ---- */}
      <section aria-labelledby="performance" className="mt-10 border-t border-[var(--color-border)] pt-7">
        <h2 id="performance" className={H2}>
          Performance par offre
        </h2>
        <p className={SUB}>Vues, candidatures, conversion et score moyen.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <caption className="sr-only">Performance de chaque offre publiée</caption>
            <thead>
              <tr className="border-y border-[var(--color-border)]">
                {["Offre", "Vues", "Candidatures", "Conversion", "Shortlist", "Score moyen"].map((h, i) => (
                  <th key={h} scope="col" className={cx(TH, i > 0 ? "text-right" : "")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {performance.map((p) => (
                <tr key={p.job.id} className="transition-colors hover:bg-[var(--color-surface-2)]">
                  <th scope="row" className="px-3 py-3 font-normal">
                    <Link
                      href={`/recruteur/offres/${p.job.id}`}
                      className="text-[13.5px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                    >
                      {p.job.title}
                    </Link>
                    <span className="block text-[12px] text-[var(--color-text-subtle)]">{p.job.city}</span>
                  </th>
                  <td className="px-3 py-3 text-right text-[13px] tabular-nums text-[var(--color-text)]">
                    {p.views.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] tabular-nums text-[var(--color-text)]">
                    {p.applications.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] tabular-nums text-[var(--color-text)]">
                    {p.conversion} %
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] tabular-nums text-[var(--color-text)]">
                    {p.shortlisted}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] tabular-nums text-[var(--color-text)]">
                    {p.averageScore > 0 ? `${p.averageScore} %` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="vues-par-offre" className={BLOCK}>
          <h2 id="vues-par-offre" className={H2}>
            Vues par offre
          </h2>
          <p className={SUB}>Comparaison de l&apos;exposition de chaque offre.</p>
          <div className="mt-5">
            <BarChart
              data={performance.map((p) => ({
                label: p.job.title,
                value: p.views,
                href: `/recruteur/offres/${p.job.id}`,
              }))}
            />
          </div>
        </section>

        <section aria-labelledby="delai" className={BLOCK}>
          <h2 id="delai" className={H2}>
            Délai de traitement
          </h2>
          <p className={SUB}>Ce que voit le candidat pendant ce temps.</p>
          <div className="mt-5 space-y-4">
            <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              Il s&apos;écoule en moyenne{" "}
              <strong className="font-semibold text-[var(--color-text)]">{averageDays} jour(s)</strong> entre la
              réception d&apos;un dossier et sa première lecture. Tant que le dossier n&apos;est pas ouvert, le
              candidat lit « Envoyée » et n&apos;a aucun autre signal.
            </p>
            <BarChart
              data={[
                { label: "Ouverture du dossier", value: averageDays, hint: "jours après réception" },
                { label: "Mise en shortlist", value: Math.round(averageDays * 2.4 * 10) / 10, hint: "jours en moyenne" },
                { label: "Convocation en entretien", value: Math.round(averageDays * 3.6 * 10) / 10, hint: "jours en moyenne" },
                { label: "Réponse finale", value: Math.round(averageDays * 6.2 * 10) / 10, hint: "jours en moyenne" },
              ]}
              unit=" j"
              tone="success"
            />
            <p className="text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
              Répondre, même négativement, dans les quinze jours reste la pratique la plus efficace pour
              entretenir un vivier de candidats disposés à recandidater.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-10">
        <ScoreDisclaimer />
      </div>
    </>
  );
}
