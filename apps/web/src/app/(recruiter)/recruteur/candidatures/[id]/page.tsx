/**
 * Fiche candidature.
 * Profil, documents, score détaillé, résumé automatique, points d'attention,
 * notes internes partagées, frise d'historique et actions de workflow.
 *
 * Direction épurée : plus de cartes empilées, des sections posées sur fond
 * blanc et séparées par des filets de 1 pixel. Le score reste la seule touche
 * de couleur forte, et la mention d'estimation algorithmique l'accompagne.
 *
 * Export statique : toutes les candidatures de la file de démonstration
 * (réelle et `app_r..`) sont pré-générées ; tout autre identifiant reste en 404.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/data/queries";
import {
  MESSAGE_TEMPLATES,
  getRecruiterApplicationById,
  getRecruiterPipeline,
} from "@/components/recruiter-data";
import { ContactPanel, InternalNotes, WorkflowButtons } from "@/components/recruiter-actions";
import { AiAssistNotice, AttentionPoints, ReviewStatusChip, WorkflowTrack } from "@/components/recruiter-ui";
import { ScoreBreakdown, ScoreRing, scoreLabel } from "@/components/score";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  DataList,
  PageHeader,
  Tag,
  cx,
  formatDate,
  relativeDays,
} from "@/components/ui";
import { IconDownload, IconFile, IconSparkles } from "@/components/icons";
import {
  APPLICATION_CHANNEL_LABEL,
  PROFILE_VISIBILITY_LABEL,
  REVIEW_STATUS_CANDIDATE_LABEL,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Fiche candidature",
};

export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return getRecruiterPipeline().map((application) => ({ id: application.id }));
}

const SECTION = "mt-10 border-t border-[var(--color-border)] pt-8";
const H2 = "text-[17px] font-semibold text-[var(--color-text)]";
const H3 = "text-[14px] font-semibold text-[var(--color-text)]";
const SUB = "mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = getRecruiterApplicationById(id);
  if (!application) notFound();

  const job = getJobById(application.jobId);
  const talent = application.talent;
  const fullName = `${talent.firstName} ${talent.lastName}`;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Espace recruteur", href: "/recruteur" },
          { label: "Candidatures", href: "/recruteur/candidatures" },
          { label: fullName },
        ]}
      />

      <PageHeader
        title={fullName}
        description={`${talent.headline} · candidature au poste de ${job?.title ?? "—"}, reçue ${relativeDays(application.submittedAt)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ReviewStatusChip status={application.reviewStatus} />
            {application.isShortlisted ? <Badge tone="accent">Shortlist</Badge> : null}
          </div>
        }
      />

      <div className="grid gap-10 border-t border-[var(--color-border)] pt-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {/* ---- Décision humaine ---- */}
          <section aria-labelledby="decision">
            <h2 id="decision" className={H2}>
              Décision
            </h2>
            <p className={SUB}>Le changement d&apos;état est un geste humain, tracé au nom de son auteur.</p>
            <div className="mt-4 space-y-4">
              <WorkflowTrack current={application.reviewStatus} />
              <WorkflowButtons candidateName={fullName} current={application.reviewStatus} />
            </div>
          </section>

          {/* ---- Résumé automatique ---- */}
          <section aria-labelledby="resume-ia" className={SECTION}>
            <h2 id="resume-ia" className={cx(H2, "flex items-center gap-1.5")}>
              <IconSparkles size={16} className="text-[var(--color-primary)]" />
              Résumé automatique du candidat
            </h2>
            <p className={SUB}>
              Rédigé par l&apos;IA à partir du dossier déposé. Proposition de lecture, pas un avis.
            </p>

            <div className="mt-4 space-y-5">
              <p className="text-[13.5px] leading-relaxed text-[var(--color-text)]">{application.aiSummary}</p>

              <div>
                <h3 className={H3}>Expérience la plus pertinente</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  {application.relevantExperience}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className={H3}>Compétences correspondantes</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(application.score.breakdown.competences.matched ?? []).length > 0 ? (
                      (application.score.breakdown.competences.matched ?? []).map((s) => (
                        <Badge key={s} tone="success">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[13px] text-[var(--color-text-muted)]">
                        Aucune correspondance directe relevée.
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className={H3}>Lacunes relevées</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {application.score.gaps.length > 0 ? (
                      application.score.gaps.map((s) => (
                        <Badge key={s} tone="warning">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[13px] text-[var(--color-text-muted)]">Aucune lacune relevée.</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className={H3}>Points d&apos;attention</h3>
                <div className="mt-2">
                  <AttentionPoints points={application.attentionPoints} />
                </div>
              </div>

              <AiAssistNotice compact />
            </div>
          </section>

          {/* ---- Profil du candidat ---- */}
          <section aria-labelledby="profil" className={SECTION}>
            <h2 id="profil" className={H2}>
              Profil du candidat
            </h2>
            <p className={SUB}>Informations déclarées par le candidat.</p>
            <div className="mt-4 border-t border-[var(--color-border)]">
              <DataList
                rows={[
                  { label: "Titre du profil", value: talent.headline },
                  { label: "Domaine", value: talent.domain },
                  { label: "Ville", value: talent.city },
                  { label: "Zones de mobilité", value: talent.mobility.join(", ") },
                  { label: "Expérience", value: `${talent.experienceYears} an(s)` },
                  { label: "Niveau de formation", value: talent.educationLevel },
                  { label: "Disponibilité", value: talent.availability },
                  {
                    label: "Compétences",
                    value: (
                      <div className="flex flex-wrap gap-1.5">
                        {talent.skills.map((s) => (
                          <Tag key={s}>{s}</Tag>
                        ))}
                      </div>
                    ),
                  },
                  { label: "Langues", value: talent.languages.join(" · ") },
                  {
                    label: "Confidentialité du profil",
                    value: PROFILE_VISIBILITY_LABEL[talent.visibility],
                  },
                  {
                    label: "Coordonnées",
                    value: application.contactUnlocked ? (
                      <span>
                        {talent.email} · {talent.phone}
                        <span className="mt-0.5 block text-[12px] text-[var(--color-text-muted)]">
                          Visibles parce que ce candidat a postulé à une de vos offres.
                        </span>
                      </span>
                    ) : (
                      "Masquées"
                    ),
                  },
                ]}
              />
            </div>
          </section>

          {/* ---- Documents ---- */}
          <section aria-labelledby="documents" className={SECTION}>
            <h2 id="documents" className={H2}>
              CV et documents joints
            </h2>
            <p className={SUB}>
              {application.documents.length} pièce(s) transmise(s) via{" "}
              {APPLICATION_CHANNEL_LABEL[application.channel]}.
            </p>
            <ul className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {application.documents.map((doc) => (
                <li key={doc.fileName} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
                    <IconFile size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-[var(--color-text)]">{doc.fileName}</p>
                    <p className="text-[12px] text-[var(--color-text-subtle)]">
                      {doc.label} · {doc.sizeKb} Ko
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <IconDownload size={14} />
                    Télécharger
                  </Button>
                </li>
              ))}
            </ul>
            {job && job.requiredDocuments.length > 0 ? (
              <p className="mt-3 text-[12.5px] text-[var(--color-text-muted)]">
                Pièces demandées dans l&apos;offre : {job.requiredDocuments.join(", ")}.
              </p>
            ) : null}
          </section>

          {/* ---- Score détaillé ---- */}
          <section aria-labelledby="score" className={SECTION}>
            <h2 id="score" className={H2}>
              Score de compatibilité et ses composantes
            </h2>
            <p className={SUB}>
              Le détail est présenté au candidat dans les mêmes termes : la transparence du score est une règle de
              la plateforme.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-6">
              <ScoreRing score={application.score.score} size={104} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[var(--color-text)]">
                  {scoreLabel(application.score.score)}
                </p>
                <p className="mt-1 max-w-md text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  Ce score classe le dossier dans votre file de lecture. Il ne conditionne ni l&apos;accès au
                  poste, ni le refus : un profil à 45 % peut être retenu, un profil à 90 % peut être écarté.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <ScoreBreakdown score={application.score} />
            </div>
          </section>

          {/* ---- Notes internes ---- */}
          <section aria-labelledby="notes" className={SECTION}>
            <h2 id="notes" className={H2}>
              Notes internes
            </h2>
            <p className={SUB}>Partagées entre les membres de Sahel Agro. Jamais visibles par le candidat.</p>
            <div className="mt-4">
              <InternalNotes notes={application.notes} />
            </div>
          </section>
        </div>

        {/* ---- Colonne latérale ---- */}
        <aside className="min-w-0">
          <section aria-label="Candidat">
            <div className="flex items-center gap-3">
              <Avatar initials={talent.avatarInitials} color={talent.color} size={46} rounded="full" />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--color-text)]">{fullName}</p>
                <p className="text-[12.5px] text-[var(--color-text-muted)]">
                  {talent.city} · {talent.availability.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-[13px] leading-relaxed">
              <p className="text-[var(--color-text-muted)]">
                Postule au poste de{" "}
                <Link
                  href={`/recruteur/offres/${application.jobId}`}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  {job?.title ?? "—"}
                </Link>
              </p>
              <p className="text-[var(--color-text-muted)]">
                Reçue le {formatDate(application.submittedAt)}, via{" "}
                {APPLICATION_CHANNEL_LABEL[application.channel].toLowerCase()}
              </p>
              <p className="text-[var(--color-text-muted)]">
                Le candidat voit l&apos;état «{" "}
                <strong className="font-semibold text-[var(--color-text)]">
                  {REVIEW_STATUS_CANDIDATE_LABEL[application.reviewStatus]}
                </strong>{" "}
                ».
              </p>
            </div>
            <div className="mt-4">
              <ContactPanel
                displayName={fullName}
                templates={MESSAGE_TEMPLATES}
                unlocked={application.contactUnlocked}
                buttonLabel="Contacter le candidat"
                size="sm"
              />
            </div>
          </section>

          <section aria-labelledby="historique" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 id="historique" className={H3}>
              Historique
            </h2>
            <p className={SUB}>Trace complète, côté candidat et côté recruteur.</p>
            <ol className="mt-4">
              {application.history.map((event, i) => (
                <li key={`${event.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="relative flex flex-col items-center">
                    <span
                      className={cx(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        event.actor === "recruteur"
                          ? "bg-[var(--color-primary)]"
                          : event.actor === "candidat"
                            ? "bg-[var(--color-accent)]"
                            : "bg-[var(--color-text-subtle)]",
                      )}
                      aria-hidden
                    />
                    {i < application.history.length - 1 ? (
                      <span className="mt-1 w-px flex-1 bg-[var(--color-border)]" aria-hidden />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--color-text)]">{event.label}</p>
                    <p className="text-[12px] text-[var(--color-text-subtle)]">
                      {formatDate(event.at)} · {event.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-8">
            <Alert tone="neutral" title="La décision reste humaine">
              L&apos;IA a résumé ce dossier, l&apos;a classé et a signalé des points d&apos;attention. Elle
              n&apos;a écarté personne et ne peut pas le faire : aucun bouton de cette interface ne refuse
              automatiquement un candidat.
            </Alert>
          </div>
        </aside>
      </div>
    </>
  );
}
