"use client";

/**
 * Filtres et résultats de la recherche de talents — [T §7.5], fonction Pro.
 *
 * Confidentialité, arbitrage C7 : les profils invisibles n'apparaissent jamais,
 * les autres sont affichés sans identité ni coordonnées. Le déblocage passe par
 * une candidature sur une offre de l'organisation ou par l'acceptation d'une
 * prise de contact.
 *
 * Les critères sont portés par l'adresse (`?q=`, `?competence=`, `?domaine=`,
 * `?experience=`, `?ville=`, `?dispo=`, `?niveau=`, `?type=`). En export
 * statique, `RecruiterTalentSearchFromUrl` les lit dans le navigateur ;
 * `RecruiterTalentSearch` sans critère sert de rendu de repli.
 *
 * Direction épurée : le vivier se lit comme une liste à filets, sans carte
 * empilée ni ombre, la couleur réservée aux actions et aux signaux.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { route } from "@/lib/base-path";
import {
  MESSAGE_TEMPLATES,
  getRecruiterPipeline,
  getTalentPool,
  type RecruiterTalent,
} from "./recruiter-data";
import { ContactPanel } from "./recruiter-actions";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Tag,
  relativeDays,
} from "./ui";
import { IconSearch, IconShield } from "./icons";
import {
  AVAILABILITIES,
  CITIES,
  DOMAINS,
  EDUCATION_LEVELS,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABEL,
  PROFILE_VISIBILITY_LABEL,
  type OpportunityType,
} from "@/lib/enums";
import { IllustrationNoResults } from "./illustrations";

const EXPERIENCE_FILTERS = [
  { value: "", label: "Toute expérience" },
  { value: "0", label: "Débutant, moins de 1 an" },
  { value: "1", label: "1 an et plus" },
  { value: "3", label: "3 ans et plus" },
  { value: "6", label: "6 ans et plus" },
  { value: "10", label: "Plus de 10 ans" },
];

/** Noms exacts des paramètres d'adresse lus par la recherche. */
const FILTER_KEYS = ["q", "competence", "domaine", "experience", "ville", "dispo", "niveau", "type"] as const;

type TalentFilters = Record<(typeof FILTER_KEYS)[number], string>;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matches(talent: RecruiterTalent, f: TalentFilters): boolean {
  if (f.q) {
    const haystack = normalize(
      [talent.headline, talent.domain, talent.skills.join(" "), talent.city].join(" "),
    );
    if (!haystack.includes(normalize(f.q))) return false;
  }
  if (f.competence) {
    const needle = normalize(f.competence);
    if (!talent.skills.some((s) => normalize(s).includes(needle))) return false;
  }
  if (f.domaine && talent.domain !== f.domaine) return false;
  if (f.experience && talent.experienceYears < Number(f.experience)) return false;
  if (f.ville && talent.city !== f.ville && !talent.mobility.includes(f.ville)) return false;
  if (f.dispo && talent.availability !== f.dispo) return false;
  if (f.niveau && talent.educationLevel !== f.niveau) return false;
  if (f.type && !talent.opportunityTypes.includes(f.type as OpportunityType)) return false;
  return true;
}

/** Lit les critères dans l'adresse. À rendre sous un `<Suspense>`. */
export function RecruiterTalentSearchFromUrl() {
  const params = useSearchParams();
  const criteria: Partial<TalentFilters> = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value !== null) criteria[key] = value;
  }
  return <RecruiterTalentSearch {...criteria} />;
}

export function RecruiterTalentSearch(criteria: Partial<TalentFilters>) {
  const filters: TalentFilters = {
    q: criteria.q ?? "",
    competence: criteria.competence ?? "",
    domaine: criteria.domaine ?? "",
    experience: criteria.experience ?? "",
    ville: criteria.ville ?? "",
    dispo: criteria.dispo ?? "",
    niveau: criteria.niveau ?? "",
    type: criteria.type ?? "",
  };

  const pool = getRecruiterPipeline();
  const applicants = new Set(pool.map((a) => a.talent.id));

  const all = getTalentPool();
  const matching = all.filter((t) => matches(t, filters));
  const hidden = matching.filter((t) => t.visibility === "invisible");
  const results = matching
    .filter((t) => t.visibility !== "invisible")
    .sort((a, b) => b.experienceYears - a.experienceYears);

  const hasFilters = Object.values(filters).some((v) => v !== "");

  return (
    <>
      {/* ---- Filtres ---- */}
      <section aria-labelledby="filtres" className="border-t border-[var(--color-border)] pt-7">
        <h2 id="filtres" className="text-[17px] font-semibold text-[var(--color-text)]">
          Filtres
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Croisez les critères pour resserrer le vivier.
        </p>

        <form
          key={FILTER_KEYS.map((k) => filters[k]).join("|")}
          method="get"
          action={route("/recruteur/talents")}
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Mot-clé" htmlFor="t-q" hint="Métier, secteur, mot du titre de profil.">
            <Input id="t-q" name="q" defaultValue={filters.q} placeholder="logistique, entrepôt…" />
          </Field>

          <Field label="Compétence" htmlFor="t-competence">
            <Input
              id="t-competence"
              name="competence"
              defaultValue={filters.competence}
              placeholder="Gestion de stock"
            />
          </Field>

          <Field label="Domaine" htmlFor="t-domaine">
            <Select id="t-domaine" name="domaine" defaultValue={filters.domaine}>
              <option value="">Tous les domaines</option>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Expérience" htmlFor="t-experience">
            <Select id="t-experience" name="experience" defaultValue={filters.experience}>
              {EXPERIENCE_FILTERS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Localisation" htmlFor="t-ville" hint="Ville de résidence ou zone de mobilité déclarée.">
            <Select id="t-ville" name="ville" defaultValue={filters.ville}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Disponibilité" htmlFor="t-dispo">
            <Select id="t-dispo" name="dispo" defaultValue={filters.dispo}>
              <option value="">Toutes les disponibilités</option>
              {AVAILABILITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Niveau de formation" htmlFor="t-niveau">
            <Select id="t-niveau" name="niveau" defaultValue={filters.niveau}>
              <option value="">Tous les niveaux</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Type de profil recherché" htmlFor="t-type">
            <Select id="t-type" name="type" defaultValue={filters.type}>
              <option value="">Tous les types</option>
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {OPPORTUNITY_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit">
              <IconSearch size={15} />
              Rechercher
            </Button>
            {hasFilters ? (
              <Link
                href="/recruteur/talents"
                className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Réinitialiser
              </Link>
            ) : null}
            <span className="text-[13px] text-[var(--color-text-muted)]">
              {results.length} profil{results.length > 1 ? "s" : ""} visible{results.length > 1 ? "s" : ""}
            </span>
          </div>
        </form>
      </section>

      {hidden.length > 0 ? (
        <div className="mt-6">
          <Alert tone="neutral" icon={<IconShield size={15} />}>
            {hidden.length} profil{hidden.length > 1 ? "s" : ""} correspond
            {hidden.length > 1 ? "ent" : ""} à votre recherche mais {hidden.length > 1 ? "ne sont" : "n'est"} pas
            affiché{hidden.length > 1 ? "s" : ""} : {hidden.length > 1 ? "leurs titulaires ont" : "son titulaire a"}{" "}
            choisi d&apos;être invisible dans la recherche de talents. Ce choix est respecté sans exception et sans
            contournement possible.
          </Alert>
        </div>
      ) : null}

      <div className="mt-8">
        {results.length === 0 ? (
          <EmptyState
            title="Aucun profil ne correspond à ces critères"
            description="Élargissez la localisation ou le niveau d'expérience. Vous pouvez aussi publier une offre : les candidats qui postulent vous deviennent directement accessibles."
            icon={<IllustrationNoResults size={170} accent="var(--color-zone-recruiter)" />}
            action={
              <Link
                href="/recruteur/talents"
                className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Réinitialiser la recherche
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {results.map((talent) => {
              const unlocked = applicants.has(talent.id);
              return (
                <li key={talent.id} className="py-5">
                  <div className="flex items-start gap-3">
                    <Avatar
                      initials={unlocked ? talent.avatarInitials : talent.anonymousName.replace(/[^A-Z]/g, "")}
                      color={talent.color}
                      size={40}
                      rounded="full"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[var(--color-text)]">
                        {unlocked ? `${talent.firstName} ${talent.lastName}` : talent.anonymousName}
                      </p>
                      <p className="text-[13px] leading-snug text-[var(--color-text-muted)]">{talent.headline}</p>
                    </div>
                    <Badge tone={unlocked ? "success" : "neutral"}>
                      {unlocked ? "Coordonnées ouvertes" : "Profil anonyme"}
                    </Badge>
                  </div>

                  <dl className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-3 lg:grid-cols-6">
                    {[
                      ["Domaine", talent.domain],
                      ["Expérience", `${talent.experienceYears} an(s)`],
                      ["Localisation", talent.city],
                      ["Formation", talent.educationLevel],
                      ["Disponibilité", talent.availability],
                      ["Mobilité", talent.mobility.join(", ")],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-[var(--color-text-subtle)]">{label}</dt>
                        <dd className="text-[var(--color-text)]">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {talent.skills.slice(0, 6).map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {talent.opportunityTypes.map((t) => (
                      <Badge key={t} tone="primary">
                        {OPPORTUNITY_TYPE_LABEL[t]}
                      </Badge>
                    ))}
                    <span className="text-[11.5px] text-[var(--color-text-subtle)]">
                      actif {relativeDays(talent.lastActiveAt)}
                    </span>
                  </div>

                  <p
                    className="mt-3.5 border-l-2 pl-3 text-[12px] leading-relaxed text-[var(--color-text-muted)]"
                    style={{
                      borderLeftColor: unlocked ? "var(--color-success)" : "var(--color-border-strong)",
                    }}
                  >
                    {unlocked
                      ? "Ce candidat a postulé à une de vos offres : son identité et ses coordonnées vous sont ouvertes."
                      : `Réglage du candidat : ${PROFILE_VISIBILITY_LABEL[talent.visibility].toLowerCase()}. Nom, e-mail et téléphone se débloqueront s'il postule à une de vos offres ou s'il accepte votre prise de contact.`}
                  </p>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <ContactPanel
                      displayName={unlocked ? `${talent.firstName} ${talent.lastName}` : talent.anonymousName}
                      templates={MESSAGE_TEMPLATES}
                      unlocked={unlocked}
                      buttonLabel="Contacter"
                      size="sm"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
