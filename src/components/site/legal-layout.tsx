/**
 * Gabarit des pages légales du site public.
 *
 * 1. En-tête clair centré : surtitre, titre, date de mise à jour, chapeau et
 *    liens vers les autres documents légaux.
 * 2. Corps dans un bloc clair : sommaire collant à gauche sur grand écran
 *    (repliable sur mobile) et sections numérotées dans une carte blanche.
 *    Les tableaux défilent dans leur propre conteneur, jamais la page.
 * 3. Appel à l'action vers la page Contact.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { IMG } from "@/data/site-content";
import { CtaBlock } from "./cta";
import { Eyebrow, Heading, Hl, Inner, Lead, Panel, Section, SiteIcon, cn } from "./kit";
import { LegalScrollRegion } from "./legal-scroll-region";
import { LegalToc } from "./legal-toc";
import { Reveal } from "./motion";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export type LegalDoc = "confidentialite" | "conditions" | "cookies";

const LEGAL_DOCS: { key: LegalDoc; href: string; label: string }[] = [
  { key: "confidentialite", href: "/confidentialite", label: "Confidentialité" },
  { key: "conditions", href: "/conditions", label: "Conditions d'utilisation" },
  { key: "cookies", href: "/cookies", label: "Cookies" },
];

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** « 1er septembre 2026 » à partir de « 2026-09-01 », sans dépendre du fuseau. */
export function formatLegalDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d === 1 ? "1er" : d} ${MONTHS[m - 1]} ${y}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function LegalLayout({
  doc,
  title,
  lead,
  updatedAt,
  sections,
  footer,
}: {
  doc: LegalDoc;
  /** Titre de la page, avec sa partie mise en valeur. */
  title: ReactNode;
  lead: string;
  updatedAt: string;
  sections: LegalSection[];
  /** Encadré de fin de document : un titre et un court texte avec liens. */
  footer?: { title: string; body: ReactNode };
}) {
  return (
    <>
      {/* 1. En-tête ------------------------------------------------------- */}
      <Section className="pt-0">
        <Panel tone="light" className="text-center">
          <Inner>
            <Reveal dir="up">
              <Eyebrow className="text-site-navy">Informations légales</Eyebrow>
              <Heading as="h1" size="h1" align="center" className="mx-auto max-w-[46rem]">
                {title}
              </Heading>
              <p className="mt-5 text-[0.9375rem] text-site-muted">
                <SiteIcon.Clock size={16} className="mr-2 inline-block align-[-0.15em] text-site-navy" />
                Dernière mise à jour le{" "}
                <time dateTime={updatedAt} className="whitespace-nowrap font-semibold text-site-ink">
                  {formatLegalDate(updatedAt)}
                </time>
              </p>
              <Lead align="center" tone="muted" className="mt-6 max-w-[40rem]">
                {lead}
              </Lead>
            </Reveal>
            <Reveal dir="up" delay={120}>
              <nav aria-label="Documents légaux" className="mt-10">
                <ul className="flex flex-wrap justify-center gap-2">
                  {LEGAL_DOCS.map((d) => {
                    const current = d.key === doc;
                    return (
                      <li key={d.key}>
                        <Link
                          href={d.href}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "inline-flex min-h-11 items-center rounded-full border px-5 text-[0.9375rem] font-medium transition-colors duration-300",
                            current
                              ? "border-site-navy bg-site-navy text-white"
                              : "border-site-border bg-white text-site-navy hover:bg-site-soft",
                          )}
                        >
                          {d.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </Reveal>
          </Inner>
        </Panel>
      </Section>

      {/* 2. Corps --------------------------------------------------------- */}
      <Section>
        {/* overflow-visible : un bloc qui masque son débordement empêcherait le
            sommaire de rester collé pendant le défilement. */}
        <Panel
          tone="light"
          pad={false}
          className="overflow-visible! px-3 py-10 xs:px-6 md:px-12 md:py-20 tab:px-10 xl:px-16"
        >
          <Inner className="grid items-start gap-6 tab:grid-cols-[15rem_minmax(0,1fr)] tab:gap-8 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-12">
            <div className="min-w-0 tab:sticky tab:top-28">
              <LegalToc items={sections.map(({ id, title: t }) => ({ id, title: t }))} />
            </div>

            <div className="min-w-0 rounded-[1.5rem] border border-b-4 border-site-border bg-white px-5 py-8 xs:px-7 md:px-12 md:py-14 tab:px-9 xl:px-12">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-titre`}
                  className="scroll-mt-28 border-t border-site-line py-10 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="site-display inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.6rem] bg-site-navy text-[1rem] text-site-gold"
                    >
                      {pad(i + 1)}
                    </span>
                    <h2
                      id={`${s.id}-titre`}
                      className="site-display pt-1 text-[1.4rem] leading-tight text-site-ink md:text-[1.75rem]"
                    >
                      <span className="sr-only">{i + 1}. </span>
                      {s.title}
                    </h2>
                  </div>
                  <div
                    className={cn(
                      "mt-5 space-y-4 text-[1rem] leading-[1.75] text-site-ink/80 md:pl-[3.75rem] tab:pl-0 xl:pl-[3.75rem]",
                      "[&_strong]:font-semibold [&_strong]:text-site-ink",
                      "[&_a]:font-semibold [&_a]:text-site-navy [&_a]:underline [&_a]:decoration-site-border [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a:hover]:decoration-site-navy",
                      "[&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_li]:pl-1 [&_li]:marker:text-site-gold",
                    )}
                  >
                    {s.body}
                  </div>
                </section>
              ))}

              {footer ? (
                <aside
                  aria-labelledby="legal-footer-titre"
                  className="site-on-dark mt-4 rounded-[1rem] border border-site-border bg-site-navy p-6 md:ml-[3.75rem] md:p-8 tab:ml-0 xl:ml-[3.75rem]"
                >
                  <h2 id="legal-footer-titre" className="site-display text-[1.375rem] leading-tight">
                    {footer.title}
                  </h2>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/85 [&_a]:font-semibold [&_a]:text-site-gold [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-white">
                    {footer.body}
                  </p>
                </aside>
              ) : null}
            </div>
          </Inner>
        </Panel>
      </Section>

      {/* 3. Appel à l'action ---------------------------------------------- */}
      <CtaBlock
        title={
          <>
            Un doute, une demande&nbsp;? <Hl>Parlons-en</Hl>
          </>
        }
        text="Données personnelles, compte, publication d'offres ou partenariat : notre équipe répond à chaque demande, où que vous soyez en Afrique."
        action={{ href: "/contact", label: "Nous contacter" }}
        image={IMG.accompagnement}
      />
    </>
  );
}

/**
 * Tableau des pages légales, dans un conteneur qui défile horizontalement
 * sur petit écran. Le conteneur devient focalisable pour défiler au clavier
 * seulement quand le tableau déborde.
 */
export function LegalTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div>
      <LegalScrollRegion
        label={caption}
        className="overflow-x-auto rounded-[1rem] border border-site-border bg-white"
      >
        <table className="w-full min-w-[33rem] border-collapse text-left text-[0.9375rem] leading-snug">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-site-navy text-white">
              {head.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[0.8125rem] font-semibold uppercase tracking-[0.08em]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("|")} className="border-t border-site-line even:bg-site-light">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={`${row[0]}-${i}`} scope="row" className="px-4 py-3 font-semibold text-site-ink">
                      {cell}
                    </th>
                  ) : (
                    <td key={`${row[0]}-${i}`} className="px-4 py-3 text-site-ink/80">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </LegalScrollRegion>
      <p className="mt-2 flex items-center gap-2 text-[0.8125rem] text-site-muted tab:hidden">
        <SiteIcon.Arrow size={14} className="shrink-0 text-site-navy" />
        Faites défiler le tableau vers la droite pour voir toutes les colonnes.
      </p>
    </div>
  );
}
