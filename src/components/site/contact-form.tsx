"use client";

/**
 * Formulaire de la page Contact.
 *
 * Validation accessible :
 * - chaque champ en erreur porte `aria-invalid` et est relié à son message
 *   par `aria-describedby` ;
 * - à l'envoi, un récapitulatif des erreurs reçoit le focus et renvoie vers
 *   chaque champ concerné ;
 * - un champ quitté est vérifié aussitôt, puis revérifié à chaque frappe.
 *
 * L'envoi est simulé : le site est une démonstration statique, aucun message
 * ne quitte le navigateur.
 */

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { route } from "@/lib/base-path";
import { SiteButton, SiteIcon, cn } from "./kit";

type Profile = "candidat" | "recruteur" | "formateur" | "partenaire";

const PROFILES: { value: Profile; label: string }[] = [
  { value: "candidat", label: "Candidat" },
  { value: "recruteur", label: "Recruteur" },
  { value: "formateur", label: "Formateur" },
  { value: "partenaire", label: "Partenaire" },
];

const SUBJECTS: { value: string; label: string }[] = [
  { value: "compte", label: "Mon compte ou mon profil" },
  { value: "candidature", label: "Une offre ou une candidature" },
  { value: "recrutement", label: "Publier des offres et recruter" },
  { value: "formation", label: "Proposer des formations" },
  { value: "partenariat", label: "Un partenariat" },
  { value: "donnees", label: "Mes données personnelles" },
  { value: "autre", label: "Autre demande" },
];

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 2000;

interface Values {
  name: string;
  email: string;
  profile: Profile | "";
  subject: string;
  message: string;
  consent: boolean;
  marketing: boolean;
}

type Field = Exclude<keyof Values, "marketing">;
type Errors = Partial<Record<Field, string>>;

/** Ordre d'affichage des champs, qui est aussi celui du récapitulatif. */
const FIELDS: Field[] = ["name", "email", "profile", "subject", "message", "consent"];

const FIELD_ID: Record<Field, string> = {
  name: "contact-nom",
  email: "contact-email",
  profile: "contact-profil-candidat",
  subject: "contact-sujet",
  message: "contact-message",
  consent: "contact-accord",
};

const EMPTY: Values = {
  name: "",
  email: "",
  profile: "",
  subject: "",
  message: "",
  consent: false,
  marketing: false,
};

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Indiquez votre nom complet.";
  const email = v.email.trim();
  if (!email) e.email = "Indiquez votre adresse e-mail.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    e.email = "Cette adresse e-mail semble incomplète, par exemple : nom@domaine.com.";
  if (!v.profile) e.profile = "Choisissez le profil qui vous correspond.";
  if (!v.subject) e.subject = "Choisissez le sujet de votre message.";
  const len = v.message.trim().length;
  if (len < MESSAGE_MIN) e.message = `Votre message doit compter au moins ${MESSAGE_MIN} caractères.`;
  else if (len > MESSAGE_MAX) e.message = `Votre message ne peut pas dépasser ${MESSAGE_MAX} caractères.`;
  if (!v.consent) e.consent = "Votre accord est nécessaire pour que nous puissions vous répondre.";
  return e;
}

const LABEL = "mb-2 block text-[0.9375rem] font-semibold text-site-navy";
const CONTROL =
  "block min-h-12 w-full rounded-[0.75rem] border bg-white px-4 py-2.5 text-[1rem] leading-relaxed text-site-ink transition-colors duration-200 placeholder:text-site-muted/80";

function controlState(invalid: boolean): string {
  return invalid ? "border-[#b42318] bg-[#fffafa]" : "border-site-navy/25 hover:border-site-navy/60 focus:border-site-navy";
}

function Required() {
  return (
    <span aria-hidden className="ml-0.5 text-site-gold-deep">
      *
    </span>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[0.875rem] font-medium text-[#b42318]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16v.01" strokeLinecap="round" />
      </svg>
      <span>
        <span className="sr-only">Erreur : </span>
        {children}
      </span>
    </p>
  );
}

export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [summary, setSummary] = useState<Errors | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const summaryRef = useRef<HTMLDivElement | null>(null);
  const successRef = useRef<HTMLHeadingElement | null>(null);
  const timer = useRef<number | null>(null);

  const errors = validate(values);
  const shown = (f: Field) => (attempted || touched[f] ? errors[f] : undefined);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (summary && Object.keys(summary).length) summaryRef.current?.focus();
  }, [summary]);

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function blur(f: Field) {
    setTouched((t) => (t[f] ? t : { ...t, [f]: true }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setAttempted(true);
    const found = validate(values);
    if (Object.keys(found).length) {
      // Nouvel objet à chaque tentative : le focus revient au récapitulatif.
      setSummary({ ...found });
      return;
    }
    setSummary(null);
    setStatus("sending");
    timer.current = window.setTimeout(() => setStatus("sent"), 1200);
  }

  function reset() {
    setValues(EMPTY);
    setTouched({});
    setAttempted(false);
    setSummary(null);
    setStatus("idle");
  }

  function goTo(f: Field) {
    const el = document.getElementById(FIELD_ID[f]);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  }

  if (status === "sent") {
    const firstName = values.name.trim().split(/\s+/)[0];
    const profile = PROFILES.find((p) => p.value === values.profile)?.label;
    const subject = SUBJECTS.find((s) => s.value === values.subject)?.label;
    return (
      <div role="status" className="rounded-[1rem] border border-b-4 border-site-border bg-white p-6 md:p-8">
        <span aria-hidden className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-site-navy text-site-gold">
          <SiteIcon.Check size={24} />
        </span>
        <h3 ref={successRef} tabIndex={-1} className="site-display mt-5 text-[1.75rem] leading-tight text-site-ink focus:outline-none">
          Merci {firstName}, message bien reçu
        </h3>
        <p className="mt-3 text-[1rem] leading-relaxed text-site-ink/80">
          Notre équipe lit chaque demande et vous répondra à l&apos;adresse{" "}
          <strong className="font-semibold text-site-ink">{values.email.trim()}</strong> dans les meilleurs délais.
        </p>
        <dl className="mt-6 grid gap-3 rounded-[0.75rem] bg-site-light p-4 text-[0.9375rem] xs:grid-cols-[auto_1fr] xs:gap-x-6">
          <dt className="font-semibold text-site-navy">Profil</dt>
          <dd className="text-site-ink/80">{profile}</dd>
          <dt className="font-semibold text-site-navy">Sujet</dt>
          <dd className="text-site-ink/80">{subject}</dd>
          <dt className="font-semibold text-site-navy">Lettre mensuelle</dt>
          <dd className="text-site-ink/80">{values.marketing ? "Inscription demandée" : "Non demandée"}</dd>
        </dl>
        <p className="mt-5 text-[0.875rem] leading-relaxed text-site-muted">
          Site de démonstration : l&apos;envoi est simulé et aucun message n&apos;a été transmis.
        </p>
        <SiteButton variant="outline-dark" className="mt-6" onClick={reset}>
          Écrire un nouveau message
        </SiteButton>
      </div>
    );
  }

  // Le récapitulatif se vide au fil des corrections.
  const summaryItems = summary ? FIELDS.filter((f) => summary[f] && errors[f]) : [];
  const messageLength = values.message.trim().length;

  return (
    <form action={route("/contact")} noValidate onSubmit={onSubmit} aria-describedby="contact-obligatoire" className="flex flex-col gap-6">
      <p id="contact-obligatoire" className="text-[0.875rem] text-site-muted">
        Les champs marqués d&apos;un astérisque <span className="text-site-gold-deep">*</span> sont obligatoires.
      </p>

      {summaryItems.length ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="contact-erreurs-titre"
          className="rounded-[0.75rem] border border-[#b42318]/40 border-l-4 border-l-[#b42318] bg-[#fffafa] p-4"
        >
          <p id="contact-erreurs-titre" className="text-[0.9375rem] font-semibold text-[#b42318]">
            {summaryItems.length === 1
              ? "Un point est à corriger avant l'envoi"
              : `${summaryItems.length} points sont à corriger avant l'envoi`}
          </p>
          <ul className="mt-2 space-y-1">
            {summaryItems.map((f) => (
              <li key={f}>
                <a
                  href={`#${FIELD_ID[f]}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(f);
                  }}
                  className="inline-flex min-h-9 items-center text-[0.9375rem] text-[#b42318] underline underline-offset-4"
                >
                  {errors[f]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor={FIELD_ID.name} className={LABEL}>
            Nom complet
            <Required />
          </label>
          <input
            id={FIELD_ID.name}
            name="nom"
            type="text"
            autoComplete="name"
            required
            placeholder="Votre nom et prénom"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => blur("name")}
            aria-invalid={Boolean(shown("name"))}
            aria-describedby={shown("name") ? `${FIELD_ID.name}-erreur` : undefined}
            className={cn(CONTROL, controlState(Boolean(shown("name"))))}
          />
          {shown("name") ? <ErrorText id={`${FIELD_ID.name}-erreur`}>{shown("name")}</ErrorText> : null}
        </div>

        <div>
          <label htmlFor={FIELD_ID.email} className={LABEL}>
            Adresse e-mail
            <Required />
          </label>
          <input
            id={FIELD_ID.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="nom@domaine.com"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => blur("email")}
            aria-invalid={Boolean(shown("email"))}
            aria-describedby={shown("email") ? `${FIELD_ID.email}-erreur` : undefined}
            className={cn(CONTROL, controlState(Boolean(shown("email"))))}
          />
          {shown("email") ? <ErrorText id={`${FIELD_ID.email}-erreur`}>{shown("email")}</ErrorText> : null}
        </div>
      </div>

      <fieldset aria-describedby={shown("profile") ? "contact-profil-erreur" : undefined}>
        <legend className={LABEL}>
          Vous êtes
          <Required />
        </legend>
        <div className="grid grid-cols-2 gap-2 xs:grid-cols-4">
          {PROFILES.map((p) => {
            const checked = values.profile === p.value;
            return (
              <label
                key={p.value}
                className={cn(
                  "relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[0.75rem] border px-3 text-[0.9375rem] font-medium transition-colors duration-200",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-site-navy",
                  checked
                    ? "border-site-navy bg-site-navy text-white"
                    : shown("profile")
                      ? "border-[#b42318] bg-[#fffafa] text-site-ink"
                      : "border-site-navy/25 bg-white text-site-ink hover:border-site-navy/60",
                )}
              >
                <input
                  id={`contact-profil-${p.value}`}
                  type="radio"
                  name="profil"
                  value={p.value}
                  required
                  checked={checked}
                  onChange={() => {
                    set("profile", p.value);
                    blur("profile");
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    checked ? "border-site-gold" : "border-site-navy/40",
                  )}
                >
                  {checked ? <span className="h-2 w-2 rounded-full bg-site-gold" /> : null}
                </span>
                {p.label}
              </label>
            );
          })}
        </div>
        {shown("profile") ? <ErrorText id="contact-profil-erreur">{shown("profile")}</ErrorText> : null}
      </fieldset>

      <div>
        <label htmlFor={FIELD_ID.subject} className={LABEL}>
          Sujet
          <Required />
        </label>
        <div className="relative">
          <select
            id={FIELD_ID.subject}
            name="sujet"
            required
            value={values.subject}
            onChange={(e) => {
              set("subject", e.target.value);
              blur("subject");
            }}
            onBlur={() => blur("subject")}
            aria-invalid={Boolean(shown("subject"))}
            aria-describedby={shown("subject") ? `${FIELD_ID.subject}-erreur` : undefined}
            className={cn(
              CONTROL,
              "appearance-none pr-12",
              !values.subject && "text-site-muted",
              controlState(Boolean(shown("subject"))),
            )}
          >
            <option value="" disabled>
              Choisissez un sujet
            </option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value} className="text-site-ink">
                {s.label}
              </option>
            ))}
          </select>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-site-navy"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {shown("subject") ? <ErrorText id={`${FIELD_ID.subject}-erreur`}>{shown("subject")}</ErrorText> : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={FIELD_ID.message} className={LABEL}>
            Message
            <Required />
          </label>
          <span
            id="contact-message-compteur"
            className={cn(
              "text-[0.8125rem] tabular-nums",
              messageLength > MESSAGE_MAX ? "font-semibold text-[#b42318]" : "text-site-muted",
            )}
          >
            {messageLength} / {MESSAGE_MAX}
          </span>
        </div>
        <textarea
          id={FIELD_ID.message}
          name="message"
          required
          rows={6}
          placeholder="Décrivez votre demande en quelques lignes"
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          onBlur={() => blur("message")}
          aria-invalid={Boolean(shown("message"))}
          aria-describedby={cn(
            "contact-message-aide",
            shown("message") && `${FIELD_ID.message}-erreur`,
          )}
          className={cn(CONTROL, "min-h-[11.25rem] resize-y py-3", controlState(Boolean(shown("message"))))}
        />
        <p id="contact-message-aide" className="mt-2 text-[0.8125rem] text-site-muted">
          Entre {MESSAGE_MIN} et {MESSAGE_MAX} caractères. N&apos;y indiquez ni mot de passe ni information bancaire.
        </p>
        {shown("message") ? <ErrorText id={`${FIELD_ID.message}-erreur`}>{shown("message")}</ErrorText> : null}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label
            htmlFor={FIELD_ID.consent}
            className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-site-ink/85"
          >
            <input
              id={FIELD_ID.consent}
              name="accord"
              type="checkbox"
              required
              checked={values.consent}
              onChange={(e) => {
                set("consent", e.target.checked);
                blur("consent");
              }}
              aria-invalid={Boolean(shown("consent"))}
              aria-describedby={shown("consent") ? `${FIELD_ID.consent}-erreur` : undefined}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-site-navy"
            />
            <span>
              J&apos;accepte que SIRA utilise ces informations uniquement pour répondre à ma demande.
              <Required />
            </span>
          </label>
          {shown("consent") ? <ErrorText id={`${FIELD_ID.consent}-erreur`}>{shown("consent")}</ErrorText> : null}
        </div>

        <label
          htmlFor="contact-lettre"
          className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-site-ink/85"
        >
          <input
            id="contact-lettre"
            name="lettre"
            type="checkbox"
            checked={values.marketing}
            onChange={(e) => set("marketing", e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-site-navy"
          />
          <span>
            Je souhaite recevoir la lettre mensuelle de SIRA (facultatif). Refuser n&apos;entraîne aucune restriction.
          </span>
        </label>

        <p className="text-[0.8125rem] leading-relaxed text-site-muted">
          Vos informations sont traitées conformément à notre{" "}
          <Link href="/confidentialite" className="font-semibold text-site-navy underline underline-offset-4">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>

      <div>
        <SiteButton
          type="submit"
          size="lg"
          aria-disabled={status === "sending"}
          className={cn("w-full xs:w-auto", status === "sending" && "cursor-progress opacity-80")}
        >
          {status === "sending" ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin" aria-hidden>
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Envoi en cours…
            </>
          ) : (
            <>
              Envoyer le message
              <SiteIcon.Arrow size={18} />
            </>
          )}
        </SiteButton>
        <p aria-live="polite" className="sr-only">
          {status === "sending" ? "Envoi du message en cours." : ""}
        </p>
      </div>
    </form>
  );
}
