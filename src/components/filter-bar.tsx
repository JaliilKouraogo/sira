/**
 * Barre de filtres horizontale des listes publiques.
 *
 * Elle remplace l'ancienne colonne de listes déroulantes empilées, qui donnait
 * à la page l'allure d'un formulaire d'administration. Les filtres tiennent
 * désormais sur une seule ligne, en pastilles, et les résultats récupèrent
 * toute la largeur.
 *
 * Aucun état client : tout vit dans l'URL, chaque recherche est partageable.
 * Les pastilles de filtres actifs portent chacune leur lien de retrait.
 */

import Link from "next/link";
import { FilterSelect } from "@/components/filter-select";
import { IconClose } from "@/components/icons";
import { route } from "@/lib/base-path";

export type SearchParamsRecord = { [key: string]: string | string[] | undefined };

export interface FilterDef {
  name: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}

/** Première valeur d'un paramètre d'URL, vide si absent. */
export function firstParam(sp: SearchParamsRecord, key: string): string {
  const value = sp[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Construit une chaîne de requête en ignorant les valeurs vides. */
export function buildQuery(entries: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function FilterBar({
  basePath,
  values,
  filters,
  sort,
  extraHidden,
}: {
  basePath: string;
  /** Valeur courante de chaque filtre, plus `q` et `sort`. */
  values: Record<string, string>;
  filters: FilterDef[];
  /** Options de tri, affichées à droite de la barre. */
  sort?: FilterDef;
  /** Paramètres à conserver sans les afficher, par exemple un type imposé. */
  extraHidden?: Record<string, string>;
}) {
  const hidden: Record<string, string> = { q: values.q ?? "", ...(extraHidden ?? {}) };

  return (
    <div className="sticky top-14 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg)]/92 backdrop-blur">
      <form method="get" action={route(basePath)} className="sira-container flex flex-wrap items-center gap-2 py-2.5">
        {Object.entries(hidden)
          .filter(([, v]) => Boolean(v))
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}

        <span className="mr-1 hidden text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] sm:inline">
          Filtrer
        </span>

        {filters.map((f) => (
          <FilterSelect
            key={f.name}
            name={f.name}
            label={f.label}
            allLabel={f.allLabel}
            value={values[f.name] ?? ""}
            options={f.options}
          />
        ))}

        {sort ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[12px] text-[var(--color-text-subtle)] sm:inline">Trier</span>
            <FilterSelect
              name={sort.name}
              label={sort.label}
              allLabel={sort.allLabel}
              value={values[sort.name] ?? ""}
              options={sort.options}
            />
          </div>
        ) : null}

        {/* Secours sans JavaScript et pour la navigation au clavier. */}
        <button
          type="submit"
          className="sr-only rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-primary-fg)] focus:not-sr-only"
        >
          Appliquer les filtres
        </button>
      </form>
    </div>
  );
}

/**
 * Pastilles des filtres actifs, chacune retirable d'un clic.
 * Elles rendent visible en un coup d'œil ce qui restreint la liste.
 */
export function ActiveChips({
  basePath,
  values,
  filters,
  searchLabel = "Recherche",
}: {
  basePath: string;
  values: Record<string, string>;
  filters: FilterDef[];
  searchLabel?: string;
}) {
  const chips: { key: string; label: string; href: string }[] = [];

  const withoutKey = (key: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      if (k !== key && k !== "sort" && v) next[k] = v;
    }
    return `${basePath}${buildQuery(next)}`;
  };

  if (values.q) {
    chips.push({ key: "q", label: `${searchLabel} : ${values.q}`, href: withoutKey("q") });
  }
  for (const f of filters) {
    const v = values[f.name];
    if (!v) continue;
    const option = f.options.find((o) => o.value === v);
    chips.push({ key: f.name, label: option?.label ?? v, href: withoutKey(f.name) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="sira-container flex flex-wrap items-center gap-1.5 pt-4">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] py-1 pl-2.5 pr-2 text-[12px] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
        >
          <span className="truncate">{c.label}</span>
          <IconClose size={11} />
          <span className="sr-only">Retirer ce filtre</span>
        </Link>
      ))}
      <Link
        href={basePath}
        className="ml-1 text-[12px] font-medium text-[var(--color-primary)] hover:underline"
      >
        Tout effacer
      </Link>
    </div>
  );
}
