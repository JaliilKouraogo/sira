/**
 * Carte de formation du site public, et petites fonctions de présentation
 * partagées par le catalogue et la fiche détaillée.
 *
 * Même grammaire que les autres cartes du site : filet or de 1 px, bordure
 * basse épaissie à 4 px, image en haut qui s'agrandit au survol, titre en
 * Instrument Sans. L'accès (gratuite, incluse avec Premium, payante) est
 * lisible dès l'image, et le prix d'une formation payante est toujours
 * affiché : l'accès n'est jamais ambigu.
 */

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getOrganization } from "@/data/queries";
import { trainingImage } from "@/data/site-content";
import { TRAINING_ACCESS_LABEL, TRAINING_FORMAT_LABEL, formatMoney } from "@/lib/enums";
import type { Training } from "@/lib/types";
import { Pill, SiteIcon, cn } from "./kit";

// ---------------------------------------------------------------------------
// Présentation
// ---------------------------------------------------------------------------

/** Places encore disponibles, ou `null` quand la session n'est pas limitée. */
export function seatsLeft(training: Training): number | null {
  if (training.seats == null) return null;
  return Math.max(0, training.seats - (training.seatsTaken ?? 0));
}

/** « 5 places restantes », « 1 place restante » ou « Session complète ». */
export function seatsLabel(remaining: number, full = "Session complète"): string {
  if (remaining === 0) return full;
  return `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`;
}

/** Tarif affiché : le montant pour une formation payante, l'accès sinon. */
export function trainingPriceLabel(training: Training): string {
  if (training.access === "payant") {
    return training.price ? formatMoney(training.price) : TRAINING_ACCESS_LABEL.payant;
  }
  return TRAINING_ACCESS_LABEL[training.access];
}

/** Note au format français : « 4,6 ». */
export function formatRating(rating: number): string {
  return rating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Date longue en français, stable quel que soit le fuseau du visiteur. */
export function formatTrainingDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Libellé court de durée : « 21 h ». */
export function durationLabel(hours: number): string {
  return `${hours} h`;
}

// ---------------------------------------------------------------------------
// Icônes propres aux formations
// ---------------------------------------------------------------------------

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const TrainingIcon = {
  Star: ({ size = 16, className }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="m12 2.5 2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8L12 2.5Z"
        fill="currentColor"
      />
    </svg>
  ),
  Seats: ({ size = 16, className }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3a6.5 6.5 0 0 1 3.5 5.7" />
    </svg>
  ),
  Format: ({ size = 16, className }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  ),
  Level: ({ size = 16, className }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M5 20v-5M12 20V9M19 20V4" />
    </svg>
  ),
  Certificate: ({ size = 16, className }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m9.5 9 1.8 1.8L14.8 7.5M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5" />
    </svg>
  ),
  Calendar: ({ size = 16, className }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Pastille d'accès
// ---------------------------------------------------------------------------

/**
 * Pastille d'accès posée sur l'image. L'or reste un accent : il ne sert qu'à
 * signaler l'accès Premium, sur une petite surface.
 */
export function AccessBadge({ training, className }: { training: Training; className?: string }): ReactNode {
  const tone =
    training.access === "inclus_premium"
      ? "bg-site-gold text-site-navy"
      : training.access === "public_gratuit"
        ? "bg-site-navy text-white"
        : "bg-white text-site-navy";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[0.5rem] px-2.5 py-1 text-[0.8125rem] font-semibold",
        tone,
        className,
      )}
    >
      {TRAINING_ACCESS_LABEL[training.access]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Carte
// ---------------------------------------------------------------------------

export function TrainingCard({ training, headingLevel = "h3" }: { training: Training; headingLevel?: "h2" | "h3" }) {
  const organization = getOrganization(training.organizationId);
  const remaining = seatsLeft(training);
  const img = trainingImage(training);
  const TitleTag = headingLevel;
  const verified = organization?.verificationStatus === "verifie";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1rem] border border-b-4 border-site-border bg-white transition-colors duration-[400ms] hover:border-site-navy">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(min-width: 992px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110"
        />
        <AccessBadge training={training} className="absolute left-4 top-4 shadow-sm" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-1.5 text-[0.8125rem] text-site-muted">
          <span className="truncate">{training.category}</span>
          <span aria-hidden>·</span>
          <span className="truncate">
            {organization?.tradeName ?? organization?.legalName ?? "Organisme de formation"}
          </span>
          {verified ? (
            <span className="inline-flex shrink-0 text-site-navy" title="Organisme vérifié par SIRA">
              <SiteIcon.Check size={14} />
              <span className="sr-only">Organisme vérifié</span>
            </span>
          ) : null}
        </p>

        <TitleTag className="site-display mt-3 text-[1.375rem] leading-snug text-site-ink transition-colors duration-[400ms] group-hover:text-site-navy">
          <Link href={`/formations/${training.slug}`} className="after:absolute after:inset-0">
            {training.title}
          </Link>
        </TitleTag>

        <p className="mt-2 text-[0.9375rem] leading-relaxed text-site-ink/75">{training.summary}</p>

        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Caractéristiques">
          <li>
            <Pill icon={<SiteIcon.Clock size={15} />}>{durationLabel(training.durationHours)}</Pill>
          </li>
          <li>
            <Pill icon={<TrainingIcon.Format size={15} />}>{TRAINING_FORMAT_LABEL[training.format]}</Pill>
          </li>
          <li>
            <Pill icon={<TrainingIcon.Level size={15} />}>{training.level}</Pill>
          </li>
          {training.certificate ? (
            <li>
              <Pill icon={<TrainingIcon.Certificate size={15} />}>Certificat</Pill>
            </li>
          ) : null}
        </ul>

        <div className="mt-auto pt-5">
          <div className="border-t border-site-line pt-4">
            <p className="text-[1.0625rem] font-semibold text-site-navy">{trainingPriceLabel(training)}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-site-muted">
              {training.rating ? (
                <span className="inline-flex items-center gap-1">
                  <TrainingIcon.Star size={14} className="text-site-gold" />
                  <span className="font-semibold text-site-ink">{formatRating(training.rating)}</span>
                  <span className="sr-only">sur 5</span>
                </span>
              ) : null}
              {remaining !== null ? (
                <span className={cn("inline-flex items-center gap-1", remaining === 0 && "font-semibold text-site-navy")}>
                  <TrainingIcon.Seats size={14} />
                  {seatsLabel(remaining, "Complet")}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
