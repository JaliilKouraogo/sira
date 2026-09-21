/**
 * 404 globale, dans le style du site public.
 *
 * Elle est rendue hors du gabarit public : pas de barre de navigation ni de
 * pied de page. Une barre simplifiée porte donc le logo et un lien de retour,
 * et les polices du site sont chargées ici aussi.
 */

import { Inter, Instrument_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { SiraLogo } from "@/components/icons";
import { Heading, Hl, Lead, Section, SiteButtonLink, SiteIcon } from "@/components/site/kit";
import { ImageFrame, Parallax, Reveal } from "@/components/site/motion";
import { IMG } from "@/data/site-content";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const SUGGESTIONS = [
  { href: "/stages", label: "Stages" },
  { href: "/formations", label: "Formations" },
  { href: "/conseils", label: "Conseils" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <div className={`${inter.variable} ${instrument.variable} site-root flex min-h-screen flex-col`}>
      <header className="px-2 pt-2 md:px-3 md:pt-3">
        <div className="flex min-h-16 items-center justify-between gap-4 rounded-[1.5rem] border border-site-border bg-site-light px-5 md:min-h-[4.5rem] md:px-12">
          <Link href="/" aria-label="SIRA, retour à l'accueil" className="shrink-0">
            <SiraLogo size={30} />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-[0.5rem] px-2 text-[0.9375rem] font-semibold text-site-navy transition-colors hover:bg-site-soft xs:px-3"
          >
            <SiteIcon.Arrow size={18} className="rotate-180" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main id="contenu" className="flex flex-1 flex-col">
        <Section className="flex flex-1 flex-col">
          <div className="grid flex-1 gap-3 tab:grid-cols-2">
            <div className="site-on-dark flex flex-col justify-center rounded-[1.5rem] border border-site-border bg-site-navy px-8 py-16 md:px-16 md:py-24 tab:min-h-[36rem]">
              <Reveal dir="left">
                <p className="site-display text-[5.5rem] leading-none text-site-gold md:text-[8rem]" aria-hidden>
                  404
                </p>
                <p className="sr-only">Erreur 404</p>
                <Heading as="h1" size="h1" className="mt-6 max-w-[32rem]">
                  Ce chemin <Hl>ne mène nulle part</Hl>
                </Heading>
                <Lead className="mt-6 text-white/90">
                  Le lien est peut-être obsolète, ou la page a été déplacée. Reprenez votre chemin depuis l&apos;accueil
                  ou la liste des opportunités.
                </Lead>
                <div className="mt-9 flex flex-wrap gap-3">
                  <SiteButtonLink href="/" variant="gold" size="lg">
                    Retour à l&apos;accueil
                  </SiteButtonLink>
                  <SiteButtonLink href="/emplois" variant="outline-light" size="lg">
                    Voir les offres
                  </SiteButtonLink>
                </div>

                <nav aria-label="Autres pages" className="mt-10 border-t border-white/20 pt-6">
                  <ul className="flex flex-wrap gap-x-6 gap-y-1">
                    {SUGGESTIONS.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="site-link inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-white/85 hover:text-site-gold"
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/demo"
                        className="site-link inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-white/85 hover:text-site-gold"
                      >
                        Plan du site de démonstration
                      </Link>
                    </li>
                  </ul>
                </nav>
              </Reveal>
            </div>

            <ImageFrame
              to="left"
              curtain="var(--color-site-canvas)"
              className="hidden min-h-[24rem] rounded-[1.5rem] border border-site-border md:block tab:min-h-0"
            >
              {/* Image décorative : cadrée sur la savane, le camion reste hors champ. */}
              <Parallax strength={18}>
                <Image
                  src={IMG.transport.src}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 992px) 50vw, 100vw"
                  className="object-cover object-right"
                />
              </Parallax>
            </ImageFrame>
          </div>
        </Section>
      </main>

      <footer className="px-4 pb-6 pt-2 text-center text-[0.875rem] text-site-muted">
        © 2026 SIRA, plateforme panafricaine de mise en relation entre talents, recruteurs et formateurs.
      </footer>
    </div>
  );
}
