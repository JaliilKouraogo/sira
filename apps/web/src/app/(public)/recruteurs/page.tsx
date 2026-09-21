/**
 * Page d'atterrissage employeurs — [T §7].
 *
 * Structure reprise de la page « Services » du gabarit de référence :
 *   1. en-tête : bloc marine et photo avec rideau et parallaxe
 *   2. onglets « Trouvez le bon talent avec… » sur fond clair
 *   3. grandes étapes en cartes horizontales sur fond marine
 *   4. les trois niveaux de vérification (#verification)
 *   5. comparatif des offres et tarifs (#tarifs)
 *   6. témoignages en défilement infini
 *   7. appel à l'action
 *
 * Trois promesses : publier vite, recevoir des candidatures exploitables,
 * et savoir exactement ce que la vérification implique. L'IA propose un
 * classement, elle ne décide jamais.
 */

import type { Metadata } from "next";
import Image from "next/image";
import { CtaBlock } from "@/components/site/cta";
import { ServiceGlyph, TestimonialCard } from "@/components/site/cards";
import { FeatureTabs } from "@/components/site/interactive";
import {
  Eyebrow,
  Heading,
  Hl,
  Inner,
  Lead,
  Marquee,
  Panel,
  Section,
  SiteButtonLink,
  SiteIcon,
  cn,
} from "@/components/site/kit";
import { ImageFrame, Parallax, Reveal } from "@/components/site/motion";
import { IMG, TESTIMONIALS } from "@/data/site-content";
import {
  RECRUITER_FEATURES,
  RECRUITER_PLANS,
  RECRUITER_STEPS,
  RECRUITER_TESTIMONIAL_NAMES,
  VERIFICATION_LEVELS,
} from "@/data/site-recruteurs";
import { getOrganizations, getPublishedJobs } from "@/data/queries";
import { ORGANIZATION_CAPABILITIES, ORGANIZATION_TYPE_LABEL, ORGANIZATION_TYPES, PLAN_LABEL } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Espace recruteurs",
  description:
    "Publiez vos offres d'emploi et de stage partout en Afrique, recevez les candidatures au même endroit et laissez SIRA vous proposer un classement des profils. Gratuit pendant la phase de lancement.",
};

/** Ce qu'un type d'organisation peut publier, en toutes lettres. */
function publishes(type: (typeof ORGANIZATION_TYPES)[number]): string {
  const caps = ORGANIZATION_CAPABILITIES[type];
  const what = [caps.jobs ? "offres" : null, caps.trainings ? "formations" : null].filter(Boolean).join(" et ");
  return what ? `Des ${what}` : "—";
}

export default function RecruteursPage() {
  const organizations = getOrganizations();
  const stats = [
    { label: "offres en ligne", value: getPublishedJobs().length },
    { label: "organisations inscrites", value: organizations.length },
    { label: "recruteurs vérifiés", value: organizations.filter((o) => o.verificationStatus === "verifie").length },
  ];

  // Les témoignages de recruteurs ouvrent le défilement, les autres suivent.
  const testimonials = [
    ...TESTIMONIALS.filter((t) => RECRUITER_TESTIMONIAL_NAMES.includes(t.name)),
    ...TESTIMONIALS.filter((t) => !RECRUITER_TESTIMONIAL_NAMES.includes(t.name)),
  ];

  return (
    <>
      {/* 1. En-tête --------------------------------------------------------- */}
      <Section className="pt-0">
        <div className="grid gap-3 tab:grid-cols-2">
          <div className="flex flex-col justify-center rounded-[1.5rem] border border-site-border bg-site-navy px-8 py-20 site-on-dark md:px-16 md:py-28 tab:min-h-[38rem]">
            <Reveal dir="left">
              <Eyebrow className="text-site-gold opacity-100">Espace recruteurs</Eyebrow>
              <Heading as="h1" size="h1" className="max-w-[36rem]">
                Recrutez les bons talents, <Hl>partout en Afrique</Hl>
              </Heading>
              <Lead className="mt-6 text-white/90">
                Publiez votre offre, recevez des candidatures complètes et laissez SIRA vous proposer un ordre de lecture
                argumenté, sans trier deux cents CV à la main. La décision de recruter reste entièrement la vôtre.
              </Lead>
              <div className="mt-9 flex flex-wrap gap-3">
                <SiteButtonLink href="/inscription/recruteur" variant="gold" size="lg">
                  Publier une offre
                </SiteButtonLink>
                <SiteButtonLink href="#tarifs" variant="outline-light" size="lg">
                  Voir les tarifs
                </SiteButtonLink>
              </div>
              <dl className="mt-12 grid max-w-[30rem] grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col-reverse justify-end border-l border-white/40 pl-4">
                    <dt className="mt-1.5 text-[0.8125rem] leading-snug text-white/80">{s.label}</dt>
                    <dd className="site-display text-[2rem] leading-none text-white md:text-[2.5rem]">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <ImageFrame
            to="left"
            curtain="var(--color-site-canvas)"
            className="hidden min-h-[28rem] rounded-[1.5rem] border border-site-border md:block tab:min-h-0"
          >
            <Parallax strength={18}>
              <Image
                src={IMG.reunionEquipe.src}
                alt={IMG.reunionEquipe.alt}
                fill
                priority
                sizes="(min-width: 992px) 50vw, 100vw"
                className="object-cover"
              />
            </Parallax>
          </ImageFrame>
        </div>
      </Section>

      {/* 2. Onglets de fonctionnalités -------------------------------------- */}
      <Section id="outils" className="scroll-mt-24 md:scroll-mt-28">
        <Panel tone="light">
          <Inner>
            <FeatureTabs
              items={RECRUITER_FEATURES}
              tone="light"
              imageSide="right"
              heading={
                <Reveal dir="up">
                  <Heading size="h2" className="max-w-[34rem]">
                    Trouvez le bon talent avec <Hl>des outils pensés pour recruter</Hl>
                  </Heading>
                </Reveal>
              }
              footer={
                <Reveal dir="up">
                  <p className="max-w-[32rem] text-[0.9375rem] leading-relaxed text-site-muted">
                    Des candidatures exploitables, un tri assisté mais jamais automatique, une visibilité réelle sur vos
                    offres.
                  </p>
                  <SiteButtonLink href="/inscription/recruteur" variant="navy" size="md" className="mt-6">
                    Créer un compte gratuit
                  </SiteButtonLink>
                </Reveal>
              }
            />
          </Inner>
        </Panel>
      </Section>

      {/* 3. Grandes étapes -------------------------------------------------- */}
      <Section>
        <Panel tone="dark">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" align="center" className="mx-auto max-w-[44rem]">
                De la création du compte <Hl>à la décision finale</Hl>
              </Heading>
              <Lead align="center" className="mt-5 text-white/85">
                Quatre étapes pour recruter en confiance, quel que soit votre pays : un compte pour toute l&apos;équipe,
                une organisation vérifiée, une offre précise et des candidatures traitées au même endroit.
              </Lead>
            </Reveal>

            <ol className="mt-14 flex flex-col gap-5 md:mt-16">
              {RECRUITER_STEPS.map((step) => (
                <li key={step.n}>
                  <Reveal dir="up">
                    <article className="group grid overflow-hidden rounded-[1.5rem] border border-b-4 border-site-border bg-site-light p-2.5 site-on-light md:grid-cols-[0.95fr_1.05fr]">
                      <ImageFrame
                        to="left"
                        curtain="var(--color-site-light)"
                        className="aspect-[4/3] rounded-[1.1rem] md:aspect-auto md:min-h-[19rem]"
                      >
                        <Image
                          src={step.image.src}
                          alt={step.image.alt}
                          fill
                          sizes="(min-width: 992px) 36rem, (min-width: 768px) 45vw, 100vw"
                          className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-105"
                        />
                      </ImageFrame>
                      <div className="flex flex-col px-4 pb-4 pt-6 md:px-8 md:py-7 tab:px-10">
                        <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-site-muted">
                          Étape <span className="site-hl">{step.n}</span>
                        </p>
                        <h3 className="site-display mt-3 text-[1.5rem] leading-tight text-site-navy md:text-[1.75rem]">
                          {step.title}
                        </h3>
                        <p className="mt-4 max-w-[32rem] text-[0.9375rem] leading-relaxed text-site-muted">{step.text}</p>
                        <div className="mt-auto pt-8">
                          <SiteButtonLink href={step.href} variant="outline-dark" size="sm">
                            Détails<span className="sr-only"> : {step.title}</span>
                          </SiteButtonLink>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ol>
          </Inner>
        </Panel>
      </Section>

      {/* 4. Niveaux de vérification ----------------------------------------- */}
      <Section id="verification" className="scroll-mt-24 md:scroll-mt-28">
        <Panel tone="light">
          <Inner>
            <div className="grid items-end gap-6 tab:grid-cols-2 tab:gap-16">
              <Reveal dir="left">
                <Heading size="h2" className="max-w-[34rem]">
                  Les trois niveaux de <Hl>vérification</Hl>
                </Heading>
              </Reveal>
              <Reveal dir="right">
                <Lead tone="muted">
                  La vérification protège les candidats des fausses offres et vous distingue des comptes opportunistes.
                  Elle conditionne ce que votre compte peut faire : plus votre niveau est élevé, plus la publication est
                  directe.
                </Lead>
              </Reveal>
            </div>

            <div className="mt-14 grid gap-6 tab:grid-cols-3">
              {VERIFICATION_LEVELS.map((level, i) => (
                <Reveal key={level.n} dir="up" delay={i * 100}>
                  <article className="flex h-full flex-col rounded-[1rem] border border-b-4 border-site-border bg-white p-6 md:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="site-display site-hl text-[3rem] leading-none md:text-[3.5rem]" aria-hidden>
                        {level.n}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-[0.5rem] px-2 py-1 text-[0.8125rem] font-medium",
                          i === VERIFICATION_LEVELS.length - 1 ? "bg-site-navy text-white" : "bg-site-soft text-site-navy",
                        )}
                      >
                        {i === VERIFICATION_LEVELS.length - 1 ? <SiteIcon.Check size={14} /> : null}
                        {level.status}
                      </span>
                    </div>
                    <h3 className="site-display mt-6 text-[1.5rem] leading-tight text-site-navy md:text-[1.625rem]">
                      <span className="sr-only">Niveau {level.n} : </span>
                      {level.title}
                    </h3>
                    <p className="mt-1.5 text-[0.875rem] text-site-muted">{level.subtitle}</p>
                    <ul className="mt-5 space-y-3 border-t border-site-line pt-5">
                      {level.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-site-ink/85">
                          <SiteIcon.Check size={16} className="mt-1 shrink-0 text-site-navy" />
                          <span className="min-w-0">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>

            <div className="mt-6 grid gap-6 tab:grid-cols-[1.4fr_0.6fr]">
              <Reveal dir="up">
                <div className="h-full rounded-[1rem] border border-site-border bg-white p-6 md:p-8">
                  <h3 className="site-display text-[1.375rem] leading-tight text-site-navy md:text-[1.5rem]">
                    Pièces attendues selon votre type d&apos;organisation
                  </h3>
                  <p className="mt-2 text-[0.875rem] text-site-muted">
                    Elles ne sont jamais publiques : seuls les administrateurs SIRA y accèdent.
                  </p>

                  {/* Bureau et tablette : tableau. */}
                  <table className="mt-6 hidden w-full text-left text-[0.9375rem] md:table">
                    <thead>
                      <tr className="border-b border-site-line text-[0.75rem] uppercase tracking-[0.1em] text-site-muted">
                        <th scope="col" className="py-3 pr-4 font-semibold">
                          Type d&apos;organisation
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold">
                          Justificatifs
                        </th>
                        <th scope="col" className="py-3 pl-4 font-semibold">
                          Peut publier
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-site-line">
                      {ORGANIZATION_TYPES.map((type) => (
                        <tr key={type}>
                          <th scope="row" className="py-3 pr-4 font-medium text-site-ink">
                            {ORGANIZATION_TYPE_LABEL[type]}
                          </th>
                          <td className="px-4 py-3 text-site-ink/75">{ORGANIZATION_CAPABILITIES[type].documents}</td>
                          <td className="py-3 pl-4 text-site-ink/75">{publishes(type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile : une ligne par type, sans défilement horizontal. */}
                  <ul className="mt-5 divide-y divide-site-line md:hidden">
                    {ORGANIZATION_TYPES.map((type) => (
                      <li key={type} className="py-3.5">
                        <p className="text-[0.9375rem] font-semibold text-site-ink">{ORGANIZATION_TYPE_LABEL[type]}</p>
                        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[0.875rem]">
                          <dt className="text-site-muted">Justificatifs</dt>
                          <dd className="text-site-ink/85">{ORGANIZATION_CAPABILITIES[type].documents}</dd>
                          <dt className="text-site-muted">Peut publier</dt>
                          <dd className="text-site-ink/85">{publishes(type)}</dd>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal dir="up" delay={100}>
                <div className="flex h-full flex-col rounded-[1rem] border border-b-4 border-site-border bg-site-navy p-6 site-on-dark md:p-8">
                  <span className="inline-flex w-fit rounded-[0.4rem] bg-site-gold p-2 text-site-navy">
                    <ServiceGlyph name="privacy" />
                  </span>
                  <h3 className="site-display mt-6 text-[1.5rem] leading-tight md:text-[1.625rem]">
                    Un compte non vérifié <Hl>ne publie rien</Hl>
                  </h3>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/85">
                    Tant qu&apos;aucune vérification n&apos;a été faite, vos offres restent en brouillon. C&apos;est la
                    contrepartie d&apos;un site où les candidats peuvent postuler en confiance.
                  </p>
                  <div className="mt-auto pt-8">
                    <SiteButtonLink href="/inscription/recruteur" variant="gold" size="sm">
                      Faire vérifier mon organisation
                    </SiteButtonLink>
                  </div>
                </div>
              </Reveal>
            </div>
          </Inner>
        </Panel>
      </Section>

      {/* 5. Offres et tarifs ------------------------------------------------ */}
      <Section id="tarifs" className="scroll-mt-24 md:scroll-mt-28">
        <Panel tone="light">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" align="center" className="mx-auto max-w-[40rem]">
                Des offres claires, <Hl>gratuites au lancement</Hl>
              </Heading>
              <Lead align="center" tone="muted" className="mt-5">
                Commencez gratuitement, passez au plan Pro quand les candidatures affluent. Paiement prépayé, sans
                prélèvement automatique.
              </Lead>
            </Reveal>

            <Reveal dir="up" className="mt-12">
              <div className="flex flex-col gap-4 rounded-[1rem] border border-site-border bg-white p-6 md:flex-row md:items-center md:gap-6 md:p-7">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-site-navy text-site-gold">
                  <SiteIcon.Check size={22} />
                </span>
                <div>
                  <h3 className="site-display text-[1.375rem] leading-tight text-site-navy">
                    Gratuit pendant la phase de lancement
                  </h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-site-ink/80">
                    L&apos;espace recruteur est intégralement gratuit pendant la phase de lancement : publication
                    d&apos;offres illimitée, réception des candidatures et plan Pro offert aux organisations inscrites. Sa
                    date d&apos;expiration vous est annoncée à l&apos;avance, au moins trente jours avant toute facturation.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="mt-6 grid gap-6 tab:grid-cols-3">
              {RECRUITER_PLANS.map((plan, i) => (
                <Reveal key={plan.code} dir="up" delay={i * 100}>
                  <article
                    className={cn(
                      "flex h-full flex-col rounded-[1.5rem] border border-b-4 border-site-border p-7 md:p-8",
                      plan.highlight ? "bg-site-navy site-on-dark" : "bg-white site-on-light",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className={cn("site-display text-[1.75rem] leading-none", !plan.highlight && "text-site-navy")}>
                        {PLAN_LABEL[plan.code]}
                      </h3>
                      {plan.badge ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-[0.5rem] px-2 py-1 text-[0.8125rem] font-medium",
                            plan.highlight ? "bg-site-gold text-site-navy" : "bg-site-soft text-site-navy",
                          )}
                        >
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className={cn("mt-3 text-[0.9375rem]", plan.highlight ? "text-white/80" : "text-site-muted")}>
                      {plan.tagline}
                    </p>
                    <p className="site-display mt-7 text-[2.5rem] leading-none md:text-[2.75rem]">
                      {plan.highlight ? <Hl>{plan.price}</Hl> : plan.price}
                    </p>
                    <p className={cn("mt-2 text-[0.875rem]", plan.highlight ? "text-white/80" : "text-site-muted")}>
                      {plan.priceNote}
                    </p>

                    <ul
                      className={cn(
                        "mt-7 flex-1 space-y-3 border-t pt-7",
                        plan.highlight ? "border-white/20" : "border-site-line",
                      )}
                    >
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className={cn(
                            "flex items-start gap-2.5 text-[0.9375rem] leading-relaxed",
                            plan.highlight ? "text-white/90" : "text-site-ink/85",
                          )}
                        >
                          <SiteIcon.Check
                            size={16}
                            className={cn("mt-1 shrink-0", plan.highlight ? "text-site-gold" : "text-site-navy")}
                          />
                          <span className="min-w-0">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <SiteButtonLink
                      href={plan.href}
                      variant={plan.highlight ? "gold" : "outline-dark"}
                      size="md"
                      className="mt-8 w-full"
                    >
                      {plan.cta}
                    </SiteButtonLink>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal dir="up" className="mt-10">
              <div className="mx-auto flex max-w-[48rem] flex-col items-center text-center">
                <p className="text-[0.9375rem] leading-relaxed text-site-muted">
                  Les fonctions d&apos;intelligence artificielle assistent, elles ne décident jamais. Aucun refus de
                  candidature n&apos;est prononcé automatiquement, et aucun critère discriminatoire ne peut être utilisé
                  dans un classement.
                </p>
                <SiteButtonLink href="/contact" variant="outline-dark" size="sm" className="mt-6">
                  Parler à un conseiller
                </SiteButtonLink>
              </div>
            </Reveal>
          </Inner>
        </Panel>
      </Section>

      {/* 6. Témoignages ----------------------------------------------------- */}
      <Section>
        <Panel tone="light" pad={false} className="py-20 md:py-28">
          <Reveal dir="up" className="px-8 md:px-16">
            <Heading size="h2" align="center">
              Ce qu&apos;en disent <Hl>ceux qui l&apos;utilisent</Hl>
            </Heading>
            <Lead align="center" tone="muted" className="mt-5">
              Recruteurs en tête, mais aussi candidats et formateurs : ils racontent ce que SIRA a changé dans leur
              recrutement ou leur recherche.
            </Lead>
          </Reveal>
          <Reveal dir="up" className="mt-14">
            <Marquee duration={48} gapClass="gap-6">
              {testimonials.map((t) => (
                <TestimonialCard key={t.name} t={t} />
              ))}
            </Marquee>
          </Reveal>
        </Panel>
      </Section>

      {/* 7. Appel à l'action ------------------------------------------------ */}
      <CtaBlock
        title={
          <>
            Publiez votre première offre <Hl>aujourd&apos;hui</Hl>
          </>
        }
        text="La création du compte prend quelques minutes. Déposez vos justificatifs dans la foulée pour obtenir le badge vérifié et publier sans attendre de validation."
        action={{ href: "/inscription/recruteur", label: "Créer un compte entreprise" }}
        image={IMG.diplomes}
      />
    </>
  );
}
