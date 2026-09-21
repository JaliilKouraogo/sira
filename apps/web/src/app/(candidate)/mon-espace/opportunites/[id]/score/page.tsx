/**
 * Explication détaillée du score de compatibilité — [T §6.4].
 *
 * Tout ce qui est affiché ici vient de `ScoreBreakdown`, qui porte déjà la
 * mention d'estimation algorithmique. L'écran y ajoute la pédagogie : comment
 * la pondération fonctionne, ce que fait un critère indispensable non
 * satisfait, et quand le score est recalculé.
 *
 * Export statique : les mêmes offres que le détail sont pré-générées, par
 * identifiant et par slug.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CandidatePremiumCard } from "@/components/candidate-premium-card";
import { IconArrowRight, IconSparkles } from "@/components/icons";
import { IllustrationMatch, IllustrationNoResults } from "@/components/illustrations";
import { ScoreBreakdown, ScoreRing, scoreLabel } from "@/components/score";
import {
  Alert,
  Badge,
  Breadcrumb,
  ButtonLink,
  EmptyState,
  Progress,
  relativeDays,
} from "@/components/ui";
import { getJobBySlug, getJobOrganization, getScore } from "@/data/queries";
import {
  BLOCKING_CRITERIA_CAP,
  SCORE_COMPONENT_LABEL,
  SCORE_WEIGHTS,
  type ScoreComponent,
} from "@/lib/enums";
import { candidateJobParams } from "../static-params";

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return candidateJobParams();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = getJobBySlug(id);
  return {
    title: job ? `Score de compatibilité — ${job.title}` : "Score de compatibilité",
    description: "Le détail des six composantes qui forment votre score SIRA et les actions pour le faire progresser.",
  };
}

/** Ce que mesure chaque composante, en une phrase compréhensible. */
const COMPONENT_EXPLANATION: Record<ScoreComponent, string> = {
  competences: "Recoupement entre les compétences exigées par l'offre et celles présentes dans votre profil et votre CV.",
  experience: "Écart entre les années d'expérience demandées et celles constatées sur votre parcours.",
  formation: "Adéquation entre le niveau d'études exigé et le diplôme le plus élevé de votre profil.",
  localisation: "Distance entre le lieu du poste, votre ville et vos zones de recherche, mobilité déclarée comprise.",
  langues: "Comparaison des langues et des niveaux demandés avec ceux que vous avez déclarés.",
  disponibilite: "Cohérence entre votre disponibilité, le type de contrat recherché et celui proposé.",
};

export default async function ScoreExplanationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJobBySlug(id);
  if (!job) notFound();

  const organization = getJobOrganization(job);
  const score = getScore(job.id);
  const orgName =
    job.visibility === "anonymisee"
      ? "Entreprise confidentielle"
      : (organization?.tradeName ?? organization?.legalName ?? "Organisation");
  const weights = Object.entries(SCORE_WEIGHTS) as [ScoreComponent, number][];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mon espace", href: "/mon-espace" },
          { label: "Opportunités", href: "/mon-espace/opportunites" },
          { label: job.title, href: `/mon-espace/opportunites/${job.id}` },
          { label: "Score" },
        ]}
      />

      <header className="mb-6 border-b border-[var(--color-border)] pb-6">
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">
          Pourquoi ce score&nbsp;?
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-text-muted)]">
          {job.title} — {orgName}
        </p>
      </header>

      {score ? (
        <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* ---- Le score en grand ---- */}
            <section className="border-b border-[var(--color-border)] py-7 lg:pt-1">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <ScoreRing score={score.score} size={168} />
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold text-[var(--color-text)]">{scoreLabel(score.score)}</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
                    Ce score compare votre profil SIRA aux exigences de cette offre, composante par composante. Il ne
                    dit pas si vous devez postuler&nbsp;: il vous dit où vous êtes attendue et ce qui manque.
                  </p>
                  <p className="mt-2 text-[12.5px] text-[var(--color-text-subtle)]">
                    Dernier calcul {relativeDays(score.computedAt)}.
                  </p>
                  <ButtonLink
                    href={`/mon-espace/opportunites/${job.id}`}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Revenir à l&apos;offre
                    <IconArrowRight size={15} />
                  </ButtonLink>
                </div>
              </div>
            </section>

            {/* ---- Le détail complet, mention obligatoire incluse ---- */}
            <section className="py-7">
              <h2 className="mb-4 text-[17px] font-semibold text-[var(--color-text)]">Le détail composante par composante</h2>
              <ScoreBreakdown score={score} />
            </section>
          </div>

          <aside className="lg:border-l lg:border-[var(--color-border)] lg:pl-8">
            {/* ---- Comment ce score est calculé ---- */}
            <section className="border-b border-[var(--color-border)] py-7 lg:pt-1">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Comment ce score est calculé</h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                Six composantes pondérées, ramenées sur 100.
              </p>
              <div className="mt-4 hidden justify-center text-[var(--color-text-subtle)] sm:flex">
                <IllustrationMatch size={150} accent="var(--color-zone-candidate)" />
              </div>
              <div className="mt-4">
                <ul className="space-y-3">
                  {weights.map(([key, weight]) => (
                    <li key={key}>
                      <p className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="font-medium text-[var(--color-text)]">{SCORE_COMPONENT_LABEL[key]}</span>
                        <Badge tone="neutral">{Math.round(weight * 100)} %</Badge>
                      </p>
                      <Progress
                        value={weight * 100}
                        tone="primary"
                        label={`Poids de la composante ${SCORE_COMPONENT_LABEL[key]}`}
                      />
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                        {COMPONENT_EXPLANATION[key]}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-3">
                  <p className="rounded-md bg-[var(--color-surface-2)] p-3 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                    Chaque composante est notée sur 100, puis multipliée par son poids. La somme des poids fait 100 %,
                    le résultat est arrondi à l&apos;unité.
                  </p>
                  <Alert tone="warning" title="Critère indispensable">
                    Un critère indispensable non satisfait — un permis, un diplôme, une convention de stage — plafonne
                    le score à {BLOCKING_CRITERIA_CAP} %, même si toutes les autres composantes sont excellentes.
                  </Alert>
                  <Alert tone="info" title="Un score qui bouge">
                    Le score est recalculé à chaque évolution&nbsp;: nouvelle compétence sur votre profil, CV mis à
                    jour, ou modification de l&apos;offre par le recruteur. Ce n&apos;est pas une note figée.
                  </Alert>
                </div>
              </div>
            </section>

            <section className="border-b border-[var(--color-border)] py-7">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]">
                <IconSparkles size={15} />
                Faire progresser ce score
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                Complétez les rubriques manquantes de votre profil, puis suivez les formations qui couvrent vos
                lacunes. Le nouveau score s&apos;applique à toutes les offres du même métier.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href="/mon-espace/profil" variant="outline" size="sm">
                  Compléter mon profil
                </ButtonLink>
                <ButtonLink href="/mon-espace/formations" variant="ghost" size="sm">
                  Voir les formations
                </ButtonLink>
              </div>
            </section>

            <div className="py-7">
              <CandidatePremiumCard
                title="Analyse de vos points faibles"
                description="Premium détaille, offre par offre, ce qui vous coûte le plus de points et comment y remédier."
                features={[
                  "Diagnostic détaillé des écarts",
                  "Plan de progression personnalisé",
                  "Préparation aux entretiens",
                ]}
              />
            </div>
          </aside>
        </div>
      ) : (
        <EmptyState
          icon={<IllustrationNoResults size={180} accent="var(--color-zone-candidate)" />}
          title="Aucun score calculé pour cette offre"
          description="L'assistant calcule les scores à partir de votre profil et de votre CV. Complétez votre profil pour déclencher le calcul."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/mon-espace/profil" size="sm">
                Compléter mon profil
              </ButtonLink>
              <ButtonLink href={`/mon-espace/opportunites/${job.id}`} variant="outline" size="sm">
                Revenir à l&apos;offre
              </ButtonLink>
            </div>
          }
        />
      )}
    </>
  );
}
