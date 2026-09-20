/**
 * Contact, calqué sur la page Contact du gabarit de référence :
 *   1. bloc clair : carte marine de coordonnées à gauche, formulaire à droite
 *   2. bloc marine : bureaux, photos aux angles coupés
 *   3. bloc clair : questions fréquentes par thème
 *   4. appel à l'action
 * Le pied de page est fourni par le gabarit de page.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ServiceGlyph } from "@/components/site/cards";
import { ContactForm } from "@/components/site/contact-form";
import { CtaBlock } from "@/components/site/cta";
import { Faq } from "@/components/site/interactive";
import { Heading, Hl, Inner, Lead, Panel, Pill, Section, SiteIcon } from "@/components/site/kit";
import { ImageFrame, Reveal } from "@/components/site/motion";
import { FAQ, IMG, OFFICES, type SiteImage } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Écrivez à l'équipe SIRA : candidats, recruteurs, centres de formation et partenaires de toute l'Afrique. Coordonnées, bureaux et questions fréquentes.",
};

interface Office {
  city: string;
  label: string;
  address: string;
  image: SiteImage;
}

/** Les bureaux physiques, complétés par l'équipe qui reçoit à distance. */
const PLACES: Office[] = [
  ...OFFICES,
  {
    city: "Partout en Afrique",
    label: "À distance",
    address: "Rendez-vous en visioconférence, sur demande",
    image: IMG.villeSoir,
  },
];

const CHANNELS: { label: string; value: string; href?: string; icon: keyof typeof SiteIcon }[] = [
  { label: "E-mail", value: "contact@sira.bf", href: "mailto:contact@sira.bf", icon: "Mail" },
  { label: "Téléphone", value: "+226 25 00 00 00", href: "tel:+22625000000", icon: "Phone" },
  { label: "Adresse du siège", value: "Avenue Kwame N'Krumah, Ouagadougou, Burkina Faso", icon: "Pin" },
];

function OfficeCard({ office }: { office: Office }) {
  return (
    <article className="group">
      <div className="relative">
        <ImageFrame
          to="down"
          curtain="var(--color-site-navy)"
          className="site-cut-tl aspect-[5/4] rounded-tr-[1rem] md:aspect-[2/2.1] border-x border-t border-site-border"
        >
          <Image
            src={office.image.src}
            alt={office.image.alt}
            fill
            sizes="(min-width: 992px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110"
          />
        </ImageFrame>
        {/* Filet or le long de l'angle coupé, que la bordure ne peut suivre. */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <line
            x1="16"
            y1="0"
            x2="0"
            y2="12"
            stroke="var(--color-site-border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="rounded-b-[1rem] border-x border-b-4 border-site-border bg-white p-5 text-site-ink md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="site-display text-[1.5rem] leading-tight">{office.city}</h3>
          <Pill>{office.label}</Pill>
        </div>
        <p className="mt-4 flex items-start gap-3 text-[0.9375rem] leading-snug text-site-ink/80">
          <span className="inline-flex shrink-0 rounded-[0.4rem] bg-site-soft p-1.5 text-site-navy">
            <SiteIcon.Pin size={16} />
          </span>
          <span className="pt-1">{office.address}</span>
        </p>
      </div>
    </article>
  );
}

export default function ContactPage() {
  return (
    <>
      {/* 1. Coordonnées et formulaire ------------------------------------- */}
      <Section className="pt-0">
        <Panel tone="light" pad={false} className="p-2 xs:p-3 md:p-4">
          <div className="grid gap-3 tab:grid-cols-2 tab:gap-10">
            <div className="site-on-dark flex flex-col justify-center rounded-[1.5rem] border border-site-border bg-site-navy px-6 py-14 xs:px-8 md:px-14 md:py-20">
              <Reveal dir="left">
                <Heading as="h1" size="h1" className="max-w-[30rem]">
                  Parlons de <Hl>votre projet</Hl>
                </Heading>
                <Lead className="mt-6 text-white/90">
                  Candidat, recruteur, centre de formation ou partenaire, où que vous soyez en Afrique : notre équipe
                  lit chaque message et vous répond dans les meilleurs délais.
                </Lead>

                <ul className="mt-10 flex flex-col gap-3">
                  {CHANNELS.map((c) => {
                    const Icon = SiteIcon[c.icon];
                    const body = (
                      <>
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.6rem] bg-white/10 text-site-gold">
                          <Icon size={20} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.875rem] font-semibold text-site-gold">{c.label}</span>
                          <span className="mt-0.5 block text-[1rem] text-white">{c.value}</span>
                        </span>
                      </>
                    );
                    return (
                      <li key={c.label}>
                        {c.href ? (
                          <a
                            href={c.href}
                            className="-mx-2 flex min-h-14 items-center gap-4 rounded-[0.75rem] px-2 py-1.5 transition-colors duration-300 hover:bg-white/10"
                          >
                            {body}
                          </a>
                        ) : (
                          <div className="-mx-2 flex min-h-14 items-center gap-4 px-2 py-1.5">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-10 border-t border-white/20 pt-6 text-[0.9375rem] leading-relaxed text-white/80">
                  Une question sur vos données personnelles ? Écrivez à{" "}
                  <a
                    href="mailto:donnees@sira.bf"
                    className="font-semibold text-site-gold underline underline-offset-4 hover:text-white"
                  >
                    donnees@sira.bf
                  </a>{" "}
                  ou consultez la{" "}
                  <Link
                    href="/confidentialite"
                    className="font-semibold text-white underline underline-offset-4 hover:text-site-gold"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </Reveal>
            </div>

            <div id="formulaire" className="scroll-mt-28 px-3 py-10 xs:px-5 md:px-8 md:py-16">
              <Reveal dir="right">
                <h2 className="site-display text-[1.75rem] leading-tight text-site-ink md:text-[2.25rem]">
                  Écrivez-<Hl>nous</Hl>
                </h2>
                <p className="mb-8 mt-3 max-w-[32rem] text-[1rem] leading-relaxed text-site-muted">
                  Précisez votre profil et le sujet de votre demande : votre message arrive directement à la bonne
                  personne.
                </p>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </Panel>
      </Section>

      {/* 2. Bureaux -------------------------------------------------------- */}
      <Section>
        <Panel tone="dark">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" className="max-w-[36rem]">
                Nos bureaux, <Hl>au plus près de vous</Hl>
              </Heading>
              <Lead className="mt-5 text-white/85">
                Notre siège est à Ouagadougou et notre antenne régionale à Bobo-Dioulasso. Pour les candidats,
                recruteurs et centres de formation du reste du continent, notre équipe vous reçoit en visioconférence.
              </Lead>
            </Reveal>
            <div className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-2 tab:grid-cols-3">
              {PLACES.map((office, i) => (
                <Reveal key={office.city} dir="up" delay={i * 120}>
                  <OfficeCard office={office} />
                </Reveal>
              ))}
            </div>
          </Inner>
        </Panel>
      </Section>

      {/* 3. Questions fréquentes ------------------------------------------ */}
      <Section id="faq" className="scroll-mt-24 md:scroll-mt-28">
        <Panel tone="light">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2">
                Questions <Hl>fréquentes</Hl>
              </Heading>
              <Lead tone="muted" className="mt-5">
                Les réponses aux questions que l&apos;on nous pose le plus souvent, classées par thème.
              </Lead>
            </Reveal>
            <Reveal dir="up" delay={120} className="mt-12">
              <Faq
                groups={FAQ}
                icons={FAQ.map((g) => (
                  <ServiceGlyph key={g.category} name={g.icon} />
                ))}
              />
            </Reveal>
            <Reveal dir="up" className="mt-10">
              <p className="text-[1rem] text-site-ink/80">
                Vous ne trouvez pas votre réponse ?{" "}
                <a
                  href="#formulaire"
                  className="inline-flex min-h-11 items-center gap-2 font-semibold text-site-navy underline decoration-site-border decoration-2 underline-offset-4 hover:decoration-site-navy"
                >
                  Posez-nous votre question
                  <SiteIcon.Arrow size={16} />
                </a>
              </p>
            </Reveal>
          </Inner>
        </Panel>
      </Section>

      {/* 4. Appel à l'action ---------------------------------------------- */}
      <CtaBlock
        title={
          <>
            Votre prochaine opportunité <Hl>commence ici</Hl>
          </>
        }
        text="Créez votre profil gratuitement et recevez les offres qui vous correspondent partout en Afrique, avec un score qui explique chaque recommandation."
        action={{ href: "/inscription", label: "Créer un compte" }}
        image={IMG.poigneeMain}
      />
    </>
  );
}
