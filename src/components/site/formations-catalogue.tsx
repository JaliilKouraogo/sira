"use client";

/**
 * Catalogue de formations filtrable, côté navigateur.
 *
 * Le site est publié en fichiers statiques : la page ne peut pas lire
 * l'adresse côté serveur. Ce composant lit donc les filtres dans l'adresse au
 * chargement (`useSearchParams`), filtre localement avec les fonctions pures
 * de `queries.ts`, puis réécrit l'adresse à chaque changement avec
 * `history.replaceState`, que Next.js synchronise avec son routeur. Une
 * recherche filtrée reste ainsi partageable, sans aller-retour réseau.
 *
 * Paramètres reconnus : `q`, `category`, `access`, `format`, `level`. Une
 * valeur inconnue est ignorée.
 *
 * Sous 768 px, les pastilles de filtres se replient derrière un bouton pour
 * que les résultats restent visibles sans défiler longuement.
 */

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { getTrainings, searchTrainings, type TrainingFilters } from "@/data/queries";
import { route } from "@/lib/base-path";
import {
  TRAINING_ACCESS,
  TRAINING_ACCESS_LABEL,
  TRAINING_FORMATS,
  TRAINING_FORMAT_LABEL,
} from "@/lib/enums";
import type { Training } from "@/lib/types";
import { TrainingCard } from "./formations-card";
import { SiteButton, SiteIcon, cn } from "./kit";
import { Reveal } from "./motion";

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------

type FilterKey = "category" | "access" | "format" | "level";

interface CatalogueState {
  q: string;
  category: string;
  access: string;
  format: string;
  level: string;
}

const EMPTY: CatalogueState = { q: "", category: "", access: "", format: "", level: "" };

const LEVELS: Training["level"][] = ["Débutant", "Intermédiaire", "Avancé"];

interface FilterGroup {
  key: FilterKey;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}

function buildGroups(): FilterGroup[] {
  const categories = Array.from(new Set(getTrainings().map((t) => t.category))).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  return [
    {
      key: "category",
      label: "Catégorie",
      allLabel: "Toutes",
      options: categories.map((c) => ({ value: c, label: c })),
    },
    {
      key: "access",
      label: "Accès",
      allLabel: "Tous",
      options: TRAINING_ACCESS.map((a) => ({ value: a, label: TRAINING_ACCESS_LABEL[a] })),
    },
    {
      key: "format",
      label: "Format",
      allLabel: "Tous",
      options: TRAINING_FORMATS.map((f) => ({ value: f, label: TRAINING_FORMAT_LABEL[f] })),
    },
    {
      key: "level",
      label: "Niveau",
      allLabel: "Tous",
      options: LEVELS.map((l) => ({ value: l, label: l })),
    },
  ];
}

const GROUPS = buildGroups();
const FILTER_KEYS: FilterKey[] = ["category", "access", "format", "level"];

/** Lit l'adresse et écarte toute valeur qui n'existe pas dans le catalogue. */
function parseParams(query: string): CatalogueState {
  const sp = new URLSearchParams(query);
  const state: CatalogueState = { ...EMPTY, q: (sp.get("q") ?? "").slice(0, 120) };
  for (const group of GROUPS) {
    const value = sp.get(group.key) ?? "";
    if (group.options.some((o) => o.value === value)) state[group.key] = value;
  }
  return state;
}

/** Forme canonique d'une chaîne de requête, pour comparer deux adresses. */
function canon(query: string): string {
  return new URLSearchParams(query).toString();
}

function toQuery(state: CatalogueState): string {
  const sp = new URLSearchParams();
  if (state.q.trim()) sp.set("q", state.q.trim());
  for (const key of FILTER_KEYS) if (state[key]) sp.set(key, state[key]);
  return sp.toString();
}

function toFilters(state: CatalogueState): TrainingFilters {
  return {
    q: state.q.trim() || undefined,
    category: state.category || undefined,
    access: state.access || undefined,
    format: state.format || undefined,
    level: state.level || undefined,
  };
}

function resultLabel(n: number): string {
  if (n === 0) return "Aucune formation trouvée";
  return n === 1 ? "1 formation trouvée" : `${n} formations trouvées`;
}

// ---------------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------------

/** Version reliée à l'adresse, à rendre dans un `<Suspense>`. */
export function FormationsCatalogue() {
  const searchParams = useSearchParams();
  return <CatalogueView query={searchParams.toString()} live />;
}

/**
 * Version sans lecture de l'adresse : catalogue complet, sans filtre. Sert
 * de contenu de repli pendant le chargement et pour les robots.
 */
export function FormationsCatalogueFallback() {
  return <CatalogueView query="" live={false} />;
}

function CatalogueView({ query, live }: { query: string; live: boolean }) {
  const [state, setState] = useState<CatalogueState>(() => parseParams(query));
  const [open, setOpen] = useState(false);
  const written = useRef(canon(query));
  const ids = useId();
  const panelId = `${ids}-filtres`;

  // Navigation extérieure (lien du menu vers /formations, retour arrière) :
  // l'adresse ne correspond plus à ce que ce composant a écrit, on la relit.
  // Une valeur simplement en retard sur nos propres écritures, pendant la
  // synchronisation du routeur, est ignorée : elle ne correspond pas à
  // l'adresse réellement affichée.
  useEffect(() => {
    if (!live) return;
    const current = canon(query);
    if (current === written.current) return;
    if (canon(window.location.search) !== current) return;
    written.current = current;
    setState(parseParams(current));
  }, [query, live]);

  function update(next: CatalogueState) {
    setState(next);
    if (!live) return;
    const qs = toQuery(next);
    written.current = qs;
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  const setFilter = (key: FilterKey, value: string) => update({ ...state, [key]: value });
  const reset = () => update(EMPTY);

  const results = useMemo(() => searchTrainings(toFilters(state)), [state]);

  // Nombre de résultats qu'obtiendrait chaque option, les autres filtres
  // restant appliqués : le visiteur voit d'avance où mène une pastille.
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const group of GROUPS) {
      for (const option of group.options) {
        map[`${group.key}:${option.value}`] = searchTrainings(
          toFilters({ ...state, [group.key]: option.value }),
        ).length;
      }
      map[`${group.key}:`] = searchTrainings(toFilters({ ...state, [group.key]: "" })).length;
    }
    return map;
  }, [state]);

  const active = GROUPS.flatMap((g) => {
    const option = g.options.find((o) => o.value === state[g.key]);
    return option ? [{ key: g.key, group: g.label, label: option.label }] : [];
  });
  const hasCriteria = active.length > 0 || state.q.trim() !== "";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <div>
      {/* ---- Recherche et filtres ---------------------------------------- */}
      <Reveal dir="up">
        <div className="rounded-[1rem] border border-site-border bg-white p-5 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form
              role="search"
              method="get"
              action={route("/formations")}
              onSubmit={onSubmit}
              className="relative flex-1"
            >
              <label htmlFor={`${ids}-q`} className="sr-only">
                Rechercher une formation
              </label>
              <SiteIcon.Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-site-muted"
              />
              <input
                id={`${ids}-q`}
                type="search"
                name="q"
                value={state.q}
                onChange={(e) => update({ ...state, q: e.target.value })}
                placeholder="Compétence, métier ou intitulé"
                autoComplete="off"
                maxLength={120}
                className="h-14 w-full rounded-[0.5rem] border border-site-line bg-white pl-12 pr-4 text-[1rem] text-site-ink outline-none transition-colors placeholder:text-site-muted focus:border-site-navy"
              />
            </form>

            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.5rem] border border-site-navy px-5 text-[1rem] font-semibold text-site-navy transition-colors hover:bg-site-navy/5 md:hidden"
            >
              <FilterGlyph />
              {open ? "Masquer les filtres" : "Afficher les filtres"}
              {active.length > 0 ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-site-navy px-1.5 text-[0.8125rem] text-white">
                  {active.length}
                </span>
              ) : null}
            </button>
          </div>

          <div
            id={panelId}
            className="site-collapse md:grid-rows-[1fr]"
            data-open={open}
          >
            <div className={cn("transition-[visibility] duration-500", !open && "max-md:invisible")}>
              <div className="mt-5 divide-y divide-site-line border-t border-site-line md:mt-6">
                {GROUPS.map((group) => (
                  <FilterRow
                    key={group.key}
                    group={group}
                    value={state[group.key]}
                    counts={counts}
                    onChange={(v) => setFilter(group.key, v)}
                    idBase={ids}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ---- Bilan de la recherche --------------------------------------- */}
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="site-display text-[1.375rem] text-site-ink" aria-live="polite" aria-atomic="true">
          {resultLabel(results.length)}
        </p>
        {hasCriteria ? (
          <ul className="flex flex-wrap gap-2" aria-label="Filtres actifs">
            {state.q.trim() ? (
              <li>
                <button
                  type="button"
                  onClick={() => update({ ...state, q: "" })}
                  aria-label={`Effacer la recherche : ${state.q.trim()}`}
                  className="inline-flex min-h-11 max-w-[16rem] items-center gap-2 rounded-full border border-site-border bg-white py-1.5 pl-4 pr-3 text-[0.875rem] font-medium text-site-navy transition-colors hover:bg-site-soft"
                >
                  <span className="truncate">« {state.q.trim()} »</span>
                  <SiteIcon.Plus size={16} className="shrink-0 rotate-45" />
                </button>
              </li>
            ) : null}
            {active.map((a) => (
              <li key={a.key}>
                <button
                  type="button"
                  onClick={() => setFilter(a.key, "")}
                  aria-label={`Retirer le filtre ${a.group} : ${a.label}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-site-border bg-white py-1.5 pl-4 pr-3 text-[0.875rem] font-medium text-site-navy transition-colors hover:bg-site-soft"
                >
                  {a.label}
                  <SiteIcon.Plus size={16} className="rotate-45" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {hasCriteria ? (
          <button
            type="button"
            onClick={reset}
            className="site-link ml-auto inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-site-navy"
          >
            Tout effacer
          </button>
        ) : null}
      </div>

      {/* ---- Résultats ---------------------------------------------------- */}
      {results.length === 0 ? (
        <EmptyCatalogue onReset={reset} />
      ) : (
        <ul className="mt-6 grid gap-6 md:grid-cols-2 tab:grid-cols-3">
          {results.map((t, i) => (
            <Reveal key={t.id} as="li" dir="up" delay={(i % 3) * 100}>
              <TrainingCard training={t} />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterRow({
  group,
  value,
  counts,
  onChange,
  idBase,
}: {
  group: FilterGroup;
  value: string;
  counts: Record<string, number>;
  onChange: (value: string) => void;
  idBase: string;
}) {
  const labelId = `${idBase}-${group.key}`;
  const choices = [{ value: "", label: group.allLabel }, ...group.options];
  return (
    <div className="grid gap-3 py-4 md:grid-cols-[7.5rem_1fr] md:items-start md:gap-6">
      <p id={labelId} className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-site-muted md:pt-3.5">
        {group.label}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const pressed = value === choice.value;
          const count = counts[`${group.key}:${choice.value}`] ?? 0;
          return (
            <button
              key={choice.value || "tous"}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(choice.value)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-[0.5rem] border px-3.5 text-[0.9375rem] font-medium transition-colors duration-200",
                pressed
                  ? "border-site-navy bg-site-navy text-white"
                  : "border-site-line bg-white text-site-navy hover:border-site-navy",
                !pressed && count === 0 && "text-site-navy/50",
              )}
            >
              {choice.label}
              <span
                className={cn(
                  "min-w-5 rounded-[0.3rem] px-1 text-center text-[0.75rem] font-semibold tabular-nums",
                  pressed ? "bg-white/15 text-site-gold" : "bg-site-soft text-site-muted",
                )}
              >
                <span className="sr-only">, </span>
                {count}
                <span className="sr-only"> {count > 1 ? "formations" : "formation"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyCatalogue({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-[1rem] border border-b-4 border-site-border bg-white px-6 py-14 text-center md:py-20">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-site-soft text-site-navy">
        <SiteIcon.Search size={28} />
      </span>
      <h3 className="site-display mt-6 max-w-[30rem] text-[1.5rem] leading-snug text-site-ink md:text-[1.75rem]">
        Aucune formation ne correspond à ces critères
      </h3>
      <p className="mt-3 max-w-[32rem] text-[0.9375rem] leading-relaxed text-site-muted">
        Le catalogue s&apos;enrichit au fil des partenariats. Retirez un filtre, ou consultez toutes les formations
        disponibles.
      </p>
      <SiteButton variant="outline-dark" className="mt-7" onClick={onReset}>
        Voir tout le catalogue
      </SiteButton>
    </div>
  );
}

function FilterGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
