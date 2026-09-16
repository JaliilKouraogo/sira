/**
 * Détail d'une formation : ce qu'on y apprend, à quelles conditions, pour
 * quel prix et avec quelles places restantes.
 *
 * Structure reprise de la page de détail du gabarit de référence :
 *   1. en-tête clair centré, puis grande image avec rideau et parallaxe ;
 *   2. corps sur deux colonnes : contenu pédagogique à gauche, encadré
 *      d'inscription collant à droite ;
 *   3. formations proches ;
 *   4. appel à l'action.
 *
 * SIRA reste un annuaire : l'inscription définitive et le paiement se font
 * chez l'organisme. Suivre une formation ne modifie pas le score de
 * compatibilité, qui reste une estimation.
 *
 * Page pré-générée pour chaque formation (export statique).
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { InitialsAvatar } from "@/components/site/cards";
import { CtaBlock } from "@/components/site/cta";
import {
  AccessBadge,
  TrainingCard,
  TrainingIcon,
  formatRating,
  formatTrainingDate,
  seatsLabel,
  seatsLeft,
  trainingPriceLabel,
} from "@/components/site/formations-card";
import {
  Heading,
  Hl,
  Inner,
  Lead,
  Panel,
  Pill,
  Section,
  SiteButtonLink,
  SiteIcon,
  cn,
} from "@/components/site/kit";
import { ImageFrame, Parallax, Reveal } from "@/components/site/motion";
import { getOrganization, getTrainingBySlug, getTrainings } from "@/data/queries";
import { IMG, trainingImage } from "@/data/site-content";
import { ORGANIZATION_TYPE_LABEL, TRAINING_ACCESS_LABEL, TRAINING_FORMAT_LABEL } from "@/lib/enums";
import type { Training } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getTrainings().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const training = getTrainingBySlug(slug);
  if (!training) return { title: "Formation introuvable | SIRA" };
  return {
    title: `${training.title} | Formations SIRA`,
    description: training.summary,
  };
}

/**
 * Formations proches : même catégorie d'abord, puis compétences partagées,
 * puis même niveau. Toujours trois propositions quand le catalogue le permet.
 */
function relatedTrainings(training: Training): Training[] {
  const score = (t: Training) =>
    (t.category === training.category ? 100 : 0) +
    t.skillsCovered.filter((s) => training.skillsCovered.includes(s)).length * 10 +
    (t.level === training.level ? 1 : 0);
  return getTrainings()
    .filter((t) => t.id !== training.id)
    .map((t, i) => ({ t, s: score(t), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 3)
    .map((x) => x.t);
}

/** Intitulé d'une section du corps, avec sa phrase d'explication. */
function BodySection({
  title,
  subtitle,
  children,
  first,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <section className={cn(!first && "mt-10 border-t border-site-line pt-10")}>
      <Reveal dir="up">
        <h2 className="site-display text-[1.5rem] leading-tight text-site-navy md:text-[1.75rem]">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-[0.9375rem] text-site-muted">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </Reveal>
    </section>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-[0.875rem] text-site-muted">{label}</dt>
      <dd className="text-right text-[0.9375rem] font-medium text-site-ink">{children}</dd>
    </div>
  );
}

export default async function FormationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const training = getTrainingBySlug(slug);
  if (!training) notFound();

  const organization = getOrganization(training.organizationId);
  const orgName = organization?.tradeName ?? organization?.legalName ?? "Organisme de formation";
  const remaining = seatsLeft(training);
  const filled = training.seats && training.seats > 0 ? ((training.seatsTaken ?? 0) / training.seats) * 100 : 0;
  const full = remaining === 0;
  const image = trainingImage(training);
  const related = relatedTrainings(training);

  return (
    <>
      {/* 1. En-tête --------------------------------------------------------- */}
      <Section className="pt-0">
        <Panel tone="light" className="max-md:px-5 max-md:pb-6 md:pb-10 tab:pb-12">
          <Inner>
            <Reveal dir="up">
              <nav aria-label="Fil d'Ariane" className="flex justify-center">
                <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.875rem] text-site-muted">
                  <li>
                    <Link href="/" className="site-link hover:text-site-navy">
                      Accueil
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li>
                    <Link href="/formations" className="site-link hover:text-site-navy">
                      Formations
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li aria-current="page" className="max-w-[16rem] truncate text-site-ink">
                    {training.title}
                  </li>
                </ol>
              </nav>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <AccessBadge training={training} />
                <Pill className="bg-white">{training.category}</Pill>
                <Pill className="bg-white">{training.level}</Pill>
                {training.certificate ? (
                  <Pill className="bg-white" icon={<TrainingIcon.Certificate size={15} />}>
                    Certificat délivré
                  </Pill>
                ) : null}
              </div>

              <Heading as="h1" size="h1" align="center" className="mx-auto mt-6 max-w-[50rem]">
                {training.title}
              </Heading>
              <Lead align="center" tone="muted" className="mt-5">
                {training.summary}
              </Lead>

              <ul className="mx-auto mt-7 flex max-w-[44rem] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.9375rem] text-site-ink">
                <li className="inline-flex items-center gap-2">
                  <SiteIcon.Clock size={18} className="text-site-navy" />
                  {training.durationHours} heures
                </li>
                <li className="inline-flex items-center gap-2">
                  <TrainingIcon.Format size={18} className="text-site-navy" />
                  {TRAINING_FORMAT_LABEL[training.format]}
                </li>
                {training.rating ? (
                  <li className="inline-flex items-center gap-2">
                    <TrainingIcon.Star size={17} className="text-site-gold" />
                    {formatRating(training.rating)} / 5
                  </li>
                ) : null}
                {remaining !== null ? (
                  <li className="inline-flex items-center gap-2">
                    <TrainingIcon.Seats size={18} className="text-site-navy" />
                    {seatsLabel(remaining)}
                  </li>
                ) : null}
              </ul>
            </Reveal>

            <ImageFrame
              to="down"
              curtain="var(--color-site-light)"
              className="mt-12 aspect-[4/3] rounded-[1.5rem] border border-site-border md:mt-14 md:aspect-[16/7]"
            >
              <Parallax strength={16}>
                <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 1280px) 76rem, 100vw" className="object-cover" />
              </Parallax>
            </ImageFrame>
          </Inner>
        </Panel>
      </Section>

      {/* 2. Corps ------------------------------------------------------------ */}
      <Section>
        {/* Pas de `Panel` ici : son `overflow-hidden` empêcherait l'encadré
            d'inscription de rester collé pendant le défilement. */}
        <div className="relative rounded-[1.5rem] border border-site-border bg-site-light px-5 py-16 site-on-light md:px-16 md:py-28">
          <Inner className="grid gap-12 tab:grid-cols-[minmax(0,1fr)_23rem] tab:gap-16">
            <div className="min-w-0">
              <BodySection title="Présentation" first>
                <p className="max-w-[44rem] text-[1rem] leading-relaxed text-site-ink/80">{training.description}</p>
              </BodySection>

              <BodySection title="Objectifs" subtitle="Ce que vous saurez faire à la fin">
                <ul className="grid gap-3">
                  {training.objectives.map((o) => (
                    <li
                      key={o}
                      className="flex items-start gap-3 rounded-[0.75rem] border border-site-border/60 bg-white px-4 py-3.5"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-site-navy text-site-gold">
                        <SiteIcon.Check size={14} />
                      </span>
                      <span className="min-w-0 text-[1rem] leading-relaxed text-site-ink">{o}</span>
                    </li>
                  ))}
                </ul>
              </BodySection>

              <BodySection
                title="Programme indicatif"
                subtitle={`${training.durationHours} heures, réparties en ${training.objectives.length} séquence${training.objectives.length > 1 ? "s" : ""}`}
              >
                <ol className="border-t border-site-line">
                  {training.objectives.map((o, i) => (
                    <li key={o} className="flex items-baseline gap-5 border-b border-site-line py-4">
                      <span className="site-display w-9 shrink-0 text-[1.375rem] leading-none text-[#a8860f]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 text-[1rem] leading-relaxed text-site-ink">
                        <span className="sr-only">Séquence {i + 1} : </span>
                        {o}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-[0.875rem] leading-relaxed text-site-muted">
                  Programme indicatif communiqué par l&apos;organisme. Le déroulé horaire détaillé est remis à
                  l&apos;inscription.
                </p>
              </BodySection>

              <BodySection title="Prérequis" subtitle="Ce qu'il faut avant de commencer">
                {training.prerequisites.length > 0 ? (
                  <ul className="grid gap-2.5">
                    {training.prerequisites.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-[1rem] leading-relaxed text-site-ink">
                        <span className="mt-[0.6rem] inline-block h-2 w-2 shrink-0 rounded-full bg-site-gold" aria-hidden />
                        <span className="min-w-0">{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[1rem] leading-relaxed text-site-ink/80">
                    Aucun prérequis particulier : la formation est ouverte à tous.
                  </p>
                )}
              </BodySection>

              <BodySection title="Compétences couvertes" subtitle="Celles qui remontent dans votre profil SIRA">
                <ul className="flex flex-wrap gap-2">
                  {training.skillsCovered.map((s) => (
                    <li key={s}>
                      <Pill className="border border-site-border/60 bg-white px-3 py-1.5 text-[0.9375rem]">{s}</Pill>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-3 rounded-[0.75rem] border border-site-border bg-white p-4 md:p-5">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-site-soft text-[0.9375rem] font-semibold text-site-navy" aria-hidden>
                    i
                  </span>
                  <p className="text-[0.9375rem] leading-relaxed text-site-ink/85">
                    Suivre cette formation ne modifie pas automatiquement votre score de compatibilité : ajoutez la
                    compétence acquise à votre profil pour qu&apos;elle soit prise en compte lors du prochain calcul.
                    Le score reste une estimation algorithmique, qui ne garantit pas un recrutement.
                  </p>
                </div>
              </BodySection>

              {organization ? (
                <BodySection title="L'organisme" subtitle="Qui dispense cette formation">
                  <div className="rounded-[1rem] border border-b-4 border-site-border bg-white p-6">
                    <div className="flex items-center gap-4">
                      <InitialsAvatar initials={organization.logoInitials} size={52} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-[1.0625rem] font-semibold text-site-ink">
                          <span className="truncate">{orgName}</span>
                          {organization.verificationStatus === "verifie" ? (
                            <span className="inline-flex shrink-0 text-site-navy" title="Organisme vérifié par SIRA">
                              <SiteIcon.Check size={16} />
                              <span className="sr-only">Organisme vérifié</span>
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[0.875rem] text-site-muted">
                          {ORGANIZATION_TYPE_LABEL[organization.type]} · {organization.city}, {organization.country}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-[0.9375rem] leading-relaxed text-site-ink/80">{organization.description}</p>
                    {organization.website ? (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="site-link mt-4 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-site-navy"
                      >
                        Site de l&apos;organisme
                        <SiteIcon.Arrow size={16} />
                      </a>
                    ) : null}
                  </div>
                </BodySection>
              ) : null}
            </div>

            {/* ---- Encadré d'inscription ---- */}
            <aside aria-labelledby="inscription-titre" className="relative">
              <div className="tab:sticky tab:top-28">
                <Reveal dir="right">
                  <div className="rounded-[1rem] border border-b-4 border-site-border bg-white p-6 md:p-7">
                    <h2 id="inscription-titre" className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-site-muted">
                      Tarif
                    </h2>
                    <p className="site-display mt-2 text-[2rem] leading-none text-site-navy">
                      {trainingPriceLabel(training)}
                    </p>
                    {training.access === "inclus_premium" ? (
                      <p className="mt-2 text-[0.875rem] leading-relaxed text-site-muted">
                        L&apos;inscription est sans frais pour les abonnés Premium.
                      </p>
                    ) : training.access === "payant" ? (
                      <p className="mt-2 text-[0.875rem] leading-relaxed text-site-muted">
                        {TRAINING_ACCESS_LABEL.payant}, réglée auprès de l&apos;organisme.
                      </p>
                    ) : null}

                    <dl className="mt-5 divide-y divide-site-line border-y border-site-line">
                      <InfoRow label="Prochaine session">
                        {training.startDate ? formatTrainingDate(training.startDate) : "À la demande"}
                      </InfoRow>
                      <InfoRow label="Durée">{training.durationHours} heures</InfoRow>
                      <InfoRow label="Format">{TRAINING_FORMAT_LABEL[training.format]}</InfoRow>
                      <InfoRow label="Niveau">{training.level}</InfoRow>
                      <InfoRow label="Catégorie">{training.category}</InfoRow>
                      <InfoRow label="Places">
                        {training.seats == null ? "Non limitées" : `${training.seatsTaken ?? 0} inscrits sur ${training.seats}`}
                      </InfoRow>
                      <InfoRow label="Certificat">{training.certificate ? "Oui, en fin de formation" : "Non"}</InfoRow>
                      <InfoRow label="Organisme">{orgName}</InfoRow>
                    </dl>

                    {training.seats != null ? (
                      <div className="mt-5">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[0.875rem] font-semibold text-site-ink" id="remplissage">
                            Remplissage
                          </p>
                          <p className="text-[0.875rem] tabular-nums text-site-muted">{Math.round(filled)} %</p>
                        </div>
                        <div
                          role="progressbar"
                          aria-labelledby="remplissage"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(filled)}
                          className="mt-2 h-2 overflow-hidden rounded-full bg-site-soft"
                        >
                          <div
                            className={cn("h-full rounded-full", filled >= 85 ? "bg-site-gold" : "bg-site-navy")}
                            style={{ width: `${Math.min(100, filled)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[0.875rem] leading-relaxed text-site-muted">
                          {full
                            ? "La session affiche complet. Inscrivez-vous pour être prévenu de la prochaine ouverture."
                            : `${remaining} place${remaining && remaining > 1 ? "s" : ""} encore disponible${remaining && remaining > 1 ? "s" : ""}.`}
                        </p>
                      </div>
                    ) : null}

                    <SiteButtonLink
                      href={`/mon-espace/formations?inscription=${training.id}`}
                      variant={full ? "outline-dark" : "navy"}
                      className="mt-6 w-full text-center"
                    >
                      {full ? "Être prévenu de la prochaine session" : "S'inscrire à cette formation"}
                    </SiteButtonLink>

                    <p className="mt-4 flex gap-2.5 text-[0.8125rem] leading-relaxed text-site-muted">
                      <SiteIcon.Pin size={16} className="mt-0.5 shrink-0 text-site-navy" />
                      <span>
                        SIRA est un annuaire de formations : l&apos;inscription définitive et le paiement se font
                        directement auprès de l&apos;organisme, qui vous confirme la place.
                      </span>
                    </p>
                  </div>
                </Reveal>
              </div>
            </aside>
          </Inner>
        </div>
      </Section>

      {/* 3. Formations proches ---------------------------------------------- */}
      {related.length > 0 ? (
        <Section>
          <Panel tone="light" className="max-md:px-5">
            <Inner>
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <Reveal dir="left">
                  <Heading size="h2" className="max-w-[32rem]">
                    D&apos;autres formations <Hl>pour progresser</Hl>
                  </Heading>
                </Reveal>
                <Reveal dir="right">
                  <SiteButtonLink href="/formations" variant="outline-dark">
                    Tout le catalogue
                  </SiteButtonLink>
                </Reveal>
              </div>
              <ul className="mt-12 grid gap-6 md:grid-cols-2 tab:grid-cols-3">
                {related.map((t, i) => (
                  <Reveal key={t.id} as="li" dir="up" delay={i * 100}>
                    <TrainingCard training={t} />
                  </Reveal>
                ))}
              </ul>
            </Inner>
          </Panel>
        </Section>
      ) : null}

      {/* 4. Appel à l'action ------------------------------------------------ */}
      <CtaBlock
        title={
          <>
            Sachez ce qui vous sépare <Hl>de l&apos;offre visée</Hl>
          </>
        }
        text="Créez votre profil : SIRA calcule votre compatibilité avec chaque offre, détaille les compétences qui manquent et vous oriente vers les formations qui les couvrent. Une estimation claire, jamais une promesse d'embauche."
        action={{ href: "/inscription/candidat", label: "Créer mon profil" }}
        image={IMG.diplomes}
      />
    </>
  );
}
