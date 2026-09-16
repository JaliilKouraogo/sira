/**
 * Kit de composants du site public.
 *
 * Grammaire reprise du gabarit de référence, adaptée à la marque SIRA :
 * - la page est un fond or sur lequel sont posés des blocs arrondis (24 px),
 *   séparés par un liseré de 6 px ;
 * - un bloc est soit marine (`tone="dark"`), soit clair (`tone="light"`) ;
 * - les titres sont en Instrument Sans, graisse 500, avec une partie mise en
 *   valeur (`<Hl>`) qui prend l'or adapté au fond du bloc ;
 * - les cartes ont une bordure basse épaissie à 4 px.
 *
 * Points de rupture identiques au modèle : 479, 767 et 991 pixels, exposés en
 * Tailwind sous `xs` (480), `md` (768) et `tab` (992).
 */

import Link from "next/link";
import type { ComponentProps, CSSProperties, ElementType, ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Mise en page
// ---------------------------------------------------------------------------

/**
 * Enveloppe d'une section : le liseré qui laisse voir le fond or autour du
 * bloc. Le modèle utilise 6 px en vertical et environ 12 px sur les côtés.
 */
export function Section({
  children,
  className,
  id,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: ElementType;
}) {
  return (
    <Tag id={id} className={cn("px-2 py-1.5 md:px-3", className)}>
      {children}
    </Tag>
  );
}

type Tone = "dark" | "light" | "white";

const TONE_CLASS: Record<Tone, string> = {
  dark: "bg-site-navy site-on-dark",
  light: "bg-site-light site-on-light",
  white: "bg-site-white site-on-light",
};

/**
 * Bloc arrondi. `pad` reprend les marges internes du modèle :
 * 7rem × 4rem sur grand écran, 2rem sur les côtés sous 768 px, 5rem × 2rem
 * sous 480 px.
 */
export function Panel({
  children,
  tone = "light",
  pad = true,
  className,
  style,
  as: Tag = "div",
}: {
  children: ReactNode;
  tone?: Tone;
  pad?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
}) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-site-border",
        TONE_CLASS[tone],
        pad && "px-8 py-20 md:px-16 md:py-28",
        className,
      )}
      style={style}
    >
      {children}
    </Tag>
  );
}

/** Contenu d'un bloc, borné en largeur pour les très grands écrans. */
export function Inner({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[76rem]", className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Typographie
// ---------------------------------------------------------------------------

/** Partie mise en valeur d'un titre. Sa couleur dépend du ton du bloc. */
export function Hl({ children }: { children: ReactNode }) {
  return <span className="site-hl">{children}</span>;
}

const HEADING_SIZE = {
  // 60 px, 56 px sous 992, 48 px sous 768, 38 px sous 480 : échelle du modèle.
  h1: "text-[2.4rem] xs:text-[3rem] md:text-[3.5rem] tab:text-[3.75rem]",
  // 50 px, 44, 40, 32.
  h2: "text-[2rem] xs:text-[2.5rem] md:text-[2.75rem] tab:text-[3.125rem]",
  // 28 px.
  h3: "text-[1.4rem] md:text-[1.75rem]",
  h4: "text-[1.2rem] md:text-[1.35rem]",
} as const;

export function Heading({
  children,
  as: Tag = "h2",
  size = "h2",
  className,
  align,
}: {
  children: ReactNode;
  as?: ElementType;
  size?: keyof typeof HEADING_SIZE;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <Tag className={cn("site-display", HEADING_SIZE[size], align === "center" && "text-center", className)}>
      {children}
    </Tag>
  );
}

/** Paragraphe d'introduction, 16 px, largeur maximale de 35rem comme le modèle. */
export function Lead({
  children,
  className,
  align,
  tone = "auto",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
  /** `auto` hérite du bloc ; `muted` force le gris des paragraphes clairs. */
  tone?: "auto" | "muted";
}) {
  return (
    <p
      className={cn(
        "max-w-[35rem] text-[1rem] leading-relaxed",
        tone === "muted" && "text-site-muted",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Petit surtitre au-dessus d'un titre. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("mb-3 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] opacity-80", className)}>
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Boutons
// ---------------------------------------------------------------------------

type ButtonVariant = "navy" | "gold" | "outline-light" | "outline-dark" | "white";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  navy: "bg-site-navy text-white hover:bg-site-navy-deep",
  gold: "bg-site-gold text-site-navy hover:bg-site-gold-hover",
  "outline-light": "border border-white/80 text-white hover:bg-white/10",
  "outline-dark": "border border-site-navy text-site-navy hover:bg-site-navy/5",
  white: "bg-white text-site-navy hover:bg-site-soft",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "min-h-11 px-5 py-2.5 text-[0.9375rem]",
  md: "min-h-12 px-6 py-3.5 text-[1rem]",
  lg: "min-h-14 px-7 py-4 text-[1.125rem]",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[0.5rem] font-semibold transition-colors duration-[250ms] select-none";

export function SiteButton({
  variant = "navy",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & ComponentProps<"button">) {
  return (
    <button type={type} className={cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function SiteButtonLink({
  href,
  variant = "navy",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Petits éléments
// ---------------------------------------------------------------------------

/** Étiquette grise arrondie, comme « Tech » ou « Temps plein » sur les cartes. */
export function Pill({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[0.5rem] bg-site-soft px-2 py-1 text-[0.8125rem] font-medium text-site-navy",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Cinq étoiles pleines, pour les témoignages. */
export function Stars({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-1 text-site-navy", className)} aria-label={`Note : ${count} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8L12 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Défilement infini horizontal. Le contenu est dupliqué et la piste glisse de
 * la moitié de sa largeur, ce qui produit une boucle sans couture.
 */
export function Marquee({
  children,
  duration = 30,
  className,
  gapClass = "gap-6",
}: {
  children: ReactNode;
  /** Durée d'un cycle en secondes. Le modèle utilise 30 s. */
  duration?: number;
  className?: string;
  gapClass?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="site-marquee" style={{ "--marquee-duration": `${duration}s` } as CSSProperties}>
        <div className={cn("flex shrink-0 items-stretch pr-6", gapClass)}>{children}</div>
        <div className={cn("flex shrink-0 items-stretch pr-6", gapClass)} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icônes du site
// ---------------------------------------------------------------------------

type IconProps = { size?: number; className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SiteIcon = {
  Pin: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Mail: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  Phone: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2Z" />
    </svg>
  ),
  Arrow: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  Plus: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Check: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  ),
  Clock: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Search: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
};

/** Réseaux sociaux du pied de page. */
export function SocialLinks({ className }: { className?: string }) {
  const items: { label: string; href: string; path: ReactNode }[] = [
    {
      label: "Facebook",
      href: "https://facebook.com",
      path: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8Z" fill="currentColor" />,
    },
    {
      label: "Instagram",
      href: "https://instagram.com",
      path: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" {...stroke} strokeWidth={1.8} />
          <circle cx="12" cy="12" r="4" {...stroke} strokeWidth={1.8} />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
        </>
      ),
    },
    {
      label: "X",
      href: "https://x.com",
      path: <path d="M4 4l16 16M20 4 4 20" {...stroke} strokeWidth={2} />,
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com",
      path: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
          <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" stroke="#fbfbfd" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ),
    },
    {
      label: "YouTube",
      href: "https://youtube.com",
      path: (
        <>
          <rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" />
          <path d="m10 9 5 3-5 3V9Z" fill="#fbfbfd" />
        </>
      ),
    },
  ];
  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {items.map((it) => (
        <li key={it.label}>
          <a
            href={it.href}
            target="_blank"
            rel="noreferrer"
            aria-label={it.label}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-site-navy transition-colors hover:bg-site-soft"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              {it.path}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
