/**
 * Accueil du site public.
 *
 * Structure reprise du gabarit de référence, dans le même ordre :
 *   1. hero : bloc marine et photo avec rideau et parallaxe
 *   2. bandeau de logos en défilement infini
 *   3. onglets de fonctionnalités sur fond marine
 *   4. trois cartes de services
 *   5. offres à la une
 *   6. chiffres clés sur fond marine
 *   7. témoignages en défilement infini
 *   8. appel à l'action
 * Le pied de page est fourni par le gabarit de page.
 *
 * Contenu propre à SIRA, exigences du cahier des charges respectées : le
 * score reste une estimation, l'IA ne décide pas, rien n'est envoyé sans
 * validation du candidat.
 */

import Image from "next/image";
import { CtaBlock } from "@/components/site/cta";
import { ServiceCard, SiteJobCard, StatItem, TestimonialCard } from "@/components/site/cards";
import { FeatureTabs } from "@/components/site/interactive";
import {
  Heading,
  Hl,
  Inner,
  Lead,
  Marquee,
  Panel,
  Section,
  SiteButtonLink,
} from "@/components/site/kit";
import { ImageFrame, Parallax, Reveal } from "@/components/site/motion";
import { HOME_GOALS, HOME_PERKS, HOME_SERVICES, IMG, PORTRAITS, TESTIMONIALS } from "@/data/site-content";
import { getJobById, getJobOrganization, getOrganizations } from "@/data/queries";
import type { Job } from "@/lib/types";

/** Glyphe neutre devant le nom d'un partenaire, varié pour rythmer le bandeau. */
function PartnerGlyph({ index }: { index: number }) {
  const shapes = [
    <circle key="c" cx="12" cy="12" r="8" />,
    <rect key="r" x="4" y="4" width="16" height="16" rx="3" />,
    <path key="t" d="M12 4 20 19H4Z" />,
    <path key="d" d="M12 3 21 12 12 21 3 12Z" />,
    <path key="z" d="M4 6h16L4 18h16" />,
  ];
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
      {shapes[index % shapes.length]}
    </svg>
  );
}

export default function HomePage() {
  const partners = getOrganizations();
  const highlighted = ["job_02", "job_05", "job_01", "job_04"]
    .map((id) => getJobById(id))
    .filter((j): j is Job => Boolean(j && j.status === "publiee"));

  return (
    <>
      {/* 1. Hero ------------------------------------------------------------ */}
      <Section className="pt-0">
        <div className="grid gap-3 tab:grid-cols-2">
          <div className="flex flex-col justify-center rounded-[1.5rem] border border-site-border bg-site-navy px-8 py-20 site-on-dark md:px-16 md:py-28 tab:min-h-[40rem]">
            <Reveal dir="left">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {PORTRAITS.slice(0, 4).map((p) => (
                    <span key={p.src} className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-site-navy">
                      <Image src={p.src} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                  ))}
                </div>
                <p className="leading-tight">
                  <span className="block text-[0.9375rem] font-semibold text-white">Candidats et recruteurs</span>
                  <span className="block text-[0.875rem] text-site-gold">réunis sur une même plateforme</span>
                </p>
              </div>

              <Heading as="h1" size="h1" className="mt-8 max-w-[34rem]">
                SIRA, le chemin vers <Hl>l&apos;opportunité</Hl>
              </Heading>

              <Lead className="mt-6 text-white/90">
                Nous rapprochons les talents et les recruteurs partout en Afrique grâce à un matching qui s&apos;explique,
                des candidatures préparées sans rien inventer et des formations qui comblent les écarts.
              </Lead>

              <div className="mt-9 flex flex-wrap gap-3">
                <SiteButtonLink href="/emplois" variant="gold" size="lg">
                  Découvrir les offres
                </SiteButtonLink>
                <SiteButtonLink href="/recruteurs" variant="outline-light" size="lg">
                  Publier une offre
                </SiteButtonLink>
              </div>
            </Reveal>
          </div>

          <ImageFrame
            to="left"
            curtain="var(--color-site-canvas)"
            className="hidden min-h-[28rem] rounded-[1.5rem] border border-site-border md:block tab:min-h-0"
          >
            <Parallax strength={18}>
              <Image
                src={IMG.equipeOrdinateurs.src}
                alt={IMG.equipeOrdinateurs.alt}
                fill
                priority
                sizes="(min-width: 992px) 50vw, 100vw"
                className="object-cover"
              />
            </Parallax>
          </ImageFrame>
        </div>
      </Section>

      {/* 2. Bandeau de partenaires ----------------------------------------- */}
      <Section>
        <Panel tone="light" pad={false} className="py-9 md:py-11">
          <h2 className="sr-only">Organisations présentes sur SIRA</h2>
          <Reveal dir="up">
            <Marquee duration={38} gapClass="gap-6">
              {partners.map((org, i) => (
                <div
                  key={org.id}
                  className="flex w-[12.5rem] shrink-0 items-center gap-2.5 text-site-muted"
                >
                  <PartnerGlyph index={i} />
                  <span className="site-display truncate text-[1.375rem] leading-none">
                    {org.tradeName ?? org.legalName}
                  </span>
                </div>
              ))}
            </Marquee>
          </Reveal>
        </Panel>
      </Section>

      {/* 3. Onglets de fonctionnalités -------------------------------------- */}
      <Section>
        <Panel tone="dark">
          <Inner>
            <FeatureTabs
              items={HOME_PERKS}
              tone="dark"
              imageSide="left"
              heading={
                <Reveal dir="up">
                  <Heading size="h2" className="max-w-[32rem]">
                    <Hl>Un matching expliqué,</Hl> des candidatures plus fortes
                  </Heading>
                </Reveal>
              }
              footer={
                <Reveal dir="up">
                  <p className="max-w-[32rem] text-[0.9375rem] leading-relaxed text-white/85">
                    Des outils d&apos;intelligence artificielle au service des candidats et des recruteurs, avec une
                    règle constante : l&apos;humain garde la décision.
                  </p>
                  <SiteButtonLink href="/a-propos" variant="outline-light" size="sm" className="mt-6">
                    Comment ça marche
                  </SiteButtonLink>
                </Reveal>
              }
            />
          </Inner>
        </Panel>
      </Section>

      {/* 4. Services -------------------------------------------------------- */}
      <Section>
        <Panel tone="light">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" align="center">
                Tout ce qu&apos;il faut pour <Hl>trouver sa voie</Hl>
              </Heading>
              <Lead align="center" tone="muted" className="mt-5">
                Une même plateforme pour ceux qui cherchent, ceux qui recrutent et ceux qui forment, avec des outils
                pensés pour chacun.
              </Lead>
            </Reveal>
            <div className="mt-14 grid gap-6 tab:grid-cols-3">
              {HOME_SERVICES.map((s, i) => (
                <Reveal key={s.title} dir="up" delay={i * 120}>
                  <ServiceCard title={s.title} text={s.text} icon={s.icon} href={s.href} />
                </Reveal>
              ))}
            </div>
          </Inner>
        </Panel>
      </Section>

      {/* 5. Offres à la une ------------------------------------------------- */}
      <Section>
        <Panel tone="light">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" align="center">
                Découvrir les <Hl>offres à la une</Hl>
              </Heading>
            </Reveal>
            <div className="mt-14 grid gap-6 tab:grid-cols-2">
              {highlighted.map((job, i) => (
                <Reveal key={job.id} dir="up" delay={(i % 2) * 120}>
                  <SiteJobCard job={job} organization={getJobOrganization(job)} />
                </Reveal>
              ))}
            </div>
            <Reveal dir="up" className="mt-12 flex justify-center">
              <SiteButtonLink href="/emplois" variant="outline-dark">
                Voir toutes les offres
              </SiteButtonLink>
            </Reveal>
          </Inner>
        </Panel>
      </Section>

      {/* 6. Objectifs chiffrés ---------------------------------------------- */}
      <Section>
        <Panel tone="dark">
          <Inner className="grid items-center gap-12 tab:grid-cols-2">
            <Reveal dir="left">
              <Heading size="h2">
                Nos objectifs <Hl>en chiffres</Hl>
              </Heading>
              <Lead className="mt-5 text-white/90">
                SIRA se construit pour l&apos;Afrique. Voici ce que nous visons pour nos premières années d&apos;exploitation,
                aux côtés des organisations et des centres de formation partenaires du continent.
              </Lead>
              <SiteButtonLink href="/a-propos" variant="gold" size="lg" className="mt-8">
                En savoir plus sur SIRA
              </SiteButtonLink>
            </Reveal>
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
              {HOME_GOALS.map((g, i) => (
                <Reveal key={g.label} dir="up" delay={i * 100}>
                  <StatItem value={g.value} label={g.label} accent={g.accent} />
                </Reveal>
              ))}
            </div>
          </Inner>
        </Panel>
      </Section>

      {/* 7. Témoignages ----------------------------------------------------- */}
      <Section>
        <Panel tone="light" pad={false} className="py-20 md:py-28">
          <Reveal dir="up" className="px-8 md:px-16">
            <Heading size="h2" align="center">
              Des parcours <Hl>qui avancent</Hl>
            </Heading>
            <Lead align="center" tone="muted" className="mt-5">
              Candidats, recruteurs et formateurs racontent ce que SIRA a changé dans leur recherche ou leur
              recrutement.
            </Lead>
          </Reveal>
          <Reveal dir="up" className="mt-14">
            <Marquee duration={48} gapClass="gap-6">
              {TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.name} t={t} />
              ))}
            </Marquee>
          </Reveal>
        </Panel>
      </Section>

      {/* 8. Appel à l'action ------------------------------------------------ */}
      <CtaBlock
        title={
          <>
            Recrutez mieux, <Hl>avancez plus vite</Hl>
          </>
        }
        text="De la publication de l'offre à la décision finale, SIRA structure chaque étape du recrutement avec des outils conçus pour les réalités des marchés africains de l'emploi."
        action={{ href: "/recruteurs", label: "Publier une offre" }}
      />
    </>
  );
}
