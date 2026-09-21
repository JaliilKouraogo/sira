/**
 * Briques de présentation propres à l'espace recruteur.
 * Composants serveur : aucun état, aucune interactivité.
 */

import Link from "next/link";
import {
  JOB_STATUS_LABEL,
  REVIEW_STATUSES,
  REVIEW_STATUS_LABEL,
  REVIEW_STATUS_CANDIDATE_LABEL,
  VERIFICATION_STATUS_LABEL,
  type JobStatus,
  type ReviewStatus,
  type VerificationStatus,
} from "@/lib/enums";
import { Alert, Badge, Card, cx, type Tone } from "./ui";
import { IconAlert, IconCheckCircle, IconShield, IconSparkles } from "./icons";
import { VERIFICATION_LEVELS } from "./recruiter-data";

// --------------------------------------------------------------------------
// Puces de statut
// --------------------------------------------------------------------------

export const JOB_STATUS_TONE: Record<JobStatus, Tone> = {
  brouillon: "neutral",
  en_validation: "warning",
  publiee: "success",
  suspendue: "warning",
  expiree: "neutral",
  cloturee: "neutral",
  rejetee: "danger",
};

export const REVIEW_STATUS_TONE: Record<ReviewStatus, Tone> = {
  recue: "neutral",
  a_examiner: "info",
  shortlist: "accent",
  entretien: "primary",
  retenue: "success",
  refusee: "danger",
};

export function JobStatusChip({ status }: { status: JobStatus }) {
  return <Badge tone={JOB_STATUS_TONE[status]}>{JOB_STATUS_LABEL[status]}</Badge>;
}

export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  return <Badge tone={REVIEW_STATUS_TONE[status]}>{REVIEW_STATUS_LABEL[status]}</Badge>;
}

export function VerificationChip({ status }: { status: VerificationStatus }) {
  const tone: Tone =
    status === "verifie"
      ? "success"
      : status === "en_verification"
        ? "warning"
        : status === "refuse" || status === "suspendu"
          ? "danger"
          : "neutral";
  return (
    <Badge tone={tone} icon={status === "verifie" ? <IconCheckCircle size={13} /> : undefined}>
      {VERIFICATION_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-accent-fg)]",
        className,
      )}
    >
      Pro
    </span>
  );
}

// --------------------------------------------------------------------------
// Mentions obligatoires
// --------------------------------------------------------------------------

/** Règle absolue : l'IA assiste, elle ne décide jamais. */
export function AiAssistNotice({ compact = false }: { compact?: boolean }) {
  return (
    <Alert tone="info" icon={<IconSparkles size={15} />} title={compact ? undefined : "Ce que fait l'IA, et ce qu'elle ne fait pas"}>
      <p>
        <strong className="font-semibold">
          L&apos;IA assiste le tri. Elle ne prend aucune décision de recrutement et ne rejette aucun candidat.
        </strong>
      </p>
      {!compact ? (
        <p className="mt-1">
          Elle classe, résume et signale des points d&apos;attention à partir des informations déclarées. Le
          changement d&apos;état d&apos;une candidature, la mise en shortlist et le refus restent des gestes
          humains, tracés au nom du membre qui les effectue.
        </p>
      ) : null}
    </Alert>
  );
}

/** Confidentialité des candidats — arbitrage C7. */
export function PrivacyNotice() {
  return (
    <Alert tone="neutral" icon={<IconShield size={15} />} title="Confidentialité des candidats">
      <p>
        Les profils sont affichés sous forme anonyme : initiales, parcours et compétences, sans identité ni
        coordonnées. Les coordonnées se débloquent dans deux cas seulement : le candidat a postulé à une de vos
        offres, ou il a accepté votre prise de contact. Les candidats qui ont choisi d&apos;être invisibles
        n&apos;apparaissent jamais dans les résultats.
      </p>
    </Alert>
  );
}

// --------------------------------------------------------------------------
// Politique de vérification — visible à la publication d'une offre
// --------------------------------------------------------------------------

export function VerificationPolicyPanel({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const currentKey = status === "verifie" ? "verifie" : status === "en_verification" ? "leger" : "non_verifie";

  const outcome =
    currentKey === "verifie"
      ? "Votre organisation est vérifiée : l'offre sera en ligne immédiatement, avec le badge vérifié, et restera soumise à la modération a posteriori."
      : currentKey === "leger"
        ? "Votre vérification est légère : l'offre partira en file de validation et sera publiée après contrôle d'un administrateur, sous 24 à 48 heures ouvrées."
        : "Votre organisation n'est pas vérifiée : l'offre ne pourra être enregistrée qu'en brouillon. Déposez vos justificatifs pour publier.";

  return (
    <Card className={cx("p-4", className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden>
          <IconShield size={17} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--color-text)]">
            Politique de vérification et publication
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{outcome}</p>
        </div>
      </div>

      <ol className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
        {VERIFICATION_LEVELS.map((level, i) => {
          const active = level.key === currentKey;
          return (
            <li key={level.key} className="py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cx(
                    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "bg-[var(--color-surface-3)] text-[var(--color-text-subtle)]",
                  )}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span
                  className={cx(
                    "text-[13.5px] font-semibold",
                    active ? "text-[var(--color-primary)]" : "text-[var(--color-text)]",
                  )}
                >
                  {level.title}
                </span>
                {active ? <Badge tone="primary">Votre niveau</Badge> : null}
              </div>
              <p className="mt-1.5 text-[13px] font-medium text-[var(--color-text)]">{level.rule}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{level.detail}</p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// --------------------------------------------------------------------------
// Workflow de candidature
// --------------------------------------------------------------------------

const WORKFLOW_ORDER: ReviewStatus[] = ["recue", "a_examiner", "shortlist", "entretien"];

/** Frise du workflow recruteur, avec la projection vue par le candidat. */
export function WorkflowTrack({ current }: { current: ReviewStatus }) {
  const closed = current === "retenue" || current === "refusee";
  const index = WORKFLOW_ORDER.indexOf(current);

  return (
    <div>
      <ol className="flex flex-wrap items-center gap-1.5">
        {WORKFLOW_ORDER.map((step, i) => {
          const done = closed || (index >= 0 && i <= index);
          return (
            <li key={step} className="flex items-center gap-1.5">
              <span
                className={cx(
                  "inline-flex items-center rounded-full border border-transparent px-2.5 py-1 text-[12px] font-medium",
                  done
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]",
                  index === i && !closed ? "border-[var(--color-primary)]" : "",
                )}
              >
                {REVIEW_STATUS_LABEL[step]}
              </span>
              <span className="text-[var(--color-text-subtle)]" aria-hidden>
                →
              </span>
            </li>
          );
        })}
        <li className="flex items-center gap-1.5">
          <span
            className={cx(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium",
              current === "retenue"
                ? "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "border-transparent bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]",
            )}
          >
            {REVIEW_STATUS_LABEL.retenue}
          </span>
          <span className="text-[var(--color-text-subtle)]" aria-hidden>
            /
          </span>
          <span
            className={cx(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium",
              current === "refusee"
                ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "border-transparent bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]",
            )}
          >
            {REVIEW_STATUS_LABEL.refusee}
          </span>
        </li>
      </ol>
      <p className="mt-2 text-[12px] text-[var(--color-text-muted)]">
        Le candidat, lui, voit « {REVIEW_STATUS_CANDIDATE_LABEL[current]} ». Son axe de préparation
        (brouillon, générée, envoyée) ne vous appartient pas et n&apos;est jamais modifié ici.
      </p>
    </div>
  );
}

export function ReviewStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REVIEW_STATUSES.map((s) => (
        <ReviewStatusChip key={s} status={s} />
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------
// Graphiques en CSS pur
// --------------------------------------------------------------------------

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}

export function BarChart({
  data,
  unit = "",
  tone = "primary",
}: {
  data: BarDatum[];
  unit?: string;
  tone?: "primary" | "accent" | "success";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const color =
    tone === "accent" ? "var(--color-accent)" : tone === "success" ? "var(--color-success)" : "var(--color-primary)";

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[13px] text-[var(--color-text)]">
              {d.href ? (
                <Link href={d.href} className="hover:text-[var(--color-primary)] hover:underline">
                  {d.label}
                </Link>
              ) : (
                d.label
              )}
            </span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[var(--color-text)]">
              {d.value.toLocaleString("fr-FR")}
              {unit}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: color, opacity: 0.75 }}
            />
          </div>
          {d.hint ? <p className="mt-1 text-[12px] text-[var(--color-text-subtle)]">{d.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}

/** Entonnoir de recrutement, barres décroissantes en CSS pur. */
export function FunnelChart({ steps }: { steps: { key: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));

  return (
    <ol className="space-y-2.5">
      {steps.map((step, i) => {
        const previous = i > 0 ? steps[i - 1].count : step.count;
        const rate = previous > 0 ? Math.round((step.count / previous) * 100) : 0;
        return (
          <li key={step.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium text-[var(--color-text)]">
                {i + 1}. {step.label}
              </span>
              <span className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
                <strong className="font-semibold text-[var(--color-text)]">{step.count}</strong>
                {i > 0 ? <span className="ml-1.5 text-[12px]">({rate} % de l&apos;étape précédente)</span> : null}
              </span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-md bg-[var(--color-surface-3)]">
              <div
                className="h-full rounded-md"
                style={{
                  width: `${Math.max(6, (step.count / max) * 100)}%`,
                  background: "var(--color-primary)",
                  opacity: Math.max(0.35, 0.78 - i * 0.12),
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Petit bandeau expliquant qu'un écran fait partie du plan Pro. */
export function ProFeatureBanner({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
      <ProBadge />
      <p className="min-w-0 flex-1 text-[13px] text-[var(--color-text-muted)]">
        <strong className="font-semibold text-[var(--color-text)]">{feature}</strong> — {description}
      </p>
      <Link
        href="/recruteur/abonnement"
        className="shrink-0 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
      >
        Votre plan
      </Link>
    </div>
  );
}

/** Liste de points d'attention signalés par l'IA, jamais bloquante. */
export function AttentionPoints({ points }: { points: string[] }) {
  if (points.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-text-muted)]">
        Aucun point d&apos;attention détecté sur ce dossier.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {points.map((p) => (
        <li key={p} className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--color-text)]">
          <span className="mt-0.5 shrink-0 text-[var(--color-warning)]" aria-hidden>
            <IconAlert size={14} />
          </span>
          <span className="min-w-0">{p}</span>
        </li>
      ))}
    </ul>
  );
}
