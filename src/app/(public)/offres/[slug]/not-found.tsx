/**
 * 404 dédiée aux offres : une offre retirée, expirée, en attente de
 * validation ou dont le lien a changé ne doit pas laisser le visiteur dans
 * une impasse. On lui propose les offres publiées le plus récemment.
 *
 * Grammaire du site public : bloc clair centré, titre avec mot-clé en or,
 * cartes d'offre, puis appel à l'action avant le pied de page.
 */

import { SiteJobCard } from "@/components/site/cards";
import { CtaBlock } from "@/components/site/cta";
import { Eyebrow, Heading, Hl, Inner, Lead, Panel, Section, SiteButtonLink } from "@/components/site/kit";
import { Reveal } from "@/components/site/motion";
import { getJobOrganization, getRecentJobs } from "@/data/queries";
import { IMG } from "@/data/site-content";

export default function OffreNotFound() {
  const suggestions = getRecentJobs(4);

  return (
    <>
      <Section className="pt-0">
        <Panel tone="light">
          <Inner>
            <Reveal dir="up" className="text-center">
              <Eyebrow className="text-site-muted">Erreur 404</Eyebrow>
              <Heading as="h1" size="h1" align="center" className="mx-auto max-w-[44rem]">
                Cette offre n&apos;est <Hl>plus disponible</Hl>
              </Heading>
              <Lead align="center" tone="muted" className="mt-6">
                Le lien est peut-être erroné, ou l&apos;offre a été clôturée, suspendue ou retirée par le recruteur. Les
                offres qui ne sont plus publiées quittent automatiquement le site.
              </Lead>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <SiteButtonLink href="/emplois" size="lg">
                  Voir toutes les offres d&apos;emploi
                </SiteButtonLink>
                <SiteButtonLink href="/stages" variant="outline-dark" size="lg">
                  Voir les stages
                </SiteButtonLink>
              </div>
            </Reveal>

            {suggestions.length > 0 ? (
              <div className="mt-20 md:mt-24">
                <Reveal dir="up">
                  <Heading size="h3" align="center" className="text-site-navy">
                    Des opportunités <Hl>publiées récemment</Hl>
                  </Heading>
                </Reveal>
                <ul className="mt-10 grid gap-6 tab:grid-cols-2">
                  {suggestions.map((job, i) => (
                    <li key={job.id}>
                      <Reveal dir="up" delay={(i % 2) * 120}>
                        <SiteJobCard job={job} organization={getJobOrganization(job)} />
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Inner>
        </Panel>
      </Section>

      <CtaBlock
        title={
          <>
            Ne manquez plus <Hl>la bonne offre</Hl>
          </>
        }
        text="Créez votre profil : SIRA vous signale les offres compatibles dès leur publication, avec un score expliqué qui reste une estimation et ne garantit pas le recrutement."
        action={{ href: "/inscription/candidat", label: "Créer mon profil" }}
        image={IMG.reunionEquipe}
      />
    </>
  );
}
