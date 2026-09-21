"use client";

/**
 * Panneau de préparation de candidature — [T §6.3].
 *
 * Simulation côté client : aucun appel réseau, aucun envoi. Les quatre pièces
 * sont générées l'une après l'autre, puis le dossier passe « À vérifier ».
 * Deux invariants s'affichent en permanence : le quota restant du plan Gratuit
 * et le fait que rien ne part sans validation humaine.
 */

import { useEffect, useState } from "react";
import { IconCheck, IconClock, IconSparkles } from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  Progress,
  cx,
} from "@/components/ui";
import { DOCUMENT_TYPE_LABEL, PREPARATION_STATUS_LABEL, type DocumentType } from "@/lib/enums";

const STEPS: { type: DocumentType; detail: string }[] = [
  { type: "cv_adapte", detail: "Votre CV est réordonné pour mettre en avant les compétences attendues par l'offre." },
  { type: "lettre_motivation", detail: "Une lettre reprend vos résultats chiffrés les plus proches du poste." },
  { type: "email_candidature", detail: "Un e-mail d'accompagnement court, prêt à relire avant envoi." },
  { type: "checklist", detail: "La liste des pièces exigées par le recruteur, à cocher une par une." },
];

export function PreparationPanel({
  jobTitle,
  consumed,
  limit,
  period,
  applicationsHref,
}: {
  jobTitle: string;
  consumed: number;
  limit: number | null;
  period: string;
  applicationsHref: string;
}) {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);

  const exhausted = limit != null && consumed >= limit;
  const remaining = limit != null ? Math.max(0, limit - consumed) : null;

  useEffect(() => {
    if (phase !== "running") return;
    if (step >= STEPS.length) {
      setPhase("done");
      return;
    }
    const timer = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(timer);
  }, [phase, step]);

  const progress = phase === "done" ? 100 : (Math.min(step, STEPS.length) / STEPS.length) * 100;

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]">
          <span className="text-[var(--color-primary)]" aria-hidden>
            <IconSparkles size={15} />
          </span>
          Préparer ma candidature
        </h2>
        <Badge tone="primary">
          {phase === "done"
            ? PREPARATION_STATUS_LABEL.a_verifier
            : phase === "running"
              ? "Génération en cours"
              : PREPARATION_STATUS_LABEL.brouillon}
        </Badge>
      </div>

      <div className="p-4">
        <p className="text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
          L&apos;assistant prépare quatre pièces pour l&apos;offre «&nbsp;{jobTitle}&nbsp;» à partir de votre profil et
          de votre CV. Vous relisez, vous corrigez, puis vous décidez de l&apos;envoi.
        </p>

        <div className="mt-4">
          <Progress
            value={progress}
            tone={phase === "done" ? "success" : "primary"}
            label="Avancement de la préparation"
          />
          <ol className="mt-3.5 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {STEPS.map((s, i) => {
              const state = phase === "done" || i < step ? "done" : phase === "running" && i === step ? "running" : "todo";
              return (
                <li key={s.type} className="flex items-start gap-3 py-3">
                  <span
                    className={cx(
                      "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                      state === "done"
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : state === "running"
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "border border-[var(--color-border-strong)] text-[var(--color-text-subtle)]",
                    )}
                    aria-hidden
                  >
                    {state === "done" ? <IconCheck size={12} /> : state === "running" ? <IconClock size={12} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-[var(--color-text)]">
                      {DOCUMENT_TYPE_LABEL[s.type]}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                      {s.detail}
                    </span>
                  </span>
                  <span
                    className={cx(
                      "shrink-0 text-[12px]",
                      state === "done"
                        ? "text-[var(--color-success)]"
                        : state === "running"
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-text-subtle)]",
                    )}
                  >
                    {state === "done" ? "Prêt" : state === "running" ? "En cours…" : "En attente"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ---- Quota du plan Gratuit ---- */}
        <p className="mt-4 text-[12.5px] text-[var(--color-text-muted)]">
          Plan Gratuit&nbsp;:{" "}
          <strong className="font-semibold text-[var(--color-text)]">
            {consumed} préparation{consumed > 1 ? "s" : ""} sur {limit ?? "illimité"} utilisée
            {consumed > 1 ? "s" : ""} {period.toLowerCase()}
          </strong>
          {remaining != null ? <> — il vous en reste {remaining}.</> : null}
        </p>

        <div className="mt-3 space-y-3">
          {/* ---- Garde-fou permanent ---- */}
          <Alert tone="warning" title="Rien ne part sans votre validation" icon={<IconCheck size={15} />}>
            Les documents générés restent dans votre espace tant que vous ne les avez pas relus et validés. SIRA
            n&apos;envoie jamais une candidature à votre place.
          </Alert>

          {exhausted ? (
            <Alert tone="danger" title="Quota de préparations atteint">
              Vous avez utilisé vos {limit} préparations {period.toLowerCase()}. Votre compteur se réinitialise à la
              fin de la période, ou le plan Premium lève cette limite.
            </Alert>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {phase === "done" ? (
            <>
              <ButtonLink href={applicationsHref} size="sm">
                Vérifier mes documents
              </ButtonLink>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep(0);
                  setPhase("idle");
                }}
              >
                Recommencer
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                disabled={exhausted || phase === "running"}
                onClick={() => {
                  setStep(0);
                  setPhase("running");
                }}
              >
                <IconSparkles size={15} />
                {phase === "running" ? "Génération en cours…" : "Lancer la préparation"}
              </Button>
              <ButtonLink href={applicationsHref} variant="ghost" size="sm">
                Voir mes candidatures
              </ButtonLink>
            </>
          )}
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-text-subtle)]" role="status">
          {phase === "done"
            ? "Dossier généré. Il est enregistré à l'état « À vérifier » dans vos candidatures."
            : phase === "running"
              ? `Génération de ${DOCUMENT_TYPE_LABEL[STEPS[Math.min(step, STEPS.length - 1)].type].toLowerCase()}…`
              : "Démonstration : la génération est simulée, aucun document n'est réellement produit ni transmis."}
        </p>
      </div>
    </Card>
  );
}
