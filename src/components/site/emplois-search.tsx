"use client";

/**
 * Recherche d'offres du site public, commune à /emplois et /stages.
 *
 * Tout l'état vit dans l'adresse, pour que chaque recherche soit partageable
 * et que le site reste publiable en fichiers statiques :
 * - la lecture passe par `useSearchParams()` ;
 * - l'écriture passe par `router.replace()`, sans remonter en haut de page ;
 * - sans JavaScript, les deux formulaires restent de vrais formulaires GET
 *   dont l'action passe par `route()`.
 *
 * Chaque composant existe en deux versions : `…View`, qui reçoit les valeurs
 * en paramètre et sert de repli de `<Suspense>` au moment de l'export, et la
 * version connectée à l'adresse, rendue une fois la page hydratée.
 *
 * Seules les offres publiées apparaissent : `searchJobs()` applique la règle.
 */

import { useRouter, useSearchParams } from "next/navigation";
import {
  useId,
  useOptimistic,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";
import { SiteJobCard } from "./cards";
import { SiteButton, SiteButtonLink, SiteIcon, cn } from "./kit";
import { Reveal } from "./motion";
import { getJobOrganization, getOrganizations, searchJobs, type JobFilters } from "@/data/queries";
import { route } from "@/lib/base-path";
import {
  CITIES,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABEL,
  DOMAINS,
  EXPERIENCE_BUCKETS,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
  type OpportunityType,
  type WorkMode,
} from "@/lib/enums";

// ---------------------------------------------------------------------------
// Configuration des deux pages
// ---------------------------------------------------------------------------

export type JobSearchVariant = "emplois" | "stages";

interface VariantConfig {
  basePath: string;
  /** Type d'opportunité imposé par la page. */
  forcedType?: OpportunityType;
  count: (n: number) => string;
  emptyTitle: string;
  emptyText: string;
  emptyAction: { href: string; label: string };
}

const VARIANTS: Record<JobSearchVariant, VariantConfig> = {
  emplois: {
    basePath: "/emplois",
    count: (n) => (n === 0 ? "Aucune offre trouvée" : n === 1 ? "1 offre trouvée" : `${n} offres trouvées`),
    emptyTitle: "Aucune offre ne correspond à votre recherche",
    emptyText:
      "Élargissez la zone géographique, retirez un filtre ou essayez un mot-clé plus général. Avec un profil SIRA, vous pouvez aussi être prévenu dès qu'une offre correspond.",
    emptyAction: { href: "/inscription/candidat", label: "Créer mon profil" },
  },
  stages: {
    basePath: "/stages",
    forcedType: "stage",
    count: (n) => (n === 0 ? "Aucun stage trouvé" : n === 1 ? "1 stage trouvé" : `${n} stages trouvés`),
    emptyTitle: "Aucun stage ne correspond à votre recherche",
    emptyText:
      "Les offres de stage sont souvent publiées par vagues, en début de semestre. Retirez un filtre, ou consultez les offres d'emploi et d'alternance en attendant.",
    emptyAction: { href: "/emplois", label: "Voir toutes les offres" },
  },
};

// ---------------------------------------------------------------------------
// Valeurs lues dans l'adresse
// ---------------------------------------------------------------------------

type FilterKey = "type" | "city" | "domain" | "contract" | "mode" | "exp";
type ValueKey = "q" | FilterKey | "sort";
type Values = Record<ValueKey, string>;

const EMPTY: Values = { q: "", type: "", city: "", domain: "", contract: "", mode: "", exp: "", sort: "" };

/** Ordre des paramètres dans l'adresse, stable pour des liens lisibles. */
const ORDER: ValueKey[] = ["q", "type", "city", "domain", "contract", "mode", "exp", "sort"];

const EXPERIENCE_VALUES: readonly string[] = EXPERIENCE_BUCKETS.map((b) => b.value);

/**
 * Plafond d'expérience exigée pour chaque tranche. Une personne qui a « 1 à
 * 2 ans » d'expérience peut postuler aux offres qui en demandent jusqu'à 2 ;
 * au-delà de 10 ans, aucune offre n'est écartée.
 */
const EXPERIENCE_MAX: Record<string, number | undefined> = { "0": 0, "1": 2, "3": 5, "6": 10, "11": undefined };

function isOpportunityType(v: string): v is OpportunityType {
  return (OPPORTUNITY_TYPES as readonly string[]).includes(v);
}

function isWorkMode(v: string): v is WorkMode {
  return (WORK_MODES as readonly string[]).includes(v);
}

function readValues(params: URLSearchParams, forcedType?: OpportunityType): Values {
  const pick = (key: string, allowed: readonly string[]) => {
    const v = params.get(key) ?? "";
    return allowed.includes(v) ? v : "";
  };
  return {
    q: (params.get("q") ?? "").trim().slice(0, 120),
    type: forcedType ? "" : pick("type", OPPORTUNITY_TYPES),
    city: pick("city", CITIES),
    domain: pick("domain", DOMAINS),
    contract: pick("contract", CONTRACT_TYPES),
    mode: pick("mode", WORK_MODES),
    exp: pick("exp", EXPERIENCE_VALUES),
    sort: pick("sort", ["deadline"]),
  };
}

function buildHref(basePath: string, values: Values): string {
  const params = new URLSearchParams();
  for (const key of ORDER) {
    if (values[key]) params.set(key, values[key]);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function toFilters(v: Values, forcedType?: OpportunityType): JobFilters {
  return {
    q: v.q || undefined,
    type: forcedType ?? (isOpportunityType(v.type) ? v.type : "all"),
    city: v.city || undefined,
    domain: v.domain || undefined,
    contractType: v.contract || undefined,
    workMode: isWorkMode(v.mode) ? v.mode : "all",
    experienceMax: EXPERIENCE_MAX[v.exp],
    sort: v.sort === "deadline" ? "deadline" : "recent",
  };
}

// ---------------------------------------------------------------------------
// Définition des filtres
// ---------------------------------------------------------------------------

interface SelectDef {
  key: FilterKey | "sort";
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}

// Les domaines proposés se limitent aux secteurs réellement représentés,
// pour ne jamais offrir un filtre qui ne renverrait rien.
const SECTORS = new Set(getOrganizations().map((o) => o.sector));

const FILTERS: SelectDef[] = [
  {
    key: "type",
    label: "Type d'opportunité",
    allLabel: "Tous les types",
    options: OPPORTUNITY_TYPES.map((t) => ({ value: t, label: OPPORTUNITY_TYPE_LABEL[t] })),
  },
  {
    key: "city",
    label: "Ville",
    allLabel: "Toutes les villes",
    options: CITIES.map((c) => ({ value: c, label: c })),
  },
  {
    key: "domain",
    label: "Domaine",
    allLabel: "Tous les domaines",
    options: DOMAINS.filter((d) => SECTORS.has(d)).map((d) => ({ value: d, label: d })),
  },
  {
    key: "contract",
    label: "Contrat",
    allLabel: "Tous les contrats",
    options: CONTRACT_TYPES.map((c) => ({ value: c, label: CONTRACT_TYPE_LABEL[c] })),
  },
  {
    key: "mode",
    label: "Mode de travail",
    allLabel: "Tous les modes",
    options: WORK_MODES.map((m) => ({ value: m, label: WORK_MODE_LABEL[m] })),
  },
  {
    key: "exp",
    label: "Expérience",
    allLabel: "Toute expérience",
    options: EXPERIENCE_BUCKETS.map((b) => ({ value: b.value, label: b.label })),
  },
];

const SORT: SelectDef = {
  key: "sort",
  label: "Trier les résultats",
  allLabel: "Plus récentes",
  options: [{ value: "deadline", label: "Date limite proche" }],
};

// ---------------------------------------------------------------------------
// Petites pièces
// ---------------------------------------------------------------------------

function Chevron({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function SlidersGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

/** Liste déroulante en pastille. Bordure or quand un filtre est appliqué. */
function FilterPill({
  def,
  value,
  onChange,
  className,
}: {
  def: SelectDef;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const active = Boolean(value);
  return (
    <label
      className={cn(
        "relative inline-flex min-h-11 items-center rounded-full border transition-colors duration-300 focus-within:ring-2 focus-within:ring-site-navy",
        active
          ? "border-site-border bg-site-gold/10 font-semibold text-site-navy shadow-[inset_0_0_0_1px_var(--color-site-border)]"
          : "border-site-line bg-white text-site-ink/85 hover:border-site-navy/40",
        className,
      )}
    >
      <span className="sr-only">{def.label}</span>
      {/* Filtre actif : le nom du filtre reste visible devant la valeur choisie. */}
      {active ? (
        <span aria-hidden className="shrink-0 whitespace-nowrap pl-4 text-[0.875rem] font-normal text-site-muted">
          {def.label}&nbsp;:
        </span>
      ) : null}
      <select
        name={def.key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full bg-transparent pr-10 text-[0.9375rem] outline-none field-sizing-content md:max-w-[16rem]",
          active ? "pl-1.5" : "pl-4",
        )}
      >
        <option value="">{def.allLabel}</option>
        {def.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Chevron className={cn("pointer-events-none absolute right-3.5", active ? "text-site-navy" : "text-site-muted")} />
    </label>
  );
}

const DESKTOP_QUERY = "(min-width: 48rem)";

/** Vrai au-delà de 768 px. Côté serveur, on suppose un grand écran. */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}

function scrollToResults() {
  const target = document.getElementById("resultats");
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// Barre de recherche de l'en-tête
// ---------------------------------------------------------------------------

export function JobSearchHeroView({ variant, values }: { variant: JobSearchVariant; values?: Values }) {
  const cfg = VARIANTS[variant];
  const v = values ?? EMPTY;
  const router = useRouter();
  const ids = useId();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Values = {
      ...v,
      q: String(data.get("q") ?? "").trim(),
      city: String(data.get("city") ?? ""),
    };
    router.replace(buildHref(cfg.basePath, next), { scroll: false });
    scrollToResults();
  }

  /** Filtres de la barre de résultats, reconduits sans JavaScript. */
  const carried = ORDER.filter((k) => k !== "q" && k !== "city" && v[k]);

  return (
    <form
      // Remonté quand l'adresse change ailleurs, par exemple au retrait d'une pastille.
      key={`${v.q}|${v.city}`}
      role="search"
      method="get"
      action={route(cfg.basePath)}
      onSubmit={onSubmit}
      className="@container mt-9 max-w-[40rem] rounded-[1rem] border border-site-border bg-white p-2 text-site-ink"
    >
      <div className="grid gap-2 @md:grid-cols-[1fr_auto] @2xl:grid-cols-[1fr_12rem_auto]">
        <label
          htmlFor={`${ids}-q`}
          className="flex min-h-12 items-center gap-2.5 rounded-[0.6rem] bg-site-light px-3.5 focus-within:ring-2 focus-within:ring-site-navy @md:col-span-2 @2xl:col-span-1"
        >
          <SiteIcon.Search size={20} className="shrink-0 text-site-navy" />
          <span className="sr-only">Mot-clé</span>
          <input
            id={`${ids}-q`}
            name="q"
            type="search"
            defaultValue={v.q}
            autoComplete="off"
            placeholder="Métier, compétence ou entreprise"
            className="h-12 w-full min-w-0 bg-transparent text-[1rem] outline-none placeholder:text-site-muted"
          />
        </label>
        <label
          htmlFor={`${ids}-city`}
          className="relative flex min-h-12 items-center gap-2.5 rounded-[0.6rem] bg-site-light pl-3.5 focus-within:ring-2 focus-within:ring-site-navy"
        >
          <SiteIcon.Pin size={20} className="shrink-0 text-site-navy" />
          <span className="sr-only">Ville</span>
          <select
            id={`${ids}-city`}
            name="city"
            defaultValue={v.city}
            className="h-12 w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-10 text-[1rem] outline-none"
          >
            <option value="">Toutes les villes</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Chevron className="pointer-events-none absolute right-3.5 text-site-muted" />
        </label>
        <SiteButton type="submit" variant="gold" size="md" className="w-full @md:w-auto">
          <SiteIcon.Search size={18} />
          Rechercher
        </SiteButton>
      </div>
      {carried.map((k) => (
        <input key={k} type="hidden" name={k} value={v[k]} />
      ))}
    </form>
  );
}

export function JobSearchHero({ variant }: { variant: JobSearchVariant }) {
  const params = useSearchParams();
  const values = readValues(params, VARIANTS[variant].forcedType);
  return <JobSearchHeroView variant={variant} values={values} />;
}

// ---------------------------------------------------------------------------
// Filtres et résultats
// ---------------------------------------------------------------------------

export function JobSearchResultsView({ variant, values }: { variant: JobSearchVariant; values?: Values }) {
  const cfg = VARIANTS[variant];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Les valeurs choisies s'affichent aussitôt, pendant que l'adresse se met à jour.
  const [shown, setShown] = useOptimistic<Values, Values>(values ?? EMPTY, (_current, next) => next);
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const panelId = useId();

  const filters = cfg.forcedType ? FILTERS.filter((f) => f.key !== "type") : FILTERS;
  const jobs = searchJobs(toFilters(shown, cfg.forcedType));

  function apply(next: Values) {
    startTransition(() => {
      setShown(next);
      router.replace(buildHref(cfg.basePath, next), { scroll: false });
    });
  }

  const set = (key: ValueKey, value: string) => apply({ ...shown, [key]: value });
  const reset = () => apply(EMPTY);

  const chips: { key: ValueKey; label: string }[] = [];
  if (shown.q) chips.push({ key: "q", label: `Mot-clé : « ${shown.q} »` });
  for (const f of filters) {
    const value = shown[f.key];
    if (!value) continue;
    const option = f.options.find((o) => o.value === value);
    chips.push({ key: f.key, label: `${f.label} : ${option?.label ?? value}` });
  }
  const activeFilters = filters.filter((f) => shown[f.key]).length;

  // Rejoue les entrées échelonnées à chaque nouvelle recherche.
  const gridKey = buildHref("", shown);

  return (
    <div aria-busy={pending}>
      {/* ---- Barre de filtres ---- */}
      <form
        method="get"
        action={route(cfg.basePath)}
        aria-label="Filtrer les offres"
        onSubmit={(e) => e.preventDefault()}
        className="rounded-[1rem] border border-site-border bg-white p-3 md:p-4"
      >
        {shown.q ? <input type="hidden" name="q" value={shown.q} /> : null}

        <div className="flex items-center justify-between gap-3 md:hidden">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex min-h-11 flex-1 items-center gap-2.5 rounded-full px-3 text-left text-[1rem] font-semibold text-site-navy"
          >
            <SlidersGlyph />
            Filtres
            {activeFilters > 0 ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-site-navy px-1.5 text-[0.8125rem] text-site-gold">
                {activeFilters}
                <span className="sr-only"> actifs</span>
              </span>
            ) : null}
            <Chevron className={cn("ml-auto transition-transform duration-300", open && "rotate-180")} />
          </button>
        </div>

        <div
          id={panelId}
          data-open={open}
          inert={!open && !isDesktop}
          className="site-collapse -m-1 md:grid-rows-[1fr] [html:not(.js)_&]:grid-rows-[1fr]"
        >
          <div className="p-1">
            <div className="grid gap-2 pt-3 xs:grid-cols-2 md:flex md:flex-wrap md:items-center md:pt-0">
              {filters.map((f) => (
                <FilterPill key={f.key} def={f} value={shown[f.key]} onChange={(value) => set(f.key, value)} />
              ))}
              {/* Secours sans JavaScript : avec, chaque choix s'applique aussitôt. */}
              <button
                type="submit"
                className="hidden min-h-11 items-center rounded-full bg-site-navy px-5 text-[0.9375rem] font-semibold text-white [html:not(.js)_&]:inline-flex"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ---- Filtres actifs ---- */}
      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => set(c.key, "")}
              aria-label={`Retirer le filtre ${c.label}`}
              className="group inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-full bg-site-navy py-1.5 pl-4 pr-2 text-[0.875rem] font-medium text-white transition-colors duration-300 hover:bg-site-navy-deep"
            >
              <span className="truncate">{c.label}</span>
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-site-gold transition-colors duration-300 group-hover:bg-site-gold group-hover:text-site-navy">
                <CloseGlyph />
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center px-3 text-[0.9375rem] font-semibold text-site-navy underline decoration-site-border decoration-2 underline-offset-4 hover:decoration-site-navy"
          >
            Tout effacer
          </button>
        </div>
      ) : null}

      {/* ---- Nombre de résultats et tri ---- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-site-line pb-5">
        <p className="site-display text-[1.25rem] leading-tight text-site-ink xs:text-[1.5rem] md:text-[1.75rem]" aria-live="polite">
          {cfg.count(jobs.length)}
        </p>
        <div className="flex items-center gap-3">
          <span className="hidden text-[0.9375rem] text-site-muted xs:inline" aria-hidden>
            Trier par
          </span>
          <FilterPill def={SORT} value={shown.sort} onChange={(value) => set("sort", value)} />
        </div>
      </div>

      {/* ---- Offres ---- */}
      {jobs.length === 0 ? (
        <Reveal key={gridKey} dir="up" className="mt-8">
          <div className="rounded-[1.5rem] border border-b-4 border-site-border bg-white px-6 py-14 text-center md:px-12 md:py-20">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-site-navy text-site-gold">
              <SiteIcon.Search size={28} />
            </span>
            <h3 className="site-display mx-auto mt-6 max-w-[30rem] text-balance text-[1.5rem] leading-tight text-site-ink md:text-[1.75rem]">
              {cfg.emptyTitle}
            </h3>
            <p className="mx-auto mt-4 max-w-[34rem] text-[0.9375rem] leading-relaxed text-site-muted md:text-[1rem]">
              {cfg.emptyText}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <SiteButton variant="navy" onClick={reset}>
                Réinitialiser les filtres
              </SiteButton>
              <SiteButtonLink href={cfg.emptyAction.href} variant="outline-dark">
                {cfg.emptyAction.label}
              </SiteButtonLink>
            </div>
          </div>
        </Reveal>
      ) : (
        <ul key={gridKey} className="mt-8 grid gap-6 tab:grid-cols-2">
          {jobs.map((job, i) => (
            <Reveal key={job.id} as="li" dir="up" delay={(i % 2) * 120}>
              <SiteJobCard job={job} organization={getJobOrganization(job)} />
            </Reveal>
          ))}
        </ul>
      )}

      {/* ---- Rappels ---- */}
      <div className="mt-12 grid gap-4 border-t border-site-line pt-6 text-[0.875rem] leading-relaxed text-site-muted md:grid-cols-2 md:gap-10">
        <p>
          Seules les offres publiées apparaissent ici. Une offre expirée, suspendue ou clôturée quitte
          automatiquement la liste.
        </p>
        <p>
          Avec un profil SIRA, chaque offre affiche un score de compatibilité. Ce score est une estimation
          algorithmique : il éclaire votre choix mais ne garantit pas le recrutement.
        </p>
      </div>
    </div>
  );
}

export function JobSearchResults({ variant }: { variant: JobSearchVariant }) {
  const params = useSearchParams();
  const values = readValues(params, VARIANTS[variant].forcedType);
  return <JobSearchResultsView variant={variant} values={values} />;
}
