/**
 * Briques partagées par les écrans de l'espace candidat (candidatures,
 * documents, formations, notifications, abonnement, profil, paramètres).
 *
 * Règle C1 rappelée ici une fois pour toutes : le candidat ne voit jamais
 * l'état brut du recruteur. Toute projection passe par `candidateStateLabel`,
 * qui lit `REVIEW_STATUS_CANDIDATE_LABEL`.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import {
  APPLICATION_CHANNEL_LABEL,
  PREPARATION_STATUS_LABEL,
  REVIEW_STATUS_CANDIDATE_LABEL,
  type ApplicationChannel,
  type NotificationChannel,
  type PreparationStatus,
  type ReviewStatus,
} from "@/lib/enums";
import type { Application, ApplicationEvent } from "@/lib/types";
import { Badge, Card, cx, formatDate, type Tone } from "./ui";
import { IconBell, IconChat, IconDownload, IconMail, IconSparkles, IconWhatsApp } from "./icons";

// --------------------------------------------------------------------------
// États d'une candidature
// --------------------------------------------------------------------------

export const PREPARATION_TONE: Record<PreparationStatus, Tone> = {
  brouillon: "neutral",
  generee: "info",
  a_verifier: "warning",
  validee: "primary",
  envoyee: "success",
};

/** Tonalité de l'état *projeté*, jamais de l'état interne du recruteur. */
export const REVIEW_CANDIDATE_TONE: Record<ReviewStatus, Tone> = {
  recue: "info",
  a_examiner: "info",
  shortlist: "info",
  entretien: "accent",
  retenue: "success",
  refusee: "danger",
};

/** Libellé vu par la candidate : préparation tant que rien n'est parti. */
export function candidateStateLabel(application: Application): string {
  if (application.preparationStatus !== "envoyee") {
    return PREPARATION_STATUS_LABEL[application.preparationStatus];
  }
  return application.reviewStatus
    ? REVIEW_STATUS_CANDIDATE_LABEL[application.reviewStatus]
    : PREPARATION_STATUS_LABEL.envoyee;
}

export function candidateStateTone(application: Application): Tone {
  if (application.preparationStatus !== "envoyee") {
    return PREPARATION_TONE[application.preparationStatus];
  }
  return application.reviewStatus ? REVIEW_CANDIDATE_TONE[application.reviewStatus] : "success";
}

export function CandidateStateChip({ application }: { application: Application }) {
  return <Badge tone={candidateStateTone(application)}>{candidateStateLabel(application)}</Badge>;
}

export type ApplicationBucket = "preparation" | "envoyees" | "terminees" | "archivees";

export const BUCKET_LABEL: Record<ApplicationBucket, string> = {
  preparation: "En préparation",
  envoyees: "Envoyées",
  terminees: "Terminées",
  archivees: "Archivées",
};

/** Regroupement des candidatures par grande étape, pour les onglets. */
export function applicationBucket(application: Application): ApplicationBucket {
  if (application.isArchived) return "archivees";
  if (application.preparationStatus !== "envoyee") return "preparation";
  if (application.reviewStatus === "retenue" || application.reviewStatus === "refusee") return "terminees";
  return "envoyees";
}

// --------------------------------------------------------------------------
// Canaux
// --------------------------------------------------------------------------

/** Phrase explicative du canal de candidature — trois parcours distincts. */
export function channelExplanation(channel: ApplicationChannel, target?: string): string {
  switch (channel) {
    case "sira":
      return "Votre dossier est déposé directement sur SIRA. Le recruteur y accède depuis son espace, et l'avancement vous est remonté automatiquement.";
    case "email":
      return `Après votre validation, SIRA envoie l'e-mail de candidature${
        target ? ` à ${target}` : ""
      } en votre nom. Rien n'est expédié tant que vous n'avez pas relu et validé le message.`;
    case "externe":
      return `SIRA ne peut pas transmettre cette candidature à votre place${
        target ? ` : ${target.toLowerCase()}` : ""
      }. Téléchargez votre dossier, envoyez-le par le canal indiqué, puis marquez la candidature comme envoyée pour garder le suivi.`;
  }
}

export function ChannelBadge({ channel }: { channel: ApplicationChannel }) {
  const icon =
    channel === "email" ? <IconMail size={13} /> : channel === "externe" ? <IconDownload size={13} /> : <IconSparkles size={13} />;
  return (
    <Badge tone={channel === "externe" ? "warning" : "neutral"} icon={icon}>
      {APPLICATION_CHANNEL_LABEL[channel]}
    </Badge>
  );
}

/** Icône du canal d'une notification — in-app, e-mail ou WhatsApp. */
export function NotificationChannelIcon({ channel, size = 14 }: { channel: NotificationChannel; size?: number }) {
  if (channel === "whatsapp") return <IconWhatsApp size={size} />;
  if (channel === "email") return <IconMail size={size} />;
  return <IconBell size={size} />;
}

// --------------------------------------------------------------------------
// Frise verticale d'historique
// --------------------------------------------------------------------------

export const ACTOR_LABEL: Record<ApplicationEvent["actor"], string> = {
  candidat: "Vous",
  recruteur: "Recruteur",
  systeme: "SIRA",
};

const ACTOR_DOT: Record<ApplicationEvent["actor"], string> = {
  candidat: "bg-[var(--color-primary)]",
  recruteur: "bg-[var(--color-accent)]",
  systeme: "bg-[var(--color-text-subtle)]",
};

/** Historique complet d'une candidature, du plus ancien au plus récent. */
export function ApplicationTimeline({ events }: { events: ApplicationEvent[] }) {
  return (
    <ol className="space-y-0">
      {events.map((event, index) => (
        <li key={`${event.at}-${index}`} className="flex gap-3">
          <span className="relative flex w-4 shrink-0 flex-col items-center">
            <span className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", ACTOR_DOT[event.actor])} aria-hidden />
            {index < events.length - 1 ? (
              <span className="w-px flex-1 bg-[var(--color-border)]" aria-hidden />
            ) : null}
          </span>
          <div className={cx("min-w-0", index < events.length - 1 ? "pb-5" : "")}>
            <p className="text-[13.5px] font-medium text-[var(--color-text)]">{event.label}</p>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              {formatDate(event.at)} · {ACTOR_LABEL[event.actor]}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// --------------------------------------------------------------------------
// Premium
// --------------------------------------------------------------------------

/** Étiquette posée sur une fonction réservée au plan Premium. */
export function PremiumTag({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
        "bg-[var(--color-accent)] text-[var(--color-accent-fg)]",
        className,
      )}
    >
      Premium
    </span>
  );
}

/** Invitation à passer Premium : la fonction reste visible, jamais masquée. */
export function PremiumCallout({
  title,
  children,
  cta = "Découvrir Premium",
}: {
  title: string;
  children: ReactNode;
  cta?: string;
}) {
  return (
    <div className="rounded-r border-l-2 border-[var(--color-accent)] bg-[var(--color-surface-2)] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-[var(--color-accent-text)]" aria-hidden>
          <IconSparkles size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-[var(--color-text)]">{title}</h3>
            <PremiumTag />
          </div>
          <div className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{children}</div>
          <Link
            href="/mon-espace/abonnement"
            className="mt-3 inline-flex h-8 items-center rounded-md bg-[var(--color-accent)] px-3 text-[13px] font-semibold text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Divers
// --------------------------------------------------------------------------

/** Onglets pilotés par l'URL : aucun état client, une simple liste de liens. */
export function TabLinks({
  tabs,
  current,
  label,
}: {
  tabs: { key: string; label: string; href: string; count?: number }[];
  current: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="scrollbar-slim mb-5 overflow-x-auto border-b border-[var(--color-border)]"
    >
      <ul className="flex min-w-max items-center gap-5">
        {tabs.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium transition-colors",
                  active
                    ? "border-[var(--color-primary)] text-[var(--color-text)]"
                    : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {tab.label}
                {tab.count !== undefined ? (
                  <span
                    className={cx(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums",
                      active
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "bg-[var(--color-surface-3)] text-[var(--color-text-muted)]",
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Bloc de section avec ancre, utilisé par le profil et les paramètres. */
export function SettingsSection({
  id,
  title,
  description,
  icon,
  children,
  tone = "neutral",
}: {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <Card
      as="section"
      className={cx("scroll-mt-20", tone === "danger" ? "border-[var(--color-danger)]/40" : undefined)}
    >
      <div className="flex items-start gap-3 border-b border-[var(--color-border)] px-4 py-3.5">
        {icon ? (
          <span
            className={cx(
              "mt-0.5 shrink-0",
              tone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-text-subtle)]",
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2
            id={id}
            className={cx(
              "scroll-mt-20 text-[15px] font-semibold leading-snug",
              tone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-text)]",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

/** Petit bandeau d'aide de l'assistant, réutilisé par plusieurs écrans. */
export function AssistantHint({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-r border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
      <span className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden>
        <IconChat size={14} />
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}
