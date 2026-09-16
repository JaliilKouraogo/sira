"use client";

/**
 * Formulaire de publication et d'édition d'offre — [T §7.3].
 * Parcours en cinq étapes, prévisualisation en direct de la carte d'offre,
 * et rappel de la politique de vérification avant publication.
 *
 * Aucun backend : « Enregistrer le brouillon » et « Publier » affichent le
 * résultat qu'aurait l'appel `POST /jobs` selon l'état de l'organisation.
 */

import { useState, type ReactNode } from "react";
import {
  APPLICATION_CHANNELS,
  APPLICATION_CHANNEL_LABEL,
  CITIES,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABEL,
  EDUCATION_LEVELS,
  JOB_VISIBILITIES,
  JOB_VISIBILITY_LABEL,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
  type ApplicationChannel,
  type ContractType,
  type JobStatus,
  type JobVisibility,
  type OpportunityType,
  type VerificationStatus,
  type WorkMode,
} from "@/lib/enums";
import type { Job, Organization } from "@/lib/types";
import { JobCard } from "./job-card";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  cx,
} from "./ui";
import { IconAlert, IconCheck, IconClose, IconPlus, IconSparkles } from "./icons";

const STEPS = [
  { id: 1, label: "Le poste" },
  { id: 2, label: "Le contenu" },
  { id: 3, label: "Le profil recherché" },
  { id: 4, label: "Conditions et candidature" },
  { id: 5, label: "Publication" },
];

const DOCUMENT_OPTIONS = [
  "CV",
  "Lettre de motivation",
  "Copie des diplômes",
  "Attestations de travail",
  "Pièce d'identité",
  "Convention de stage",
  "Portfolio ou dépôt de code",
  "Casier judiciaire",
];

// --------------------------------------------------------------------------
// Saisies composées
// --------------------------------------------------------------------------

function TagInput({
  label,
  hint,
  values,
  onChange,
  placeholder,
  tone = "neutral",
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  tone?: "neutral" | "primary" | "warning";
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
        />
        <Button variant="outline" onClick={add} className="shrink-0">
          <IconPlus size={14} />
          Ajouter
        </Button>
      </div>
      {values.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li key={v}>
              <span
                className={cx(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium",
                  tone === "primary"
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : tone === "warning"
                      ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
                )}
              >
                {v}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`Retirer ${v}`}
                  className="ml-0.5 rounded-full hover:opacity-70"
                >
                  <IconClose size={12} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  );
}

function ListInput({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <ul className="space-y-2">
        {values.map((value, index) => (
          <li key={index} className="flex gap-2">
            <span
              className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]"
              aria-hidden
            />
            <Input
              value={value}
              onChange={(e) => {
                const next = [...values];
                next[index] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              aria-label={`${label}, ligne ${index + 1}`}
            />
            <Button
              variant="ghost"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Supprimer la ligne ${index + 1}`}
              className="shrink-0"
            >
              <IconClose size={15} />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={() => onChange([...values, ""])} className="mt-2">
        <IconPlus size={14} />
        Ajouter une ligne
      </Button>
    </Field>
  );
}

// --------------------------------------------------------------------------
// Formulaire
// --------------------------------------------------------------------------

export function RecruiterJobForm({
  initial,
  organization,
  verificationStatus,
  policy,
  mode,
}: {
  initial?: Job;
  organization: Organization;
  verificationStatus: VerificationStatus;
  policy?: ReactNode;
  mode: "create" | "edit";
}) {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning" | "info"; text: string } | null>(null);

  // 1. Le poste
  const [title, setTitle] = useState(initial?.title ?? "");
  const [opportunityType, setOpportunityType] = useState<OpportunityType>(initial?.opportunityType ?? "emploi");
  const [contractType, setContractType] = useState<ContractType>(initial?.contractType ?? "cdi");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [city, setCity] = useState<string>(initial?.city ?? CITIES[0]);
  const [workMode, setWorkMode] = useState<WorkMode>(initial?.workMode ?? "presentiel");

  // 2. Le contenu
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [missions, setMissions] = useState<string[]>(initial?.missions ?? [""]);
  const [responsibilities, setResponsibilities] = useState<string[]>(initial?.responsibilities ?? []);

  // 3. Le profil recherché
  const [requiredSkills, setRequiredSkills] = useState<string[]>(initial?.requiredSkills ?? []);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>(initial?.niceToHaveSkills ?? []);
  const [blockingCriteria, setBlockingCriteria] = useState<string[]>(initial?.blockingCriteria ?? []);
  const [educationLevel, setEducationLevel] = useState<string>(initial?.educationLevel ?? EDUCATION_LEVELS[5]);
  const [experienceYears, setExperienceYears] = useState(String(initial?.experienceYears ?? 0));

  // 4. Conditions et candidature
  const [salaryMin, setSalaryMin] = useState(initial?.salaryMin ? String(initial.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState(initial?.salaryMax ? String(initial.salaryMax) : "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(initial?.requiredDocuments ?? ["CV"]);
  const [applicationChannel, setApplicationChannel] = useState<ApplicationChannel>(
    initial?.applicationChannel ?? "sira",
  );
  const [applicationTarget, setApplicationTarget] = useState(initial?.applicationTarget ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [visibility, setVisibility] = useState<JobVisibility>(initial?.visibility ?? "publique");

  const canPublish = verificationStatus === "verifie" || verificationStatus === "en_verification";
  const publishLabel =
    verificationStatus === "verifie"
      ? "Publier immédiatement"
      : verificationStatus === "en_verification"
        ? "Envoyer en validation"
        : "Publication impossible";

  const previewStatus: JobStatus =
    verificationStatus === "verifie" ? "publiee" : verificationStatus === "en_verification" ? "en_validation" : "brouillon";

  const draftJob: Job = {
    id: initial?.id ?? "job_draft",
    slug: initial?.slug ?? "apercu",
    organizationId: organization.id,
    title: title.trim() || "Intitulé du poste",
    opportunityType,
    contractType,
    department: department.trim() || undefined,
    country: "Burkina Faso",
    city,
    workMode,
    summary: summary.trim() || "Le résumé apparaîtra ici, sous le titre de l'offre.",
    description,
    missions: missions.filter(Boolean),
    responsibilities: responsibilities.filter(Boolean),
    requiredSkills,
    niceToHaveSkills,
    blockingCriteria,
    educationLevel,
    experienceYears: Number(experienceYears) || 0,
    languages: initial?.languages ?? [{ name: "Français", level: "Courant" }],
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    salaryMax: salaryMax ? Number(salaryMax) : undefined,
    deadline: deadline || "2026-12-31",
    requiredDocuments,
    applicationChannel,
    applicationTarget: applicationTarget.trim() || undefined,
    contact: contact.trim() || undefined,
    visibility,
    origin: "native",
    status: initial?.status ?? previewStatus,
    publishedAt: initial?.publishedAt ?? "2026-09-12",
    viewCount: initial?.viewCount ?? 0,
    applicationCount: initial?.applicationCount ?? 0,
  };

  const missingRequired = [
    !title.trim() && "l'intitulé du poste",
    !description.trim() && "la description",
    missions.filter(Boolean).length === 0 && "au moins une mission",
    requiredSkills.length === 0 && "au moins une compétence requise",
    !deadline && "la date limite",
  ].filter((x): x is string => typeof x === "string");

  function toggleDocument(doc: string) {
    setRequiredDocuments((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));
  }

  function saveDraft() {
    setFeedback({
      tone: "info",
      text:
        mode === "create"
          ? "Brouillon enregistré. L'offre reste invisible du public et vous pouvez la reprendre depuis « Mes offres »."
          : "Modifications enregistrées dans le brouillon de travail. L'offre en ligne n'est pas encore mise à jour.",
    });
  }

  function publish() {
    if (!canPublish) {
      setFeedback({
        tone: "warning",
        text: "Votre organisation n'est pas vérifiée : seul l'enregistrement en brouillon est possible. Déposez vos justificatifs depuis la fiche entreprise.",
      });
      return;
    }
    if (missingRequired.length > 0) {
      setFeedback({
        tone: "warning",
        text: `Il manque ${missingRequired.join(", ")} avant de pouvoir publier.`,
      });
      return;
    }
    setFeedback({
      tone: "success",
      text:
        verificationStatus === "verifie"
          ? "Offre publiée. Elle est en ligne immédiatement avec le badge vérifié et reste soumise à la modération a posteriori."
          : "Offre envoyée en validation. Un administrateur la contrôle sous 24 à 48 heures ouvrées avant sa mise en ligne.",
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-5">
        {/* Étapes */}
        <nav aria-label="Étapes du formulaire">
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  aria-current={step === s.id ? "step" : undefined}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    step === s.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]",
                  )}
                >
                  <span
                    className={cx(
                      "inline-flex h-4.5 w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums",
                      step === s.id
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                        : "bg-[var(--color-surface-3)] text-[var(--color-text-subtle)]",
                    )}
                  >
                    {s.id}
                  </span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <Card>
          <CardHeader
            title={`Étape ${step} sur ${STEPS.length} — ${STEPS[step - 1].label}`}
            subtitle={
              step === 1
                ? "Ce qui identifie le poste et permet de le retrouver dans la recherche."
                : step === 2
                  ? "Ce que le candidat lira. Soyez concret : les missions font la différence sur le taux de candidature."
                  : step === 3
                    ? "Ce qui alimente le score de compatibilité affiché aux candidats."
                    : step === 4
                      ? "Rémunération, délai, pièces demandées et canal de réception."
                      : "Vérifiez, puis choisissez ce que vous faites de cette offre."
            }
          />

          <div className="space-y-5 p-4">
            {/* ---------------- Étape 1 : le poste ---------------- */}
            {step === 1 ? (
              <>
                <Field label="Intitulé du poste" required htmlFor="job-title" hint="Le titre tel qu'il apparaîtra dans les résultats de recherche.">
                  <Input
                    id="job-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Responsable logistique"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Type d'opportunité" required htmlFor="job-type">
                    <Select
                      id="job-type"
                      value={opportunityType}
                      onChange={(e) => setOpportunityType(e.target.value as OpportunityType)}
                    >
                      {OPPORTUNITY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {OPPORTUNITY_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Type de contrat" required htmlFor="job-contract">
                    <Select
                      id="job-contract"
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value as ContractType)}
                    >
                      {CONTRACT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {CONTRACT_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Département ou service" htmlFor="job-department" hint="Facultatif.">
                    <Input
                      id="job-department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Supply chain"
                    />
                  </Field>

                  <Field label="Localisation" required htmlFor="job-city">
                    <Select id="job-city" value={city} onChange={(e) => setCity(e.target.value)}>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Mode de travail" required htmlFor="job-workmode">
                    <Select
                      id="job-workmode"
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    >
                      {WORK_MODES.map((m) => (
                        <option key={m} value={m}>
                          {WORK_MODE_LABEL[m]}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Pays" htmlFor="job-country">
                    <Input id="job-country" value="Burkina Faso" readOnly aria-readonly />
                  </Field>
                </div>
              </>
            ) : null}

            {/* ---------------- Étape 2 : le contenu ---------------- */}
            {step === 2 ? (
              <>
                <Field
                  label="Résumé"
                  htmlFor="job-summary"
                  hint="Deux lignes maximum, affichées sur la carte d'offre."
                >
                  <Textarea
                    id="job-summary"
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Piloter les flux entrants et sortants de l'unité et encadrer une équipe de 12 personnes."
                  />
                </Field>

                <Field label="Description du poste" required htmlFor="job-description">
                  <Textarea
                    id="job-description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contexte du poste, rattachement hiérarchique, environnement de travail…"
                  />
                </Field>

                <ListInput
                  label="Missions"
                  hint="Une mission par ligne. C'est la rubrique la plus lue par les candidats."
                  values={missions}
                  onChange={setMissions}
                  placeholder="Planifier les approvisionnements et les expéditions"
                />

                <ListInput
                  label="Responsabilités"
                  hint="Périmètre, budget, effectif encadré, engagements de résultat."
                  values={responsibilities}
                  onChange={setResponsibilities}
                  placeholder="Budget logistique annuel de 180 millions FCFA"
                />
              </>
            ) : null}

            {/* ---------------- Étape 3 : le profil ---------------- */}
            {step === 3 ? (
              <>
                <TagInput
                  label="Compétences requises"
                  hint="Elles pèsent 35 % du score de compatibilité. Validez chaque compétence avec la touche Entrée."
                  values={requiredSkills}
                  onChange={setRequiredSkills}
                  placeholder="Gestion de stock"
                  tone="primary"
                />

                <TagInput
                  label="Compétences souhaitées"
                  hint="Appréciées mais non éliminatoires."
                  values={niceToHaveSkills}
                  onChange={setNiceToHaveSkills}
                  placeholder="SAP MM"
                />

                <TagInput
                  label="Critères indispensables"
                  hint="Un critère non satisfait plafonne le score du candidat à 40 %. À réserver aux exigences réellement bloquantes : permis, agrément, convention de stage."
                  values={blockingCriteria}
                  onChange={setBlockingCriteria}
                  placeholder="Permis C en cours de validité"
                  tone="warning"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Niveau de formation" htmlFor="job-education">
                    <Select
                      id="job-education"
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                    >
                      {EDUCATION_LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Expérience demandée, en années" htmlFor="job-experience">
                    <Input
                      id="job-experience"
                      type="number"
                      min={0}
                      max={40}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </Field>
                </div>
              </>
            ) : null}

            {/* ---------------- Étape 4 : conditions ---------------- */}
            {step === 4 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Salaire minimum, en FCFA" htmlFor="job-salary-min" hint="Laissez vide pour ne rien afficher.">
                    <Input
                      id="job-salary-min"
                      type="number"
                      min={0}
                      step={5000}
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="450000"
                    />
                  </Field>
                  <Field label="Salaire maximum, en FCFA" htmlFor="job-salary-max">
                    <Input
                      id="job-salary-max"
                      type="number"
                      min={0}
                      step={5000}
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="650000"
                    />
                  </Field>
                  <Field label="Date limite de candidature" required htmlFor="job-deadline">
                    <Input
                      id="job-deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </Field>
                  <Field label="Visibilité" htmlFor="job-visibility">
                    <Select
                      id="job-visibility"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as JobVisibility)}
                    >
                      {JOB_VISIBILITIES.map((v) => (
                        <option key={v} value={v}>
                          {JOB_VISIBILITY_LABEL[v]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field label="Pièces demandées" hint="Le candidat voit cette liste sous forme de checklist avant l'envoi.">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {DOCUMENT_OPTIONS.map((doc) => (
                      <Checkbox
                        key={doc}
                        label={doc}
                        checked={requiredDocuments.includes(doc)}
                        onChange={() => toggleDocument(doc)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Canal de candidature" htmlFor="job-channel">
                  <Select
                    id="job-channel"
                    value={applicationChannel}
                    onChange={(e) => setApplicationChannel(e.target.value as ApplicationChannel)}
                  >
                    {APPLICATION_CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {APPLICATION_CHANNEL_LABEL[c]}
                      </option>
                    ))}
                  </Select>
                </Field>

                {applicationChannel !== "sira" ? (
                  <Field
                    label={applicationChannel === "email" ? "Adresse de réception" : "Lien externe de candidature"}
                    htmlFor="job-target"
                    hint={
                      applicationChannel === "email"
                        ? "SIRA relaie le dossier vers cette adresse et conserve la trace de l'envoi."
                        : "Le candidat quitte SIRA : le suivi de sa candidature ne pourra pas être affiché."
                    }
                  >
                    <Input
                      id="job-target"
                      value={applicationTarget}
                      onChange={(e) => setApplicationTarget(e.target.value)}
                      placeholder={
                        applicationChannel === "email" ? "recrutement@sahelagro.bf" : "https://sahelagro.bf/carrieres"
                      }
                    />
                  </Field>
                ) : null}

                <Field
                  label="Contact affiché sur l'offre"
                  htmlFor="job-contact"
                  hint="Facultatif. Visible par les candidats, à ne renseigner que si vous acceptez d'être appelé."
                >
                  <Input
                    id="job-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Service recrutement, +226 25 30 40 50"
                  />
                </Field>
              </>
            ) : null}

            {/* ---------------- Étape 5 : publication ---------------- */}
            {step === 5 ? (
              <div className="space-y-5">
                {policy}

                {missingRequired.length > 0 ? (
                  <Alert tone="warning" title="Champs obligatoires incomplets" icon={<IconAlert size={15} />}>
                    Il manque {missingRequired.join(", ")}. Vous pouvez tout de même enregistrer un brouillon.
                  </Alert>
                ) : (
                  <Alert tone="success" title="Offre complète" icon={<IconCheck size={15} />}>
                    Tous les champs obligatoires sont renseignés.
                  </Alert>
                )}

                <div>
                  <h3 className="mb-2 text-[14px] font-semibold text-[var(--color-text)]">Récapitulatif</h3>
                  <dl className="divide-y divide-[var(--color-border)] text-[13px]">
                    {[
                      ["Intitulé", draftJob.title],
                      ["Type", `${OPPORTUNITY_TYPE_LABEL[opportunityType]} · ${CONTRACT_TYPE_LABEL[contractType]}`],
                      ["Département", department || "Non précisé"],
                      ["Localisation", `${city} · ${WORK_MODE_LABEL[workMode]}`],
                      ["Missions", `${missions.filter(Boolean).length} mission(s)`],
                      ["Responsabilités", `${responsibilities.filter(Boolean).length} ligne(s)`],
                      ["Compétences requises", requiredSkills.join(", ") || "Aucune"],
                      ["Compétences souhaitées", niceToHaveSkills.join(", ") || "Aucune"],
                      ["Critères indispensables", blockingCriteria.join(", ") || "Aucun"],
                      ["Formation", educationLevel],
                      ["Expérience", `${Number(experienceYears) || 0} an(s)`],
                      [
                        "Salaire",
                        salaryMin || salaryMax
                          ? `${salaryMin || "—"} à ${salaryMax || "—"} FCFA`
                          : "Non précisé",
                      ],
                      ["Date limite", deadline || "Non précisée"],
                      ["Pièces demandées", requiredDocuments.join(", ") || "Aucune"],
                      ["Canal", APPLICATION_CHANNEL_LABEL[applicationChannel]],
                      ["Contact", contact || "Non précisé"],
                      ["Visibilité", JOB_VISIBILITY_LABEL[visibility]],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-3 sm:gap-4">
                        <dt className="text-[var(--color-text-muted)]">{label}</dt>
                        <dd className="text-[var(--color-text)] sm:col-span-2">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {feedback ? (
                  <Alert
                    tone={feedback.tone === "success" ? "success" : feedback.tone === "warning" ? "warning" : "info"}
                    icon={feedback.tone === "success" ? <IconCheck size={15} /> : <IconAlert size={15} />}
                  >
                    {feedback.text}
                  </Alert>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={saveDraft}>
                    Enregistrer le brouillon
                  </Button>
                  <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>
                    {showPreview ? "Masquer la prévisualisation" : "Prévisualiser"}
                  </Button>
                  <Button onClick={publish} disabled={!canPublish} title={!canPublish ? publishLabel : undefined}>
                    {publishLabel}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Navigation entre étapes */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] p-4">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
              Précédent
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={saveDraft}>
                Enregistrer le brouillon
              </Button>
              <Button onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))} disabled={step === STEPS.length}>
                Suivant
              </Button>
            </div>
          </div>
        </Card>

        {feedback && step !== 5 ? (
          <Alert
            tone={feedback.tone === "success" ? "success" : feedback.tone === "warning" ? "warning" : "info"}
            icon={<IconCheck size={15} />}
          >
            {feedback.text}
          </Alert>
        ) : null}

        {showPreview ? (
          <Card>
            <CardHeader
              title="Prévisualisation complète"
              subtitle="La fiche telle que le candidat la lira sur l'offre publiée."
            />
            <div className="space-y-4 p-4 text-[13.5px] leading-relaxed">
              <h3 className="text-[17px] font-semibold text-[var(--color-text)]">{draftJob.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="primary">{OPPORTUNITY_TYPE_LABEL[opportunityType]}</Badge>
                <Badge tone="neutral">{CONTRACT_TYPE_LABEL[contractType]}</Badge>
                <Badge tone="neutral">{WORK_MODE_LABEL[workMode]}</Badge>
                <Badge tone="neutral">{city}</Badge>
              </div>
              {description ? <p className="text-[var(--color-text-muted)]">{description}</p> : null}
              {missions.filter(Boolean).length > 0 ? (
                <div>
                  <h4 className="text-[13.5px] font-semibold text-[var(--color-text)]">Missions</h4>
                  <ul className="mt-1.5 ml-4 list-disc space-y-1 text-[var(--color-text-muted)]">
                    {missions.filter(Boolean).map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {requiredSkills.length > 0 ? (
                <div>
                  <h4 className="text-[13.5px] font-semibold text-[var(--color-text)]">Compétences requises</h4>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {requiredSkills.map((s) => (
                      <Badge key={s} tone="primary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {requiredDocuments.length > 0 ? (
                <div>
                  <h4 className="text-[13.5px] font-semibold text-[var(--color-text)]">Pièces à fournir</h4>
                  <ul className="mt-1.5 ml-4 list-disc space-y-1 text-[var(--color-text-muted)]">
                    {requiredDocuments.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>

      {/* Prévisualisation en direct de la carte d'offre */}
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="mb-2.5 flex items-center gap-2">
          <IconSparkles size={15} className="text-[var(--color-primary)]" />
          <h2 className="text-[11.5px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
            Aperçu en direct
          </h2>
        </div>
        <JobCard job={draftJob} organization={organization} showActions={false} />
        <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          Voici la carte que les candidats verront dans les résultats de recherche. Elle se met à jour à chaque
          modification du formulaire.
        </p>
        {visibility === "anonymisee" ? (
          <p className="mt-2 rounded-md border-l-2 border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
            En visibilité anonymisée, le nom et le logo de Sahel Agro sont remplacés par « Entreprise
            confidentielle » jusqu&apos;à la candidature.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
