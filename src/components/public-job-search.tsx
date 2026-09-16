/**
 * Recherche d'opportunités — écran commun aux pages /emplois et /stages.
 *
 * Tout l'état vit dans l'URL : les formulaires sont en méthode GET et la page
 * reste un composant serveur. Seule la liste déroulante de filtre embarque un
 * peu de JavaScript, pour se soumettre au changement.
 *
 * Mise en page : un en-tête porté par le fond animé de marque, une barre de
 * filtres horizontale et collante, les filtres actifs en pastilles retirables,
 * puis les résultats sur toute la largeur.
 */

import { Backdrop } from "@/components/backdrop";
import { JobCard } from "@/components/job-card";
import { IconMapPin, IconSearch } from "@/components/icons";
import { IllustrationNoResults } from "@/components/illustrations";
import {
  ActiveChips,
  FilterBar,
  firstParam,
  type FilterDef,
  type SearchParamsRecord,
} from "@/components/filter-bar";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getJobOrganization, getOrganizations, searchJobs, type JobFilters } from "@/data/queries";
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
  type ContractType,
  type OpportunityType,
  type WorkMode,
} from "@/lib/enums";

const CONTRACT_VALUES: readonly string[] = CONTRACT_TYPES;
const WORK_MODE_VALUES: readonly string[] = WORK_MODES;
const OPPORTUNITY_VALUES: readonly string[] = OPPORTUNITY_TYPES;
const CITY_VALUES: readonly string[] = CITIES;

export function PublicJobSearch({
  basePath,
  searchParams,
  forcedType,
  title,
  description,
  emptyTitle,
  emptyDescription,
  countLabel,
}: {
  basePath: string;
  searchParams: SearchParamsRecord;
  /** Type d'opportunité imposé par la page, « stage » par exemple. */
  forcedType?: OpportunityType;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  countLabel: (n: number) => string;
}) {
  const q = firstParam(searchParams, "q");
  const city = firstParam(searchParams, "city");
  const domain = firstParam(searchParams, "domain");
  const contract = firstParam(searchParams, "contract");
  const mode = firstParam(searchParams, "mode");
  const exp = firstParam(searchParams, "exp");
  const sort = firstParam(searchParams, "sort");
  const type = forcedType ?? firstParam(searchParams, "type");

  const expNumber = exp !== "" && !Number.isNaN(Number(exp)) ? Number(exp) : undefined;

  const filters: JobFilters = {
    q: q || undefined,
    type: OPPORTUNITY_VALUES.includes(type) ? (type as OpportunityType) : "all",
    city: CITY_VALUES.includes(city) ? city : undefined,
    domain: domain || undefined,
    contractType: CONTRACT_VALUES.includes(contract) ? (contract as ContractType) : undefined,
    workMode: WORK_MODE_VALUES.includes(mode) ? (mode as WorkMode) : "all",
    experienceMax: expNumber,
    sort: sort === "deadline" ? "deadline" : "recent",
  };

  const jobs = searchJobs(filters);

  // Les domaines proposés se limitent aux secteurs réellement représentés,
  // pour ne jamais offrir un filtre qui ne renverrait rien.
  const sectors = new Set(getOrganizations().map((o) => o.sector));

  const filterDefs: FilterDef[] = [
    ...(forcedType
      ? []
      : [
          {
            name: "type",
            label: "Type d'opportunité",
            allLabel: "Tous les types",
            options: OPPORTUNITY_TYPES.map((t) => ({ value: t, label: OPPORTUNITY_TYPE_LABEL[t] })),
          },
        ]),
    {
      name: "city",
      label: "Ville",
      allLabel: "Toutes les villes",
      options: CITIES.map((c) => ({ value: c, label: c })),
    },
    {
      name: "domain",
      label: "Domaine d'activité",
      allLabel: "Tous les domaines",
      options: DOMAINS.filter((d) => sectors.has(d)).map((d) => ({ value: d, label: d })),
    },
    {
      name: "contract",
      label: "Type de contrat",
      allLabel: "Tous les contrats",
      options: CONTRACT_TYPES.map((c) => ({ value: c, label: CONTRACT_TYPE_LABEL[c] })),
    },
    {
      name: "mode",
      label: "Mode de travail",
      allLabel: "Tous les modes",
      options: WORK_MODES.map((m) => ({ value: m, label: WORK_MODE_LABEL[m] })),
    },
    {
      name: "exp",
      label: "Votre expérience",
      allLabel: "Toute expérience",
      options: EXPERIENCE_BUCKETS.map((b) => ({ value: b.value, label: b.label })),
    },
  ];

  const sortDef: FilterDef = {
    name: "sort",
    label: "Trier les résultats",
    allLabel: "Plus récentes",
    options: [{ value: "deadline", label: "Date limite proche" }],
  };

  const values: Record<string, string> = {
    q,
    city,
    domain,
    contract,
    mode,
    exp,
    sort,
    ...(forcedType ? {} : { type }),
  };

  /** Champs à reconduire dans la barre de recherche pour ne rien perdre. */
  const carried = Object.entries(values).filter(([k, v]) => k !== "q" && Boolean(v));

  return (
    <>
      {/* ---- En-tête et recherche principale ---- */}
      <section className="relative isolate overflow-hidden">
        <Backdrop />
        <div className="sira-container relative pb-9 pt-12 md:pt-16">
          <div className="max-w-3xl">
            <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[var(--color-text)] md:text-[36px]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-text-muted)]">
              {description}
            </p>

            <form method="get" action={basePath} className="mt-7" role="search">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 px-3 backdrop-blur-sm transition-colors focus-within:border-[var(--color-primary)]">
                  <IconSearch size={16} className="shrink-0 text-[var(--color-text-subtle)]" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={q}
                    aria-label="Rechercher une opportunité"
                    placeholder="Métier, compétence ou entreprise"
                    className="h-10 w-full bg-transparent text-[13.5px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)]"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 px-3 backdrop-blur-sm transition-colors focus-within:border-[var(--color-primary)] sm:w-48">
                  <IconMapPin size={16} className="shrink-0 text-[var(--color-text-subtle)]" />
                  <select
                    name="city"
                    aria-label="Localisation"
                    defaultValue={city}
                    className="h-10 w-full bg-transparent text-[13.5px] text-[var(--color-text)] outline-none"
                  >
                    <option value="">Toutes les villes</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="h-10 shrink-0 rounded-md bg-[var(--color-primary)] px-5 text-[13.5px] font-medium text-[var(--color-primary-fg)] transition-colors hover:bg-[var(--color-primary-hover)]"
                >
                  Rechercher
                </button>
              </div>
              {carried
                .filter(([k]) => k !== "city")
                .map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
            </form>
          </div>
        </div>
      </section>

      {/* ---- Barre de filtres, collante sous l'en-tête du site ---- */}
      <FilterBar
        basePath={basePath}
        values={values}
        filters={filterDefs}
        sort={sortDef}
        extraHidden={forcedType ? { type: forcedType } : undefined}
      />

      <ActiveChips basePath={basePath} values={values} filters={filterDefs} />

      {/* ---- Résultats ---- */}
      <div className="sira-container pb-16 pt-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[14px] font-medium text-[var(--color-text)]" aria-live="polite">
            {countLabel(jobs.length)}
          </p>
          <p className="text-[12.5px] text-[var(--color-text-subtle)]">
            {sort === "deadline" ? "Triées par date limite" : "Triées par date de publication"}
          </p>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={<IllustrationNoResults size={190} />}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <ButtonLink href={basePath} variant="outline">
                Réinitialiser les filtres
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-3 xl:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} organization={getJobOrganization(job)} />
              </li>
            ))}
          </ul>
        )}

        {jobs.length > 0 ? (
          <p className="mt-8 border-t border-[var(--color-border)] pt-4 text-[12.5px] leading-relaxed text-[var(--color-text-subtle)]">
            Seules les offres publiées apparaissent ici. Une offre expirée, suspendue ou clôturée quitte
            automatiquement la liste.
          </p>
        ) : null}
      </div>
    </>
  );
}
