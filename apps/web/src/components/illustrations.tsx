/**
 * Bibliothèque d'illustrations SIRA.
 *
 * Parti pris : dessin au trait, géométrique, sans aplat ni dégradé, cohérent
 * avec la direction visuelle épurée. Chaque illustration « parle » : elle
 * représente le geste métier de l'écran où elle apparaît, pas une décoration.
 *
 * Mécanique de couleur, qui garantit le fonctionnement dans les deux thèmes :
 * - l'ossature (sol, cadres, repères) est tracée en `var(--color-border-strong)` ;
 * - le trait principal utilise `currentColor`, donc il hérite de la couleur du
 *   texte environnant ;
 * - un seul élément porte l'accent, passé par la propriété `accent`, qui vaut
 *   par défaut la teinte de l'espace courant.
 *
 * Motif de marque : SIRA signifie « chemin » en dioula et en bambara. Le
 * chemin ascendant qui mène à un point est le fil conducteur de la série.
 */

import type { ReactNode } from "react";

type SpotProps = {
  /** Largeur rendue, en pixels. La hauteur suit le rapport 10/7. */
  size?: number;
  className?: string;
  /** Couleur d'accent, généralement la teinte de l'espace. */
  accent?: string;
  /** Texte alternatif. Sans lui, l'illustration est décorative et masquée. */
  title?: string;
};

const VB_W = 200;
const VB_H = 140;

function Spot({
  size = 200,
  className,
  title,
  children,
}: SpotProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={(size * VB_H) / VB_W}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** Ossature discrète : sol et repères verticaux. */
function Ground({ y = 122 }: { y?: number }) {
  return (
    <g stroke="var(--color-border-strong)" strokeWidth="1.25" strokeLinecap="round">
      <line x1="14" y1={y} x2="186" y2={y} />
      <line x1="30" y1={y} x2="30" y2={y + 5} opacity="0.6" />
      <line x1="70" y1={y} x2="70" y2={y + 5} opacity="0.6" />
      <line x1="110" y1={y} x2="110" y2={y + 5} opacity="0.6" />
      <line x1="150" y1={y} x2="150" y2={y + 5} opacity="0.6" />
    </g>
  );
}

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const FAINT = {
  stroke: "var(--color-border-strong)",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// ---------------------------------------------------------------------------
// Le chemin — motif de marque, page d'accueil
// ---------------------------------------------------------------------------

/**
 * Le chemin qui monte vers l'opportunité : une courbe ascendante jalonnée
 * d'étapes, qui traverse des opportunités esquissées et aboutit à un repère.
 */
export function IllustrationPath({ accent = "var(--color-zone-public)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      {/* Opportunités esquissées le long du parcours */}
      <g {...FAINT}>
        <rect x="46" y="86" width="26" height="20" rx="2" />
        <rect x="94" y="62" width="26" height="20" rx="2" />
        <rect x="142" y="36" width="26" height="20" rx="2" />
        <line x1="52" y1="93" x2="66" y2="93" />
        <line x1="52" y1="99" x2="62" y2="99" />
        <line x1="100" y1="69" x2="114" y2="69" />
        <line x1="100" y1="75" x2="110" y2="75" />
        <line x1="148" y1="43" x2="162" y2="43" />
        <line x1="148" y1="49" x2="158" y2="49" />
      </g>
      {/* Le chemin */}
      <path
        d="M20 120 C 46 120 40 104 60 100 C 82 96 84 78 108 74 C 132 70 130 52 156 48"
        {...STROKE}
      />
      {/* Jalons franchis */}
      <g fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5">
        <circle cx="60" cy="100" r="3.5" />
        <circle cx="108" cy="74" r="3.5" />
      </g>
      {/* Destination */}
      <circle cx="156" cy="48" r="5.5" fill={accent} />
      <path d="M156 42.5 L156 24" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M156 24 L172 29 L156 34" fill="none" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" />
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// Espace candidat — le profil devient un parcours
// ---------------------------------------------------------------------------

export function IllustrationCandidate({ accent = "var(--color-zone-candidate)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      {/* Le CV */}
      <g {...STROKE}>
        <rect x="26" y="28" width="60" height="80" rx="3" />
        <circle cx="42" cy="46" r="6" />
        <line x1="54" y1="43" x2="74" y2="43" />
        <line x1="54" y1="50" x2="68" y2="50" />
      </g>
      <g {...FAINT}>
        <line x1="36" y1="66" x2="76" y2="66" />
        <line x1="36" y1="74" x2="76" y2="74" />
        <line x1="36" y1="82" x2="66" y2="82" />
        <line x1="36" y1="90" x2="72" y2="90" />
      </g>
      {/* L'extraction vers le parcours */}
      <path d="M92 68 L110 68" {...FAINT} strokeDasharray="3 4" />
      {/* Le parcours ascendant */}
      <path d="M116 104 C 132 104 130 88 144 84 C 158 80 156 62 170 58" {...STROKE} />
      <g fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5">
        <circle cx="144" cy="84" r="3.5" />
      </g>
      <circle cx="170" cy="58" r="5.5" fill={accent} />
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// Espace recruteur — retrouver le bon profil dans la pile
// ---------------------------------------------------------------------------

export function IllustrationRecruiter({ accent = "var(--color-zone-recruiter)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      {/* L'organisation */}
      <g {...FAINT}>
        <rect x="20" y="44" width="44" height="78" rx="2" />
        <line x1="30" y1="58" x2="36" y2="58" />
        <line x1="48" y1="58" x2="54" y2="58" />
        <line x1="30" y1="72" x2="36" y2="72" />
        <line x1="48" y1="72" x2="54" y2="72" />
        <line x1="30" y1="86" x2="36" y2="86" />
        <line x1="48" y1="86" x2="54" y2="86" />
      </g>
      {/* La pile de candidatures */}
      <g {...FAINT}>
        <rect x="92" y="90" width="82" height="22" rx="3" />
        <circle cx="106" cy="101" r="5" />
        <line x1="120" y1="98" x2="152" y2="98" />
        <line x1="120" y1="105" x2="140" y2="105" />
        <rect x="92" y="62" width="82" height="22" rx="3" />
        <circle cx="106" cy="73" r="5" />
        <line x1="120" y1="70" x2="152" y2="70" />
        <line x1="120" y1="77" x2="140" y2="77" />
      </g>
      {/* Le profil retenu, détaché de la pile */}
      <g {...STROKE}>
        <rect x="98" y="28" width="82" height="24" rx="3" fill="var(--color-bg)" />
        <circle cx="112" cy="40" r="5.5" />
        <line x1="127" y1="36" x2="159" y2="36" />
      </g>
      <line x1="127" y1="45" x2="147" y2="45" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M168 40 l4 4 l7 -8" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// Espace formateur — monter en compétence, marche après marche
// ---------------------------------------------------------------------------

export function IllustrationTrainer({ accent = "var(--color-zone-trainer)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      {/* Les marches */}
      <g {...FAINT}>
        <rect x="26" y="96" width="40" height="26" rx="2" />
        <rect x="66" y="74" width="40" height="48" rx="2" />
      </g>
      <g {...STROKE}>
        <rect x="106" y="52" width="40" height="70" rx="2" />
      </g>
      {/* Le livre ouvert au sommet */}
      <g {...STROKE}>
        <path d="M108 40 C 116 34 124 34 126 38 C 128 34 136 34 144 40" />
        <line x1="126" y1="38" x2="126" y2="52" />
      </g>
      {/* Le jalon atteint */}
      <circle cx="126" cy="24" r="5.5" fill={accent} />
      {/* La progression */}
      <path d="M36 90 L76 68 L116 46" {...FAINT} strokeDasharray="3 4" />
      <circle cx="36" cy="90" r="2.5" fill="var(--color-border-strong)" />
      <circle cx="76" cy="68" r="2.5" fill="var(--color-border-strong)" />
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// Back-office — piloter et régler
// ---------------------------------------------------------------------------

export function IllustrationAdmin({ accent = "var(--color-zone-admin)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...STROKE}>
        <rect x="30" y="26" width="140" height="90" rx="4" />
        <line x1="30" y1="44" x2="170" y2="44" />
        <circle cx="42" cy="35" r="2" />
        <circle cx="50" cy="35" r="2" />
      </g>
      {/* Jauge de pilotage */}
      <path d="M52 96 A 26 26 0 0 1 104 96" {...FAINT} />
      <path d="M52 96 A 26 26 0 0 1 66 74" stroke={accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <line x1="78" y1="96" x2="92" y2="80" {...STROKE} />
      <circle cx="78" cy="96" r="2.5" fill="currentColor" />
      {/* Réglages */}
      <g {...FAINT}>
        <line x1="120" y1="64" x2="156" y2="64" />
        <line x1="120" y1="82" x2="156" y2="82" />
        <line x1="120" y1="100" x2="156" y2="100" />
      </g>
      <g fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5">
        <circle cx="146" cy="64" r="4" />
        <circle cx="130" cy="82" r="4" />
        <circle cx="140" cy="100" r="4" />
      </g>
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// Le score de compatibilité — deux pièces qui s'ajustent
// ---------------------------------------------------------------------------

export function IllustrationMatch({ accent = "var(--color-zone-candidate)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      {/* Le profil */}
      <g {...FAINT}>
        <rect x="24" y="46" width="52" height="62" rx="3" />
        <circle cx="40" cy="62" r="5" />
        <line x1="52" y1="60" x2="66" y2="60" />
        <line x1="32" y1="80" x2="68" y2="80" />
        <line x1="32" y1="88" x2="60" y2="88" />
      </g>
      {/* L'offre */}
      <g {...FAINT}>
        <rect x="124" y="46" width="52" height="62" rx="3" />
        <line x1="132" y1="60" x2="162" y2="60" />
        <line x1="132" y1="72" x2="168" y2="72" />
        <line x1="132" y1="80" x2="158" y2="80" />
        <line x1="132" y1="88" x2="164" y2="88" />
      </g>
      {/* L'ajustement */}
      <path d="M80 77 L96 77" {...FAINT} strokeDasharray="3 4" />
      <path d="M104 77 L120 77" {...FAINT} strokeDasharray="3 4" />
      {/* L'anneau de score */}
      <circle cx="100" cy="58" r="20" stroke="var(--color-border-strong)" strokeWidth="3" fill="var(--color-bg)" />
      <path
        d="M100 38 A 20 20 0 1 1 82.5 68"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <text
        x="100"
        y="63"
        textAnchor="middle"
        fill="currentColor"
        style={{ font: "600 15px ui-sans-serif, system-ui, sans-serif" }}
      >
        %
      </text>
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// WhatsApp — la notification et la commande conversationnelle
// ---------------------------------------------------------------------------

export function IllustrationWhatsApp({ accent = "var(--color-zone-candidate)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...STROKE}>
        <rect x="62" y="18" width="76" height="104" rx="8" />
        <line x1="88" y1="28" x2="112" y2="28" />
      </g>
      {/* Message entrant */}
      <g {...FAINT}>
        <rect x="72" y="42" width="50" height="22" rx="4" />
        <line x1="79" y1="50" x2="112" y2="50" />
        <line x1="79" y1="57" x2="103" y2="57" />
      </g>
      {/* Réponse de l'utilisateur */}
      <g {...FAINT}>
        <rect x="92" y="72" width="38" height="16" rx="4" />
        <line x1="99" y1="80" x2="122" y2="80" />
      </g>
      {/* Bouton d'action, seul élément accentué */}
      <rect x="72" y="96" width="56" height="16" rx="4" stroke={accent} strokeWidth="1.5" fill="none" />
      <line x1="80" y1="104" x2="110" y2="104" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// Vérification et confiance
// ---------------------------------------------------------------------------

export function IllustrationVerified({ accent = "var(--color-zone-recruiter)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...FAINT}>
        <rect x="30" y="30" width="64" height="82" rx="3" />
        <line x1="42" y1="48" x2="82" y2="48" />
        <line x1="42" y1="58" x2="76" y2="58" />
        <line x1="42" y1="68" x2="82" y2="68" />
        <line x1="42" y1="78" x2="70" y2="78" />
      </g>
      <g {...STROKE}>
        <path d="M136 34 L166 44 V 76 C 166 94 152 106 136 112 C 120 106 106 94 106 76 V 44 Z" fill="var(--color-bg)" />
      </g>
      <path d="M124 72 l8 8 l18 -20" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// États vides
// ---------------------------------------------------------------------------

/** Recherche sans résultat. */
export function IllustrationNoResults({ accent = "var(--color-zone-candidate)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...FAINT}>
        <rect x="26" y="42" width="60" height="16" rx="3" strokeDasharray="4 4" />
        <rect x="26" y="66" width="60" height="16" rx="3" strokeDasharray="4 4" />
        <rect x="26" y="90" width="60" height="16" rx="3" strokeDasharray="4 4" />
      </g>
      <g {...STROKE}>
        <circle cx="130" cy="62" r="28" fill="var(--color-bg)" />
        <line x1="150" y1="82" x2="168" y2="100" strokeWidth="2.5" />
      </g>
      <line x1="120" y1="62" x2="140" y2="62" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    </Spot>
  );
}

/** Aucun document. */
export function IllustrationNoDocuments({ accent = "var(--color-zone-candidate)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...FAINT}>
        <rect x="62" y="34" width="54" height="70" rx="3" strokeDasharray="4 4" />
        <rect x="78" y="26" width="54" height="70" rx="3" strokeDasharray="4 4" />
      </g>
      <g {...STROKE}>
        <path d="M96 44 h 34 l 12 12 v 52 a 3 3 0 0 1 -3 3 h -43 a 3 3 0 0 1 -3 -3 V 47 a 3 3 0 0 1 3 -3 Z" fill="var(--color-bg)" />
        <path d="M130 44 v 12 h 12" />
      </g>
      <g stroke={accent} strokeWidth="1.5" strokeLinecap="round">
        <line x1="104" y1="72" x2="132" y2="72" />
        <line x1="104" y1="82" x2="124" y2="82" />
      </g>
    </Spot>
  );
}

/** Aucune candidature. */
export function IllustrationNoApplications({ accent = "var(--color-zone-candidate)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...STROKE}>
        <rect x="64" y="28" width="72" height="86" rx="4" fill="var(--color-bg)" />
        <rect x="86" y="20" width="28" height="16" rx="3" fill="var(--color-bg)" />
      </g>
      <g {...FAINT}>
        <line x1="76" y1="56" x2="124" y2="56" strokeDasharray="4 4" />
        <line x1="76" y1="70" x2="124" y2="70" strokeDasharray="4 4" />
        <line x1="76" y1="84" x2="106" y2="84" strokeDasharray="4 4" />
      </g>
      <circle cx="124" cy="96" r="9" fill="var(--color-bg)" stroke={accent} strokeWidth="1.5" />
      <path d="M120 96 h 8 M124 92 v 8" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
    </Spot>
  );
}

/** Aucune notification. */
export function IllustrationNoNotifications({ accent = "var(--color-zone-candidate)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...STROKE}>
        <path d="M128 84 V 62 a 28 28 0 0 0 -56 0 v 22 l -10 12 h 76 Z" fill="var(--color-bg)" />
        <path d="M90 96 a 10 10 0 0 0 20 0" />
      </g>
      <line x1="100" y1="34" x2="100" y2="26" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <g {...FAINT}>
        <line x1="40" y1="112" x2="160" y2="112" strokeDasharray="4 4" />
      </g>
    </Spot>
  );
}

/** Catalogue de formations vide, ou aucune recommandation. */
export function IllustrationNoTrainings({ accent = "var(--color-zone-trainer)", ...p }: SpotProps) {
  return (
    <Spot {...p}>
      <Ground />
      <g {...FAINT}>
        <rect x="40" y="70" width="36" height="40" rx="2" strokeDasharray="4 4" />
        <rect x="124" y="70" width="36" height="40" rx="2" strokeDasharray="4 4" />
      </g>
      <g {...STROKE}>
        <rect x="82" y="52" width="36" height="58" rx="2" fill="var(--color-bg)" />
        <path d="M84 42 C 92 36 98 36 100 40 C 102 36 108 36 116 42" />
        <line x1="100" y1="40" x2="100" y2="52" />
      </g>
      <circle cx="100" cy="28" r="4.5" fill={accent} />
    </Spot>
  );
}

// ---------------------------------------------------------------------------
// Repères d'espace — petit glyphe de 20 px pour la barre latérale
// ---------------------------------------------------------------------------

export type ZoneKey = "public" | "candidate" | "recruiter" | "trainer" | "admin";

const ZONE_GLYPH: Record<ZoneKey, ReactNode> = {
  // Le chemin
  public: <path d="M4 16 C 8 16 7 11 11 10 C 15 9 14 5 18 4" />,
  // Le chemin avec son jalon final
  candidate: (
    <>
      <path d="M4 16 C 8 16 7 11 11 10 C 15 9 14 6 17 5" />
      <circle cx="17.5" cy="4.5" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  // Les profils empilés
  recruiter: (
    <>
      <rect x="3" y="4" width="16" height="5" rx="1.5" />
      <rect x="3" y="13" width="16" height="5" rx="1.5" />
    </>
  ),
  // Les marches
  trainer: <path d="M3 18 h 5 v -5 h 5 v -5 h 6" />,
  // La grille de pilotage
  admin: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="12" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="12" width="7" height="7" rx="1.5" />
      <rect x="12" y="12" width="7" height="7" rx="1.5" />
    </>
  ),
};

/** Glyphe identifiant l'espace, tracé dans la teinte de la zone. */
export function ZoneMark({
  zone,
  size = 20,
  className,
}: {
  zone: ZoneKey;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke={`var(--color-zone-${zone})`}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ZONE_GLYPH[zone]}
    </svg>
  );
}

/** Table de correspondance espace vers teinte, libellé et illustration. */
export const ZONE_IDENTITY: Record<
  ZoneKey,
  { label: string; accent: string; Illustration: (p: SpotProps) => ReactNode }
> = {
  public: { label: "Site public", accent: "var(--color-zone-public)", Illustration: IllustrationPath },
  candidate: { label: "Espace candidat", accent: "var(--color-zone-candidate)", Illustration: IllustrationCandidate },
  recruiter: { label: "Espace recruteur", accent: "var(--color-zone-recruiter)", Illustration: IllustrationRecruiter },
  trainer: { label: "Espace formateur", accent: "var(--color-zone-trainer)", Illustration: IllustrationTrainer },
  admin: { label: "Administration", accent: "var(--color-zone-admin)", Illustration: IllustrationAdmin },
};

/**
 * En-tête d'espace : glyphe, titre, description et illustration à droite.
 * C'est l'élément qui différencie visuellement les cinq zones.
 */
export function ZoneHeader({
  zone,
  title,
  description,
  action,
}: {
  zone: ZoneKey;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { Illustration, accent } = ZONE_IDENTITY[zone];
  return (
    <div className="mb-7 border-b border-[var(--color-border)] pb-6">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <span
            className="inline-block h-0.5 w-8 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
          <h1 className="mt-3 text-[22px] font-semibold text-[var(--color-text)]">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
        <div className="hidden shrink-0 text-[var(--color-text-subtle)] sm:block">
          <Illustration size={148} accent={accent} />
        </div>
      </div>
    </div>
  );
}
