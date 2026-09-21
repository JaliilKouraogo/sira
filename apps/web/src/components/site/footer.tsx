/**
 * Pied de page du site public, bloc clair arrondi comme dans le gabarit :
 * grand titre et lettre d'information, coordonnées, colonnes de liens,
 * logo et réseaux sociaux, puis mentions.
 */

import Link from "next/link";
import { SiraLogo } from "@/components/icons";
import { Hl, Heading, Panel, Section, SiteIcon, SocialLinks } from "./kit";
import { NewsletterForm } from "./newsletter";
import { Reveal } from "./motion";

const MAIN_PAGES = [
  { href: "/", label: "Accueil" },
  { href: "/emplois", label: "Emplois" },
  { href: "/stages", label: "Stages" },
  { href: "/formations", label: "Formations" },
  { href: "/recruteurs", label: "Recruteurs" },
];

const COMPANY_PAGES = [
  { href: "/a-propos", label: "À propos" },
  { href: "/conseils", label: "Conseils" },
  { href: "/contact", label: "Contact" },
  { href: "/demo", label: "Démonstration" },
];

const LEGAL_PAGES = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions" },
  { href: "/cookies", label: "Cookies" },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-[0.9375rem] font-semibold text-site-navy">{title}</h3>
      <ul className="mt-4 space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="site-link inline-flex min-h-9 items-center text-[0.9375rem] text-site-ink/85 hover:text-site-navy"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <Section as="footer" className="pb-3">
      <Panel tone="light" pad={false} className="px-8 pb-10 pt-20 md:px-16 md:pt-24">
        {/* Titre et lettre d'information */}
        <div className="grid gap-10 tab:grid-cols-[1.25fr_0.75fr] tab:gap-12">
          <Reveal dir="left">
            <Heading size="h2" className="max-w-[40rem]">
              Des solutions RH <Hl>pensées pour l&apos;Afrique</Hl>
            </Heading>
          </Reveal>
          <Reveal dir="right">
            <h3 className="site-display text-[1.5rem] text-site-ink">Recevez nos conseils emploi</h3>
            <p className="mb-4 mt-2 text-[0.9375rem] text-site-muted">
              Une lettre par mois : offres à la une, formations et conseils de candidature.
            </p>
            <NewsletterForm />
          </Reveal>
        </div>

        {/* Coordonnées et liens */}
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-[0.9375rem] font-semibold text-site-navy">Contact</h3>
            <ul className="mt-4 space-y-3 text-[0.9375rem] text-site-ink/85">
              <li>
                <a href="mailto:contact@sira.bf" className="site-link inline-flex min-h-9 items-center gap-3 hover:text-site-navy">
                  <SiteIcon.Mail className="shrink-0 text-site-navy" />
                  contact@sira.bf
                </a>
              </li>
              <li>
                <a href="tel:+22625000000" className="site-link inline-flex min-h-9 items-center gap-3 hover:text-site-navy">
                  <SiteIcon.Phone className="shrink-0 text-site-navy" />
                  +226 25 00 00 00
                </a>
              </li>
              <li className="flex gap-3">
                <SiteIcon.Pin className="mt-0.5 shrink-0 text-site-navy" />
                <span>
                  Avenue Kwame N&apos;Krumah
                  <br />
                  Ouagadougou, Burkina Faso
                </span>
              </li>
            </ul>
          </div>
          <Column title="Pages principales" links={MAIN_PAGES} />
          <Column title="SIRA" links={COMPANY_PAGES} />
          <Column title="Informations légales" links={LEGAL_PAGES} />
        </div>

        {/* Logo et réseaux */}
        <div className="mt-14 flex flex-col items-start justify-between gap-6 xs:flex-row xs:items-center">
          <Link href="/" aria-label="SIRA, retour à l'accueil">
            <SiraLogo size={36} withTagline />
          </Link>
          <SocialLinks className="-ml-2.5 xs:ml-0" />
        </div>

        <div className="mt-8 border-t border-site-line pt-6 text-center text-[0.875rem] text-site-muted">
          © 2026 SIRA, Ouagadougou. Les scores affichés sur la plateforme sont des estimations algorithmiques et ne
          garantissent aucun recrutement.
        </div>
      </Panel>
    </Section>
  );
}
