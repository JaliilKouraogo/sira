/**
 * En-tête de la page À propos.
 *
 * Reprend l'animation signature du gabarit : sous le titre, une grande image
 * centrale s'agrandit pendant le défilement (de 36vw × 80vh environ jusqu'à
 * 95vw × 88vh) tandis que deux groupes d'images latéraux s'écartent vers
 * l'extérieur (±32vw). La progression est fournie par `ScrollProgress` sous
 * forme de variable CSS `--p`, entre 22 % et 55 % du parcours de l'en-tête ;
 * tout le reste est du `calc()` en CSS, sans aucun rendu React pendant le
 * défilement.
 *
 * L'animation n'existe qu'à partir de 768 px. En dessous, une simple grille
 * d'images. Avec le réglage « mouvement réduit », `--p` reste à 0 et les
 * images gardent leur taille de départ.
 *
 * Uniquement des scènes (`IMG`) : aucune personne identifiable n'est associée
 * à un nom ou à une fonction.
 */

import Image from "next/image";
import type { CSSProperties } from "react";
import { IMG, type SiteImage } from "@/data/site-content";
import { Heading, Hl, Lead, Section, SiteButtonLink, cn } from "./kit";
import { ImageFrame, Reveal, ScrollProgress } from "./motion";

const CENTER = IMG.salleFormation;
const LEFT = { tall: IMG.accompagnement, square: IMG.poigneeMain, portrait: IMG.entretien };
const RIGHT = { portrait: IMG.villeSoir, square: IMG.diplomes, tall: IMG.equipeOrdinateurs };

/** Hauteur utile de la scène, sous la barre de navigation flottante. */
const AVAILABLE = "(100vh - 6.75rem)";

/**
 * Image de la scène. `curtain` active le rideau de dévoilement ; il est réservé
 * aux images qui restent dans le champ, car une image latérale repoussée hors
 * du bloc pendant le défilement pourrait ne jamais déclencher son rideau.
 */
function Shot({
  image,
  className,
  to = "left",
  sizes,
  priority,
  curtain = false,
  rounded = "rounded-[1rem]",
}: {
  image: SiteImage;
  className?: string;
  to?: "left" | "right" | "down";
  sizes: string;
  priority?: boolean;
  curtain?: boolean;
  rounded?: string;
}) {
  const img = <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  const frame = cn("border border-site-border", rounded, className);
  return curtain ? (
    <ImageFrame to={to} curtain="var(--color-site-light)" className={frame}>
      {img}
    </ImageFrame>
  ) : (
    <div className={cn("relative overflow-hidden", frame)}>{img}</div>
  );
}

export function AproposHero() {
  // Largeur et hauteur de départ de l'image centrale. `--w0` est posée par
  // classe (44vw en tablette portrait, 36vw au-delà de 992 px) ; la hauteur
  // de départ est bornée pour ne pas produire une image trop étroite.
  const stageVars = {
    "--h0": `min(calc(${AVAILABLE} * 0.84), calc(var(--w0) * 1.6))`,
  } as CSSProperties;

  return (
    <Section className="pt-0">
      <div className="overflow-clip rounded-[1.5rem] border border-site-border bg-site-light site-on-light">
        <ScrollProgress start={0.22} end={0.55}>
          {/* Texte ---------------------------------------------------------- */}
          <div className="px-8 pb-12 pt-20 md:px-16 md:pb-14 md:pt-24">
            <Reveal dir="up" className="mx-auto flex max-w-[48rem] flex-col items-center text-center">
              <p className="mb-5 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-site-muted">
                À propos de SIRA
              </p>
              <Heading as="h1" size="h1" align="center">
                Rendre lisible le chemin <Hl>vers l&apos;opportunité</Hl>
              </Heading>
              <Lead align="center" tone="muted" className="mt-6">
                Partout en Afrique, les offres existent et les talents aussi. Ce qui manque, c&apos;est un chemin clair
                entre les deux : savoir quelles opportunités correspondent vraiment, comprendre ce qui bloque et
                présenter un dossier à la hauteur. C&apos;est ce que SIRA construit.
              </Lead>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <SiteButtonLink href="/inscription/candidat" variant="navy" size="md">
                  Créer mon profil
                </SiteButtonLink>
                <SiteButtonLink href="/a-propos#ia" variant="outline-dark" size="md">
                  Comprendre notre IA
                </SiteButtonLink>
              </div>
            </Reveal>
          </div>

          {/* Petit écran : grille simple ------------------------------------ */}
          <div className="grid grid-cols-2 gap-3 px-3 pb-3 xs:px-5 xs:pb-5 md:hidden">
            <Shot image={CENTER} className="col-span-2 aspect-[4/3]" sizes="90vw" priority curtain rounded="rounded-[1.25rem]" />
            <Shot image={LEFT.tall} className="row-span-2" to="right" sizes="50vw" curtain />
            <Shot image={LEFT.square} className="aspect-square" sizes="50vw" curtain />
            <Shot image={RIGHT.square} className="aspect-square" sizes="50vw" curtain />
          </div>

          {/* À partir de 768 px : scène épinglée ----------------------------- */}
          <div className="relative hidden h-[170vh] [--w0:44vw] md:block tab:[--w0:36vw]" style={stageVars}>
            <div className="sticky top-0 h-screen overflow-hidden">
              <div className="absolute inset-x-0 bottom-3 top-[6rem]">
                {/* Groupe de gauche */}
                <div
                  className="absolute top-1/2 flex items-center gap-4 will-change-transform"
                  style={{
                    right: "calc(50% + var(--w0) / 2 + 1.25rem)",
                    transform: "translate3d(calc(var(--p) * -1 * ((95vw - var(--w0)) / 2 + 2.5vw)), -50%, 0)",
                  }}
                >
                  <Shot image={LEFT.tall} className="aspect-[2/3] w-[min(20vw,38vh)]" sizes="20vw" />
                  <div className="flex w-[min(18vw,34vh)] flex-col gap-4">
                    <Shot image={LEFT.square} className="aspect-square w-full" sizes="18vw" />
                    <Shot image={LEFT.portrait} className="aspect-[3/4] w-full" sizes="18vw" />
                  </div>
                </div>

                {/* Image centrale */}
                <div
                  className="absolute left-1/2 top-1/2 z-10"
                  style={{
                    width: "calc(var(--w0) + var(--p) * (95vw - var(--w0)))",
                    height: `calc(var(--h0) + var(--p) * (${AVAILABLE} - var(--h0)))`,
                    transform: "translate3d(-50%, -50%, 0)",
                  }}
                >
                  <Shot
                    image={CENTER}
                    className="h-full w-full"
                    to="down"
                    sizes="95vw"
                    priority
                    curtain
                    rounded="rounded-[1.5rem]"
                  />
                </div>

                {/* Groupe de droite */}
                <div
                  className="absolute top-1/2 flex items-center gap-4 will-change-transform"
                  style={{
                    left: "calc(50% + var(--w0) / 2 + 1.25rem)",
                    transform: "translate3d(calc(var(--p) * ((95vw - var(--w0)) / 2 + 2.5vw)), -50%, 0)",
                  }}
                >
                  <div className="flex w-[min(18vw,34vh)] flex-col gap-4">
                    <Shot image={RIGHT.portrait} className="aspect-[3/4] w-full" sizes="18vw" />
                    <Shot image={RIGHT.square} className="aspect-square w-full" sizes="18vw" />
                  </div>
                  <Shot image={RIGHT.tall} className="aspect-[2/3] w-[min(20vw,38vh)]" sizes="20vw" />
                </div>
              </div>
            </div>
          </div>
        </ScrollProgress>
      </div>
    </Section>
  );
}
