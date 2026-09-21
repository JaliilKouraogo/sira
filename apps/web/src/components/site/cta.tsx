/**
 * Bloc d'appel à l'action placé avant le pied de page, sur chaque page du
 * site : un bloc marine à gauche, une photo à droite avec rideau et
 * parallaxe (−30 % à +25 % dans le modèle).
 */

import Image from "next/image";
import type { ReactNode } from "react";
import { asset } from "@/lib/base-path";
import { Heading, Lead, Section, SiteButtonLink } from "./kit";
import { ImageFrame, Parallax, Reveal } from "./motion";

export function CtaBlock({
  title,
  text,
  action = { href: "/contact", label: "Nous contacter" },
  image = { src: asset("/images/scenes/salle-reunion.jpg"), alt: "Réunion de travail entre professionnelles dans une salle lumineuse" },
}: {
  title: ReactNode;
  text: string;
  action?: { href: string; label: string };
  image?: { src: string; alt: string };
}) {
  return (
    <Section>
      <div className="grid gap-3 tab:grid-cols-2">
        <div className="flex flex-col justify-center rounded-[1.5rem] border border-site-border bg-site-navy px-8 py-20 site-on-dark md:px-16 md:py-28">
          <Reveal dir="left">
            <Heading size="h2">{title}</Heading>
            <Lead className="mt-5 text-white/85">{text}</Lead>
            <SiteButtonLink href={action.href} variant="gold" size="lg" className="mt-8">
              {action.label}
            </SiteButtonLink>
          </Reveal>
        </div>
        <ImageFrame
          to="right"
          className="min-h-[20rem] rounded-[1.5rem] border border-site-border md:min-h-[28rem]"
          curtain="var(--color-site-canvas)"
        >
          <Parallax strength={16}>
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 992px) 50vw, 100vw" className="object-cover" />
          </Parallax>
        </ImageFrame>
      </div>
    </Section>
  );
}
