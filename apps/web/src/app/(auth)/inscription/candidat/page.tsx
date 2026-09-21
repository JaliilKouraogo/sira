"use client";

/**
 * Inscription candidat — parcours en 6 étapes (section 7.2 du plan).
 *
 * Le formulaire est long par nature : il est donc découpé, avec un indicateur
 * d'étape, un brouillon enregistré à chaque changement d'étape et une
 * validation qui ne bloque que sur les champs réellement indispensables.
 *
 * Point réglementaire (section 10.2, matrice `CONSENT_MATRIX`) :
 *   — le traitement de service est présenté comme nécessaire, pas comme un choix ;
 *   — les opportunités par e-mail sont une préférence, active par défaut ;
 *   — WhatsApp exige un opt-in explicite, décoché par défaut ;
 *   — le marketing est décoché par défaut et son refus ne restreint rien.
 *
 * Direction épurée : aucune carte enveloppante, l'avancement est un indicateur
 * fin de six segments, et les listes répétées sont séparées par des filets.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AuthField,
  FileDrop,
  GroupLabel,
  TagInput,
  ToggleChips,
  errorId,
} from "@/components/auth-fields";
import {
  IconArrowRight,
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconPlus,
  IconShield,
  IconWhatsApp,
} from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  Input,
  Select,
  cx,
  formatDate,
} from "@/components/ui";
import {
  AVAILABILITIES,
  CITIES,
  CONSENT_BASIS_LABEL,
  CONSENT_MATRIX,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABEL,
  DOMAINS,
  EDUCATION_LEVELS,
  EXPERIENCE_BUCKETS,
  LANGUAGE_LEVELS,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
  formatMoney,
} from "@/lib/enums";
import type { ConsentBasis } from "@/lib/enums";

const STEPS = [
  { title: "Identité", subtitle: "Comment vous joindre" },
  { title: "Localisation", subtitle: "Où cherchez-vous ?" },
  { title: "Parcours", subtitle: "Formation et expérience" },
  { title: "Métier", subtitle: "Compétences et langues" },
  { title: "Préférences", subtitle: "Ce que vous recherchez" },
  { title: "CV et consentements", subtitle: "Dernière étape" },
] as const;

const SITUATIONS = [
  "En recherche active",
  "En poste, à l'écoute",
  "Étudiant",
  "En formation",
  "Sans activité",
] as const;

type Diplome = { id: number; intitule: string; etablissement: string; annee: string };
type Langue = { id: number; nom: string; niveau: string };

export default function InscriptionCandidatPage() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Étape 1 — identité
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<string[]>([]);

  // Étape 2 — localisation
  const [pays, setPays] = useState("Burkina Faso");
  const [ville, setVille] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [mobilite, setMobilite] = useState(false);

  // Étape 3 — parcours
  const [situation, setSituation] = useState("");
  const [niveau, setNiveau] = useState("");
  const [experience, setExperience] = useState("");
  const [diplomes, setDiplomes] = useState<Diplome[]>([
    { id: 1, intitule: "", etablissement: "", annee: "" },
  ]);

  // Étape 4 — métier
  const [domaine, setDomaine] = useState("");
  const [metiers, setMetiers] = useState<string[]>([]);
  const [techniques, setTechniques] = useState<string[]>([]);
  const [comportementales, setComportementales] = useState<string[]>([]);
  const [langues, setLangues] = useState<Langue[]>([{ id: 1, nom: "Français", niveau: "Courant" }]);

  // Étape 5 — préférences
  const [opportunites, setOpportunites] = useState<string[]>([]);
  const [contrats, setContrats] = useState<string[]>([]);
  const [disponibilite, setDisponibilite] = useState("");
  const [salaireMin, setSalaireMin] = useState("");
  const [salaireMax, setSalaireMax] = useState("");
  const [modes, setModes] = useState<string[]>([]);

  // Étape 6 — CV et consentements
  const [cv, setCv] = useState<string[]>([]);
  const [pieces, setPieces] = useState<string[]>([]);
  const [whatsappLie, setWhatsappLie] = useState(false);
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [optOpportunitesEmail, setOptOpportunitesEmail] = useState(true);
  const [optWhatsapp, setOptWhatsapp] = useState(false);
  const [optMarketing, setOptMarketing] = useState(false);

  const nextId = useRef(2);
  const firstRender = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Brouillon : message discret à chaque changement d'étape, puis effacement.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setDraftSaved(true);
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const timer = window.setTimeout(() => setDraftSaved(false), 2800);
    return () => window.clearTimeout(timer);
  }, [step]);

  function describe(id: string): string | undefined {
    return errors[id] ? errorId(id) : undefined;
  }

  function validate(current: number): Record<string, string> {
    const found: Record<string, string> = {};
    if (current === 1) {
      if (!nom.trim()) found.nom = "Indiquez votre nom.";
      if (!prenom.trim()) found.prenom = "Indiquez votre prénom.";
      if (telephone.replace(/\D/g, "").length < 8) {
        found.telephone = "Numéro incomplet : au moins 8 chiffres.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Adresse e-mail invalide.";
    }
    if (current === 2) {
      if (!pays.trim()) found.pays = "Indiquez votre pays de résidence.";
      if (!ville) found.ville = "Choisissez votre ville.";
    }
    if (current === 3) {
      if (!situation) found.situation = "Choisissez votre situation actuelle.";
      if (!niveau) found.niveau = "Choisissez votre niveau d'études.";
      if (!experience) found.experience = "Indiquez vos années d'expérience.";
    }
    if (current === 4) {
      if (!domaine) found.domaine = "Choisissez votre domaine principal.";
      if (metiers.length === 0) found.metiers = "Ajoutez au moins un métier recherché.";
    }
    if (current === 5) {
      if (opportunites.length === 0) found.opportunites = "Choisissez au moins un type d'opportunité.";
      if (!disponibilite) found.disponibilite = "Indiquez votre disponibilité.";
    }
    if (current === 6) {
      if (whatsappLie && whatsappNumero.replace(/\D/g, "").length < 8) {
        found.whatsappNumero = "Numéro WhatsApp incomplet.";
      }
    }
    return found;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step < STEPS.length) {
      setStep(step + 1);
      return;
    }
    setSubmitted(true);
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  // ---- Écran de confirmation -------------------------------------------
  if (submitted) {
    return (
      <div>
        <div className="text-center">
          <span
            className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]"
            aria-hidden
          >
            <IconCheckCircle size={20} />
          </span>
          <h1 className="text-[22px] font-semibold text-[var(--color-text)]">
            Bienvenue sur SIRA, {prenom || "candidat"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
            Votre compte est créé. Il ne reste qu&apos;à confirmer votre e-mail et votre téléphone pour
            commencer à recevoir des offres.
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <ButtonLink href="/verification">
              Vérifier mes coordonnées
              <IconArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/emplois" variant="outline">
              Voir les offres
            </ButtonLink>
          </div>
        </div>

        <section className="mt-9 border-t border-[var(--color-border)] pt-8">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Ce que nous avons enregistré</h2>
          <ul className="mt-3.5 space-y-2 text-[13px] text-[var(--color-text-muted)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                <IconCheck size={14} />
              </span>
              <span>
                {prenom} {nom} · {email} · {telephone}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                <IconCheck size={14} />
              </span>
              <span>
                {ville || "Ville non précisée"}
                {zones.length > 0 ? ` · ${zones.length} zone${zones.length > 1 ? "s" : ""} de recherche` : ""}
                {mobilite ? " · mobile géographiquement" : ""}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                <IconCheck size={14} />
              </span>
              <span>
                {domaine || "Domaine non précisé"}
                {metiers.length > 0 ? ` · ${metiers.join(", ")}` : ""}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                <IconCheck size={14} />
              </span>
              <span>{cv.length > 0 ? `CV : ${cv[0]}` : "Aucun CV déposé pour l'instant"}</span>
            </li>
          </ul>
          <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
            Compte créé le {formatDate("2026-09-12")}. Vous pouvez modifier chaque information, revenir sur vos
            consentements et supprimer votre compte à tout moment depuis vos paramètres.
          </p>
        </section>
      </div>
    );
  }

  const stepInfo = STEPS[step - 1];

  return (
    <div>
      {/* ---- En-tête et indicateur d'étape ---- */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Créer mon profil candidat</h1>
        <span className="text-[12.5px] text-[var(--color-text-muted)]">
          Étape {step} sur {STEPS.length}
        </span>
      </div>

      {/* Indicateur fin : six segments, les titres d'étape restent lisibles. */}
      <ol
        aria-label={`Progression de l'inscription : étape ${step} sur ${STEPS.length}`}
        className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6"
      >
        {STEPS.map((s, index) => {
          const position = index + 1;
          const done = position < step;
          const current = position === step;
          return (
            <li key={s.title} className="min-w-0" aria-current={current ? "step" : undefined}>
              <span
                aria-hidden
                className={cx(
                  "block h-0.5 rounded-full",
                  done || current ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-3)]",
                )}
              />
              <span
                className={cx(
                  "mt-1.5 block truncate text-[11.5px]",
                  current
                    ? "font-medium text-[var(--color-text)]"
                    : done
                      ? "text-[var(--color-text-muted)]"
                      : "text-[var(--color-text-subtle)]",
                )}
                title={s.title}
              >
                {s.title}
              </span>
            </li>
          );
        })}
      </ol>

      <p
        role="status"
        aria-live="polite"
        className={cx(
          "mt-3 flex items-center gap-1.5 text-[12px] transition-opacity duration-300",
          draftSaved ? "text-[var(--color-success)] opacity-100" : "opacity-0",
        )}
      >
        <IconCheck size={13} />
        {draftSaved ? "Brouillon enregistré automatiquement" : ""}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-4 border-t border-[var(--color-border)] pt-7">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-[17px] font-semibold text-[var(--color-text)] focus:outline-none"
        >
          {stepInfo.title}
          <span className="ml-2 text-[13.5px] font-normal text-[var(--color-text-muted)]">
            {stepInfo.subtitle}
          </span>
        </h2>

        <div className="mt-6 space-y-5">
          {/* ================= Étape 1 — Identité ================= */}
          {step === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="Nom" htmlFor="nom" required error={errors.nom}>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    autoComplete="family-name"
                    placeholder="OUEDRAOGO"
                    aria-invalid={!!errors.nom || undefined}
                    aria-describedby={describe("nom")}
                  />
                </AuthField>
                <AuthField label="Prénom" htmlFor="prenom" required error={errors.prenom}>
                  <Input
                    id="prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    autoComplete="given-name"
                    placeholder="Aminata"
                    aria-invalid={!!errors.prenom || undefined}
                    aria-describedby={describe("prenom")}
                  />
                </AuthField>
              </div>

              <AuthField
                label="Téléphone"
                htmlFor="telephone"
                required
                hint="Format local ou international, par exemple +226 70 00 00 00."
                error={errors.telephone}
              >
                <Input
                  id="telephone"
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+226 70 00 00 00"
                  aria-invalid={!!errors.telephone || undefined}
                  aria-describedby={describe("telephone")}
                />
              </AuthField>

              <AuthField label="Adresse e-mail" htmlFor="email" required error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="aminata@exemple.bf"
                  aria-invalid={!!errors.email || undefined}
                  aria-describedby={describe("email")}
                />
              </AuthField>

              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-text)]">
                  Photo de profil <span className="font-normal text-[var(--color-text-muted)]">(facultative)</span>
                </p>
                <FileDrop
                  id="photo"
                  title="Ajouter une photo"
                  hint="JPG ou PNG, 2 Mo maximum"
                  accept="image/*"
                  onFiles={setPhoto}
                />
                {photo.length > 0 ? null : (
                  <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
                    Une photo n&apos;est jamais obligatoire et n&apos;entre pas dans le score de compatibilité.
                  </p>
                )}
              </div>
            </>
          ) : null}

          {/* ================= Étape 2 — Localisation ================= */}
          {step === 2 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="Pays de résidence" htmlFor="pays" required error={errors.pays}>
                  <Input
                    id="pays"
                    value={pays}
                    onChange={(e) => setPays(e.target.value)}
                    autoComplete="country-name"
                    aria-invalid={!!errors.pays || undefined}
                    aria-describedby={describe("pays")}
                  />
                </AuthField>
                <AuthField label="Ville" htmlFor="ville" required error={errors.ville}>
                  <Select
                    id="ville"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    aria-invalid={!!errors.ville || undefined}
                    aria-describedby={describe("ville")}
                  >
                    <option value="">Choisir une ville</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </AuthField>
              </div>

              <ToggleChips
                idPrefix="zone"
                legend="Zones de recherche"
                hint="Les villes où vous accepteriez de travailler. Plusieurs choix possibles."
                options={CITIES.map((c) => ({ value: c, label: c }))}
                values={zones}
                onChange={setZones}
              />

              <div className="rounded-md border border-[var(--color-border)] px-3.5 py-3">
                <Checkbox
                  id="mobilite"
                  checked={mobilite}
                  onChange={(e) => setMobilite(e.target.checked)}
                  label="Je suis mobile géographiquement"
                  description="Vous acceptez un poste hors de vos zones de recherche, y compris avec déménagement."
                />
              </div>
            </>
          ) : null}

          {/* ================= Étape 3 — Parcours ================= */}
          {step === 3 ? (
            <>
              <AuthField
                label="Situation professionnelle"
                htmlFor="situation"
                required
                error={errors.situation}
              >
                <Select
                  id="situation"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  aria-invalid={!!errors.situation || undefined}
                  aria-describedby={describe("situation")}
                >
                  <option value="">Choisir une situation</option>
                  {SITUATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </AuthField>

              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="Niveau d'études" htmlFor="niveau" required error={errors.niveau}>
                  <Select
                    id="niveau"
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value)}
                    aria-invalid={!!errors.niveau || undefined}
                    aria-describedby={describe("niveau")}
                  >
                    <option value="">Choisir un niveau</option>
                    {EDUCATION_LEVELS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </AuthField>
                <AuthField
                  label="Années d'expérience"
                  htmlFor="experience"
                  required
                  error={errors.experience}
                >
                  <Select
                    id="experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    aria-invalid={!!errors.experience || undefined}
                    aria-describedby={describe("experience")}
                  >
                    <option value="">Choisir</option>
                    {EXPERIENCE_BUCKETS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </Select>
                </AuthField>
              </div>

              <fieldset>
                <GroupLabel hint="Diplômes, certificats et attestations. Ajoutez-en autant que nécessaire.">
                  Diplômes et certificats
                </GroupLabel>
                <ul className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {diplomes.map((d, index) => (
                    <li key={d.id} className="py-4">
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">
                          Diplôme {index + 1}
                        </span>
                        {diplomes.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setDiplomes(diplomes.filter((x) => x.id !== d.id))}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)]"
                          >
                            <IconClose size={12} />
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                      <div className="space-y-3">
                        <AuthField label="Intitulé" htmlFor={`diplome-${d.id}-intitule`}>
                          <Input
                            id={`diplome-${d.id}-intitule`}
                            value={d.intitule}
                            onChange={(e) =>
                              setDiplomes(
                                diplomes.map((x) =>
                                  x.id === d.id ? { ...x, intitule: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Licence en gestion"
                          />
                        </AuthField>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <AuthField label="Établissement" htmlFor={`diplome-${d.id}-ecole`}>
                            <Input
                              id={`diplome-${d.id}-ecole`}
                              value={d.etablissement}
                              onChange={(e) =>
                                setDiplomes(
                                  diplomes.map((x) =>
                                    x.id === d.id ? { ...x, etablissement: e.target.value } : x,
                                  ),
                                )
                              }
                              placeholder="Université Joseph Ki-Zerbo"
                            />
                          </AuthField>
                          <AuthField label="Année d'obtention" htmlFor={`diplome-${d.id}-annee`}>
                            <Input
                              id={`diplome-${d.id}-annee`}
                              value={d.annee}
                              onChange={(e) =>
                                setDiplomes(
                                  diplomes.map((x) =>
                                    x.id === d.id ? { ...x, annee: e.target.value } : x,
                                  ),
                                )
                              }
                              inputMode="numeric"
                              placeholder="2024"
                            />
                          </AuthField>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    const id = nextId.current;
                    nextId.current += 1;
                    setDiplomes([...diplomes, { id, intitule: "", etablissement: "", annee: "" }]);
                  }}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-strong)] px-3 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <IconPlus size={15} />
                  Ajouter un diplôme
                </button>
              </fieldset>
            </>
          ) : null}

          {/* ================= Étape 4 — Métier ================= */}
          {step === 4 ? (
            <>
              <AuthField label="Domaine principal" htmlFor="domaine" required error={errors.domaine}>
                <Select
                  id="domaine"
                  value={domaine}
                  onChange={(e) => setDomaine(e.target.value)}
                  aria-invalid={!!errors.domaine || undefined}
                  aria-describedby={describe("domaine")}
                >
                  <option value="">Choisir un domaine</option>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </AuthField>

              <AuthField
                label="Métiers recherchés"
                htmlFor="metiers"
                required
                hint="Saisissez un métier puis Entrée. Exemple : comptable, assistant de direction."
                error={errors.metiers}
              >
                <TagInput
                  id="metiers"
                  values={metiers}
                  onChange={setMetiers}
                  placeholder="Comptable"
                  invalid={!!errors.metiers}
                  describedBy={describe("metiers")}
                />
              </AuthField>

              <AuthField
                label="Compétences techniques"
                htmlFor="techniques"
                hint="Logiciels, méthodes, savoir-faire métier."
              >
                <TagInput
                  id="techniques"
                  values={techniques}
                  onChange={setTechniques}
                  placeholder="Sage comptabilité"
                />
              </AuthField>

              <AuthField
                label="Compétences comportementales"
                htmlFor="comportementales"
                hint="Rigueur, travail en équipe, sens du client…"
              >
                <TagInput
                  id="comportementales"
                  values={comportementales}
                  onChange={setComportementales}
                  placeholder="Rigueur"
                />
              </AuthField>

              <fieldset>
                <GroupLabel hint="Le niveau déclaré entre dans le score de compatibilité des offres.">
                  Langues
                </GroupLabel>
                <ul className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {langues.map((l, index) => (
                    <li key={l.id} className="py-4">
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">
                          Langue {index + 1}
                        </span>
                        {langues.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setLangues(langues.filter((x) => x.id !== l.id))}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)]"
                          >
                            <IconClose size={12} />
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AuthField label="Langue" htmlFor={`langue-${l.id}-nom`}>
                          <Input
                            id={`langue-${l.id}-nom`}
                            value={l.nom}
                            onChange={(e) =>
                              setLangues(
                                langues.map((x) => (x.id === l.id ? { ...x, nom: e.target.value } : x)),
                              )
                            }
                            placeholder="Mooré"
                          />
                        </AuthField>
                        <AuthField label="Niveau" htmlFor={`langue-${l.id}-niveau`}>
                          <Select
                            id={`langue-${l.id}-niveau`}
                            value={l.niveau}
                            onChange={(e) =>
                              setLangues(
                                langues.map((x) => (x.id === l.id ? { ...x, niveau: e.target.value } : x)),
                              )
                            }
                          >
                            {LANGUAGE_LEVELS.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </Select>
                        </AuthField>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    const id = nextId.current;
                    nextId.current += 1;
                    setLangues([...langues, { id, nom: "", niveau: LANGUAGE_LEVELS[0] }]);
                  }}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-strong)] px-3 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <IconPlus size={15} />
                  Ajouter une langue
                </button>
              </fieldset>
            </>
          ) : null}

          {/* ================= Étape 5 — Préférences ================= */}
          {step === 5 ? (
            <>
              <div>
                <ToggleChips
                  idPrefix="opportunite"
                  legend="Type d'opportunité recherché"
                  hint="Plusieurs choix possibles."
                  options={OPPORTUNITY_TYPES.map((t) => ({ value: t, label: OPPORTUNITY_TYPE_LABEL[t] }))}
                  values={opportunites}
                  onChange={setOpportunites}
                />
                {errors.opportunites ? (
                  <p
                    id={errorId("opportunites")}
                    role="alert"
                    className="mt-1.5 text-[12px] text-[var(--color-danger)]"
                  >
                    {errors.opportunites}
                  </p>
                ) : null}
              </div>

              <ToggleChips
                idPrefix="contrat"
                legend="Type de contrat souhaité"
                options={CONTRACT_TYPES.map((t) => ({ value: t, label: CONTRACT_TYPE_LABEL[t] }))}
                values={contrats}
                onChange={setContrats}
              />

              <AuthField label="Disponibilité" htmlFor="disponibilite" required error={errors.disponibilite}>
                <Select
                  id="disponibilite"
                  value={disponibilite}
                  onChange={(e) => setDisponibilite(e.target.value)}
                  aria-invalid={!!errors.disponibilite || undefined}
                  aria-describedby={describe("disponibilite")}
                >
                  <option value="">Choisir une disponibilité</option>
                  {AVAILABILITIES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </AuthField>

              <fieldset>
                <GroupLabel hint="Fourchette mensuelle brute en FCFA. Jamais montrée aux recruteurs sans votre accord.">
                  Prétentions salariales
                </GroupLabel>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <AuthField label="Minimum" htmlFor="salaire-min">
                    <Input
                      id="salaire-min"
                      value={salaireMin}
                      onChange={(e) => setSalaireMin(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="150000"
                    />
                  </AuthField>
                  <AuthField label="Maximum" htmlFor="salaire-max">
                    <Input
                      id="salaire-max"
                      value={salaireMax}
                      onChange={(e) => setSalaireMax(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="250000"
                    />
                  </AuthField>
                </div>
                {salaireMin || salaireMax ? (
                  <p className="mt-2 text-[12px] text-[var(--color-text-muted)]">
                    Soit {formatMoney(salaireMin ? Number(salaireMin) : null)} à{" "}
                    {formatMoney(salaireMax ? Number(salaireMax) : null)} par mois.
                  </p>
                ) : null}
              </fieldset>

              <ToggleChips
                idPrefix="mode"
                legend="Mode de travail accepté"
                options={WORK_MODES.map((m) => ({ value: m, label: WORK_MODE_LABEL[m] }))}
                values={modes}
                onChange={setModes}
              />
            </>
          ) : null}

          {/* ================= Étape 6 — CV et consentements ================= */}
          {step === 6 ? (
            <>
              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-text)]">Votre CV</p>
                <FileDrop
                  id="cv"
                  title="Déposer mon CV"
                  hint="PDF, DOC ou DOCX, 5 Mo maximum"
                  accept=".pdf,.doc,.docx"
                  onFiles={setCv}
                />
                <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
                  Le CV est analysé pour pré-remplir votre profil. Vous relisez toujours avant publication.
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-text)]">
                  Pièces justificatives{" "}
                  <span className="font-normal text-[var(--color-text-muted)]">(facultatives)</span>
                </p>
                <FileDrop
                  id="pieces"
                  title="Diplômes, attestations, certificats"
                  hint="Plusieurs fichiers possibles"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onFiles={setPieces}
                />
                {pieces.length > 0 ? (
                  <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
                    {pieces.length} pièce{pieces.length > 1 ? "s" : ""} jointe
                    {pieces.length > 1 ? "s" : ""}.
                  </p>
                ) : null}
              </div>

              <div className="rounded-md border border-[var(--color-border)] px-3.5 py-3">
                <Checkbox
                  id="whatsapp-lie"
                  checked={whatsappLie}
                  onChange={(e) => setWhatsappLie(e.target.checked)}
                  label="Lier mon compte WhatsApp"
                  description="Pour recevoir vos documents de candidature et discuter avec l'assistant SIRA sur WhatsApp."
                />
                {whatsappLie ? (
                  <div className="mt-3 pl-6">
                    <AuthField
                      label="Numéro WhatsApp"
                      htmlFor="whatsapp-numero"
                      required
                      error={errors.whatsappNumero}
                    >
                      <Input
                        id="whatsapp-numero"
                        type="tel"
                        value={whatsappNumero}
                        onChange={(e) => setWhatsappNumero(e.target.value)}
                        placeholder="+226 70 00 00 00"
                        aria-invalid={!!errors.whatsappNumero || undefined}
                        aria-describedby={describe("whatsappNumero")}
                      />
                    </AuthField>
                  </div>
                ) : null}
              </div>

              {/* ---- Consentements — section 10.2 ---- */}
              <section aria-labelledby="consentements">
                <h3
                  id="consentements"
                  className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]"
                >
                  <span className="text-[var(--color-primary)]" aria-hidden>
                    <IconShield size={15} />
                  </span>
                  Vos consentements
                </h3>

                <ul className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  <ConsentRow
                    id="consent-service"
                    basis={CONSENT_MATRIX.service.email}
                    title="Création et gestion de mon compte"
                    description="Nécessaire au fonctionnement du service : création du compte, sécurité, envoi des messages liés à vos candidatures. Ce traitement ne peut pas être désactivé tant que votre compte existe. Vous pouvez supprimer votre compte à tout moment."
                    checked
                    locked
                  />

                  <ConsentRow
                    id="consent-opportunites"
                    basis={CONSENT_MATRIX.opportunites.email}
                    title="Recevoir les offres qui me correspondent par e-mail"
                    description="Préférence activée par défaut. Vous pouvez la désactiver ici ou depuis vos paramètres, à tout moment."
                    checked={optOpportunitesEmail}
                    onChange={setOptOpportunitesEmail}
                  />

                  <ConsentRow
                    id="consent-whatsapp"
                    basis={CONSENT_MATRIX.opportunites.whatsapp}
                    title="Recevoir des notifications sur WhatsApp"
                    description="Consentement explicite, décoché par défaut. Aucun message WhatsApp ne vous sera envoyé sans cette case cochée."
                    checked={optWhatsapp}
                    onChange={setOptWhatsapp}
                    icon={<IconWhatsApp size={15} />}
                  />

                  <ConsentRow
                    id="consent-marketing"
                    basis={CONSENT_MATRIX.marketing.email}
                    title="Recevoir les actualités et offres commerciales de SIRA"
                    description="Consentement explicite, décoché par défaut."
                    checked={optMarketing}
                    onChange={setOptMarketing}
                  />
                </ul>

                <div className="mt-4">
                  <Alert tone="info" icon={<IconCheckCircle size={16} />}>
                    Refuser les communications commerciales n&apos;entraîne aucune restriction : toutes les
                    fonctionnalités de SIRA restent accessibles, offres comprises.
                  </Alert>
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                  En créant votre compte, vous acceptez les conditions générales d&apos;utilisation et la
                  politique de confidentialité de SIRA. Votre profil est créé{" "}
                  <strong className="font-semibold text-[var(--color-text)]">invisible</strong> dans la
                  recherche de talents : vous choisirez ensuite ce que les recruteurs peuvent voir.
                </p>
              </section>
            </>
          ) : null}
        </div>

        {/* ---- Navigation ---- */}
        <div className="mt-7 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5">
          {step === 1 ? (
            <ButtonLink href="/inscription" variant="ghost">
              Changer de type de compte
            </ButtonLink>
          ) : (
            <Button type="button" variant="outline" onClick={goBack}>
              Précédent
            </Button>
          )}

          {step < STEPS.length ? (
            <Button type="submit">
              Suivant
              <IconArrowRight size={16} />
            </Button>
          ) : (
            <Button type="submit">Créer mon compte</Button>
          )}
        </div>
      </form>

      <p className="mt-8 border-t border-[var(--color-border)] pt-6 text-[13px] text-[var(--color-text-muted)]">
        Vous avez déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-[var(--color-primary)] hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

/**
 * Ligne de consentement : le fondement juridique (`ConsentBasis`) est affiché
 * en clair, de façon que l'utilisateur distingue ce qui est nécessaire au
 * service, ce qui est une simple préférence et ce qui relève de son
 * consentement explicite.
 */
function ConsentRow({
  id,
  title,
  description,
  basis,
  checked,
  onChange,
  locked = false,
  icon,
}: {
  id: string;
  title: string;
  description: string;
  basis: ConsentBasis;
  checked: boolean;
  onChange?: (next: boolean) => void;
  locked?: boolean;
  icon?: React.ReactNode;
}) {
  const tone = basis === "service" ? "neutral" : basis === "preference" ? "info" : "accent";
  return (
    <li className="py-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {icon ? <span className="text-[var(--color-text-muted)]">{icon}</span> : null}
        <Badge tone={tone}>{CONSENT_BASIS_LABEL[basis]}</Badge>
        {locked ? <Badge tone="neutral">Non désactivable</Badge> : null}
      </div>
      <Checkbox
        id={id}
        checked={checked}
        disabled={locked}
        readOnly={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        label={title}
        description={description}
      />
    </li>
  );
}
