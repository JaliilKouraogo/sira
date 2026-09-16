/**
 * Recherche d'offres, toutes opportunités confondues.
 *
 * Structure reprise des pages intérieures du gabarit :
 *   1. en-tête : bloc marine avec la barre de recherche, photo avec rideau
 *      et parallaxe ;
 *   2. bloc clair : filtres en pastilles, filtres actifs, nombre de
 *      résultats et grille d'offres ;
 *   3. appel à l'action avant le pied de page.
 *
 * La page ne lit pas l'adresse côté serveur, pour rester exportable en
 * fichiers statiques : les filtres vivent dans des composants client rendus
 * sous `<Suspense>`, dont le repli affiche la recherche sans filtre.
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
import { getPublishedJobs } from "@/data/queries";

export const metadata: Metadata = {
  title: "Offres d'emploi en Afrique",
  description:
    "Consultez les offres publiées sur SIRA, partout en Afrique, et filtrez-les par ville, domaine, contrat, mode de travail et expérience demandée.",
};

export default function EmploisPage() {
  const total = getPublishedJobs().length;

  return (
    <>
      <JobSearchHeader
        badge={total === 1 ? "1 opportunité publiée" : `${total} opportunités publiées`}
        title={
          <>
            Trouvez l&apos;offre qui <Hl>vous fait avancer</Hl>
          </>
        }
        text="Emplois, stages, alternances, missions et volontariats : toutes les opportunités publiées sur SIRA, des postes en CDI aux missions courtes. Affinez la recherche, puis ouvrez une offre pour comprendre ce qui est attendu."
        image={IMG.villeSoir}
        search={
          <Suspense fallback={<JobSearchHeroView variant="emplois" />}>
            <JobSearchHero variant="emplois" />
          </Suspense>
        }
      />

      <Section id="resultats" className="scroll-mt-24">
        <Panel tone="light" pad={false} className="px-5 py-14 xs:px-8 md:px-12 md:py-20 tab:px-16">
          <Inner>
            <div className="mb-10 grid gap-5 tab:grid-cols-[1.1fr_0.9fr] tab:items-end tab:gap-12">
              <Reveal dir="left">
                <Heading size="h2" className="text-balance">
                  Toutes les offres, <Hl>au bon filtre</Hl>
                </Heading>
              </Reveal>
              <Reveal dir="right">
                <Lead tone="muted">
                  Ville, domaine, contrat, mode de travail, expérience : chaque choix s&apos;applique aussitôt et
                  s&apos;inscrit dans l&apos;adresse de la page, pour partager une recherche ou la retrouver plus tard.
                </Lead>
              </Reveal>
            </div>
            <Suspense fallback={<JobSearchResultsView variant="emplois" />}>
              <JobSearchResults variant="emplois" />
            </Suspense>
          </Inner>
        </Panel>
      </Section>

      <CtaBlock
        title={
          <>
            Une candidature prête, <Hl>validée par vous</Hl>
          </>
        }
        text="À partir de votre profil, SIRA prépare un CV adapté et une lettre de motivation sans rien inventer. Vous relisez, vous modifiez, et rien n'est envoyé sans votre validation."
        action={{ href: "/inscription/candidat", label: "Créer mon profil" }}
        image={IMG.accompagnement}
      />
    </>
  );
}
