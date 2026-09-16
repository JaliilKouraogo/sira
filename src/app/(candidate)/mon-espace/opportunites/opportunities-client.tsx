"use client";

/**
 * Filtres et résultats de la liste des opportunités — [T §6.2].
 *
 * Les filtres restent portés par l'URL et soumis par un simple formulaire GET :
 * la recherche est partageable. Pour que le site puisse être exporté en
 * fichiers statiques, l'adresse est lue ici, dans le navigateur, avec
 * `useSearchParams()`. Les filtres couverts par la couche de données sont
 * délégués à `searchJobs`, les trois autres (pays, métier, fraîcheur) sont
 * appliqués ici sans modifier la couche partagée.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconSearch } from "@/components/icons";
import { IllustrationNoResults } from "@/components/illustrations";
import { JobCard } from "@/components/job-card";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  Select,
  daysUntil,
} from "@/components/ui";
import {
  getJobOrganization,
  getOrganizations,
  getPublishedJobs,
  getSavedJobs,
  getScore,
  searchJobs,
  type JobFilters,
} from "@/data/queries";
import { route } from "@/lib/base-path";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABEL,
  DOMAINS,
  EXPERIENCE_BUCKETS,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
  formatMoney,
  type ContractType,
  type OpportunityType,
  type WorkMode,
} from "@/lib/enums";

const LIST_PATH = "/mon-espace/opportunites";

/** Seuils de salaire proposés au filtre, en FCFA. */
const SALARY_STEPS = [100000, 150000, 200000, 300000, 500000, 750000];

/** Fraîcheur de publication, en jours. */
const FRESHNESS = [
  { value: "1", label: "Dernières 24 heures" },
  { value: "3", label: "3 derniers jours" },
  { value: "7", label: "7 derniers jours" },
  { value: "14", label: "14 derniers jours" },
  { value: "30", label: "30 derniers jours" },
];

/** Expérience : le seuil choisi devient le maximum d'années exigé par l'offre. */
const EXPERIENCE_MAX: Record<string, number> = { "0": 0, "1": 2, "3": 5, "6": 10, "11": 99 };

const SORTS: { value: NonNullable<JobFilters["sort"]>; label: string }[] = [
  { value: "score", label: "Pertinence (score)" },
  { value: "recent", label: "Date de publication" },
  { value: "deadline", label: "Date limite" },
];

const asOpportunityType = (v: string): OpportunityType | undefined =>
  (OPPORTUNITY_TYPES as readonly string[]).includes(v) ? (v as OpportunityType) : undefined;

const asContractType = (v: string): ContractType | undefined =>
  (CONTRACT_TYPES as readonly string[]).includes(v) ? (v as ContractType) : undefined;

const asWorkMode = (v: string): WorkMode | undefined =>
  (WORK_MODES as readonly string[]).includes(v) ? (v as WorkMode) : undefined;

export function OpportunitiesResults() {
  const params = useSearchParams();
  const first = (key: string): string => params.get(key) ?? "";

  const q = first("q").trim();
  const type = asOpportunityType(first("type"));
  const pays = first("pays");
  // `city` est accepté comme synonyme de `ville`, le nom utilisé par la recherche publique.
  const ville = first("ville") || first("city");
  const domaine = first("domaine");
  const metier = first("metier");
  const experience = first("experience");
  const salaire = first("salaire");
  const contrat = asContractType(first("contrat"));
  const mode = asWorkMode(first("mode"));
  const fraicheur = first("date");
  const entreprise = first("entreprise");
  const tri = SORTS.find((s) => s.value === first("tri"))?.value ?? "score";

  // ---- Référentiels alimentés par les offres réellement publiées ----
  const published = getPublishedJobs();
  const countries = [...new Set(published.map((j) => j.country))].sort((a, b) => a.localeCompare(b, "fr"));
  const cities = [...new Set(published.map((j) => j.city))].sort((a, b) => a.localeCompare(b, "fr"));
  const metiers = [...new Set(published.map((j) => j.title))].sort((a, b) => a.localeCompare(b, "fr"));
  const domains = DOMAINS.filter((d) => published.some((j) => getJobOrganization(j)?.sector === d));
  // Une offre anonymisée ne doit jamais trahir son entreprise par un filtre.
  const companies = getOrganizations().filter((o) =>
    published.some((j) => j.organizationId === o.id && j.visibility !== "anonymisee"),
  );

  // ---- Filtres délégués à la couche de données ----
  const results = searchJobs({
    q: q || undefined,
    type: type ?? "all",
    city: ville || undefined,
    domain: domaine || undefined,
    workMode: mode ?? "all",
    contractType: contrat || undefined,
    minSalary: salaire ? Number(salaire) : undefined,
    experienceMax: experience && experience in EXPERIENCE_MAX ? EXPERIENCE_MAX[experience] : undefined,
    organizationId: entreprise || undefined,
    sort: tri,
  })
    // ---- Filtres complémentaires de [T §6.2], appliqués ici ----
    .filter((j) => (pays ? j.country === pays : true))
    .filter((j) => (metier ? j.title === metier : true))
    .filter((j) => (fraicheur ? -daysUntil(j.publishedAt) <= Number(fraicheur) : true));

  const saved = getSavedJobs();
  const activeFilters = [q, type, pays, ville, domaine, metier, experience, salaire, contrat, mode, fraicheur, entreprise].filter(
    (v) => Boolean(v),
  ).length;

  return (
    <>
      {/* ---- Les filtres de [T §6.2], portés par l'URL ---- */}
      <div className="mb-6 border-y border-[var(--color-border)] py-5">
        {/* La clé remonte le formulaire quand l'adresse change, pour que les champs reflètent l'URL. */}
        <form key={params.toString()} method="get" action={route(LIST_PATH)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Rechercher" htmlFor="f-q" hint="Métier, compétence ou entreprise">
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
                  aria-hidden
                >
                  <IconSearch size={16} />
                </span>
                <Input
                  id="f-q"
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder="Responsable logistique, Excel, Sahel Agro…"
                  className="pl-9"
                />
              </div>
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto">
                Rechercher
              </Button>
            </div>
          </div>

          <details open>
            <summary className="cursor-pointer rounded-md px-1 py-1 text-[13px] font-medium text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
              Tous les filtres
              {activeFilters > 0 ? (
                <Badge tone="primary" className="ml-2">
                  {activeFilters} actif{activeFilters > 1 ? "s" : ""}
                </Badge>
              ) : null}
            </summary>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Emploi ou stage" htmlFor="f-type">
                <Select id="f-type" name="type" defaultValue={type ?? ""}>
                  <option value="">Tous les types</option>
                  {OPPORTUNITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {OPPORTUNITY_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Pays" htmlFor="f-pays">
                <Select id="f-pays" name="pays" defaultValue={pays}>
                  <option value="">Tous les pays</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Ville" htmlFor="f-ville">
                <Select id="f-ville" name="ville" defaultValue={ville}>
                  <option value="">Toutes les villes</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Domaine" htmlFor="f-domaine">
                <Select id="f-domaine" name="domaine" defaultValue={domaine}>
                  <option value="">Tous les domaines</option>
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Métier" htmlFor="f-metier">
                <Select id="f-metier" name="metier" defaultValue={metier}>
                  <option value="">Tous les métiers</option>
                  {metiers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Expérience" htmlFor="f-experience" hint="Offres accessibles avec votre expérience">
                <Select id="f-experience" name="experience" defaultValue={experience}>
                  <option value="">Toute expérience</option>
                  {EXPERIENCE_BUCKETS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Salaire minimum" htmlFor="f-salaire">
                <Select id="f-salaire" name="salaire" defaultValue={salaire}>
                  <option value="">Tous les salaires</option>
                  {SALARY_STEPS.map((s) => (
                    <option key={s} value={s}>
                      À partir de {formatMoney(s)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Type de contrat" htmlFor="f-contrat">
                <Select id="f-contrat" name="contrat" defaultValue={contrat ?? ""}>
                  <option value="">Tous les contrats</option>
                  {CONTRACT_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {CONTRACT_TYPE_LABEL[c]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Mode de travail" htmlFor="f-mode">
                <Select id="f-mode" name="mode" defaultValue={mode ?? ""}>
                  <option value="">Tous les modes</option>
                  {WORK_MODES.map((w) => (
                    <option key={w} value={w}>
                      {WORK_MODE_LABEL[w]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Date de publication" htmlFor="f-date">
                <Select id="f-date" name="date" defaultValue={fraicheur}>
                  <option value="">Depuis toujours</option>
                  {FRESHNESS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Entreprise" htmlFor="f-entreprise">
                <Select id="f-entreprise" name="entreprise" defaultValue={entreprise}>
                  <option value="">Toutes les organisations</option>
                  {companies.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.tradeName ?? o.legalName}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Trier par" htmlFor="f-tri">
                <Select id="f-tri" name="tri" defaultValue={tri}>
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm">
                Appliquer les filtres
              </Button>
              <Link
                href={LIST_PATH}
                className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              >
                Réinitialiser
              </Link>
            </div>
          </details>
        </form>
      </div>

      {/* ---- Résultats ---- */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13.5px] font-semibold text-[var(--color-text)]" aria-live="polite">
          {results.length} offre{results.length > 1 ? "s" : ""}
          {activeFilters > 0 ? " correspondant à votre recherche" : " publiées"}
        </h2>
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Tri&nbsp;: {SORTS.find((s) => s.value === tri)?.label.toLowerCase()}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {results.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              organization={getJobOrganization(job)}
              score={getScore(job.id)}
              href={`${LIST_PATH}/${job.id}`}
              saved={saved.some((s) => s.job.id === job.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<IllustrationNoResults size={180} accent="var(--color-zone-candidate)" />}
          title="Aucune offre ne correspond à votre recherche"
          description="Élargissez la zone géographique, retirez le filtre de salaire ou revenez dans quelques jours : de nouvelles offres sont publiées chaque semaine."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href={LIST_PATH} size="sm">
                Réinitialiser les filtres
              </ButtonLink>
              <ButtonLink href="/mon-espace/profil" variant="outline" size="sm">
                Ajuster mes préférences
              </ButtonLink>
            </div>
          }
        />
      )}
    </>
  );
}
