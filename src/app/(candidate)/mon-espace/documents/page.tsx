/**
 * Mon CV et documents — [T §6.6].
 *
 * Deux blocs : le CV original avec le résultat lisible de l'analyse, puis les
 * documents générés regroupés par candidature.
 *
 * Règle portée par cet écran : la suppression est un **archivage logique**, et
 * un document rattaché à une candidature déjà envoyée n'est plus supprimable.
 * Le bouton reste visible, désactivé, avec la raison écrite à l'écran.
 */

import Link from "next/link";
import { SimulatedActionBar } from "@/components/account-actions";
import { CandidateStateChip, PremiumCallout } from "@/components/account-shared";
import {
  IconCheckCircle,
  IconDownload,
  IconFile,
  IconGraduation,
  IconSparkles,
  IconUser,
} from "@/components/icons";
import { IllustrationNoDocuments } from "@/components/illustrations";
import {
  Alert,
  Badge,
  DataList,
  EmptyState,
  PageHeader,
  Progress,
  Tag,
  formatDate,
  relativeDays,
} from "@/components/ui";
import { getAllDocuments, getResumes, getUsageCounters } from "@/data/queries";
import { DOCUMENT_TYPE_LABEL } from "@/lib/enums";
import type { Application, ApplicationDocument, Job } from "@/lib/types";

export const metadata = {
  title: "Mon CV et mes documents — SIRA",
};

const LANGUAGE_LABEL: Record<"fr" | "en", string> = { fr: "Français", en: "Anglais" };

function formatSize(sizeKb: number): string {
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} Mo` : `${sizeKb} Ko`;
}

export default function DocumentsPage() {
  const resume = getResumes().find((item) => item.isOriginal) ?? getResumes()[0];
  const entries = getAllDocuments();
  const analysisQuota = getUsageCounters().find((counter) => counter.feature === "cv_analysis");

  /** Regroupement par candidature, dans l'ordre renvoyé par la couche data. */
  const groups: { application: Application; job?: Job; documents: ApplicationDocument[] }[] = [];
  for (const entry of entries) {
    const existing = groups.find((group) => group.application.id === entry.application.id);
    if (existing) {
      existing.documents.push(entry.doc);
    } else {
      groups.push({ application: entry.application, job: entry.job, documents: [entry.doc] });
    }
  }

  return (
    <>
      <PageHeader
        title="Mon CV et mes documents"
        description="Votre CV d'origine, ce que l'analyse en a extrait, et tous les documents produits pour vos candidatures."
      />

      {/* ------------------------------------------------------------------
          CV original
      ------------------------------------------------------------------ */}
      <section className="mb-2 border-y border-[var(--color-border)] py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">CV original</h2>
            <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
              Le document de référence : toutes les adaptations en sont dérivées.
            </p>
          </div>
          <SimulatedActionBar
            align="end"
            actions={[
              {
                label: "Remplacer",
                message:
                  "Le téléversement d'un nouveau CV créerait une version 2 et relancerait l'analyse. L'ancienne version resterait consultable.",
                icon: <IconFile size={14} />,
              },
              {
                label: "Télécharger",
                message: "Téléchargement du fichier original, tel que vous l'avez déposé.",
                icon: <IconDownload size={14} />,
              },
            ]}
          />
        </div>

        {resume ? (
          <div>
            <div className="flex flex-wrap items-start gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-subtle)]"
                aria-hidden
              >
                <IconFile size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-all text-[14.5px] font-semibold text-[var(--color-text)]">{resume.fileName}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--color-text-muted)]">
                  <span>{formatSize(resume.sizeKb)}</span>
                  <span>Déposé le {formatDate(resume.createdAt)}</span>
                  <span>Langue : {LANGUAGE_LABEL[resume.language]}</span>
                  <span>Version {resume.version}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {resume.parsedAt ? (
                    <Badge tone="success" icon={<IconCheckCircle size={13} />}>
                      Analyse terminée · {relativeDays(resume.parsedAt)}
                    </Badge>
                  ) : (
                    <Badge tone="warning">Analyse en attente</Badge>
                  )}
                  <Badge tone="neutral">PDF</Badge>
                </div>
              </div>
            </div>

            {analysisQuota ? (
              <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-[var(--color-text)]">
                    {analysisQuota.label} — {analysisQuota.period.toLowerCase()}
                  </p>
                  <p className="text-[12.5px] tabular-nums text-[var(--color-text-muted)]">
                    {analysisQuota.consumed} / {analysisQuota.limit ?? "illimité"}
                  </p>
                </div>
                <Progress
                  className="mt-2"
                  value={analysisQuota.limit ? (analysisQuota.consumed / analysisQuota.limit) * 100 : 0}
                  tone={
                    analysisQuota.limit && analysisQuota.consumed >= analysisQuota.limit ? "warning" : "primary"
                  }
                  label={analysisQuota.label}
                />
                <p className="mt-2 text-[12px] text-[var(--color-text-muted)]">
                  Plan Gratuit : 1 analyse approfondie par mois. Votre quota est consommé, la prochaine analyse sera
                  disponible le mois prochain.
                </p>
              </div>
            ) : null}

            {resume.parsedData ? (
              <div className="mt-5 space-y-5 border-t border-[var(--color-border)] pt-5">
                <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Ce que l&apos;analyse a extrait</h3>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)]">
                    <IconSparkles size={14} />
                    Expériences reconnues ({resume.parsedData.experiences.length})
                  </p>
                  <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                    {resume.parsedData.experiences.map((experience) => (
                      <li key={`${experience.company}-${experience.startDate}`} className="py-3">
                        <p className="text-[13.5px] font-medium text-[var(--color-text)]">{experience.title}</p>
                        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                          {experience.company} · {experience.startDate} → {experience.endDate ?? "en cours"}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                          {experience.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)]">
                    <IconGraduation size={14} />
                    Formations reconnues ({resume.parsedData.educations.length})
                  </p>
                  <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                    {resume.parsedData.educations.map((education) => (
                      <li
                        key={`${education.degree}-${education.year}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                      >
                        <span className="text-[13.5px] text-[var(--color-text)]">{education.degree}</span>
                        <span className="text-[12.5px] text-[var(--color-text-muted)]">
                          {education.school} · {education.year}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[13px] font-medium text-[var(--color-text-muted)]">
                      Compétences détectées ({resume.parsedData.skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.parsedData.skills.map((skill) => (
                        <Badge key={skill} tone="primary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[13px] font-medium text-[var(--color-text-muted)]">
                      Langues détectées ({resume.parsedData.languages.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.parsedData.languages.map((language) => (
                        <Tag key={language.name}>
                          {language.name} — {language.level}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>

                <Alert tone="info">
                  Ces informations ont été extraites automatiquement. Corrigez ce qui est inexact depuis{" "}
                  <Link href="/mon-espace/profil" className="font-medium underline">
                    votre profil
                  </Link>{" "}
                  : c&apos;est le profil, et non le fichier, qui alimente vos scores de compatibilité.
                </Alert>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon={<IllustrationNoDocuments size={170} accent="var(--color-zone-candidate)" />}
            title="Aucun CV déposé"
            description="Déposez votre CV pour que SIRA l'analyse et calcule vos scores de compatibilité."
          />
        )}
      </section>

      {/* ------------------------------------------------------------------
          Documents générés
      ------------------------------------------------------------------ */}
      <section className="space-y-5 py-8">
        <div>
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Documents générés</h2>
          <p className="mt-1 text-[13.5px] text-[var(--color-text-muted)]">
            Regroupés par candidature, avec leur type, leur version et leur date.
          </p>
        </div>

        <Alert tone="neutral" title="La suppression est un archivage">
          Supprimer un document le retire de votre espace mais ne l&apos;efface pas : il est archivé, conservé pour la
          traçabilité de vos démarches, et redevient invisible dans vos listes. En revanche, un document rattaché à une
          candidature <strong>déjà envoyée</strong> ne peut plus être archivé : il fait partie du dossier reçu par le
          recruteur.
        </Alert>

        {groups.length === 0 ? (
          <EmptyState
            icon={<IllustrationNoDocuments size={170} accent="var(--color-zone-candidate)" />}
            title="Aucun document généré"
            description="Préparez une candidature depuis une offre : l'assistant produira votre CV adapté, votre lettre et la checklist des pièces."
          />
        ) : (
          groups.map((group) => {
            const sent = group.application.preparationStatus === "envoyee";
            return (
              <div key={group.application.id} className="border-t border-[var(--color-border)] pt-5">
                <div className="mb-1">
                  <h3 className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]">
                    <Link
                      href={`/mon-espace/candidatures/${group.application.id}`}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {group.job?.title ?? "Candidature"}
                    </Link>
                    <CandidateStateChip application={group.application} />
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                    {`${group.documents.length} document${group.documents.length > 1 ? "s" : ""} · mis à jour ${relativeDays(
                      group.application.updatedAt,
                    )}`}
                  </p>
                </div>
                <ul className="divide-y divide-[var(--color-border)]">
                  {group.documents.map((document) => (
                    <li key={document.id} className="py-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-[var(--color-text)]">
                            {DOCUMENT_TYPE_LABEL[document.documentType]}
                            <Badge tone="neutral">Version {document.version}</Badge>
                            {document.editedByHuman ? (
                              <Badge tone="primary">Modifié par vous</Badge>
                            ) : (
                              <Badge tone="accent">Généré par l&apos;IA</Badge>
                            )}
                          </p>
                          <p className="mt-0.5 break-all font-mono text-[12px] text-[var(--color-text-muted)]">
                            {document.fileName}
                          </p>
                        </div>
                        <span className="shrink-0 text-[12px] text-[var(--color-text-subtle)]">
                          {formatDate(document.createdAt)}
                        </span>
                      </div>

                      {document.content ? (
                        <details className="mt-3">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] [&::-webkit-details-marker]:hidden">
                            Aperçu
                          </summary>
                          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 font-sans text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                            {document.content}
                          </pre>
                        </details>
                      ) : (
                        <p className="mt-3 text-[12px] text-[var(--color-text-subtle)]">
                          Aperçu indisponible : ce document est un fichier binaire, il s&apos;ouvre dans la visionneuse.
                        </p>
                      )}

                      <SimulatedActionBar
                        className="mt-3"
                        actions={[
                          {
                            label: "Aperçu",
                            message: document.content
                              ? "Le contenu est dépliable juste au-dessus, et s'ouvre en plein écran dans la visionneuse."
                              : "Ouverture du fichier dans la visionneuse SIRA, sans téléchargement.",
                            tone: "info",
                          },
                          {
                            label: "Modifier",
                            message: sent
                              ? "Une modification créerait une nouvelle version dans votre espace. Le recruteur, lui, conserve la version qu'il a reçue."
                              : "L'éditeur s'ouvre sur ce document : vos modifications créent une version n+1, l'ancienne reste consultable.",
                          },
                          {
                            label: "Télécharger",
                            message: `Téléchargement de ${document.fileName}.`,
                            icon: <IconDownload size={14} />,
                            tone: "info",
                          },
                          {
                            label: "Supprimer",
                            variant: "danger",
                            tone: "neutral",
                            disabled: sent,
                            disabledReason: sent
                              ? "ce document appartient à une candidature déjà envoyée. Il constitue la preuve du dossier transmis au recruteur et ne peut plus être archivé."
                              : undefined,
                            message:
                              "Archivage logique : le document disparaît de vos listes mais reste conservé pour la traçabilité. Vous pouvez demander sa restauration.",
                          },
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <div className="grid gap-8 border-t border-[var(--color-border)] py-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-[14px] font-semibold text-[var(--color-text)]">Où vont vos documents</h2>
          <div>
            <DataList
              rows={[
                { label: "Stockage", value: "Espace personnel SIRA, accessible à vous seule" },
                { label: "Partage", value: "Un recruteur ne reçoit un document que si vous envoyez la candidature" },
                { label: "Archivage", value: "Conservation pour traçabilité, sans réapparaître dans vos listes" },
                {
                  label: "Profil",
                  value: (
                    <Link href="/mon-espace/profil" className="font-medium text-[var(--color-primary)] hover:underline">
                      Corriger les données extraites
                    </Link>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <PremiumCallout title="Analyse des points faibles de votre CV">
          Premium relit votre CV ligne à ligne : formulations vagues, expériences sous-valorisées, compétences
          absentes des offres que vous visez. Avec le plan Gratuit, vous disposez d&apos;une analyse par mois.
        </PremiumCallout>
      </div>

      <p className="flex items-start gap-2 border-t border-[var(--color-border)] pt-4 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
        <span className="mt-0.5 shrink-0" aria-hidden>
          <IconUser size={13} />
        </span>
        <span>
          Les documents générés par l&apos;assistant restent des propositions : relisez-les toujours avant envoi, vous
          en êtes l&apos;autrice devant le recruteur.
        </span>
      </p>
    </>
  );
}
