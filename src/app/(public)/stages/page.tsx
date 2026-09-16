/**
 * Recherche d'offres de stage. Même écran que /emplois, avec le type
 * d'opportunité « stage » imposé et des textes pensés pour les étudiants et
 * les jeunes diplômés.
 *
 * La page ne lit pas l'adresse côté serveur, pour rester exportable en
 * fichiers statiques : les filtres vivent dans des composants client rendus
 * sous `<Suspense>`.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { JobSearchHeader } from "@/components/site/emplois-header";
import { CtaBlock } from "@/components/site/cta";
import { Heading, Hl, Inner, Lead, Panel, Section } from "@/components/site/kit";
import {
  JobSearchHero,
  JobSearchHeroView,
  JobSearchResults,
  JobSearchResultsView,
} from "@/components/site/emplois-search";
import { Reveal } from "@/components/site/motion";
import { IMG } from "@/data/site-content";
import { searchJobs } from "@/data/queries";

export const metadata: Metadata = {
  title: "Offres de stage en Afrique",
  description:
    "Stages conventionnés publiés sur SIRA, partout en Afrique : filtrez par ville, domaine et mode de travail pour trouver le stage qui correspond à votre formation.",
};

export default function StagesPage() {
  const total = searchJobs({ type: "stage" }).length;

  return (
    <>
      <JobSearchHeader
        badge={total === 1 ? "1 stage publié" : `${total} stages publiés`}
        title={
          <>
            Le stage qui <Hl>lance votre parcours</Hl>
          </>
        }
        text="Les stages publiés sur SIRA, pour les étudiants et les jeunes diplômés. Un stage n'exige pas d'expérience longue : concentrez-vous sur la ville, le domaine et les compétences demandées, et préparez une candidature soignée."
        image={IMG.diplomes}
        search={
          <Suspense fallback={<JobSearchHeroView variant="stages" />}>
            <JobSearchHero variant="stages" />
          </Suspense>
        }
      />

      <Section id="resultats" className="scroll-mt-24">
        <Panel tone="light" pad={false} className="px-5 py-14 xs:px-8 md:px-12 md:py-20 tab:px-16">
          <Inner>
            <div className="mb-10 grid gap-5 tab:grid-cols-[1.1fr_0.9fr] tab:items-end tab:gap-12">
              <Reveal dir="left">
                <Heading size="h2">
                  Trouvez le stage <Hl>fait pour vous</Hl>
                </Heading>
              </Reveal>
              <Reveal dir="right">
                <Lead tone="muted">
                  Filtrez par ville, domaine ou mode de travail. Chaque choix s&apos;applique aussitôt et
                  s&apos;inscrit dans l&apos;adresse de la page, pour partager une recherche avec un camarade ou la
                  retrouver plus tard.
                </Lead>
              </Reveal>
            </div>
            <Suspense fallback={<JobSearchResultsView variant="stages" />}>
              <JobSearchResults variant="stages" />
            </Suspense>
          </Inner>
        </Panel>
      </Section>

      <CtaBlock
        title={
          <>
            Vous accueillez <Hl>des stagiaires ?</Hl>
          </>
        }
        text="Publiez vos offres de stage et recevez des candidatures structurées d'étudiants et de jeunes diplômés, partout en Afrique. L'IA propose un classement, la décision vous appartient."
        action={{ href: "/recruteurs", label: "Publier un stage" }}
        image={IMG.salleFormation}
      />
    </>
  );
}
