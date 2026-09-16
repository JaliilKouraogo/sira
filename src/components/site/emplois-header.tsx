/**
 * En-tête des pages de recherche d'offres (/emplois et /stages).
 *
 * Même grammaire que l'accueil : un bloc marine à gauche qui porte le titre,
 * le paragraphe et la barre de recherche, une grande photo à droite dévoilée
 * par un rideau et animée en parallaxe. Entre 768 et 991 px la photo passe
 * sous le bloc ; en dessous de 768 px elle disparaît.
 */

import Image from "next/image";
import type { ReactNode } from "react";
import type { SiteImage } from "@/data/site-content";
import { Heading, Lead, Section } from "./kit";
import { ImageFrame, Parallax, Reveal } from "./motion";

export function JobSearchHeader({
  badge,
  title,
  text,
  image,
  search,
}: {
  badge: string;
  title: ReactNode;
  text: string;
  image: SiteImage;
  /** Barre de recherche, rendue sous `<Suspense>` par la page. */
  search: ReactNode;
}) {
  return (
    <Section className="pt-0">
      <div className="grid gap-3 tab:grid-cols-2">
        <div className="flex flex-col justify-center rounded-[1.5rem] border border-site-border bg-site-navy px-6 py-16 site-on-dark xs:px-8 md:px-16 md:py-24 tab:min-h-[40rem]">
          <Reveal dir="left">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/25 py-1.5 pl-2.5 pr-4 text-[0.875rem] font-medium text-white/90">
              <span className="relative inline-flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-site-gold opacity-60 motion-reduce:animate-none" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-site-gold" />
              </span>
              {badge}
            </p>

            <Heading as="h1" size="h1" className="mt-7 max-w-[36rem]">
              {title}
            </Heading>

            <Lead className="mt-6 text-white/90">{text}</Lead>

            {search}
          </Reveal>
        </div>

        <ImageFrame
          to="left"
          curtain="var(--color-site-canvas)"
          className="hidden min-h-[28rem] rounded-[1.5rem] border border-site-border md:block tab:min-h-0"
        >
          <Parallax strength={18}>
            <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 992px) 50vw, 100vw" className="object-cover" />
          </Parallax>
        </ImageFrame>
      </div>
    </Section>
  );
}
