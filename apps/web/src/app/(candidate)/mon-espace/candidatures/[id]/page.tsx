/**
 * Détail d'une candidature — [T §6.5].
 *
 * Quatre exigences portées par cet écran :
 * 1. le score affiché est celui **figé au dépôt**, et c'est écrit ;
 * 2. l'état recruteur n'apparaît jamais brut, il est projeté ;
 * 3. l'historique est complet, sous forme de frise verticale ;
 * 4. les actions proposées dépendent de l'état de préparation *et* du canal.
 *
 * Export statique : les candidatures du candidat de démonstration sont
 * pré-générées, toute autre adresse aboutit à la page 404.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { SimulatedActionBar, type SimulatedAction } from "@/components/account-actions";
import {
  ApplicationTimeline,
  CandidateStateChip,
  ChannelBadge,
  PremiumCallout,
  candidateStateLabel,
  channelExplanation,
} from "@/components/account-shared";
import {
  IconArrowRight,
  IconCheckCircle,
  IconDownload,
  IconMail,
  IconSparkles,
} from "@/components/icons";
import { IllustrationNoDocuments } from "@/components/illustrations";
import { ScoreDisclaimer, ScoreRing, scoreLabel } from "@/components/score";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  DataList,
  EmptyState,
  PageHeader,
  Tag,
  formatDate,
  relativeDays,
} from "@/components/ui";
import {
  CANDIDATE_ID,
  getApplication,
  getApplications,
  getJobById,
  getOrganization,
  getScore,
} from "@/data/queries";
import {
  CONTRACT_TYPE_LABEL,
  DOCUMENT_TYPE_LABEL,
  OPPORTUNITY_TYPE_LABEL,
  PREPARATION_STATUS_LABEL,
  WORK_MODE_LABEL,
  formatSalaryRange,
  type ApplicationChannel,
} from "@/lib/enums";
import type { Application } from "@/lib/types";

export const metadata = {
  title: "Détail de la candidature — SIRA",
};

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return getApplications(CANDIDATE_ID).map((application) => ({ id: application.id }));
}

/**
 * Actions disponibles : le croisement de l'état de préparation et du canal.
 * Le canal externe n'autorise jamais un envoi par SIRA, seulement un
 * téléchargement suivi d'une déclaration manuelle.
 */
function actionsFor(application: Application, target?: string): SimulatedAction[] {
  const channel: ApplicationChannel = application.channelUsed;

  switch (application.preparationStatus) {
    case "brouillon":
      return [
        {
          label: "Générer mon dossier",
          message:
            "L'assistant préparerait le CV adapté et la lettre de motivation à partir de l'offre, puis vous les soumettrait pour relecture. Cette préparation consommerait 1 de vos 2 préparations mensuelles du plan Gratuit.",
          variant: "primary",
          size: "md",
          icon: <IconSparkles size={15} />,
        },
        {
          label: "Supprimer le brouillon",
          message: "Le brouillon serait archivé. Aucun document n'ayant été envoyé, rien ne part chez le recruteur.",
          variant: "ghost",
          size: "md",
          tone: "neutral",
        },
      ];

    case "generee":
    case "a_verifier":
      return [
        {
          label: "Vérifier et valider le dossier",
          message:
            "Vous relisez chaque document, vous corrigez ce qui doit l'être, puis vous validez. Tant que vous n'avez pas validé, SIRA n'envoie rien.",
          variant: "primary",
          size: "md",
          icon: <IconCheckCircle size={15} />,
        },
        {
          label: "Modifier les documents",
          message: "Ouverture de l'éditeur : vos modifications remplacent la version générée et créent une version n+1.",
          size: "md",
        },
      ];

    case "validee":
      if (channel === "externe") {
        return [
          {
            label: "Télécharger le dossier",
            message: "Le CV adapté, la lettre et la checklist des pièces seraient téléchargés dans une archive unique.",
            variant: "primary",
            size: "md",
            icon: <IconDownload size={15} />,
          },
          {
            label: "Marquer comme envoyée",
            message:
              "Vous déclarez avoir transmis le dossier par le canal indiqué. SIRA enregistre la date et bascule la candidature en « Envoyée » pour le suivi, sans prétendre l'avoir expédiée à votre place.",
            size: "md",
            icon: <IconCheckCircle size={15} />,
          },
        ];
      }
      if (channel === "email") {
        return [
          {
            label: "Relire et autoriser l'envoi",
            message: `Après votre accord, SIRA expédierait l'e-mail de candidature${
              target ? ` à ${target}` : ""
            } avec vos pièces jointes, en votre nom et avec votre adresse en réponse.`,
            variant: "primary",
            size: "md",
            icon: <IconMail size={15} />,
          },
          {
            label: "Modifier l'e-mail",
            message: "L'éditeur s'ouvre sur l'objet et le corps du message avant tout envoi.",
            size: "md",
          },
        ];
      }
      return [
        {
          label: "Envoyer ma candidature",
          message:
            "Le dossier serait déposé sur SIRA et rendu visible au recruteur. Votre score serait figé à cet instant et n'évoluerait plus.",
          variant: "primary",
          size: "md",
          icon: <IconArrowRight size={15} />,
        },
        {
          label: "Modifier les documents",
          message: "Retour à l'édition : la candidature repasse en « À vérifier » jusqu'à une nouvelle validation.",
          size: "md",
        },
      ];

    case "envoyee":
      return [
        {
          label: "Télécharger le dossier envoyé",
          message: "Copie exacte des pièces transmises au recruteur, telles qu'il les a reçues.",
          size: "md",
          icon: <IconDownload size={15} />,
        },
        {
          label: "Archiver cette candidature",
          message:
            "La candidature quitterait votre liste active pour l'onglet « Archivées ». Le recruteur conserve le dossier qu'il a reçu.",
          variant: "ghost",
          size: "md",
          tone: "neutral",
        },
      ];
  }
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = getApplication(id);

  if (!application || application.candidateId !== CANDIDATE_ID) {
    notFound();
  }

  const job = getJobById(application.jobId);
  if (!job) {
    notFound();
  }

  const organization = getOrganization(job.organizationId);
  const currentScore = getScore(job.id);
  const frozen = application.frozenScore;
  const drifted = frozen !== undefined && currentScore !== undefined && currentScore.score !== frozen;
  const history = [...application.history].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mon espace", href: "/mon-espace" },
          { label: "Mes candidatures", href: "/mon-espace/candidatures" },
          { label: job.title },
        ]}
      />

      <PageHeader
        title={job.title}
        description={`${organization?.tradeName ?? organization?.legalName ?? "Organisation"} · ${job.city}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <CandidateStateChip application={application} />
        <ChannelBadge channel={application.channelUsed} />
        <Badge tone="neutral">Préparation : {PREPARATION_STATUS_LABEL[application.preparationStatus]}</Badge>
      </div>

      <div className="grid gap-x-10 lg:grid-cols-3">
        {/* ---------------- Colonne principale ---------------- */}
        <div className="lg:col-span-2">
          {/* Offre visée */}
          <section className="border-t border-[var(--color-border)] py-7">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h2 className="text-[17px] font-semibold text-[var(--color-text)]">L&apos;offre visée</h2>
              <Link
                href={`/mon-espace/opportunites/${job.id}`}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Voir l&apos;offre
                <IconArrowRight size={14} />
              </Link>
            </div>
            <div className="flex gap-3.5">
              <Avatar initials={organization?.logoInitials ?? "??"} color={organization?.logoColor} size={48} />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold text-[var(--color-text)]">{job.title}</p>
                <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">
                  {organization?.tradeName ?? organization?.legalName} · {job.city} ·{" "}
                  {formatSalaryRange(job.salaryMin, job.salaryMax)}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge tone="primary">{OPPORTUNITY_TYPE_LABEL[job.opportunityType]}</Badge>
                  <Tag>{CONTRACT_TYPE_LABEL[job.contractType]}</Tag>
                  <Tag>{WORK_MODE_LABEL[job.workMode]}</Tag>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{job.summary}</p>
              </div>
            </div>
          </section>

          {/* Score figé */}
          <section className="border-b border-[var(--color-border)] py-7">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Score figé au moment du dépôt</h2>
            <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
              Photographie de votre compatibilité à l&apos;instant où le dossier a été préparé.
            </p>
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {frozen !== undefined ? <ScoreRing score={frozen} size={116} /> : null}
              <div className="min-w-0 flex-1 space-y-3">
                {frozen !== undefined ? (
                  <p className="text-[13.5px] leading-relaxed text-[var(--color-text)]">
                    <strong className="font-semibold">{scoreLabel(frozen)}</strong> — ce {frozen} % est le score{" "}
                    <strong className="font-semibold">figé</strong>, conservé tel quel pour garder une trace fidèle du
                    dossier déposé. Ce n&apos;est <em>pas</em> votre score courant : il ne bouge plus, même si vous
                    complétez votre profil ou si l&apos;offre est modifiée.
                  </p>
                ) : (
                  <p className="text-[13.5px] text-[var(--color-text-muted)]">
                    Aucun score n&apos;a encore été figé : il le sera au moment du dépôt.
                  </p>
                )}

                {drifted && currentScore ? (
                  <Alert tone="info" title="Votre score courant a évolué">
                    Sur cette offre, votre score actuel est de <strong>{currentScore.score} %</strong>, contre{" "}
                    {frozen} % au dépôt. Le recruteur, lui, voit le score figé attaché à votre dossier.{" "}
                    <Link href={`/mon-espace/opportunites/${job.id}`} className="font-medium underline">
                      Voir le détail du score courant
                    </Link>
                    .
                  </Alert>
                ) : null}

                <ScoreDisclaimer model={currentScore?.model} computedAt={currentScore?.computedAt} />
              </div>
            </div>
          </section>

          {/* Documents du dossier */}
          <section className="border-b border-[var(--color-border)] py-7">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Les documents du dossier</h2>
                <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
                  {`${application.documents.length} pièce${application.documents.length > 1 ? "s" : ""} rattachée${
                    application.documents.length > 1 ? "s" : ""
                  } à cette candidature`}
                </p>
              </div>
              <Link
                href="/mon-espace/documents"
                className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Tous mes documents
              </Link>
            </div>
            <div>
              {application.documents.length === 0 ? (
                <EmptyState
                  icon={<IllustrationNoDocuments size={170} accent="var(--color-zone-candidate)" />}
                  title="Aucun document généré"
                  description="Lancez la préparation pour que l'assistant produise votre CV adapté et votre lettre."
                />
              ) : (
                <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                  {application.documents.map((document) => (
                    <li key={document.id} className="py-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-[var(--color-text)]">
                            {DOCUMENT_TYPE_LABEL[document.documentType]}
                            <Badge tone="neutral">Version {document.version}</Badge>
                            {document.editedByHuman ? <Badge tone="primary">Modifié par vous</Badge> : null}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[12px] text-[var(--color-text-muted)]">
                            {document.fileName}
                          </p>
                        </div>
                        <span className="text-[12px] text-[var(--color-text-subtle)]">
                          {formatDate(document.createdAt)}
                        </span>
                      </div>

                      {document.content ? (
                        <details className="mt-2.5">
                          <summary className="cursor-pointer list-none text-[12.5px] font-medium text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
                            Aperçu du contenu
                          </summary>
                          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 font-sans text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                            {document.content}
                          </pre>
                        </details>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {job.requiredDocuments.length > 0 ? (
                <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                  <p className="text-[12.5px] font-medium text-[var(--color-text)]">Pièces exigées par le recruteur</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.requiredDocuments.map((piece) => (
                      <Tag key={piece}>{piece}</Tag>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Historique complet */}
          <section className="border-b border-[var(--color-border)] py-7">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Historique complet</h2>
            <p className="mb-4 mt-1 text-[12.5px] text-[var(--color-text-muted)]">
              Chaque étape, avec sa date et son auteur, du plus ancien au plus récent.
            </p>
            <div>
              <ApplicationTimeline events={history} />
              {application.preparationStatus === "envoyee" ? (
                <p className="mt-4 rounded-md bg-[var(--color-surface-2)] p-3 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                  Vous voyez l&apos;avancement tel que SIRA vous le présente :{" "}
                  <strong className="font-medium text-[var(--color-text)]">{candidateStateLabel(application)}</strong>.
                  Le détail interne du tri effectué par le recruteur ne vous est pas communiqué.
                </p>
              ) : null}
            </div>
          </section>

          <div className="py-7">
            <PremiumCallout title="Préparer l'entretien de ce poste">
              Le coach carrière prépare les questions probables sur ce poste, vos réponses aux points faibles du
              dossier et une simulation d&apos;entretien. Ces fonctions font partie du plan Premium.
            </PremiumCallout>
          </div>
        </div>

        {/* ---------------- Colonne latérale ---------------- */}
        <div className="lg:border-l lg:border-[var(--color-border)] lg:pl-8">
          <section className="border-y border-[var(--color-border)] py-7 lg:border-t-0">
            <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-text)]">Ce qui vous attend</h2>
            <div>
              <Alert tone={application.channelUsed === "externe" ? "warning" : "info"} title="Canal de candidature">
                {channelExplanation(application.channelUsed, job.applicationTarget)}
              </Alert>
              <SimulatedActionBar
                className="mt-4"
                actions={actionsFor(application, job.applicationTarget)}
                note="Démonstration : aucune donnée n'est réellement transmise depuis cet écran."
              />
            </div>
          </section>

          <section className="py-7">
            <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-text)]">Dates et repères</h2>
            <div>
              <DataList
                rows={[
                  { label: "Dossier créé", value: `${formatDate(application.createdAt)} (${relativeDays(application.createdAt)})` },
                  { label: "Dernière mise à jour", value: `${formatDate(application.updatedAt)} (${relativeDays(application.updatedAt)})` },
                  {
                    label: "Envoi",
                    value: application.submittedAt ? formatDate(application.submittedAt) : "Pas encore envoyée",
                  },
                  { label: "Date limite de l'offre", value: formatDate(job.deadline) },
                  {
                    label: "Destinataire",
                    value: job.applicationTarget ?? "Espace recruteur SIRA",
                  },
                  { label: "Référence", value: <span className="font-mono text-[12.5px]">{application.id}</span> },
                ]}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
