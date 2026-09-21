"use client";

/**
 * Inscription recruteur — deux étapes : le responsable, puis l'organisation.
 *
 * Le type d'organisation gouverne ce que le compte pourra faire : les
 * justificatifs attendus et les capacités affichées sont lus dans
 * `ORGANIZATION_CAPABILITIES` (section 2.2 du plan), jamais recopiés ici.
 *
 * Direction épurée : pas de carte enveloppante, un filet fin pour séparer
 * l'en-tête du formulaire, et un indicateur d'étape discret.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AuthField,
  FileDrop,
  PasswordInput,
  errorId,
} from "@/components/auth-fields";
import {
  IconArrowRight,
  IconBriefcase,
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconGraduation,
  IconMegaphone,
  IconShield,
} from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Input,
  Progress,
  Select,
  Textarea,
  cx,
} from "@/components/ui";
import {
  CITIES,
  DOMAINS,
  ORGANIZATION_CAPABILITIES,
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABEL,
} from "@/lib/enums";
import type { OrganizationType } from "@/lib/enums";

const STEPS = [
  { title: "Votre compte", subtitle: "Le responsable du compte" },
  { title: "Votre organisation", subtitle: "Identité et justificatifs" },
] as const;

const SIZES = [
  "1 à 9 salariés",
  "10 à 49 salariés",
  "50 à 249 salariés",
  "250 salariés et plus",
] as const;

export default function InscriptionRecruteurPage() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Étape 1 — responsable
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  // Étape 2 — organisation
  const [nomLegal, setNomLegal] = useState("");
  const [nomCommercial, setNomCommercial] = useState("");
  const [type, setType] = useState<OrganizationType | "">("");
  const [secteur, setSecteur] = useState("");
  const [taille, setTaille] = useState("");
  const [pays, setPays] = useState("Burkina Faso");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [description, setDescription] = useState("");
  const [justificatifs, setJustificatifs] = useState<string[]>([]);

  const firstRender = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);

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
      if (!nom.trim()) found.nom = "Indiquez votre nom et prénom.";
      if (!fonction.trim()) found.fonction = "Indiquez votre fonction dans l'organisation.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Adresse e-mail invalide.";
      if (telephone.replace(/\D/g, "").length < 8) found.telephone = "Numéro incomplet.";
      if (motDePasse.length < 8) found.motDePasse = "8 caractères minimum.";
    }
    if (current === 2) {
      if (!nomLegal.trim()) found.nomLegal = "Indiquez le nom légal de l'organisation.";
      if (!type) found.type = "Choisissez un type d'organisation.";
      if (!secteur) found.secteur = "Choisissez un secteur d'activité.";
      if (!ville) found.ville = "Choisissez une ville.";
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

  const capabilities = type ? ORGANIZATION_CAPABILITIES[type] : null;

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
          <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Compte recruteur créé</h1>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
            {nomCommercial || nomLegal} est enregistrée. Notre équipe vérifie vos justificatifs sous 48 heures
            ouvrées. Vous recevrez un e-mail à {email} dès que la vérification est terminée.
          </p>
          <div className="mt-4 flex justify-center">
            <Badge tone="warning">Organisation en vérification</Badge>
          </div>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <ButtonLink href="/verification">
              Vérifier mes coordonnées
              <IconArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/" variant="outline">
              Retour à l&apos;accueil
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-8">
          <Alert tone="info" title="Publier votre première offre" icon={<IconShield size={16} />}>
            Vous pouvez préparer une offre dès maintenant. Tant que votre organisation n&apos;est pas vérifiée,
            la première offre passe par un contrôle administrateur avant sa mise en ligne.
          </Alert>
        </div>
      </div>
    );
  }

  const stepInfo = STEPS[step - 1];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Créer un compte recruteur</h1>
        <span className="text-[12.5px] text-[var(--color-text-muted)]">
          Étape {step} sur {STEPS.length}
        </span>
      </div>

      <Progress
        className="mt-3"
        value={(step / STEPS.length) * 100}
        label={`Progression de l'inscription : étape ${step} sur ${STEPS.length}`}
      />

      <p
        role="status"
        aria-live="polite"
        className={cx(
          "mt-2 flex items-center gap-1.5 text-[12px] transition-opacity duration-300",
          draftSaved ? "text-[var(--color-success)] opacity-100" : "opacity-0",
        )}
      >
        <IconCheck size={13} />
        {draftSaved ? "Brouillon enregistré automatiquement" : ""}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 border-t border-[var(--color-border)] pt-7">
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
          {/* ================= Étape 1 — responsable ================= */}
          {step === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="Nom et prénom" htmlFor="nom" required error={errors.nom}>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    autoComplete="name"
                    placeholder="SAWADOGO Issa"
                    aria-invalid={!!errors.nom || undefined}
                    aria-describedby={describe("nom")}
                  />
                </AuthField>
                <AuthField label="Fonction" htmlFor="fonction" required error={errors.fonction}>
                  <Input
                    id="fonction"
                    value={fonction}
                    onChange={(e) => setFonction(e.target.value)}
                    autoComplete="organization-title"
                    placeholder="Responsable des ressources humaines"
                    aria-invalid={!!errors.fonction || undefined}
                    aria-describedby={describe("fonction")}
                  />
                </AuthField>
              </div>

              <AuthField
                label="E-mail professionnel"
                htmlFor="email"
                required
                hint="Une adresse au nom de l'organisation accélère la vérification."
                error={errors.email}
              >
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="recrutement@monentreprise.bf"
                  aria-invalid={!!errors.email || undefined}
                  aria-describedby={describe("email")}
                />
              </AuthField>

              <AuthField
                label="Téléphone / WhatsApp"
                htmlFor="telephone"
                required
                error={errors.telephone}
              >
                <Input
                  id="telephone"
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+226 25 00 00 00"
                  aria-invalid={!!errors.telephone || undefined}
                  aria-describedby={describe("telephone")}
                />
              </AuthField>

              <AuthField
                label="Mot de passe"
                htmlFor="mot-de-passe"
                required
                hint="8 caractères minimum. Évitez un mot de passe déjà utilisé ailleurs."
                error={errors.motDePasse}
              >
                <PasswordInput
                  id="mot-de-passe"
                  value={motDePasse}
                  onChange={setMotDePasse}
                  autoComplete="new-password"
                  invalid={!!errors.motDePasse}
                  describedBy={describe("motDePasse")}
                />
              </AuthField>
            </>
          ) : null}

          {/* ================= Étape 2 — organisation ================= */}
          {step === 2 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="Nom légal" htmlFor="nom-legal" required error={errors.nomLegal}>
                  <Input
                    id="nom-legal"
                    value={nomLegal}
                    onChange={(e) => setNomLegal(e.target.value)}
                    autoComplete="organization"
                    placeholder="SIRA Technologies SARL"
                    aria-invalid={!!errors.nomLegal || undefined}
                    aria-describedby={describe("nomLegal")}
                  />
                </AuthField>
                <AuthField
                  label="Nom commercial"
                  htmlFor="nom-commercial"
                  hint="S'il diffère du nom légal."
                >
                  <Input
                    id="nom-commercial"
                    value={nomCommercial}
                    onChange={(e) => setNomCommercial(e.target.value)}
                    placeholder="SIRA"
                  />
                </AuthField>
              </div>

              <AuthField
                label="Type d'organisation"
                htmlFor="type"
                required
                hint="Il détermine les justificatifs demandés et ce que votre compte pourra publier."
                error={errors.type}
              >
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as OrganizationType | "")}
                  aria-invalid={!!errors.type || undefined}
                  aria-describedby={describe("type")}
                >
                  <option value="">Choisir un type</option>
                  {ORGANIZATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ORGANIZATION_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </AuthField>

              {/* ---- Conséquences du type choisi, lues dans le référentiel ---- */}
              {type && capabilities ? (
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] px-4 py-3.5">
                  <h3 className="text-[13.5px] font-semibold text-[var(--color-text)]">
                    {ORGANIZATION_TYPE_LABEL[type]} : ce qui est attendu
                  </h3>

                  <p className="mt-3 text-[11.5px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                    Justificatifs à fournir
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--color-text)]">{capabilities.documents}</p>

                  <p className="mt-3.5 text-[11.5px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                    Capacités du compte
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {[
                      { on: capabilities.jobs, label: "Publier des offres d'emploi", icon: <IconBriefcase size={14} /> },
                      { on: capabilities.trainings, label: "Publier des formations", icon: <IconGraduation size={14} /> },
                      { on: capabilities.campaigns, label: "Diffuser des campagnes", icon: <IconMegaphone size={14} /> },
                    ].map((c) => (
                      <li
                        key={c.label}
                        className={cx(
                          "flex items-center gap-2 text-[13px]",
                          c.on ? "text-[var(--color-text)]" : "text-[var(--color-text-subtle)]",
                        )}
                      >
                        <span
                          className={cx(
                            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            c.on
                              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                              : "bg-[var(--color-surface-3)] text-[var(--color-text-subtle)]",
                          )}
                          aria-hidden
                        >
                          {c.on ? <IconCheck size={12} /> : <IconClose size={12} />}
                        </span>
                        <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
                          {c.icon}
                        </span>
                        <span>
                          {c.label}
                          {c.on ? "" : " — non disponible pour ce type"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="Secteur d'activité" htmlFor="secteur" required error={errors.secteur}>
                  <Select
                    id="secteur"
                    value={secteur}
                    onChange={(e) => setSecteur(e.target.value)}
                    aria-invalid={!!errors.secteur || undefined}
                    aria-describedby={describe("secteur")}
                  >
                    <option value="">Choisir un secteur</option>
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </AuthField>
                <AuthField label="Taille" htmlFor="taille">
                  <Select id="taille" value={taille} onChange={(e) => setTaille(e.target.value)}>
                    <option value="">Non précisée</option>
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </AuthField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="Pays" htmlFor="pays">
                  <Input
                    id="pays"
                    value={pays}
                    onChange={(e) => setPays(e.target.value)}
                    autoComplete="country-name"
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

              <AuthField label="Adresse" htmlFor="adresse">
                <Input
                  id="adresse"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  autoComplete="street-address"
                  placeholder="Avenue Kwame N'Krumah, secteur 4"
                />
              </AuthField>

              <AuthField label="Site web" htmlFor="site-web" hint="Facultatif, mais utile à la vérification.">
                <Input
                  id="site-web"
                  type="url"
                  value={siteWeb}
                  onChange={(e) => setSiteWeb(e.target.value)}
                  autoComplete="url"
                  placeholder="https://monentreprise.bf"
                />
              </AuthField>

              <AuthField
                label="Description"
                htmlFor="description"
                hint="Quelques lignes présentées aux candidats sur votre page organisation."
              >
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Notre mission, nos métiers, ce que nous proposons aux talents."
                />
              </AuthField>

              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-text)]">
                  Justificatifs{" "}
                  {capabilities ? (
                    <span className="font-normal text-[var(--color-text-muted)]">
                      ({capabilities.documents})
                    </span>
                  ) : null}
                </p>
                <FileDrop
                  id="justificatifs"
                  title="Déposer les justificatifs"
                  hint="PDF ou image, plusieurs fichiers possibles"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onFiles={setJustificatifs}
                />
                <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
                  {justificatifs.length > 0
                    ? `${justificatifs.length} document${justificatifs.length > 1 ? "s" : ""} prêt${justificatifs.length > 1 ? "s" : ""} à être transmis.`
                    : "Vous pourrez aussi les déposer plus tard, depuis votre espace recruteur."}
                </p>
              </div>

              <Alert tone="info" title="Vérification et première offre" icon={<IconShield size={16} />}>
                La publication d&apos;offres est ouverte dès que votre organisation est vérifiée, sous 48
                heures ouvrées après réception des justificatifs. En attendant, vous pouvez préparer vos
                offres : la première offre d&apos;un recruteur non encore vérifié est contrôlée par un
                administrateur avant sa mise en ligne.
              </Alert>
            </>
          ) : null}
        </div>

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5">
          {step === 1 ? (
            <ButtonLink href="/inscription" variant="ghost">
              Changer de type de compte
            </ButtonLink>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrors({});
                setStep(1);
              }}
            >
              Précédent
            </Button>
          )}

          {step < STEPS.length ? (
            <Button type="submit">
              Suivant
              <IconArrowRight size={16} />
            </Button>
          ) : (
            <Button type="submit">Créer le compte</Button>
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
