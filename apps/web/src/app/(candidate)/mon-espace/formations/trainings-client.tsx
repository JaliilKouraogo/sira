"use client";

/**
 * Catalogue des formations de l'espace candidat — [T §6.8].
 *
 * Cinq onglets et cinq filtres, tous portés par l'URL. Pour l'export statique,
 * l'adresse est lue dans le navigateur avec `useSearchParams()`. Sur les
 * onglets de recommandation, chaque formation dit explicitement **quelle
 * lacune elle comble** et sur quelle offre cette lacune a été détectée : une
 * recommandation sans motif n'est pas une recommandation.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SimulatedActionBar } from "@/components/account-actions";
import { PremiumTag, TabLinks } from "@/components/account-shared";
import { buildQuery } from "@/components/filter-bar";
import { IconClock, IconMapPin, IconStar } from "@/components/icons";
import { IllustrationNoTrainings } from "@/components/illustrations";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Tag,
  cx,
  formatDate,
} from "@/components/ui";
import {
  getAllScores,
  getJobById,
  getOrganization,
  getRecommendedTrainings,
  getTrainings,
} from "@/data/queries";
import { route } from "@/lib/base-path";
import {
  TRAINING_ACCESS_LABEL,
  TRAINING_FORMATS,
  TRAINING_FORMAT_LABEL,
  formatMoney,
} from "@/lib/enums";
import type { Training } from "@/lib/types";

const PAGE_PATH = "/mon-espace/formations";

type TabKey = "recommandees" | "score" | "gratuites" | "partenaires" | "toutes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "recommandees", label: "Recommandées pour moi" },
  { key: "score", label: "Pour améliorer mon score" },
  { key: "gratuites", label: "Gratuites" },
  { key: "partenaires", label: "Partenaires" },
  { key: "toutes", label: "Toutes" },
];

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;

const DURATIONS: { value: string; label: string; test: (hours: number) => boolean }[] = [
  { value: "court", label: "20 h ou moins", test: (h) => h <= 20 },
  { value: "moyen", label: "De 21 à 40 h", test: (h) => h > 20 && h <= 40 },
  { value: "long", label: "Plus de 40 h", test: (h) => h > 40 },
];

export function TrainingsCatalog() {
  const params = useSearchParams();
  const first = (key: string): string => params.get(key) ?? "";

  const requested = first("onglet");
  const current: TabKey = TABS.some((tab) => tab.key === requested) ? (requested as TabKey) : "recommandees";

  const categorie = first("categorie");
  const niveau = first("niveau");
  const duree = first("duree");
  const format = first("format");
  const certificat = first("certificat");
  const focus = first("focus");

  const all = getTrainings();
  const recommended = getRecommendedTrainings();

  /** Où chaque lacune a-t-elle été détectée ? Une lacune vient d'une offre. */
  const gapOrigins = new Map<string, string[]>();
  const cappingGaps = new Set<string>();
  for (const score of getAllScores()) {
    const job = getJobById(score.jobId);
    for (const gap of score.gaps) {
      const origins = gapOrigins.get(gap) ?? [];
      if (job && !origins.includes(job.title)) origins.push(job.title);
      gapOrigins.set(gap, origins);
      if (score.score < 75) cappingGaps.add(gap);
    }
  }

  const gapsOf = (training: Training) =>
    recommended.find((item) => item.training.id === training.id)?.matchedGaps ?? [];

  // ---- Jeu de base selon l'onglet -----------------------------------------
  let base: Training[];
  switch (current) {
    case "recommandees":
      base = recommended.map((item) => item.training);
      break;
    case "score":
      base = recommended
        .filter((item) => item.matchedGaps.some((gap) => cappingGaps.has(gap)))
        .map((item) => item.training);
      break;
    case "gratuites":
      base = all.filter((training) => training.access === "public_gratuit");
      break;
    case "partenaires":
      base = all.filter((training) => getOrganization(training.organizationId)?.isPartner);
      break;
    default:
      base = all;
  }

  // ---- Filtres ------------------------------------------------------------
  const duration = DURATIONS.find((item) => item.value === duree);
  const visible = base.filter((training) => {
    if (categorie && training.category !== categorie) return false;
    if (niveau && training.level !== niveau) return false;
    if (format && training.format !== format) return false;
    if (duration && !duration.test(training.durationHours)) return false;
    if (certificat === "oui" && !training.certificate) return false;
    return true;
  });

  const categories = Array.from(new Set(all.map((training) => training.category))).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  const filters = { categorie, niveau, duree, format, certificat };
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const focused = focus ? all.find((training) => training.id === focus) : undefined;

  const tabs = TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `${PAGE_PATH}${buildQuery({ onglet: tab.key, ...filters })}`,
    count:
      tab.key === "recommandees"
        ? recommended.length
        : tab.key === "score"
          ? recommended.filter((item) => item.matchedGaps.some((gap) => cappingGaps.has(gap))).length
          : tab.key === "gratuites"
            ? all.filter((training) => training.access === "public_gratuit").length
            : tab.key === "partenaires"
              ? all.filter((training) => getOrganization(training.organizationId)?.isPartner).length
              : all.length,
  }));

  return (
    <>
      <TabLinks tabs={tabs} current={current} label="Filtrer les formations par catégorie d'accès" />

      {/* ---------------- Explication de l'onglet ---------------- */}
      {current === "recommandees" ? (
        <Alert tone="info" title="Pourquoi ces formations">
          Elles couvrent les compétences qui manquent à votre profil sur les offres analysées. Chaque carte indique la
          lacune comblée et l&apos;offre où elle a été détectée.
        </Alert>
      ) : null}
      {current === "score" ? (
        <Alert tone="warning" title="Ces formations font monter vos scores">
          Ne figurent ici que les formations qui répondent à une lacune constatée sur une offre où votre score reste
          sous 75 %. Le gain annoncé est une estimation : il dépend aussi du reste de votre profil.
        </Alert>
      ) : null}
      {current === "partenaires" ? (
        <Alert tone="info" title="Organismes partenaires de SIRA">
          Ces formations sont dispensées par des organismes dont SIRA a vérifié les agréments.
        </Alert>
      ) : null}

      {/* ---------------- Formation mise en avant depuis un score ---------------- */}
      {focused ? (
        <div className="mt-4">
          <Alert tone="primary" title="Formation ciblée depuis votre analyse de score">
            <p className="text-[13.5px] text-[var(--color-text)]">
              <strong className="font-semibold">{focused.title}</strong> — {focused.summary}
            </p>
            {gapsOf(focused).length > 0 ? (
              <p className="mt-1.5 text-[12.5px] text-[var(--color-text-muted)]">
                Comble : {gapsOf(focused).join(", ")}.
              </p>
            ) : null}
          </Alert>
        </div>
      ) : null}

      {/* ---------------- Filtres ---------------- */}
      {/* La clé remonte le formulaire quand l'adresse change, pour que les champs reflètent l'URL. */}
      <form key={params.toString()} method="get" action={route(PAGE_PATH)} className="mt-5">
        <input type="hidden" name="onglet" value={current} />
        <div className="border-y border-[var(--color-border)] py-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-[14px] font-semibold text-[var(--color-text)]">Affiner</p>
            {activeFilters > 0 ? (
              <Link
                href={`${PAGE_PATH}${buildQuery({ onglet: current })}`}
                className="text-[12.5px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Tout effacer ({activeFilters})
              </Link>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label htmlFor="f-categorie" className="block text-[12.5px] font-medium text-[var(--color-text)]">
                Catégorie
              </label>
              <Select id="f-categorie" name="categorie" defaultValue={categorie}>
                <option value="">Toutes</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="f-niveau" className="block text-[12.5px] font-medium text-[var(--color-text)]">
                Niveau
              </label>
              <Select id="f-niveau" name="niveau" defaultValue={niveau}>
                <option value="">Tous</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="f-duree" className="block text-[12.5px] font-medium text-[var(--color-text)]">
                Durée
              </label>
              <Select id="f-duree" name="duree" defaultValue={duree}>
                <option value="">Toutes</option>
                {DURATIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="f-format" className="block text-[12.5px] font-medium text-[var(--color-text)]">
                Format
              </label>
              <Select id="f-format" name="format" defaultValue={format}>
                <option value="">Tous</option>
                {TRAINING_FORMATS.map((item) => (
                  <option key={item} value={item}>
                    {TRAINING_FORMAT_LABEL[item]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="f-certificat" className="block text-[12.5px] font-medium text-[var(--color-text)]">
                Certificat
              </label>
              <Select id="f-certificat" name="certificat" defaultValue={certificat}>
                <option value="">Peu importe</option>
                <option value="oui">Avec attestation</option>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Appliquer
            </Button>
          </div>
        </div>
      </form>

      {/* ---------------- Résultats ---------------- */}
      <p className="mt-5 mb-3 text-[13px] text-[var(--color-text-muted)]">
        {visible.length} formation{visible.length > 1 ? "s" : ""} affichée{visible.length > 1 ? "s" : ""}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={<IllustrationNoTrainings size={180} accent="var(--color-zone-candidate)" />}
          title="Aucune formation ne correspond"
          description="Élargissez vos filtres, ou consultez l'onglet « Toutes » pour parcourir le catalogue complet."
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              gaps={current === "recommandees" || current === "score" ? gapsOf(training) : []}
              gapOrigins={gapOrigins}
              highlighted={training.id === focus}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function TrainingCard({
  training,
  gaps,
  gapOrigins,
  highlighted,
}: {
  training: Training;
  gaps: string[];
  gapOrigins: Map<string, string[]>;
  highlighted?: boolean;
}) {
  const organization = getOrganization(training.organizationId);
  const accessTone = training.access === "public_gratuit" ? "success" : training.access === "inclus_premium" ? "accent" : "neutral";
  const seatsLeft = training.seats !== undefined && training.seatsTaken !== undefined ? training.seats - training.seatsTaken : undefined;

  return (
    <Card
      as="li"
      className={cx("flex flex-col", highlighted ? "border-[var(--color-primary)]" : undefined)}
    >
      <div className="flex-1 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[14.5px] font-semibold leading-snug text-[var(--color-text)]">{training.title}</h3>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              {organization?.tradeName ?? organization?.legalName ?? "Organisme"}
              {organization?.isPartner ? " · partenaire SIRA" : ""}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <Badge tone={accessTone}>{TRAINING_ACCESS_LABEL[training.access]}</Badge>
            {training.access === "inclus_premium" ? <PremiumTag /> : null}
          </span>
        </div>

        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">{training.summary}</p>

        {gaps.length > 0 ? (
          <div className="mt-3 rounded-r border-l-2 border-[var(--color-accent)] bg-[var(--color-surface-2)] px-3 py-2.5">
            <p className="text-[12.5px] font-semibold text-[var(--color-text)]">
              Comble {gaps.length > 1 ? "ces lacunes" : "cette lacune"} :
            </p>
            <ul className="mt-1.5 space-y-1">
              {gaps.map((gap) => {
                const origins = gapOrigins.get(gap) ?? [];
                return (
                  <li key={gap} className="text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                    <strong className="font-semibold text-[var(--color-text)]">{gap}</strong>
                    {origins.length > 0 ? ` — détectée sur ${origins.join(", ")}` : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <IconClock size={13} />
            {training.durationHours} h
          </span>
          <span className="inline-flex items-center gap-1">
            <IconMapPin size={13} />
            {TRAINING_FORMAT_LABEL[training.format]}
          </span>
          {training.rating ? (
            <span className="inline-flex items-center gap-1 text-[var(--color-accent-text)]">
              <IconStar size={12} />
              {training.rating.toFixed(1)}
            </span>
          ) : null}
          {training.startDate ? <span>Début le {formatDate(training.startDate)}</span> : null}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Tag>{training.category}</Tag>
          <Tag>{training.level}</Tag>
          {training.certificate ? <Badge tone="success">Attestation</Badge> : null}
          {seatsLeft !== undefined && seatsLeft <= 6 ? (
            <Badge tone="warning">Plus que {seatsLeft} places</Badge>
          ) : null}
        </div>

        {training.skillsCovered.length > 0 ? (
          <p className="mt-2.5 text-[12px] text-[var(--color-text-subtle)]">
            Compétences visées : {training.skillsCovered.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] p-4">
        <span className="text-[13.5px] font-semibold text-[var(--color-text)]">
          {training.access === "payant" ? formatMoney(training.price) : TRAINING_ACCESS_LABEL[training.access]}
        </span>
        <SimulatedActionBar
          actions={[
            {
              label: training.access === "inclus_premium" ? "Passer Premium pour m'inscrire" : "M'inscrire",
              variant: training.access === "inclus_premium" ? "accent" : "primary",
              message:
                training.access === "inclus_premium"
                  ? "Cette formation est incluse dans l'abonnement Premium. L'inscription se ferait après le passage à Premium, sans frais supplémentaires."
                  : `Votre demande d'inscription à « ${training.title} » serait transmise à l'organisme, qui vous confirmerait la place.`,
            },
            {
              label: "Détails",
              message: `La fiche complète de « ${training.title} » présente le programme, les prérequis et les sessions à venir.`,
              tone: "info",
            },
          ]}
        />
      </div>
    </Card>
  );
}
