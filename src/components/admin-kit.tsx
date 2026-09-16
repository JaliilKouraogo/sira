/**
 * Primitives partagées par le back-office et l'espace formateur.
 *
 * Rien ici n'invente de libellé métier : les textes affichés proviennent du
 * référentiel `@/lib/enums`. Ce fichier ne porte que la mise en forme
 * (tableaux défilables, graphiques en CSS pur, files d'attente) et la
 * correspondance statut vers tonalité de couleur du design system.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card, cx, type Tone } from "@/components/ui";
import { getOrganizations, getRecruiterJobs } from "@/data/queries";
import type {
  AiJobStatus,
  CampaignStatus,
  JobStatus,
  PaymentStatus,
  PreparationStatus,
  ReviewStatus,
  SubscriptionStatus,
  VerificationStatus,
} from "@/lib/enums";
import type { Job, Organization, User } from "@/lib/types";

// --------------------------------------------------------------------------
// Accès aux données du back-office
// --------------------------------------------------------------------------

/**
 * Toutes les offres, tous statuts confondus.
 *
 * La couche d'accès aux données n'expose pas de lecture globale non filtrée :
 * l'administration recompose donc la liste organisation par organisation,
 * plutôt que de lire les fixtures directement.
 */
export function getAllJobsAdmin(): Job[] {
  return getOrganizations()
    .flatMap((org) => getRecruiterJobs(org.id))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// --------------------------------------------------------------------------
// Tableaux — tout tableau large vit dans un conteneur défilable
// --------------------------------------------------------------------------

export function Table({
  head,
  children,
  minWidth = 720,
}: {
  head: ReactNode[];
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {head.map((h, i) => (
              <th
                key={`col-${i}`}
                scope="col"
                className="whitespace-nowrap px-4 py-2.5 text-left text-[11.5px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cx("hover:bg-[var(--color-surface-2)]", className)}>{children}</tr>;
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cx("px-4 py-3 align-middle text-[var(--color-text)]", className)}>
      {children}
    </td>
  );
}

/** Cellule secondaire : gris, sans retour à la ligne. */
export function TdMuted({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <Td className={cx("whitespace-nowrap text-[13px] text-[var(--color-text-muted)]", className)}>{children}</Td>
  );
}

// --------------------------------------------------------------------------
// Graphiques — CSS pur, aucune bibliothèque
// --------------------------------------------------------------------------

export interface ChartItem {
  label: string;
  value: number;
  display?: string;
}

/** Barres horizontales. Aucun texte n'est posé sur la barre : l'or reste lisible. */
export function BarChart({
  items,
  tone = "primary",
  emptyLabel = "Aucune donnée sur la période",
}: {
  items: ChartItem[];
  tone?: "primary" | "accent" | "success" | "warning" | "info";
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--color-text-muted)]">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  const color = `var(--color-${tone})`;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[13px] text-[var(--color-text)]">{item.label}</span>
            <span className="shrink-0 text-[13px] font-medium tabular-nums text-[var(--color-text)]">
              {item.display ?? item.value}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: color, opacity: 0.75 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Colonnes verticales, pour une série temporelle courte. */
export function ColumnChart({
  items,
  tone = "primary",
  height = 150,
  ariaLabel = "Évolution sur la période",
}: {
  items: ChartItem[];
  tone?: "primary" | "accent" | "success";
  height?: number;
  ariaLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const color = `var(--color-${tone})`;
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label={ariaLabel}>
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10.5px] tabular-nums text-[var(--color-text-muted)]">
              {item.display ?? item.value}
            </span>
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max(4, (item.value / max) * (height - 26))}px`,
                background: color,
                opacity: 0.75,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {items.map((item) => (
          <span
            key={item.label}
            className="min-w-0 flex-1 truncate text-center text-[11px] text-[var(--color-text-subtle)]"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Files d'attente actionnables
// --------------------------------------------------------------------------

export function QueueCard({
  title,
  count,
  description,
  href,
  linkLabel = "Traiter la file",
  tone = "primary",
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  linkLabel?: string;
  tone?: Tone;
}) {
  const empty = count === 0;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--color-text)]">{title}</p>
          <p className="mt-1 text-[26px] font-semibold leading-tight tabular-nums text-[var(--color-text)]">{count}</p>
        </div>
        <Badge tone={empty ? "success" : tone}>{empty ? "À jour" : "À traiter"}</Badge>
      </div>
      <p className="text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>
      <Link href={href} className="mt-auto text-[13px] font-medium text-[var(--color-primary)] hover:underline">
        {empty ? "Consulter" : linkLabel}
      </Link>
    </Card>
  );
}

/** Encart de procédure numérotée, repris sur plusieurs écrans. */
export function ProcessSteps({ steps }: { steps: { label: string; detail: string }[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className="rounded-[var(--radius-card)] border border-[var(--color-border)] px-3.5 py-3"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-3)] text-[11px] font-semibold tabular-nums text-[var(--color-text-muted)]">
            {i + 1}
          </span>
          <p className="mt-2 text-[13px] font-medium text-[var(--color-text)]">{step.label}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-text-muted)]">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

// --------------------------------------------------------------------------
// Statuts vers tonalités
// --------------------------------------------------------------------------

export const VERIFICATION_TONE: Record<VerificationStatus, Tone> = {
  non_verifie: "neutral",
  en_verification: "warning",
  verifie: "success",
  refuse: "danger",
  suspendu: "danger",
};

export const JOB_STATUS_TONE: Record<JobStatus, Tone> = {
  brouillon: "neutral",
  en_validation: "warning",
  publiee: "success",
  suspendue: "danger",
  expiree: "neutral",
  cloturee: "neutral",
  rejetee: "danger",
};

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, Tone> = {
  brouillon: "neutral",
  en_moderation: "warning",
  validee: "info",
  en_attente_paiement: "warning",
  diffusion: "success",
  terminee: "neutral",
  rejetee: "danger",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  cancelled: "neutral",
  refunded: "info",
};

export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, Tone> = {
  active: "success",
  en_attente_paiement: "warning",
  grace: "warning",
  expiree: "neutral",
  annulee: "neutral",
};

export const AI_STATUS_TONE: Record<AiJobStatus, Tone> = {
  queued: "neutral",
  running: "info",
  succeeded: "success",
  failed: "danger",
  cancelled: "neutral",
};

export const PREPARATION_TONE: Record<PreparationStatus, Tone> = {
  brouillon: "neutral",
  generee: "info",
  a_verifier: "warning",
  validee: "primary",
  envoyee: "success",
};

export const REVIEW_TONE: Record<ReviewStatus, Tone> = {
  recue: "neutral",
  a_examiner: "info",
  shortlist: "primary",
  entretien: "warning",
  retenue: "success",
  refusee: "danger",
};

/**
 * Statut de signalement : l'union est déclarée dans `Report` (types.ts) et
 * n'a pas de libellé au référentiel. Les libellés d'affichage sont donc
 * portés ici, au plus près de l'écran qui les consomme.
 */
export type ReportStatus = "ouvert" | "en_cours" | "traite" | "rejete";

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  ouvert: "Ouvert",
  en_cours: "En cours d'instruction",
  traite: "Traité",
  rejete: "Rejeté",
};

export const REPORT_STATUS_TONE: Record<ReportStatus, Tone> = {
  ouvert: "danger",
  en_cours: "warning",
  traite: "success",
  rejete: "neutral",
};

// --------------------------------------------------------------------------
// Formats
// --------------------------------------------------------------------------

export function orgName(org?: Organization): string {
  if (!org) return "Organisation inconnue";
  return org.tradeName ?? org.legalName;
}

export function fullName(user?: User): string {
  if (!user) return "Utilisateur inconnu";
  return `${user.firstName} ${user.lastName}`;
}

export function initialsOf(user?: User): string {
  if (!user) return "??";
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

/** Coût IA : libellé en dollars, parce que la facturation des modèles l'est. */
export function formatUsd(amount: number, digits = 4): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)} USD`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(ms / 1000)} s`;
}
