/**
 * Détail d'une offre — [T §6]. Tous les champs de l'entité Job y figurent :
 * ce qui est demandé, ce qui bloque, comment postuler, et qui recrute.
 *
 * Structure reprise du « détail de service » du gabarit de référence :
 *   1. en-tête clair centré : organisation, titre, résumé, pastilles, puis
 *      grande image dévoilée par un rideau, avec parallaxe ;
 *   2. corps sur deux colonnes (une seule sous 992 px) : contenu détaillé à
 *      gauche, encadré « Postuler » collant et carte du recruteur à droite ;
 *   3. offres similaires ;
 *   4. appel à l'action.
 *
 * Règles conservées : une offre non publiée renvoie la page 404 (RM-10), le
 * score reste une estimation qui ne garantit pas le recrutement, et rien
 * n'est envoyé sans la validation du candidat.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconAlert,
  IconBriefcase,
  IconBuilding,
  IconClock,
  IconFile,
  IconMail,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import { SiteJobCard, InitialsAvatar } from "@/components/site/cards";
import { CtaBlock } from "@/components/site/cta";
import { Heading, Hl, Inner, Lead, Panel, Pill, Section, SiteButtonLink, SiteIcon, cn } from "@/components/site/kit";
import { ImageFrame, Parallax, Reveal } from "@/components/site/motion";
import { OffreActions, OffreCountdown } from "@/components/site/offre-actions";
import { scoreLabel } from "@/components/score";
import { daysUntil, formatDate, relativeDays } from "@/components/ui";
import { getJobBySlug, getJobOrganization, getPublishedJobs, getRecentJobs, getScore } from "@/data/queries";
import { IMG, jobImage } from "@/data/site-content";
import {
  APPLICATION_CHANNEL_LABEL,
  BLOCKING_CRITERIA_CAP,
  CONTRACT_TYPE_LABEL,
  JOB_ORIGIN_LABEL,
  OPPORTUNITY_TYPE_LABEL,
  ORGANIZATION_TYPE_LABEL,
  SCORE_DISCLAIMER,
  WORK_MODE_LABEL,
  formatSalaryRange,
} from "@/lib/enums";
import type { Job, Organization } from "@/lib/types";

// ---------------------------------------------------------------------------
// Export statique : seules les offres publiées sont pré-générées.
// ---------------------------------------------------------------------------

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getPublishedJobs().map((job) => ({ slug: job.slug }));
}

function orgDisplayName(job: Job, organization?: Organization): string {
  if (job.visibility === "anonymisee") return "Entreprise confidentielle";
  return organization?.tradeName ?? organization?.legalName ?? "Organisation";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job || job.status !== "publiee") return { title: "Offre introuvable" };
  const name = orgDisplayName(job, getJobOrganization(job));
  return {
    title: `${job.title} — ${name}`,
    description: job.summary,
    openGraph: { title: `${job.title} — ${name}`, description: job.summary, type: "website" },
  };
}

// ---------------------------------------------------------------------------
// Petits éléments propres à la page
// ---------------------------------------------------------------------------

/** Le dernier mot du titre prend l'or, comme les titres du reste du site. */
function splitTitle(title: string): { head: string; tail: string } {
  const i = title.lastIndexOf(" ");
  return i < 0 ? { head: "", tail: title } : { head: title.slice(0, i + 1), tail: title.slice(i + 1) };
}

/** Intertitre du contenu : marine, avec un mot-clé en or. */
function BodyHeading({ id, children, subtitle }: { id: string; children: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-6">
      <Heading as="h2" size="h3" className="text-site-navy">
        <span id={id}>{children}</span>
      </Heading>
      {subtitle ? <p className="mt-2 text-[0.9375rem] text-site-muted">{subtitle}</p> : null}
    </div>
  );
}

/** Petite étiquette au-dessus d'une valeur. */
function Label({ children, as: Tag = "p", className }: { children: ReactNode; as?: "p" | "span" | "h2" | "h3" | "dt"; className?: string }) {
  return (
    <Tag className={cn("text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-site-muted", className)}>
      {children}
    </Tag>
  );
}

/** Carte blanche à filet or et bordure basse épaissie. */
function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[1.5rem] border border-b-4 border-site-border bg-white p-6 md:p-7", className)}>
      {children}
    </div>
  );
}

/** Anneau de score aux couleurs du site : piste claire, progression or. */
function ScoreDial({ score }: { score: number }) {
  const size = 132;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Score de compatibilité estimé : ${score} sur 100`}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-site-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-site-gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="site-display text-[2.25rem] leading-none text-site-navy tabular-nums">{score}</span>
        <span className="mt-1 text-[0.75rem] text-site-muted">sur 100</span>
      </span>
    </div>
  );
}

const APPLY_BUTTON =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[0.5rem] bg-site-navy px-6 py-3.5 text-[1rem] font-semibold text-white transition-colors duration-[250ms] hover:bg-site-navy-deep";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OffreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job || job.status !== "publiee") notFound();

  const organization = getJobOrganization(job);
  const score = getScore(job.id);
  const anonymised = job.visibility === "anonymisee";
  const name = orgDisplayName(job, organization);
  const remaining = daysUntil(job.deadline);
  const verified = organization?.verificationStatus === "verifie" && !anonymised;
  const image = jobImage(job);
  // L'appel à l'action ne répète pas la photo de l'en-tête.
  const ctaImage = image.src === IMG.entretien.src ? IMG.reunionEquipe : IMG.entretien;
  const { head, tail } = splitTitle(job.title);
  const isInternship = job.opportunityType === "stage";

  // Offres proches : même type, même ville, même recruteur, compétences communes.
  const ranked = getPublishedJobs()
    .filter((j) => j.id !== job.id)
    .map((j) => ({
      job: j,
      weight:
        (j.opportunityType === job.opportunityType ? 2 : 0) +
        (j.city === job.city ? 2 : 0) +
        (j.organizationId === job.organizationId ? 1 : 0) +
        j.requiredSkills.filter((s) => job.requiredSkills.includes(s)).length,
    }))
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((x) => x.job);
  const similar = [...ranked, ...getRecentJobs(6).filter((j) => j.id !== job.id && !ranked.includes(j))].slice(0, 2);

  const applyLabel =
    job.applicationChannel === "sira"
      ? "Postuler sur SIRA"
      : job.applicationChannel === "email"
        ? "Postuler par e-mail"
        : "Postuler auprès du recruteur";
  const applyByMail = job.applicationChannel === "email" && Boolean(job.applicationTarget);
  const experience =
    job.experienceYears === 0
      ? "Accessible aux débutants"
      : `${job.experienceYears} an${job.experienceYears > 1 ? "s" : ""} minimum`;

  return (
    <>
      {/* 1. En-tête ---------------------------------------------------------- */}
      <Section className="pt-0">
        <Panel tone="light" pad={false} className="px-3 pb-3 pt-14 xs:px-4 xs:pb-4 md:px-7 md:pb-7 md:pt-24">
          <Inner className="px-5 text-center md:px-8">
            <Reveal dir="up">
              <nav aria-label="Fil d'Ariane">
                <ol className="flex flex-wrap items-center justify-center gap-x-2 text-[0.8125rem] text-site-muted">
                  <li>
                    <Link href="/" className="inline-flex min-h-11 items-center hover:text-site-navy">
                      <span className="site-link">Accueil</span>
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li>
                    <Link
                      href={isInternship ? "/stages" : "/emplois"}
                      className="inline-flex min-h-11 items-center hover:text-site-navy"
                    >
                      <span className="site-link">{isInternship ? "Stages" : "Offres d'emploi"}</span>
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li aria-current="page" className="max-w-[16rem] truncate text-site-ink">
                    {job.title}
                  </li>
                </ol>
              </nav>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                {anonymised || !organization ? (
                  <span
                    aria-hidden
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-site-navy text-site-gold"
                  >
                    <IconBuilding size={20} strokeWidth={1.6} />
                  </span>
                ) : (
                  <InitialsAvatar initials={organization.logoInitials} size={44} />
                )}
                <span className="text-[1rem] font-semibold text-site-navy">{name}</span>
                {anonymised ? (
                  <span className="inline-flex items-center rounded-full border border-site-line bg-white px-3 py-1 text-[0.8125rem] font-medium text-site-muted">
                    Offre anonyme
                  </span>
                ) : verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-site-border bg-white px-3 py-1 text-[0.8125rem] font-semibold text-site-navy">
                    <SiteIcon.Check size={14} className="text-site-gold" />
                    Recruteur vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-site-line bg-white px-3 py-1 text-[0.8125rem] font-medium text-site-muted">
                    Recruteur non vérifié
                  </span>
                )}
              </div>

              <Heading as="h1" size="h1" align="center" className="mx-auto mt-6 max-w-[52rem]">
                {head}
                <Hl>{tail}</Hl>
              </Heading>

              <Lead align="center" tone="muted" className="mt-6 max-w-[40rem]">
                {job.summary}
              </Lead>

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Caractéristiques de l'offre">
                <li>
                  <Pill className="border border-site-line bg-white px-3 py-1.5 text-[0.875rem]" icon={<IconBriefcase size={15} strokeWidth={1.6} />}>
                    {OPPORTUNITY_TYPE_LABEL[job.opportunityType]}
                  </Pill>
                </li>
                <li>
                  <Pill className="border border-site-line bg-white px-3 py-1.5 text-[0.875rem]">
                    {CONTRACT_TYPE_LABEL[job.contractType]}
                  </Pill>
                </li>
                <li>
                  <Pill className="border border-site-line bg-white px-3 py-1.5 text-[0.875rem]">
                    {WORK_MODE_LABEL[job.workMode]}
                  </Pill>
                </li>
                <li>
                  <Pill className="border border-site-line bg-white px-3 py-1.5 text-[0.875rem]" icon={<SiteIcon.Pin size={15} />}>
                    {job.city}, {job.country}
                  </Pill>
                </li>
                <li>
                  <Pill className="border border-site-border bg-white px-3 py-1.5 text-[0.875rem] font-semibold">
                    {formatSalaryRange(job.salaryMin, job.salaryMax)}
                  </Pill>
                </li>
                {job.origin !== "native" ? (
                  <li>
                    <Pill className="border border-site-line bg-white px-3 py-1.5 text-[0.875rem]">
                      {JOB_ORIGIN_LABEL[job.origin]}
                    </Pill>
                  </li>
                ) : null}
              </ul>

              <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.8125rem] text-site-muted">
                <span className="inline-flex items-center gap-1.5">
                  <IconClock size={14} strokeWidth={1.6} />
                  Publiée {relativeDays(job.publishedAt)}
                </span>
                {job.department ? (
                  <span className="inline-flex items-center gap-1.5">
                    <IconBuilding size={14} strokeWidth={1.6} />
                    {job.department}
                  </span>
                ) : null}
              </p>
            </Reveal>
          </Inner>

          <ImageFrame
            to="down"
            curtain="var(--color-site-light)"
            className="mt-12 aspect-[4/3] w-full max-w-full rounded-[1.25rem] border border-site-border xs:aspect-[16/10] md:mt-16 md:aspect-[16/8] tab:aspect-[16/7]"
          >
            <Parallax strength={16}>
              <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="object-cover" />
            </Parallax>
          </ImageFrame>
        </Panel>
      </Section>

      {/* 2. Corps de l'offre -------------------------------------------------- */}
      <Section>
        {/* Pas de Panel ici : son `overflow-hidden` empêcherait l'encadré collant. */}
        <div className="relative rounded-[1.5rem] border border-site-border bg-site-light px-5 py-16 site-on-light xs:px-8 md:px-12 md:py-24 tab:px-16">
          <Inner className="flex flex-col gap-10 tab:grid tab:grid-cols-[minmax(0,1fr)_23rem] tab:gap-x-12 tab:gap-y-0 xl:gap-x-20">
            {/* ---- Contenu ---- */}
            <div className="order-2 min-w-0 tab:order-none tab:col-start-1 tab:row-start-1">
              <Reveal dir="up" className="pb-10">
                <section aria-labelledby="offre-poste">
                  <BodyHeading id="offre-poste">
                    Le <Hl>poste</Hl>
                  </BodyHeading>
                  <p className="text-[1.0625rem] leading-relaxed text-site-ink/80">{job.description}</p>

                  {job.blockingCriteria.length > 0 ? (
                    <div className="mt-8 rounded-[1rem] border border-l-4 border-site-border bg-white p-5 md:p-6" role="note">
                      <p className="flex items-center gap-2.5 text-[1rem] font-semibold text-site-navy">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-site-navy text-site-gold">
                          <IconAlert size={16} strokeWidth={1.8} />
                        </span>
                        Critères indispensables
                      </p>
                      <ul className="mt-4 space-y-2">
                        {job.blockingCriteria.map((c) => (
                          <li key={c} className="flex items-start gap-3 text-[0.9375rem] font-medium text-site-ink">
                            <span aria-hidden className="mt-[0.45rem] h-2 w-2 shrink-0 rotate-45 bg-site-gold" />
                            {c}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 border-t border-site-line pt-4 text-[0.875rem] leading-relaxed text-site-muted">
                        Un critère indispensable non satisfait plafonne votre score de compatibilité à{" "}
                        <strong className="font-semibold text-site-navy">{BLOCKING_CRITERIA_CAP} %</strong>, quelle que
                        soit la qualité du reste de votre dossier.
                      </p>
                    </div>
                  ) : null}
                </section>
              </Reveal>

              <Reveal dir="up" className="border-t border-site-line py-10">
                <section aria-labelledby="offre-missions">
                  <BodyHeading id="offre-missions" subtitle="Ce que vous ferez au quotidien">
                    Vos <Hl>missions</Hl>
                  </BodyHeading>
                  <ol className="space-y-4">
                    {job.missions.map((m, i) => (
                      <li key={m} className="flex items-start gap-4">
                        <span className="site-display w-7 shrink-0 pt-px text-[1.0625rem] text-site-gold-deep tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 text-[1rem] leading-relaxed text-site-ink/85">{m}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </Reveal>

              {job.responsibilities.length > 0 ? (
                <Reveal dir="up" className="border-t border-site-line py-10">
                  <section aria-labelledby="offre-responsabilites">
                    <BodyHeading id="offre-responsabilites" subtitle="Le périmètre confié au poste">
                      Vos <Hl>responsabilités</Hl>
                    </BodyHeading>
                    <ul className="space-y-3">
                      {job.responsibilities.map((r) => (
                        <li key={r} className="flex items-start gap-3 text-[1rem] leading-relaxed text-site-ink/85">
                          <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-site-navy text-site-gold">
                            <SiteIcon.Check size={12} />
                          </span>
                          <span className="min-w-0">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </Reveal>
              ) : null}

              <Reveal dir="up" className="border-t border-site-line py-10">
                <section aria-labelledby="offre-competences">
                  <BodyHeading
                    id="offre-competences"
                    subtitle="Ce que le recruteur attend, et ce qui ferait la différence"
                  >
                    Les <Hl>compétences</Hl> attendues
                  </BodyHeading>
                  <div className="space-y-6">
                    <div>
                      <Label as="h3">Requises</Label>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {job.requiredSkills.map((s) => (
                          <li
                            key={s}
                            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-site-border bg-white px-3 py-1.5 text-[0.9375rem] font-semibold text-site-navy"
                          >
                            <SiteIcon.Check size={14} className="text-site-gold" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {job.niceToHaveSkills.length > 0 ? (
                      <div>
                        <Label as="h3">Souhaitées</Label>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {job.niceToHaveSkills.map((s) => (
                            <li
                              key={s}
                              className="inline-flex items-center rounded-[0.5rem] border border-site-line bg-white/70 px-3 py-1.5 text-[0.9375rem] font-medium text-site-ink/80"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </section>
              </Reveal>

              <Reveal dir="up" className="border-t border-site-line py-10">
                <section aria-labelledby="offre-profil">
                  <BodyHeading id="offre-profil">
                    Le <Hl>profil</Hl> recherché
                  </BodyHeading>
                  <dl className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1rem] border border-b-4 border-site-border bg-white p-5">
                      <Label as="dt">Niveau d&apos;études</Label>
                      <dd className="site-display mt-2 text-[1.25rem] text-site-navy">{job.educationLevel}</dd>
                    </div>
                    <div className="rounded-[1rem] border border-b-4 border-site-border bg-white p-5">
                      <Label as="dt">Expérience</Label>
                      <dd className="site-display mt-2 text-[1.25rem] text-site-navy">{experience}</dd>
                    </div>
                    <div className="rounded-[1rem] border border-b-4 border-site-border bg-white p-5 md:col-span-2">
                      <Label as="dt">Langues</Label>
                      <dd className="mt-3 flex flex-wrap gap-2">
                        {job.languages.map((l) => (
                          <span
                            key={l.name}
                            className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-site-soft px-3 py-1.5 text-[0.9375rem] text-site-navy"
                          >
                            <span className="font-semibold">{l.name}</span>
                            <span aria-hidden className="text-site-gold">
                              ·
                            </span>
                            <span className="sr-only">, niveau </span>
                            {l.level}
                          </span>
                        ))}
                      </dd>
                    </div>
                    <div className="rounded-[1rem] border border-b-4 border-site-border bg-white p-5 md:col-span-2">
                      <Label as="dt">Critères indispensables</Label>
                      <dd className="mt-2 text-[1rem] leading-relaxed text-site-ink">
                        {job.blockingCriteria.length > 0 ? (
                          <span className="font-semibold text-site-navy">{job.blockingCriteria.join(" · ")}</span>
                        ) : (
                          <span className="text-site-muted">Aucun critère bloquant déclaré</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>
              </Reveal>

              {score ? (
                <Reveal dir="up" className="border-t border-site-line py-10">
                  <section aria-labelledby="offre-score">
                    <BodyHeading id="offre-score" subtitle="Calculée à partir de votre profil et des exigences de l'offre">
                      Votre <Hl>compatibilité</Hl> estimée
                    </BodyHeading>
                    <div className="flex flex-col items-center gap-6 rounded-[1rem] border border-b-4 border-site-border bg-white p-6 text-center md:flex-row md:items-center md:gap-8 md:p-7 md:text-left">
                      <ScoreDial score={score.score} />
                      <div className="min-w-0">
                        <p className="inline-flex rounded-full bg-site-soft px-3 py-1 text-[0.875rem] font-semibold text-site-navy">
                          {scoreLabel(score.score)}
                        </p>
                        <p className="mt-3 text-[0.875rem] leading-relaxed text-site-muted">
                          <span className="font-semibold text-site-ink">{SCORE_DISCLAIMER}</span> Score calculé par le
                          modèle <span className="font-mono">{score.model}</span> le {formatDate(score.computedAt)}. Il
                          est recalculé si votre profil ou l&apos;offre évolue.
                        </p>
                        <SiteButtonLink
                          href={`/mon-espace/opportunites/${job.id}`}
                          variant="outline-dark"
                          size="sm"
                          className="mt-4"
                        >
                          Voir le détail du score
                        </SiteButtonLink>
                      </div>
                    </div>
                  </section>
                </Reveal>
              ) : null}

              <Reveal dir="up" className="border-t border-site-line py-10">
                <section aria-labelledby="offre-candidater">
                  <BodyHeading id="offre-candidater" subtitle="Pièces demandées et canal de dépôt">
                    Comment <Hl>candidater</Hl>
                  </BodyHeading>

                  <Label as="h3">Pièces demandées</Label>
                  <ul className="mt-3 grid gap-2 xs:grid-cols-2">
                    {job.requiredDocuments.map((d) => (
                      <li
                        key={d}
                        className="flex min-h-14 items-center gap-3 rounded-[0.75rem] border border-site-line bg-white px-4 py-3 text-[0.9375rem] font-medium text-site-ink"
                      >
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-site-soft text-site-navy">
                          <IconFile size={16} strokeWidth={1.6} />
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-[1rem] border border-b-4 border-site-border bg-white p-5 md:p-6">
                    <Label as="h3">Canal de candidature</Label>
                    <p className="site-display mt-2 text-[1.25rem] text-site-navy">
                      {APPLICATION_CHANNEL_LABEL[job.applicationChannel]}
                    </p>
                    {job.applicationTarget ? (
                      <p className="mt-2 flex items-start gap-2 break-all text-[0.9375rem] text-site-ink/80">
                        <IconMail size={16} strokeWidth={1.6} className="mt-0.5 shrink-0 text-site-navy" />
                        {job.applicationTarget}
                      </p>
                    ) : null}
                    {job.contact ? (
                      <p className="mt-1 text-[0.9375rem] text-site-ink/80">Contact : {job.contact}</p>
                    ) : null}
                    <p className="mt-4 flex items-start gap-2.5 border-t border-site-line pt-4 text-[0.875rem] leading-relaxed text-site-muted">
                      <IconShield size={18} strokeWidth={1.6} className="mt-px shrink-0 text-site-navy" />
                      <span>
                        SIRA ne demande jamais d&apos;argent pour une candidature. Si un recruteur vous réclame des
                        frais, signalez l&apos;offre.
                      </span>
                    </p>
                  </div>

                  {job.origin !== "native" ? (
                    <div className="mt-6 rounded-[1rem] border border-l-4 border-site-border bg-white p-5 md:p-6" role="note">
                      <p className="text-[1rem] font-semibold text-site-navy">{JOB_ORIGIN_LABEL[job.origin]}</p>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-site-ink/80">
                        Cette offre provient d&apos;une source externe relayée par SIRA. Vérifiez les informations
                        auprès de l&apos;organisation avant de postuler.
                        {job.sourceUrl ? (
                          <>
                            {" "}
                            <a
                              href={job.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="font-semibold text-site-navy underline underline-offset-2"
                            >
                              Voir l&apos;annonce d&apos;origine
                            </a>
                          </>
                        ) : null}
                      </p>
                    </div>
                  ) : null}
                </section>
              </Reveal>

              <Reveal dir="up" className="border-t border-site-line pt-10">
                <section aria-labelledby="offre-recap">
                  <BodyHeading id="offre-recap">
                    L&apos;offre en <Hl>résumé</Hl>
                  </BodyHeading>
                  <dl className="grid rounded-[1rem] border border-b-4 border-site-border bg-white px-5 py-2 text-[0.9375rem] md:grid-cols-2 md:gap-x-10 md:px-7 md:py-3">
                    {[
                      { label: "Type", value: OPPORTUNITY_TYPE_LABEL[job.opportunityType] },
                      { label: "Contrat", value: CONTRACT_TYPE_LABEL[job.contractType] },
                      { label: "Mode de travail", value: WORK_MODE_LABEL[job.workMode] },
                      { label: "Lieu", value: `${job.city}, ${job.country}` },
                      { label: "Rémunération", value: formatSalaryRange(job.salaryMin, job.salaryMax) },
                      { label: "Publication", value: formatDate(job.publishedAt) },
                      { label: "Date limite", value: formatDate(job.deadline) },
                      { label: "Origine", value: JOB_ORIGIN_LABEL[job.origin] },
                      { label: "Activité", value: `${job.viewCount} vues · ${job.applicationCount} candidatures` },
                    ].map((row, i, rows) => (
                      <div
                        key={row.label}
                        className={cn(
                          "flex justify-between gap-4 border-site-line py-3",
                          i < rows.length - 1 && "border-b",
                          // Sur deux colonnes, la dernière ligne complète n'a pas de filet.
                          i >= rows.length - (rows.length % 2 === 0 ? 2 : 1) && "md:border-b-0",
                        )}
                      >
                        <dt className="shrink-0 text-site-muted">{row.label}</dt>
                        <dd className="text-right font-medium text-site-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </Reveal>
            </div>

            {/* ---- Colonne latérale ---- */}
            <div className="contents tab:col-start-2 tab:row-start-1 tab:flex tab:flex-col tab:gap-4">
              {/* Encadré « Postuler » : premier sur mobile, collant sur grand écran.
                  L'enveloppe occupe toute la hauteur libre de la colonne pour que
                  l'encadré puisse l'accompagner pendant la lecture. Sur grand
                  écran, la carte du recruteur passe au-dessus : sinon elle serait
                  repoussée tout en bas de la colonne, loin de l'encadré. */}
              <div className="order-1 tab:order-none tab:grid tab:flex-1">
                <Reveal dir="right">
                  <aside
                    aria-labelledby="offre-postuler"
                    className="tab:sticky tab:top-28 tab:max-h-[calc(100vh-8rem)] tab:overflow-y-auto tab:rounded-[1.5rem]"
                  >
                    <Card>
                      <Heading as="h2" size="h3" className="text-site-navy">
                        <span id="offre-postuler">
                          Prêt à <Hl>postuler</Hl> ?
                        </span>
                      </Heading>

                      <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <Label as="span">Date limite</Label>
                        <span className="text-[1rem] font-semibold text-site-ink">{formatDate(job.deadline)}</span>
                      </p>
                      <div className="mt-3">
                        <OffreCountdown remainingDays={remaining} />
                      </div>

                      <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-site-line pt-4">
                        <Label as="span">Canal</Label>
                        <span className="text-[0.9375rem] font-semibold text-site-navy">
                          {APPLICATION_CHANNEL_LABEL[job.applicationChannel]}
                        </span>
                      </p>

                      <div className="mt-4 grid gap-2.5">
                        {applyByMail ? (
                          <a
                            href={`mailto:${job.applicationTarget}?subject=${encodeURIComponent(`Candidature — ${job.title}`)}`}
                            className={APPLY_BUTTON}
                          >
                            <IconMail size={18} strokeWidth={1.6} />
                            {applyLabel}
                          </a>
                        ) : (
                          <Link href={`/mon-espace/opportunites/${job.id}?action=postuler`} className={APPLY_BUTTON}>
                            {applyLabel}
                            <SiteIcon.Arrow size={18} />
                          </Link>
                        )}
                        <SiteButtonLink
                          href={`/mon-espace/opportunites/${job.id}?action=preparer`}
                          variant="outline-dark"
                          className="w-full"
                        >
                          <IconSparkles size={17} strokeWidth={1.6} className="text-site-gold" />
                          Préparer ma candidature
                        </SiteButtonLink>
                      </div>
                      <p className="mt-3 text-[0.8125rem] leading-relaxed text-site-muted">
                        SIRA adapte votre CV et rédige une première lettre, sans rien inventer. Rien n&apos;est envoyé
                        sans votre validation.
                      </p>
                      <Link
                        href="/inscription/candidat"
                        className="mt-1 inline-flex min-h-11 items-center text-[0.875rem] font-semibold text-site-navy"
                      >
                        <span className="site-link">Créer mon profil</span>
                      </Link>

                      <div className="mt-4 border-t border-site-line pt-4">
                        <OffreActions jobTitle={job.title} />
                      </div>
                    </Card>
                  </aside>
                </Reveal>
              </div>

              {/* Carte du recruteur. */}
              <div className="order-3 tab:-order-1">
                <Reveal dir="right">
                  <section aria-labelledby="offre-recruteur">
                    <Card>
                      <Label as="h2">
                        <span id="offre-recruteur">Le recruteur</span>
                      </Label>
                      {anonymised ? (
                        <div className="mt-4">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden
                              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-site-navy text-site-gold"
                            >
                              <IconBuilding size={22} strokeWidth={1.6} />
                            </span>
                            <p className="site-display text-[1.25rem] text-site-navy">{name}</p>
                          </div>
                          <p className="mt-4 text-[0.9375rem] leading-relaxed text-site-ink/80">
                            Cette offre est publiée de façon anonyme. L&apos;identité de l&apos;organisation vous sera
                            communiquée par le recruteur après l&apos;examen de votre candidature.
                          </p>
                        </div>
                      ) : organization ? (
                        <div className="mt-4">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar initials={organization.logoInitials} size={48} />
                            <div className="min-w-0">
                              <p className="site-display truncate text-[1.25rem] leading-tight text-site-navy">{name}</p>
                              <p className="truncate text-[0.875rem] text-site-muted">
                                {ORGANIZATION_TYPE_LABEL[organization.type]}
                              </p>
                            </div>
                          </div>
                          {verified ? (
                            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-site-border px-3 py-1 text-[0.8125rem] font-semibold text-site-navy">
                              <SiteIcon.Check size={14} className="text-site-gold" />
                              Recruteur vérifié par SIRA
                            </p>
                          ) : null}
                          <p className="mt-4 text-[0.9375rem] leading-relaxed text-site-ink/80">
                            {organization.description}
                          </p>
                          <dl className="mt-4 divide-y divide-site-line border-y border-site-line text-[0.875rem]">
                            <div className="flex justify-between gap-4 py-2.5">
                              <dt className="text-site-muted">Secteur</dt>
                              <dd className="text-right font-medium text-site-ink">{organization.sector}</dd>
                            </div>
                            {organization.size ? (
                              <div className="flex justify-between gap-4 py-2.5">
                                <dt className="text-site-muted">Effectif</dt>
                                <dd className="text-right font-medium text-site-ink">{organization.size}</dd>
                              </div>
                            ) : null}
                            <div className="flex justify-between gap-4 py-2.5">
                              <dt className="text-site-muted">Siège</dt>
                              <dd className="text-right font-medium text-site-ink">{organization.city}</dd>
                            </div>
                          </dl>
                          <div className="mt-4 flex flex-col items-start gap-1">
                            {organization.website ? (
                              <a
                                href={organization.website}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-site-navy"
                              >
                                <span className="site-link">Site de l&apos;organisation</span>
                              </a>
                            ) : null}
                            <Link
                              href={`/emplois?q=${encodeURIComponent(name)}`}
                              className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-site-navy"
                            >
                              <span className="site-link">Voir les autres offres de {name}</span>
                              <SiteIcon.Arrow size={16} className="shrink-0" />
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-[0.9375rem] text-site-muted">Organisation non renseignée.</p>
                      )}
                    </Card>
                  </section>
                </Reveal>
              </div>
            </div>
          </Inner>
        </div>
      </Section>

      {/* 3. Offres similaires ----------------------------------------------- */}
      {similar.length > 0 ? (
        <Section>
          <Panel tone="light">
            <Inner>
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                <Reveal dir="left">
                  <Heading size="h2" className="max-w-[36rem]">
                    Découvrir des offres <Hl>similaires</Hl>
                  </Heading>
                </Reveal>
                <Reveal dir="right">
                  <SiteButtonLink href={isInternship ? "/stages" : "/emplois"} variant="outline-dark">
                    {isInternship ? "Voir tous les stages" : "Voir toutes les offres"}
                  </SiteButtonLink>
                </Reveal>
              </div>
              <div className="mt-12 grid gap-6 md:mt-14 tab:grid-cols-2">
                {similar.map((s, i) => (
                  <Reveal key={s.id} dir="up" delay={i * 120}>
                    <SiteJobCard job={s} organization={getJobOrganization(s)} />
                  </Reveal>
                ))}
              </div>
            </Inner>
          </Panel>
        </Section>
      ) : null}

      {/* 4. Appel à l'action ------------------------------------------------ */}
      <CtaBlock
        title={
          <>
            Une candidature <Hl>qui vous ressemble</Hl>
          </>
        }
        text="Créez votre profil à partir de votre CV : SIRA estime votre compatibilité avec chaque offre, adapte votre dossier sans rien inventer et n'envoie rien sans votre validation."
        action={{ href: "/inscription/candidat", label: "Créer mon profil" }}
        image={ctaImage}
      />
    </>
  );
}
