/**
 * Carte de formation du catalogue public.
 * Une formation payante affiche son prix : l'accès n'est jamais ambigu.
 */

import Link from "next/link";
import { IconCheckCircle, IconClock, IconGraduation, IconStar, IconUsers } from "@/components/icons";
import { Badge, Card, Tag } from "@/components/ui";
import { getOrganization } from "@/data/queries";
import {
  TRAINING_ACCESS_LABEL,
  TRAINING_FORMAT_LABEL,
  formatMoney,
  type TrainingAccess,
} from "@/lib/enums";
import type { Training } from "@/lib/types";
import type { Tone } from "@/components/ui";

export function trainingAccessTone(access: TrainingAccess): Tone {
  if (access === "public_gratuit") return "success";
  if (access === "inclus_premium") return "accent";
  return "neutral";
}

/** Libellé d'accès, complété du prix quand la formation est payante. */
export function trainingAccessLabel(training: Training): string {
  if (training.access === "payant") {
    return training.price ? `Payante — ${formatMoney(training.price)}` : TRAINING_ACCESS_LABEL.payant;
  }
  return TRAINING_ACCESS_LABEL[training.access];
}

export function seatsLeft(training: Training): number | null {
  if (training.seats == null) return null;
  return Math.max(0, training.seats - (training.seatsTaken ?? 0));
}

export function PublicTrainingCard({ training }: { training: Training }) {
  const organization = getOrganization(training.organizationId);
  const remaining = seatsLeft(training);

  return (
    <Card as="article" className="group relative flex h-full flex-col p-4 transition-colors hover:border-[var(--color-border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-primary)]"
          aria-hidden
        >
          <IconGraduation size={18} />
        </span>
        <Badge tone={trainingAccessTone(training.access)}>{trainingAccessLabel(training)}</Badge>
      </div>

      <h3 className="mt-3.5 text-[14.5px] font-semibold leading-snug text-[var(--color-text)]">
        <Link
          href={`/formations/${training.slug}`}
          className="before:absolute before:inset-0 hover:text-[var(--color-primary)]"
        >
          {training.title}
        </Link>
      </h3>
      <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
        {organization?.tradeName ?? organization?.legalName ?? "Organisme de formation"}
      </p>

      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{training.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1">
          <IconClock size={13} />
          {training.durationHours} h
        </span>
        {training.rating ? (
          <span className="inline-flex items-center gap-1">
            <IconStar size={13} className="text-[var(--color-accent-text)]" />
            <span className="tabular-nums">{training.rating.toFixed(1)} / 5</span>
          </span>
        ) : null}
        {remaining !== null ? (
          <span className="inline-flex items-center gap-1">
            <IconUsers size={13} />
            {remaining === 0 ? "Complet" : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--color-border)] pt-3">
        <Tag>{TRAINING_FORMAT_LABEL[training.format]}</Tag>
        <Tag>{training.level}</Tag>
        <Tag>{training.category}</Tag>
        {training.certificate ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-success)]">
            <IconCheckCircle size={13} />
            Certificat
          </span>
        ) : null}
      </div>
    </Card>
  );
}
