/**
 * Cartes du site public, d'après le gabarit :
 * - `ServiceCard` : bordure basse de 4 px, bascule en marine au survol ;
 * - `SiteJobCard` : image à gauche, contenu à droite, bordure droite épaissie ;
 * - `TestimonialCard` : étoiles, citation, avatar à initiales ;
 * - `PostCard` : image qui s'agrandit au survol.
 */

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CONTRACT_TYPE_LABEL, OPPORTUNITY_TYPE_LABEL, formatSalaryRange } from "@/lib/enums";
import type { Job, Organization } from "@/lib/types";
import { jobImage, type Post, type Testimonial } from "@/data/site-content";
import { Pill, SiteIcon, Stars, cn } from "./kit";

// ---------------------------------------------------------------------------
// Icônes de service
// ---------------------------------------------------------------------------

export type ServiceIconName = "candidate" | "recruiter" | "trainer" | "payment" | "privacy";

export function ServiceGlyph({ name, size = 22 }: { name: ServiceIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "candidate":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "recruiter":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 13h18" />
        </svg>
      );
    case "trainer":
      return (
        <svg {...common}>
          <path d="M22 9 12 4 2 9l10 5 10-5Z" />
          <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
        </svg>
      );
    case "payment":
      return (
        <svg {...common}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h4" />
        </svg>
      );
    case "privacy":
      return (
        <svg {...common}>
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Carte de service. Au survol, le fond passe au marine, le texte au blanc et
 * la pastille d'icône à l'or, en 0,5 s à l'entrée et 0,2 s à la sortie comme
 * dans le modèle.
 */
export function ServiceCard({
  title,
  text,
  icon,
  href,
}: {
  title: string;
  text: string;
  icon: ServiceIconName;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <h3 className="site-display text-[1.5rem] leading-tight text-site-navy transition-colors duration-200 group-hover:text-white group-hover:duration-500 md:text-[1.625rem]">
          {title}
        </h3>
        <span className="inline-flex shrink-0 rounded-[0.4rem] bg-site-soft p-2 text-site-navy transition-colors duration-200 group-hover:bg-site-gold group-hover:duration-500">
          <ServiceGlyph name={icon} />
        </span>
      </div>
      <p className="mt-5 text-[0.9375rem] leading-relaxed text-site-navy/85 transition-colors duration-200 group-hover:text-white/85 group-hover:duration-500">
        {text}
      </p>
      {href ? (
        <span className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-site-navy transition-colors duration-200 group-hover:text-site-gold group-hover:duration-500">
          En savoir plus
          <SiteIcon.Arrow size={16} />
        </span>
      ) : null}
    </>
  );

  const className =
    "group flex h-full flex-col rounded-[1rem] border border-b-4 border-site-border bg-white p-6 transition-colors duration-200 hover:bg-site-navy hover:duration-500 md:p-7";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

// ---------------------------------------------------------------------------
// Offre
// ---------------------------------------------------------------------------

/**
 * Carte d'offre à image. Sur grand écran et jusqu'à 480 px : image à gauche
 * (0,75 fr), contenu à droite (1,25 fr), bordure droite de 4 px. Sous 768 px
 * la bordure épaissie passe en bas. Sous 480 px l'image passe au-dessus.
 */
export function SiteJobCard({
  job,
  organization,
  href,
}: {
  job: Job;
  organization?: Organization;
  href?: string;
}) {
  const img = jobImage(job);
  const link = href ?? `/offres/${job.slug}`;
  const orgName =
    job.visibility === "anonymisee" ? "Entreprise confidentielle" : organization?.tradeName ?? organization?.legalName ?? "";
  const verified = organization?.verificationStatus === "verifie" && job.visibility !== "anonymisee";

  return (
    <article className="group relative grid h-full overflow-hidden rounded-[1.5rem] border border-site-border bg-white md:grid-cols-[0.75fr_1.25fr] md:border-b md:border-r-4 max-md:border-b-4 xs:max-md:grid-cols-2">
      <div className="relative h-52 overflow-hidden xs:h-auto xs:min-h-full">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(min-width: 768px) 20vw, (min-width: 480px) 45vw, 100vw"
          className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110"
        />
      </div>
      <div className="flex flex-col p-5 md:p-6">
        <p className="flex items-center gap-1.5 text-[0.8125rem] text-site-muted">
          {orgName}
          {verified ? (
            <span className="inline-flex text-site-navy" title="Recruteur vérifié par SIRA">
              <SiteIcon.Check size={14} />
              <span className="sr-only">Recruteur vérifié</span>
            </span>
          ) : null}
        </p>
        <h3 className="site-display mt-1.5 text-[1.5rem] leading-tight text-site-ink">
          <Link href={link} className="after:absolute after:inset-0 hover:text-site-navy">
            {job.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-site-ink/80">{job.summary}</p>
        <p className="mt-3 text-[0.9375rem] font-semibold text-site-ink">
          Salaire : {formatSalaryRange(job.salaryMin, job.salaryMax)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <Pill>{OPPORTUNITY_TYPE_LABEL[job.opportunityType]}</Pill>
          <Pill>{CONTRACT_TYPE_LABEL[job.contractType]}</Pill>
          <Pill className="ml-auto" icon={<SiteIcon.Pin size={15} />}>
            {job.city}
          </Pill>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Témoignage
// ---------------------------------------------------------------------------

export function InitialsAvatar({ initials, size = 44, className }: { initials: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-site-navy font-semibold text-site-gold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

/** Carte de témoignage : 25rem de large, 15rem sous 480 px, comme le modèle. */
export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="flex w-[17rem] shrink-0 flex-col justify-between rounded-[1rem] border border-b-4 border-site-border bg-white p-6 xs:w-[22rem] md:w-[25rem] md:p-8">
      <div>
        <Stars count={t.rating} />
        <blockquote className="mt-5 text-[0.9375rem] leading-relaxed text-site-ink md:text-[1rem]">
          « {t.quote} »
        </blockquote>
      </div>
      <figcaption className="mt-6 flex items-center gap-3">
        <InitialsAvatar initials={t.initials} />
        <span>
          <span className="block text-[0.9375rem] font-semibold text-site-ink">{t.name}</span>
          <span className="block text-[0.875rem] text-site-muted">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function PostCard({ post, size = "md" }: { post: Post; size?: "md" | "lg" }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1rem] border border-b-4 border-site-border bg-white transition-colors duration-[400ms] hover:border-site-navy">
      <div className={cn("relative overflow-hidden", size === "lg" ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <Image
          src={post.image.src}
          alt={post.image.alt}
          fill
          sizes={size === "lg" ? "(min-width: 992px) 45vw, 100vw" : "(min-width: 992px) 30vw, (min-width: 768px) 45vw, 100vw"}
          className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-3 text-[0.8125rem] text-site-muted">
          <Pill>{post.category}</Pill>
          <span>{formatPostDate(post.date)}</span>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min de lecture</span>
        </div>
        <h3
          className={cn(
            "site-display mt-4 leading-snug text-site-ink transition-colors duration-[400ms] group-hover:text-site-navy",
            size === "lg" ? "text-[1.75rem]" : "text-[1.375rem]",
          )}
        >
          <Link href={`/conseils/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-site-ink/75">{post.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-[0.9375rem] font-semibold text-site-navy">
          Lire l&apos;article
          <SiteIcon.Arrow size={16} />
        </span>
      </div>
    </article>
  );
}

/** Carte de chiffre clé, sur fond marine, séparée par un filet vertical. */
export function StatItem({ value, label, accent }: { value: string; label: string; accent?: boolean }): ReactNode {
  return (
    <div className="border-l border-white/70 pl-6 md:pl-8">
      <p
        className={cn(
          "site-display text-[3.25rem] font-semibold leading-[1.15] md:text-[4rem] tab:text-[5rem]",
          accent ? "text-site-gold" : "text-white",
        )}
      >
        {value}
      </p>
      <p className="mt-2 max-w-[14rem] text-[0.9375rem] leading-snug text-white/90">{label}</p>
    </div>
  );
}
