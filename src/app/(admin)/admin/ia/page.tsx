/**
 * Back-office — paramètres IA, matching et coûts [T §21.5].
 *
 * Deux sujets sur un seul écran, parce qu'ils ne se décident pas l'un sans
 * l'autre : relever une pondération ou baisser un seuil de notification
 * change le volume d'appels, donc la facture.
 *
 * Direction épurée : réglages, graphiques et journaux posés à même la page,
 * séparés par des filets, sans carte ni ombre.
 */

import type { Metadata } from "next";
import { AdminScoreWeights } from "@/components/admin-score-weights";
import {
  AI_STATUS_TONE,
  BarChart,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatMs,
  formatPercent,
  formatUsd,
  fullName,
} from "@/components/admin-kit";
import { IllustrationMatch } from "@/components/illustrations";
import { Alert, Badge, PageHeader, Stat, Tag, formatDate } from "@/components/ui";
import { getAiJobs, getAllUsers, getUserById } from "@/data/queries";
import {
  AI_JOB_STATUS_LABEL,
  AI_JOB_TYPES,
  AI_JOB_TYPE_LABEL,
  BLOCKING_CRITERIA_CAP,
  SCORE_DISCLAIMER,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "IA et matching | Administration SIRA",
};

/** Affectation des modèles par tâche — section 9 du plan. */
const MODEL_ASSIGNMENT: { model: string; usage: string; rationale: string }[] = [
  {
    model: "claude-opus-5",
    usage: "Score de compatibilité, adaptation du CV, lettre, e-mail, message WhatsApp",
    rationale: "Tâches de raisonnement et de rédaction, où la qualité se voit immédiatement par le candidat.",
  },
  {
    model: "claude-sonnet-5",
    usage: "Résumé de candidat, recommandation de formation, préparation à l'entretien",
    rationale: "Bon compromis qualité-coût sur des synthèses courtes produites en volume.",
  },
  {
    model: "claude-haiku-4-5",
    usage: "Analyse de CV, classification métier",
    rationale: "Extraction structurée, appelée à chaque dépôt de CV : le coût unitaire prime.",
  },
];

export default function AdminAiPage() {
  const aiJobs = getAiJobs();
  const users = getAllUsers();

  const finished = aiJobs.filter((j) => j.status === "succeeded" || j.status === "failed");
  const failed = aiJobs.filter((j) => j.status === "failed");
  const succeeded = aiJobs.filter((j) => j.status === "succeeded");

  const totalCost = aiJobs.reduce((sum, j) => sum + j.costUsd, 0);
  const totalTokens = aiJobs.reduce((sum, j) => sum + j.inputTokens + j.outputTokens, 0);
  const cachedTokens = aiJobs.reduce((sum, j) => sum + j.cachedTokens, 0);
  const averageLatency =
    succeeded.length === 0 ? 0 : succeeded.reduce((sum, j) => sum + j.latencyMs, 0) / succeeded.length;
  const failureRate = finished.length === 0 ? 0 : (failed.length / finished.length) * 100;

  const activeUserIds = Array.from(new Set(aiJobs.map((j) => j.userId)));
  const costPerActiveUser = activeUserIds.length === 0 ? 0 : totalCost / activeUserIds.length;
  const costPerUser = totalCost / Math.max(1, users.length);

  const byType = AI_JOB_TYPES.map((type) => {
    const jobsOfType = aiJobs.filter((j) => j.type === type);
    const cost = jobsOfType.reduce((sum, j) => sum + j.costUsd, 0);
    return { label: AI_JOB_TYPE_LABEL[type], value: cost, display: formatUsd(cost), count: jobsOfType.length };
  }).filter((row) => row.count > 0);

  const byUser = activeUserIds.map((userId) => {
    const jobsOfUser = aiJobs.filter((j) => j.userId === userId);
    const cost = jobsOfUser.reduce((sum, j) => sum + j.costUsd, 0);
    return {
      userId,
      label: fullName(getUserById(userId)),
      value: cost,
      display: formatUsd(cost),
      count: jobsOfUser.length,
    };
  });

  const byModel = Array.from(new Set(aiJobs.map((j) => j.model))).map((model) => {
    const jobsOfModel = aiJobs.filter((j) => j.model === model);
    const cost = jobsOfModel.reduce((sum, j) => sum + j.costUsd, 0);
    return { label: model, value: cost, display: formatUsd(cost), count: jobsOfModel.length };
  });

  return (
    <>
      <PageHeader
        title="IA et matching"
        description="Réglage du modèle de score et suivi de la dépense. Chaque appel est journalisé avec son modèle, ses jetons, son coût et sa latence."
      />

      <Alert tone="info" title="Mention obligatoire, jamais désactivable">
        {SCORE_DISCLAIMER} Cette mention accompagne tout score affiché à un candidat comme à un recruteur, quelle que
        soit la configuration retenue ci-dessous.
      </Alert>

      {/* ---- Réglages ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Paramètres du score</h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Ce que pèse chaque composante dans le rapprochement entre un profil et une offre, et le plafond
              appliqué aux critères indispensables. Estimation algorithmique : le score reste une aide à la
              décision, jamais un filtre automatique.
            </p>
          </div>
          <div className="hidden shrink-0 text-[var(--color-text-subtle)] lg:block">
            <IllustrationMatch size={150} accent="var(--color-zone-admin)" />
          </div>
        </div>
        <div className="mt-4">
          <AdminScoreWeights />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Critères indispensables</h3>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Plafond en vigueur : {BLOCKING_CRITERIA_CAP} sur 100
            </p>
            <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              <p>
                Un critère déclaré indispensable par le recruteur et non satisfait par le candidat plafonne le score,
                quelles que soient les autres composantes. Un profil excellent partout ailleurs restera donc sous la
                barre.
              </p>
              <p>
                Le plafond protège les deux parties : le recruteur ne voit pas remonter un profil inéligible, et le
                candidat n&apos;est pas encouragé à postuler là où il sera écarté d&apos;office. La raison du plafond
                est toujours affichée au candidat, avec la mention du critère manquant.
              </p>
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Affectation des modèles</h3>
            <p className="mt-0.5 mb-3 text-[12.5px] text-[var(--color-text-muted)]">
              Une tâche, un modèle, une raison
            </p>
            <Table head={["Modèle", "Tâches", "Pourquoi"]} minWidth={560}>
              {MODEL_ASSIGNMENT.map((row) => (
                <Tr key={row.model}>
                  <Td>
                    <Tag>{row.model}</Tag>
                  </Td>
                  <Td className="text-[13px]">{row.usage}</Td>
                  <Td className="text-[12.5px] text-[var(--color-text-muted)]">{row.rationale}</Td>
                </Tr>
              ))}
            </Table>
          </div>
        </div>
      </section>

      {/* ---- Coûts ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="mb-4 text-[17px] font-semibold text-[var(--color-text)]">Suivi des coûts</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Coût IA total"
            value={formatUsd(totalCost)}
            hint={`${aiJobs.length} appels journalisés`}
          />
          <Stat
            label="Coût moyen par utilisateur actif"
            value={formatUsd(costPerActiveUser)}
            hint={`${activeUserIds.length} utilisateurs ont déclenché un appel`}
          />
          <Stat
            label="Coût moyen par compte inscrit"
            value={formatUsd(costPerUser)}
            hint={`${users.length} comptes au total`}
          />
          <Stat label="Latence moyenne" value={formatMs(averageLatency)} hint="Appels terminés avec succès" />
          <Stat
            label="Taux d'échec"
            value={formatPercent(failureRate, 1)}
            hint={`${failed.length} échec(s) sur ${finished.length} appels terminés`}
          />
          <Stat
            label="Jetons mis en cache"
            value={formatInt(cachedTokens)}
            hint={`sur ${formatInt(totalTokens)} jetons traités`}
          />
        </div>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Coût par type de tâche</h2>
          <div className="mt-4">
            <BarChart items={byType} tone="accent" />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Coût par utilisateur</h2>
          <div className="mt-4">
            <BarChart items={byUser} tone="primary" />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Coût par modèle</h2>
          <div className="mt-4">
            <BarChart items={byModel} tone="info" />
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Détail par type de tâche</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Volume, coût cumulé et coût unitaire moyen
          </p>
        </div>
        <Table head={["Type de tâche", "Appels", "Coût cumulé", "Coût moyen par appel"]} minWidth={680}>
          {byType.map((row) => (
            <Tr key={row.label}>
              <Td className="font-medium">{row.label}</Td>
              <TdMuted>{row.count}</TdMuted>
              <TdMuted>{formatUsd(row.value)}</TdMuted>
              <TdMuted>{formatUsd(row.value / Math.max(1, row.count))}</TdMuted>
            </Tr>
          ))}
        </Table>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Dernières tâches IA</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Journal complet : chaque appel porte son modèle, ses jetons, son coût et sa latence
          </p>
        </div>
        <Table
          head={["Tâche", "Utilisateur", "Modèle", "Statut", "Jetons entrée", "Jetons sortie", "Cache", "Coût", "Latence", "Date"]}
          minWidth={1240}
        >
          {[...aiJobs]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((job) => (
              <Tr key={job.id}>
                <Td className="font-medium">{AI_JOB_TYPE_LABEL[job.type]}</Td>
                <TdMuted>{fullName(getUserById(job.userId))}</TdMuted>
                <Td>
                  <Tag>{job.model}</Tag>
                </Td>
                <Td>
                  <Badge tone={AI_STATUS_TONE[job.status]}>{AI_JOB_STATUS_LABEL[job.status]}</Badge>
                </Td>
                <TdMuted>{formatInt(job.inputTokens)}</TdMuted>
                <TdMuted>{formatInt(job.outputTokens)}</TdMuted>
                <TdMuted>{formatInt(job.cachedTokens)}</TdMuted>
                <TdMuted>{formatUsd(job.costUsd)}</TdMuted>
                <TdMuted>{job.latencyMs === 0 ? "—" : formatMs(job.latencyMs)}</TdMuted>
                <TdMuted>{formatDate(job.createdAt)}</TdMuted>
              </Tr>
            ))}
        </Table>
      </section>
    </>
  );
}
