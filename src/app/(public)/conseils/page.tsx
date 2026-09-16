/**
 * Rubrique Conseils : liste des articles.
 *
 * Structure reprise de la page Blog du gabarit de référence :
 *   1. en-tête clair : titre, introduction et articles à la une
 *      (un article vedette large, deux articles à côté)
 *   2. tous les articles, filtrables par thème depuis l'adresse
 *   3. témoignages en défilement infini
 *   4. appel à l'action
 *
 * Le filtre lit l'adresse dans le navigateur (`useSearchParams`) sous
 * `Suspense` : la page reste exportable en fichiers statiques.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { PostCard, TestimonialCard } from "@/components/site/cards";
import { PostRowCard } from "@/components/site/conseils-cards";
import { ConseilsFilter, ConseilsList } from "@/components/site/conseils-filter";
import { CtaBlock } from "@/components/site/cta";
import { Heading, Hl, Inner, Lead, Marquee, Panel, Section } from "@/components/site/kit";
import { Reveal } from "@/components/site/motion";
import { IMG, TESTIMONIALS } from "@/data/site-content";
import { featuredPosts } from "@/data/site-conseils";

export const metadata: Metadata = {
  title: "Conseils emploi et recrutement",
  description:
    "CV, entretien, stage, recrutement et formation : des conseils concrets pour les candidats et les recruteurs partout en Afrique, par l'équipe SIRA.",
};

export default function ConseilsPage() {
  const [lead, ...others] = featuredPosts();
  const aside = others.slice(0, 2);

  return (
    <>
      {/* 1. En-tête et articles à la une ------------------------------------ */}
      <Section className="pt-0">
        <Panel tone="light">
          <Inner>
            <div className="grid gap-6 tab:grid-cols-[1.15fr_0.85fr] tab:items-end tab:gap-16">
              <Reveal dir="left">
                <Heading as="h1" size="h1" className="max-w-[40rem]">
                  Conseils emploi &amp; <Hl>tendances du recrutement</Hl>
                </Heading>
              </Reveal>
              <Reveal dir="right">
                <Lead tone="muted" className="tab:mb-2">
                  Des repères concrets pour décrocher un emploi ou un stage, réussir un entretien, recruter les bons
                  profils et continuer à se former, pensés pour les réalités des marchés de l&apos;emploi africains.
                </Lead>
              </Reveal>
            </div>

            {lead ? (
              <div className="mt-14 grid gap-6 md:mt-16 tab:grid-cols-[1.1fr_0.9fr]">
                <h2 className="sr-only">Articles à la une</h2>
                <Reveal dir="up">
                  <PostCard post={lead} size="lg" />
                </Reveal>
                {/* Sur mobile, seul l'article vedette reste ici : les deux autres
                    ouvrent déjà la grille « Tous les articles » juste en dessous. */}
                <div className="hidden gap-6 md:grid tab:grid-rows-2">
                  {aside.map((post, i) => (
                    <Reveal key={post.slug} dir="up" delay={(i + 1) * 120}>
                      <PostRowCard post={post} />
                    </Reveal>
                  ))}
                </div>
              </div>
            ) : null}
          </Inner>
        </Panel>
      </Section>

      {/* 2. Tous les articles ------------------------------------------------ */}
      <Section id="articles">
        <Panel tone="light">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" align="center">
                Tous les articles, <Hl>par thème</Hl>
              </Heading>
              <Lead align="center" tone="muted" className="mt-5">
                CV, entretien, stage, recrutement ou formation : choisissez un thème pour ne garder que les conseils
                qui vous concernent.
              </Lead>
            </Reveal>
            <Suspense fallback={<ConseilsList active={null} />}>
              <ConseilsFilter />
            </Suspense>
          </Inner>
        </Panel>
      </Section>

      {/* 3. Témoignages ------------------------------------------------------ */}
      <Section>
        <Panel tone="light" pad={false} className="py-20 md:py-28">
          <Reveal dir="up" className="px-8 md:px-16">
            <Heading size="h2" align="center">
              Ils ont mis ces conseils <Hl>en pratique</Hl>
            </Heading>
            <Lead align="center" tone="muted" className="mt-5">
              Candidats, recruteurs et formateurs racontent comment SIRA a fait avancer leur recherche ou leur
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

      {/* 4. Appel à l'action ------------------------------------------------- */}
      <CtaBlock
        title={
          <>
            Passez des conseils <Hl>à la candidature</Hl>
          </>
        }
        text="Créez votre profil, découvrez votre score de compatibilité pour chaque offre et préparez des candidatures solides, que vous relisez et validez avant tout envoi."
        action={{ href: "/inscription/candidat", label: "Créer mon profil" }}
        image={IMG.accompagnement}
      />
    </>
  );
}
