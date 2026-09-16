/**
 * À propos.
 *
 * Structure calquée sur la page « About » du gabarit de référence :
 *   1. en-tête centré et scène d'images qui s'agrandit au défilement
 *   2. « Apprenez à nous connaître » : texte, objectifs chiffrés et image
 *   3. le sens du nom, la mission, la vision et la conviction
 *   4. #ia : calcul du score de compatibilité, puis garde-fous
 *   5. « Pour qui nous travaillons » : personas génériques
 *   6. galerie « Des moments qui comptent »
 *   7. #partenaires, #contact, puis appel à l'action
 *
 * Exigences du cahier des charges conservées : le score est une estimation
 * algorithmique qui ne garantit pas le recrutement, l'IA classe mais ne décide
 * jamais, rien n'est envoyé sans validation du candidat, refuser le marketing
 * n'entraîne aucune restriction.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconWhatsApp, SiraMark } from "@/components/icons";
import { AproposHero } from "@/components/site/apropos-hero";
import { InitialsAvatar } from "@/components/site/cards";
import { CtaBlock } from "@/components/site/cta";
import {
  Eyebrow,
  Heading,
  Hl,
  Inner,
  Lead,
  Marquee,
  Panel,
  Section,
  SiteButtonLink,
  SiteIcon,
  cn,
} from "@/components/site/kit";
import { ImageFrame, Reveal } from "@/components/site/motion";
import { HOME_GOALS, IMG, PORTRAITS, type SiteImage } from "@/data/site-content";
import { getOrganizations } from "@/data/queries";
import {
  BLOCKING_CRITERIA_CAP,
  ORGANIZATION_TYPE_LABEL,
  SCORE_COMPONENT_LABEL,
  SCORE_DISCLAIMER,
  SCORE_WEIGHTS,
  type ScoreComponent,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "À propos de SIRA | Notre mission et notre IA",
  description:
    "SIRA signifie le chemin en dioula et en bambara. Plateforme panafricaine de mise en relation entre talents, recruteurs et formateurs : notre mission, le calcul du score de compatibilité, nos garde-fous et nos partenaires.",
};

// ---------------------------------------------------------------------------
// Pictogrammes propres à la page
// ---------------------------------------------------------------------------

type GlyphName = "route" | "horizon" | "compass" | "pen" | "hand" | "scale" | "equal";

function Glyph({ name, size = 22 }: { name: GlyphName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "route":
      return (
        <svg {...common}>
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" />
        </svg>
      );
    case "horizon":
      return (
        <svg {...common}>
          <path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 4v3M4.9 8.9l2 2M19.1 8.9l-2 2" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
          <path d="m13.5 6.5 4 4" />
        </svg>
      );
    case "hand":
      return (
        <svg {...common}>
          <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 10V4.5a1.5 1.5 0 0 1 3 0V11M15 10.5V6.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.6-2.2L3 15.5a1.6 1.6 0 0 1 2.4-2.1L9 16V11" />
        </svg>
      );
    case "scale":
      return (
        <svg {...common}>
          <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z" />
        </svg>
      );
    case "equal":
      return (
        <svg {...common}>
          <circle cx="7.5" cy="7" r="2.5" />
          <circle cx="16.5" cy="7" r="2.5" />
          <path d="M3 20a4.5 4.5 0 0 1 9 0M12 20a4.5 4.5 0 0 1 9 0" />
        </svg>
      );
  }
}

/** Pastille d'icône des cartes, comme sur les cartes de service. */
function GlyphChip({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "gold" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 self-start rounded-[0.4rem] p-2 text-site-navy",
        tone === "gold" ? "bg-site-gold" : "bg-site-soft",
      )}
    >
      {children}
    </span>
  );
}

/** Carte blanche à filet or et bordure basse épaissie. */
const CARD = "rounded-[1rem] border border-b-4 border-site-border bg-white";

// ---------------------------------------------------------------------------
// Contenu
// ---------------------------------------------------------------------------

const PILLARS: { title: string; text: string; glyph: GlyphName }[] = [
  {
    title: "Notre mission",
    text: "Donner à chaque candidat les moyens de comprendre où il en est, et à chaque recruteur les moyens de traiter ses candidatures sans y passer ses nuits. La technologie sert cet objectif ; elle ne le remplace pas.",
    glyph: "route",
  },
  {
    title: "Notre vision",
    text: "Une Afrique où chaque talent trouve le chemin de l'opportunité qui lui correspond, quels que soient son pays, sa ville ou son réseau : un marché de l'emploi plus lisible, plus juste et ouvert à tous.",
    glyph: "horizon",
  },
  {
    title: "Notre conviction",
    text: "Un pourcentage sans explication ne sert à rien. Un score n'a de valeur que s'il dit ce qui manque et ce qu'il faut faire ensuite. C'est pourquoi chaque estimation est détaillée, datée et accompagnée de sa part d'incertitude.",
    glyph: "compass",
  },
];

const COMPONENT_DETAIL: Record<ScoreComponent, string> = {
  competences:
    "Compétences requises par l'offre retrouvées dans le profil et le CV. C'est la composante la plus lourde, parce que c'est la première chose qu'un recruteur vérifie.",
  experience:
    "Années d'expérience et pertinence des postes occupés au regard de l'expérience demandée. Dépasser le seuil n'augmente pas indéfiniment le score.",
  formation:
    "Niveau d'études et spécialité par rapport au niveau attendu. Une équivalence par l'expérience est prise en compte quand l'offre l'autorise.",
  localisation:
    "Ville du poste, zones de recherche déclarées et mobilité géographique. Une offre en télétravail neutralise en grande partie cette composante.",
  langues: "Langues demandées par l'offre et niveau déclaré dans le profil, sur l'échelle du référentiel.",
  disponibilite:
    "Disponibilité annoncée face à la date de prise de poste souhaitée. Composante volontairement légère, car elle se négocie.",
};

const GUARDRAILS: { title: string; text: string; glyph: GlyphName }[] = [
  {
    title: "Jamais d'invention de faits",
    text: "Un CV adapté ou une lettre générée ne contient que des éléments présents dans votre profil ou votre CV d'origine. SIRA reformule, hiérarchise et met en valeur, mais n'ajoute ni diplôme, ni expérience, ni compétence que vous n'avez pas déclarés.",
    glyph: "pen",
  },
  {
    title: "Validation humaine avant tout envoi",
    text: "Aucun document, message ou candidature n'est transmis sans que vous l'ayez relu et validé. L'état « Générée » n'est pas l'état « Envoyée », et le passage de l'un à l'autre est toujours une action volontaire.",
    glyph: "hand",
  },
  {
    title: "Aucune décision de recrutement automatisée",
    text: "Le score classe et explique, il ne refuse pas. Aucun candidat n'est écarté par l'algorithme : un recruteur voit toutes les candidatures reçues et décide seul de la suite.",
    glyph: "scale",
  },
  {
    title: "Aucun critère discriminatoire",
    text: "L'âge, le sexe, l'origine, l'appartenance ethnique ou religieuse, la situation familiale, l'état de santé et les opinions politiques ou syndicales n'entrent dans aucun calcul, et ne peuvent pas être utilisés comme critère de recherche par un recruteur.",
    glyph: "equal",
  },
];

/**
 * Personas génériques. Les portraits illustrent un profil type ; ils ne sont
 * associés à aucun nom, aucune fonction réelle et aucune citation.
 */
const PERSONAS: { label: string; text: string; href: string; cta: string; portrait: SiteImage }[] = [
  {
    label: "Jeunes diplômés",
    text: "Pour décrocher un premier emploi avec un profil clair, des offres adaptées et un score qui montre ce qu'il reste à acquérir.",
    href: "/emplois",
    cta: "Voir les offres d'emploi",
    portrait: PORTRAITS[5],
  },
  {
    label: "Étudiants en quête de stage",
    text: "Pour trouver un stage auprès d'organisations vérifiées et préparer une candidature solide, même sans expérience.",
    href: "/stages",
    cta: "Voir les offres de stage",
    portrait: PORTRAITS[4],
  },
  {
    label: "Professionnels en reconversion",
    text: "Pour valoriser un parcours réel dans un nouveau métier et repérer les formations qui comblent l'écart.",
    href: "/formations",
    cta: "Voir les formations",
    portrait: PORTRAITS[1],
  },
  {
    label: "Profils expérimentés",
    text: "Pour cibler les postes à la hauteur de leur expérience et recevoir les offres compatibles sans passer leurs soirées à chercher.",
    href: "/emplois",
    cta: "Voir les offres d'emploi",
    portrait: PORTRAITS[2],
  },
  {
    label: "Recruteurs et équipes RH",
    text: "Pour publier des offres, recevoir des candidatures structurées et garder la décision, avec un classement suggéré et expliqué.",
    href: "/recruteurs",
    cta: "Découvrir l'espace recruteurs",
    portrait: PORTRAITS[3],
  },
  {
    label: "Formateurs et centres de formation",
    text: "Pour présenter leurs formations aux candidats à qui il manque précisément les compétences qu'elles couvrent.",
    href: "/formations",
    cta: "Voir le catalogue de formations",
    portrait: PORTRAITS[0],
  },
];

/**
 * Mosaïque de la galerie. Sur grand écran, placement explicite sur une grille
 * de 9 colonnes et 24 rangées, d'après la composition du gabarit ; en
 * dessous, grille de 4 puis 2 colonnes.
 */
const GALLERY: { image: SiteImage; className: string }[] = [
  {
    image: IMG.logistique,
    className: "row-span-2 tab:col-span-2 tab:col-start-1 tab:row-span-21 tab:row-start-2",
  },
  {
    image: IMG.transport,
    className: "md:col-span-2 tab:col-span-3 tab:col-start-3 tab:row-span-10 tab:row-start-1",
  },
  {
    image: IMG.agriculture,
    className: "tab:col-span-2 tab:col-start-6 tab:row-span-10 tab:row-start-4",
  },
  {
    image: IMG.developpement,
    className: "col-span-2 md:col-span-1 tab:col-span-2 tab:col-start-8 tab:row-span-21 tab:row-start-3",
  },
  {
    image: IMG.solaire,
    className: "tab:col-span-2 tab:col-start-3 tab:row-span-10 tab:row-start-12",
  },
  {
    image: IMG.salleReunion,
    className: "tab:col-span-3 tab:col-start-5 tab:row-span-10 tab:row-start-15",
  },
];

/** Glyphe neutre devant le nom d'une organisation, dans le bandeau. */
function OrgGlyph({ index }: { index: number }) {
  const shapes = [
    <circle key="c" cx="12" cy="12" r="8" />,
    <rect key="r" x="4" y="4" width="16" height="16" rx="3" />,
    <path key="t" d="M12 4 20 19H4Z" />,
    <path key="d" d="M12 3 21 12 12 21 3 12Z" />,
  ];
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
      {shapes[index % shapes.length]}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AProposPage() {
  const components = Object.entries(SCORE_WEIGHTS) as [ScoreComponent, number][];
  const organizations = getOrganizations();
  const partners = organizations.filter((o) => o.isPartner);
  const others = organizations.filter((o) => !o.isPartner);
  const goals = [HOME_GOALS[0], HOME_GOALS[3]];

  return (
    <>
      {/* 1. En-tête ---------------------------------------------------------- */}
      <AproposHero />

      {/* 2. Apprenez à nous connaître --------------------------------------- */}
      <Section>
        <Panel tone="light">
          <Inner className="grid items-center gap-14 tab:grid-cols-2 tab:gap-16">
            <Reveal dir="left">
              <Heading size="h2">
                Apprenez à <Hl>nous connaître</Hl>
              </Heading>
              <Lead tone="muted" className="mt-5">
                SIRA est une plateforme panafricaine qui met en relation les talents, les recruteurs et les formateurs.
                Nous aidons chaque candidat à comprendre où il en est, chaque recruteur à traiter ses candidatures
                avec méthode, et chaque centre de formation à rejoindre ceux qui ont besoin de lui.
              </Lead>

              <div className="mt-9 grid gap-4 xs:grid-cols-2 xs:gap-6">
                {goals.map((g, i) => (
                  <Reveal key={g.label} dir="up" delay={i * 120}>
                    <div className="h-full rounded-[0.75rem] border border-site-border bg-white px-7 py-6">
                      <p className="site-display text-[2.5rem] leading-none text-site-navy">{g.value}</p>
                      <p className="mt-2 text-[0.9375rem] text-site-muted">{g.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <p className="mt-4 text-[0.8125rem] leading-relaxed text-site-muted">
                Objectifs de développement pour nos premières années d&apos;exploitation, et non des résultats atteints.
              </p>

              <SiteButtonLink href="/emplois" variant="navy" className="mt-8">
                Découvrir les offres
              </SiteButtonLink>
            </Reveal>

            <Reveal dir="right">
              <div className="relative mx-auto max-w-[36rem] pl-4 pt-4 md:pl-8 md:pt-8">
                <ImageFrame
                  to="right"
                  curtain="var(--color-site-light)"
                  className="site-cut-tl-br aspect-square rounded-[1rem]"
                >
                  <Image
                    src={IMG.reunionEquipe.src}
                    alt={IMG.reunionEquipe.alt}
                    fill
                    sizes="(min-width: 992px) 40vw, 90vw"
                    className="object-cover"
                  />
                </ImageFrame>
                <span
                  aria-hidden
                  className="absolute left-0 top-0 inline-flex h-16 w-16 items-center justify-center rounded-[0.75rem] border border-site-border bg-site-navy shadow-[0_0_0_6px_var(--color-site-light)] md:h-20 md:w-20"
                >
                  <SiraMark height={38} color="var(--color-site-gold)" />
                </span>
              </div>
            </Reveal>
          </Inner>
        </Panel>
      </Section>

      {/* 3. Le sens du nom, mission, vision --------------------------------- */}
      <Section>
        <Panel tone="dark">
          <Inner>
            <div className="grid items-center gap-12 tab:grid-cols-[1.1fr_0.9fr] tab:gap-16">
              <Reveal dir="left">
                <Eyebrow className="text-site-gold opacity-100">Pourquoi « SIRA »</Eyebrow>
                <Heading size="h2">
                  Un nom qui montre <Hl>la voie</Hl>
                </Heading>
                <p className="mt-6 max-w-[36rem] text-[1rem] leading-relaxed text-white/90">
                  En dioula comme en bambara, <strong className="font-semibold text-white">sira</strong> signifie le
                  chemin, la route, la voie. Le mot dit exactement ce que nous voulons faire : non pas promettre un
                  emploi, mais montrer le trajet qui y mène, étape par étape, et signaler les obstacles avant
                  qu&apos;ils ne fassent perdre du temps.
                </p>
                <p className="mt-4 max-w-[36rem] text-[1rem] leading-relaxed text-white/90">
                  C&apos;est un nom venu d&apos;Afrique de l&apos;Ouest, compris dans plusieurs pays de la région et
                  qui se prononce sans effort en français. Il porte une idée qui vaut pour tout le continent : chaque
                  parcours professionnel est un chemin, et chacun mérite d&apos;être éclairé. Notre signature en
                  découle : <em className="text-site-gold">le chemin vers l&apos;opportunité</em>.
                </p>
              </Reveal>

              <Reveal dir="right">
                <figure className="rounded-[1.5rem] border border-site-border bg-site-navy-deep p-8 md:p-10">
                  <p className="site-display text-[4rem] leading-none text-site-gold md:text-[5rem]">
                    <span aria-hidden>si·ra</span>
                    <span className="sr-only">sira</span>
                  </p>
                  <p className="mt-3 text-[0.9375rem] italic text-white/70">nom · dioula, bambara</p>
                  <ol className="mt-7 divide-y divide-white/15 border-t border-white/15">
                    {["le chemin", "la route", "la voie"].map((sense, i) => (
                      <li key={sense} className="flex items-baseline gap-5 py-4">
                        <span className="w-6 text-[0.875rem] font-semibold tabular-nums text-site-gold">{i + 1}.</span>
                        <span className="site-display text-[1.625rem] leading-tight text-white md:text-[1.875rem]">
                          {sense}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <figcaption className="mt-5 flex items-center gap-3 text-[0.875rem] text-white/75">
                    <SiraMark height={22} color="var(--color-site-gold)" />
                    SIRA, le chemin vers l&apos;opportunité
                  </figcaption>
                </figure>
              </Reveal>
            </div>

            <div className="mt-16 grid gap-6 tab:mt-20 tab:grid-cols-3">
              {PILLARS.map((p, i) => (
                <Reveal key={p.title} dir="up" delay={i * 120}>
                  <article className={cn(CARD, "flex h-full flex-col p-6 text-site-ink md:p-7")}>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="site-display text-[1.5rem] leading-tight text-site-navy md:text-[1.625rem]">
                        {p.title}
                      </h3>
                      <GlyphChip>
                        <Glyph name={p.glyph} />
                      </GlyphChip>
                    </div>
                    <p className="mt-5 text-[0.9375rem] leading-relaxed text-site-ink/80">{p.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </Inner>
        </Panel>
      </Section>

      {/* 4. L'IA : score et garde-fous --------------------------------------- */}
      <div id="ia" className="scroll-mt-24">
        <Section>
          <Panel tone="light">
            <Inner>
              <Reveal dir="up">
                <Eyebrow className="text-center text-site-muted opacity-100">Notre intelligence artificielle</Eyebrow>
                <Heading size="h2" align="center" className="mx-auto max-w-[44rem]">
                  Comment le score de compatibilité <Hl>est calculé</Hl>
                </Heading>
                <Lead align="center" tone="muted" className="mt-5 max-w-[40rem]">
                  Le score compare votre profil aux exigences de l&apos;offre sur six composantes, chacune pondérée. La
                  note finale est la moyenne pondérée de ces six notes, ramenée sur cent. Les poids sont les mêmes pour
                  tout le monde et sont publiés ici.
                </Lead>
              </Reveal>

              <div className="mt-14 grid items-start gap-6 tab:grid-cols-[1.2fr_0.8fr] tab:gap-8">
                <Reveal dir="left">
                  <div className={cn(CARD, "p-6 md:p-9")}>
                    <h3 className="site-display text-[1.5rem] leading-tight text-site-ink md:text-[1.75rem]">
                      Six composantes, <Hl>des poids publics</Hl>
                    </h3>

                    {/* Répartition des cent points, en une seule barre. */}
                    <div className="mt-6 flex h-3 overflow-hidden rounded-full" aria-hidden>
                      {components.map(([key, weight], i) => (
                        <span
                          key={key}
                          className={cn("h-full", i > 0 && "border-l-2 border-white")}
                          style={{
                            width: `${weight * 100}%`,
                            backgroundColor: i === 0 ? "var(--color-site-gold)" : "var(--color-site-navy)",
                            opacity: i === 0 ? 1 : 1 - i * 0.13,
                          }}
                        />
                      ))}
                    </div>

                    <ul className="mt-7 divide-y divide-site-line border-t border-site-line">
                      {components.map(([key, weight]) => (
                        <li key={key} className="py-5">
                          <div className="flex items-baseline justify-between gap-4">
                            <h4 className="text-[1.0625rem] font-semibold text-site-ink">{SCORE_COMPONENT_LABEL[key]}</h4>
                            <span className="site-display text-[1.5rem] leading-none tabular-nums text-site-navy">
                              {Math.round(weight * 100)} %
                            </span>
                          </div>
                          <div
                            className="mt-3 h-1.5 overflow-hidden rounded-full bg-site-soft"
                            role="img"
                            aria-label={`Poids de la composante ${SCORE_COMPONENT_LABEL[key]} : ${Math.round(weight * 100)} % de la note`}
                          >
                            <div className="h-full rounded-full bg-site-navy" style={{ width: `${weight * 100}%` }} />
                          </div>
                          <p className="mt-3 text-[0.9375rem] leading-relaxed text-site-muted">{COMPONENT_DETAIL[key]}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>

                <div className="grid gap-6">
                  <Reveal dir="right">
                    <div className="rounded-[1rem] border border-b-4 border-site-border bg-site-navy p-6 site-on-dark md:p-8">
                      <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-white/75">
                        Critères indispensables
                      </p>
                      <p className="mt-4 flex items-baseline gap-3">
                        <span className="site-display text-[4.5rem] leading-none text-site-gold md:text-[5rem]">
                          {BLOCKING_CRITERIA_CAP}
                        </span>
                        <span className="text-[0.9375rem] text-white/80">sur 100 au maximum</span>
                      </p>
                      <h3 className="site-display mt-6 text-[1.4rem] leading-tight md:text-[1.5rem]">
                        Le plafond des critères indispensables
                      </h3>
                      <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/85">
                        Certaines offres comportent des critères sans lesquels la candidature n&apos;a pas de sens : un
                        permis, une habilitation, un diplôme réglementé, une langue de travail. Si l&apos;un de ces
                        critères n&apos;est pas satisfait, le score est plafonné à {BLOCKING_CRITERIA_CAP}, même si
                        toutes les autres composantes sont excellentes. Le critère manquant est alors affiché en clair,
                        avec la marche à suivre pour le combler.
                      </p>
                    </div>
                  </Reveal>

                  <Reveal dir="right" delay={120}>
                    <div className={cn(CARD, "p-6 md:p-8")}>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="site-display text-[1.4rem] leading-tight text-site-navy md:text-[1.5rem]">
                          Une estimation, pas une promesse
                        </h3>
                        <GlyphChip>
                          <Glyph name="compass" />
                        </GlyphChip>
                      </div>
                      <p className="mt-4 text-[0.9375rem] font-semibold leading-relaxed text-site-ink">
                        {SCORE_DISCLAIMER}
                      </p>
                      <p className="mt-3 text-[0.9375rem] leading-relaxed text-site-muted">
                        Le score est recalculé quand votre profil change ou quand l&apos;offre est modifiée. Une
                        candidature déjà envoyée conserve le score figé au moment de l&apos;envoi, pour que
                        l&apos;historique reste fidèle.
                      </p>
                    </div>
                  </Reveal>
                </div>
              </div>
            </Inner>
          </Panel>
        </Section>

        <Section>
          <Panel tone="dark">
            <Inner>
              <div className="grid items-end gap-6 tab:grid-cols-2 tab:gap-16">
                <Reveal dir="left">
                  <Eyebrow className="text-site-gold opacity-100">Nos engagements</Eyebrow>
                  <Heading size="h2">
                    Nos <Hl>garde-fous</Hl>
                  </Heading>
                </Reveal>
                <Reveal dir="right">
                  <Lead className="text-white/85">
                    Ces quatre règles ne sont pas des options de configuration. Elles sont inscrites dans le
                    fonctionnement du produit et s&apos;appliquent à tous les comptes, quel que soit l&apos;abonnement.
                  </Lead>
                </Reveal>
              </div>

              <div className="mt-14 grid gap-6 md:grid-cols-2">
                {GUARDRAILS.map((g, i) => (
                  <Reveal key={g.title} dir="up" delay={(i % 2) * 120}>
                    <article className={cn(CARD, "flex h-full flex-col p-6 text-site-ink md:p-8")}>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="site-display text-[1.4rem] leading-tight text-site-navy md:text-[1.625rem]">
                          {g.title}
                        </h3>
                        <GlyphChip tone="gold">
                          <Glyph name={g.glyph} />
                        </GlyphChip>
                      </div>
                      <p className="mt-4 text-[0.9375rem] leading-relaxed text-site-ink/80">{g.text}</p>
                    </article>
                  </Reveal>
                ))}
              </div>

              <Reveal dir="up" className="mt-12 flex justify-center">
                <p className="flex max-w-[46rem] items-start gap-3 rounded-[0.75rem] border border-site-border px-5 py-4 text-[0.9375rem] leading-relaxed text-white/90">
                  <SiteIcon.Check size={20} className="mt-0.5 shrink-0 text-site-gold" />
                  <span>
                    Vos données vous appartiennent : refuser les communications commerciales n&apos;entraîne aucune
                    restriction sur les fonctions essentielles du service.
                  </span>
                </p>
              </Reveal>
            </Inner>
          </Panel>
        </Section>
      </div>

      {/* 5. Pour qui nous travaillons ---------------------------------------- */}
      <Section>
        <Panel tone="light">
          <Inner>
            <Reveal dir="up">
              <Heading size="h2" className="max-w-[36rem]">
                Pour qui nous <Hl>travaillons</Hl>
              </Heading>
              <Lead tone="muted" className="mt-5">
                Une même plateforme pour ceux qui cherchent, ceux qui recrutent et ceux qui forment, partout sur le
                continent. Chacun y trouve des outils pensés pour son étape du parcours.
              </Lead>
            </Reveal>

            <ul className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-2 tab:grid-cols-3 tab:gap-y-12">
              {PERSONAS.map((p, i) => (
                <li key={p.label}>
                  <Reveal dir="up" delay={(i % 3) * 120}>
                    <article className="group flex h-full flex-col">
                      <div className="site-cut-tl relative aspect-[2/2.1] overflow-hidden rounded-t-[1rem] bg-site-soft">
                        <Image
                          src={p.portrait.src}
                          alt=""
                          fill
                          sizes="(min-width: 992px) 30vw, (min-width: 768px) 45vw, 100vw"
                          className="object-cover object-top transition-transform duration-[400ms] ease-out group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 items-start justify-between gap-4 rounded-b-[1rem] border border-b-4 border-t-0 border-site-border bg-white p-5">
                        <div>
                          <h3 className="site-display text-[1.375rem] leading-tight text-site-ink">{p.label}</h3>
                          <p className="mt-2 text-[0.9375rem] leading-relaxed text-site-muted">{p.text}</p>
                        </div>
                        <Link
                          href={p.href}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.5rem] border border-site-border bg-site-soft text-site-navy transition-colors duration-[250ms] hover:bg-site-navy hover:text-white"
                        >
                          <SiteIcon.Arrow size={18} />
                          <span className="sr-only">
                            {p.cta} ({p.label})
                          </span>
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          </Inner>
        </Panel>
      </Section>

      {/* 6. Galerie ---------------------------------------------------------- */}
      <Section>
        <Panel tone="light">
          <Inner>
            <div className="grid auto-rows-[10rem] grid-cols-2 gap-3 xs:auto-rows-[12rem] md:auto-rows-[13rem] md:grid-cols-4 md:gap-4 tab:auto-rows-auto tab:grid-cols-9 tab:grid-rows-[repeat(24,min(1.9vw,1.55rem))] tab:gap-y-0">
              {GALLERY.map((g, i) => (
                <div key={g.image.src} className={cn("grid", g.className)}>
                  <Reveal dir="up" delay={i * 100}>
                    <div className="group relative h-full overflow-hidden rounded-[1rem] border border-site-border">
                      <Image
                        src={g.image.src}
                        alt={g.image.alt}
                        fill
                        sizes="(min-width: 992px) 25vw, (min-width: 768px) 40vw, 50vw"
                        className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110"
                      />
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>

            <Reveal dir="up" className="mt-14">
              <Heading size="h2" align="center">
                Des moments <Hl>qui comptent</Hl>
              </Heading>
              <Lead align="center" tone="muted" className="mt-5">
                Un premier entretien, une formation terminée, une offre acceptée : SIRA accompagne les étapes qui font
                avancer un parcours, dans tous les secteurs et partout sur le continent.
              </Lead>
            </Reveal>
          </Inner>
        </Panel>
      </Section>

      {/* 7a. Partenaires ------------------------------------------------------ */}
      <Section id="partenaires" className="scroll-mt-24">
        <Panel tone="dark" pad={false} className="py-20 md:py-28">
          <Inner className="px-8 md:px-16">
            <div className="grid gap-12 tab:grid-cols-[0.85fr_1.15fr] tab:gap-16">
              <Reveal dir="left">
                <Heading size="h2">
                  Nos <Hl>partenaires</Hl>
                </Heading>
                <Lead className="mt-5 text-white/85">
                  Institutions, universités, centres de formation et organisations qui diffusent leurs opportunités sur
                  SIRA ou dont les programmes alimentent notre catalogue de formations. Nous voulons étendre ce réseau à
                  l&apos;ensemble du continent.
                </Lead>
                {others.length > 0 ? (
                  <p className="mt-5 max-w-[35rem] text-[0.9375rem] leading-relaxed text-white/70">
                    {others.length} autres organisations publient leurs offres sur SIRA sans convention de partenariat.
                    Devenir partenaire donne accès à la diffusion de formations et de campagnes ciblées.
                  </p>
                ) : null}
                <SiteButtonLink href="/contact" variant="gold" size="lg" className="mt-8">
                  Devenir partenaire
                </SiteButtonLink>
              </Reveal>

              {partners.length > 0 ? (
                <ul className="grid gap-5 md:grid-cols-2">
                  {partners.map((p, i) => (
                    <li key={p.id}>
                      <Reveal dir="up" delay={(i % 2) * 120}>
                        <article className={cn(CARD, "flex h-full flex-col p-6 text-site-ink")}>
                          <div className="flex items-center gap-3">
                            <InitialsAvatar initials={p.logoInitials} size={48} />
                            <div className="min-w-0">
                              <h3 className="site-display text-[1.25rem] leading-tight text-site-ink">
                                {p.tradeName ?? p.legalName}
                              </h3>
                              {p.tradeName ? (
                                <p className="truncate text-[0.8125rem] text-site-muted">{p.legalName}</p>
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-4 text-[0.875rem] font-medium text-site-navy">
                            {ORGANIZATION_TYPE_LABEL[p.type]}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-[0.875rem] text-site-muted">
                            <SiteIcon.Pin size={14} className="shrink-0" />
                            {p.city}, {p.country}
                          </p>
                          <p className="mt-3 text-[0.9375rem] leading-relaxed text-site-ink/75">{p.description}</p>
                        </article>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[1rem] text-white/85">Les premiers partenariats sont en cours de signature.</p>
              )}
            </div>
          </Inner>

          <div className="mt-16 border-t border-white/15 pt-10">
            <p className="px-8 text-center text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-white/70">
              Ils publient leurs opportunités sur SIRA
            </p>
            <Reveal dir="up" className="mt-8">
              <Marquee duration={40} gapClass="gap-10">
                {organizations.map((org, i) => (
                  <div key={org.id} className="flex shrink-0 items-center gap-2.5 text-white/75">
                    <OrgGlyph index={i} />
                    <span className="site-display whitespace-nowrap text-[1.375rem] leading-none">
                      {org.tradeName ?? org.legalName}
                    </span>
                  </div>
                ))}
              </Marquee>
            </Reveal>
          </div>
        </Panel>
      </Section>

      {/* 7b. Contact ---------------------------------------------------------- */}
      <Section id="contact" className="scroll-mt-24">
        <Panel tone="light">
          <Inner>
            <div className="grid items-end gap-6 tab:grid-cols-2 tab:gap-16">
              <Reveal dir="left">
                <Heading size="h2">
                  Nous <Hl>contacter</Hl>
                </Heading>
              </Reveal>
              <Reveal dir="right">
                <Lead tone="muted">
                  Candidats, recruteurs, formateurs ou partenaires : notre équipe répond aux demandes venues de tout le
                  continent. Pour un échange détaillé, rendez-vous sur la page contact.
                </Lead>
              </Reveal>
            </div>

            <div className="mt-14 grid gap-6 tab:grid-cols-3">
              <Reveal dir="up">
                <article className={cn(CARD, "flex h-full flex-col p-6 md:p-7")}>
                  <GlyphChip>
                    <SiteIcon.Mail size={22} />
                  </GlyphChip>
                  <h3 className="site-display mt-5 text-[1.375rem] leading-tight text-site-navy">
                    Écrire à l&apos;équipe
                  </h3>
                  <a
                    href="mailto:contact@sira.bf"
                    className="site-link mt-3 inline-flex min-h-11 w-fit items-center text-[1rem] font-semibold text-site-navy"
                  >
                    contact@sira.bf
                  </a>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-site-muted">
                    Questions générales, partenariats, presse. Réponse sous deux jours ouvrés.
                  </p>
                </article>
              </Reveal>

              <Reveal dir="up" delay={120}>
                <article className={cn(CARD, "flex h-full flex-col p-6 md:p-7")}>
                  <GlyphChip>
                    <IconWhatsApp size={22} />
                  </GlyphChip>
                  <h3 className="site-display mt-5 text-[1.375rem] leading-tight text-site-navy">
                    Support candidats et recruteurs
                  </h3>
                  <p className="mt-3 inline-flex min-h-11 items-center text-[1rem] font-semibold text-site-navy">
                    +226 00 00 00 00
                  </p>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-site-muted">
                    Assistance par WhatsApp et par e-mail, du lundi au vendredi, de 8 h à 17 h (heure de Ouagadougou).
                  </p>
                </article>
              </Reveal>

              <Reveal dir="up" delay={240}>
                <article className={cn(CARD, "flex h-full flex-col p-6 md:p-7")}>
                  <GlyphChip>
                    <SiteIcon.Pin size={22} />
                  </GlyphChip>
                  <h3 className="site-display mt-5 text-[1.375rem] leading-tight text-site-navy">Siège</h3>
                  <p className="mt-3 inline-flex min-h-11 items-center text-[1rem] font-semibold text-site-navy">
                    Ouagadougou, Burkina Faso
                  </p>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-site-muted">
                    Pour les demandes relatives à vos données personnelles, écrivez à{" "}
                    <a href="mailto:donnees@sira.bf" className="site-link font-semibold text-site-navy">
                      donnees@sira.bf
                    </a>
                    .
                  </p>
                </article>
              </Reveal>
            </div>

            <Reveal dir="up" className="mt-12 flex flex-wrap gap-3">
              <SiteButtonLink href="/contact" variant="navy">
                Accéder à la page contact
              </SiteButtonLink>
              <SiteButtonLink href="/inscription/candidat" variant="outline-dark">
                Créer mon profil
              </SiteButtonLink>
              <SiteButtonLink href="/recruteurs" variant="outline-dark">
                Espace recruteurs
              </SiteButtonLink>
            </Reveal>
          </Inner>
        </Panel>
      </Section>

      {/* 8. Appel à l'action -------------------------------------------------- */}
      <CtaBlock
        title={
          <>
            Tracez votre chemin <Hl>avec SIRA</Hl>
          </>
        }
        text="Créez votre profil en quelques minutes, découvrez les offres qui vous correspondent et avancez avec un score qui explique chaque étape. L'inscription est gratuite."
        action={{ href: "/inscription/candidat", label: "Créer mon profil" }}
        image={IMG.remiseDiplomes}
      />
    </>
  );
}
