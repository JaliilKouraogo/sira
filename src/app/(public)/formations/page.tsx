/**
 * Catalogue de formations — [T §8].
 *
 * Structure reprise du gabarit de référence :
 *   1. en-tête : bloc marine et photo avec rideau et parallaxe ;
 *   2. catalogue sur bloc clair : recherche, filtres en pastilles, grille ;
 *   3. du score à la formation : trois étapes, rappel des règles ;
 *   4. appel à l'action pour les organismes de formation.
 *
 * Le site est exporté en fichiers statiques : la page ne lit pas l'adresse
 * côté serveur. Les filtres sont appliqués dans le navigateur par
 * `FormationsCatalogue`, rendu dans un `<Suspense>` dont le repli affiche le
 * catalogue complet.
 *
 * SIRA reste un annuaire : l'inscription et le paiement se font chez
 * l'organisme qui dispense la formation.
 */

import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { CtaBlock } from "@/components/site/cta";
import { FormationsCatalogue, FormationsCatalogueFallback } from "@/components/site/formations-catalogue";
import {
  Eyebrow,
  Heading,
  Hl,
  Inner,
  Lead,
  Panel,
  Section,
  SiteButtonLink,
} from "@/components/site/kit";
import { ImageFrame, Parallax, Reveal } from "@/components/site/motion";
import { getTrainings } from "@/data/queries";
import { IMG } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Catalogue de formations | SIRA",
  description:
    "Formations courtes, certifiantes ou gratuites proposées par les organismes partenaires de SIRA, filtrables par catégorie, accès, format et niveau.",
};

const STEPS: { title: string; text: string }[] = [
  {
    title: "Repérez l'écart",
    text: "Pour chaque offre, le score de compatibilité détaille les compétences qui vous manquent. C'est une estimation algorithmique : elle éclaire votre recherche, elle ne garantit pas un recrutement.",
  },
  {
    title: "Choisissez la formation",
    text: "SIRA vous oriente vers les formations qui couvrent ces compétences. La plateforme reste un annuaire : l'inscription et le paiement se font directement auprès de l'organisme.",
  },
  {
    title: "Mettez votre profil à jour",
    text: "Suivre une formation ne modifie pas votre score automatiquement. Ajoutez la compétence acquise à votre profil : elle sera prise en compte au prochain calcul.",
  },
];

export default function FormationsPage() {
  const trainings = getTrainings();
  const facts = [
    { value: String(trainings.length), label: "formations référencées" },
    { value: String(trainings.filter((t) => t.access === "public_gratuit").length), label: "gratuites" },
    { value: String(trainings.filter((t) => t.certificate).length), label: "avec certificat" },
  ];

  return (
    <>
      {/* 1. En-tête ------------------------------------------------------- */}
      <Section className="pt-0">
        <div className="grid gap-3 tab:grid-cols-2">
          <div className="flex flex-col justify-center rounded-[1.5rem] border border-site-border bg-site-navy px-8 py-20 site-on-dark md:px-16 md:py-28 tab:min-h-[40rem]">
            <Reveal dir="left">
              <Eyebrow className="text-site-gold opacity-100">Catalogue de formations</Eyebrow>
              <Heading as="h1" size="h1" className="max-w-[34rem]">
                Des formations pour <Hl>combler l&apos;écart</Hl>
              </Heading>
              <Lead className="mt-6 text-white/90">
                Quand une offre vous échappe pour une compétence précise, SIRA vous dit laquelle et où l&apos;acquérir.
                Ces formations sont proposées par des centres et établissements partenaires, en présentiel, en ligne ou
                en format hybride.
              </Lead>

              <div className="mt-9 flex flex-wrap gap-3">
                <SiteButtonLink href="#catalogue" variant="gold" size="lg">
                  Parcourir le catalogue
                </SiteButtonLink>
                <SiteButtonLink href="/contact" variant="outline-light" size="lg">
                  Référencer une formation
                </SiteButtonLink>
              </div>

              <dl className="mt-12 grid max-w-[32rem] grid-cols-3 gap-4 border-t border-white/20 pt-8">
                {facts.map((f) => (
                  <div key={f.label} className="flex min-w-0 flex-col-reverse">
                    <dt className="mt-2 text-[0.8125rem] leading-snug text-white/80 md:text-[0.875rem]">{f.label}</dt>
                    <dd className="site-display text-[2.25rem] leading-none text-site-gold md:text-[2.75rem]">
                      {f.value}
                    </dd>
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
                src={IMG.salleFormation.src}
                alt={IMG.salleFormation.alt}
                fill
                priority
                sizes="(min-width: 992px) 50vw, 100vw"
                className="object-cover"
              />
            </Parallax>
          </ImageFrame>
        </div>
      </Section>

      {/* 2. Catalogue ----------------------------------------------------- */}
      <Section id="catalogue" className="scroll-mt-24">
        <Panel tone="light" className="max-md:px-5 max-md:py-16">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" align="center">
                Trouvez la formation <Hl>qui vous fait avancer</Hl>
              </Heading>
              <Lead align="center" tone="muted" className="mt-5">
                Recherchez par compétence ou par métier, puis affinez par catégorie, accès, format et niveau.
                L&apos;accès de chaque formation est indiqué dès la carte.
              </Lead>
            </Reveal>

            <div className="mt-12 md:mt-14">
              <Suspense fallback={<FormationsCatalogueFallback />}>
                <FormationsCatalogue />
              </Suspense>
            </div>

            <p className="mt-10 border-t border-site-line pt-5 text-[0.875rem] leading-relaxed text-site-muted">
              Les formations incluses avec Premium sont accessibles sans frais supplémentaires aux abonnés. Les
              formations payantes sont facturées par l&apos;organisme qui les dispense : SIRA référence les formations,
              l&apos;inscription et le paiement se font directement auprès de l&apos;organisme.
            </p>
          </Inner>
        </Panel>
      </Section>

      {/* 3. Du score à la formation --------------------------------------- */}
      <Section>
        <Panel tone="dark">
          <Inner>
            <div className="grid gap-8 tab:grid-cols-[1.15fr_1fr] tab:items-end">
              <Reveal dir="left">
                <Heading size="h2">
                  Du score <Hl>à la formation</Hl>
                </Heading>
              </Reveal>
              <Reveal dir="right">
                <Lead className="text-white/85">
                  Une recommandation sans motif n&apos;en est pas une : chaque formation proposée dit quelle compétence
                  elle couvre. L&apos;humain garde la décision, du choix de la formation à la candidature.
                </Lead>
              </Reveal>
            </div>

            <ol className="mt-14 grid gap-6 tab:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} as="li" dir="up" delay={i * 120}>
                  <div className="flex h-full flex-col rounded-[1rem] border border-b-4 border-site-border bg-white p-6 text-site-ink md:p-7">
                    <span className="site-display text-[2.5rem] leading-none text-[#a8860f]" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="site-display mt-6 text-[1.5rem] leading-tight text-site-navy md:text-[1.625rem]">
                      {s.title}
                    </h3>
                    <p className="mt-4 text-[0.9375rem] leading-relaxed text-site-ink/80">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </Inner>
        </Panel>
      </Section>

      {/* 4. Appel à l'action ---------------------------------------------- */}
      <CtaBlock
        title={
          <>
            Vous formez des talents&nbsp;? <Hl>Faites-le savoir</Hl>
          </>
        }
        text="Présentez vos formations aux candidats qui en ont réellement besoin, partout en Afrique : SIRA les recommande à partir des compétences qui manquent dans leurs profils."
        action={{ href: "/contact", label: "Référencer une formation" }}
        image={IMG.remiseDiplomes}
      />
    </>
  );
}
