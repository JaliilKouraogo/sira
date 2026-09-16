"use client";

/**
 * Connexion — deux méthodes présentées en onglets.
 *
 * L'OTP par téléphone n'est pas un gadget : une partie des candidats n'a pas
 * d'adresse e-mail consultée régulièrement, mais tous ont un numéro. Les deux
 * chemins mènent au même compte.
 *
 * Direction épurée : ni carte ni ombre. Les onglets sont un simple filet
 * souligné, et le formulaire respire sur fond blanc.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { OtpInput, AuthField, PasswordInput, errorId, formatCountdown } from "@/components/auth-fields";
import { IconArrowRight, IconCheckCircle, IconMail, IconWhatsApp } from "@/components/icons";
import { Alert, Button, ButtonLink, Checkbox, Input, cx } from "@/components/ui";

type Method = "email" | "otp";

const TABS: { id: Method; label: string }[] = [
  { id: "email", label: "E-mail et mot de passe" },
  { id: "otp", label: "Téléphone et code OTP" },
];

export default function ConnexionPage() {
  const [method, setMethod] = useState<Method>("email");
  const [connected, setConnected] = useState(false);

  // Onglet e-mail
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [rester, setRester] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Onglet OTP
  const [telephone, setTelephone] = useState("");
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [secondes, setSecondes] = useState(0);
  const timer = useRef<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function startCountdown() {
    setSecondes(60);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setSecondes((s) => {
        if (s <= 1) {
          if (timer.current) window.clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Adresse e-mail invalide.";
    if (motDePasse.length < 1) found.motDePasse = "Saisissez votre mot de passe.";
    setErrors(found);
    if (Object.keys(found).length === 0) setConnected(true);
  }

  function handlePhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (telephone.replace(/\D/g, "").length < 8) found.telephone = "Numéro incomplet : au moins 8 chiffres.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setCodeEnvoye(true);
    startCountdown();
  }

  function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const complet = code.every((c) => c !== "");
    setErrors(complet ? {} : { code: "Saisissez les 6 chiffres reçus." });
    if (complet) setConnected(true);
  }

  function switchTab(next: Method) {
    setMethod(next);
    setErrors({});
  }

  if (connected) {
    return (
      <div className="mx-auto max-w-md text-center">
        <span
          className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]"
          aria-hidden
        >
          <IconCheckCircle size={20} />
        </span>
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Connexion réussie</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
          Démonstration : aucun compte n&apos;est réellement ouvert. Votre espace vous attend avec les offres
          qui correspondent à votre profil.
        </p>
        <div className="mt-7 flex flex-col gap-2 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:justify-center">
          <ButtonLink href="/emplois">
            Voir les offres
            <IconArrowRight size={16} />
          </ButtonLink>
          <Button
            variant="outline"
            onClick={() => {
              setConnected(false);
              setCodeEnvoye(false);
              setCode(["", "", "", "", "", ""]);
            }}
          >
            Revenir à la connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Se connecter</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
        Content de vous revoir. Choisissez votre méthode de connexion.
      </p>

      {/* ---- Onglets ---- */}
      <div
        role="tablist"
        aria-label="Méthode de connexion"
        className="mt-7 flex gap-6 border-b border-[var(--color-border)]"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`onglet-${tab.id}`}
            aria-selected={method === tab.id}
            aria-controls={`panneau-${tab.id}`}
            tabIndex={method === tab.id ? 0 : -1}
            onClick={() => switchTab(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const next = index === 0 ? 1 : 0;
                switchTab(TABS[next].id);
                tabRefs.current[next]?.focus();
              }
            }}
            className={cx(
              "-mb-px border-b-2 pb-2.5 text-[13px] font-medium transition-colors",
              method === tab.id
                ? "border-[var(--color-primary)] text-[var(--color-text)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- Panneau e-mail ---- */}
      {method === "email" ? (
        <div role="tabpanel" id="panneau-email" aria-labelledby="onglet-email" className="mt-6">
          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <AuthField label="Adresse e-mail" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="vous@exemple.bf"
                aria-invalid={!!errors.email || undefined}
                aria-describedby={errors.email ? errorId("email") : undefined}
              />
            </AuthField>

            <div>
              <AuthField label="Mot de passe" htmlFor="mot-de-passe" required error={errors.motDePasse}>
                <PasswordInput
                  id="mot-de-passe"
                  value={motDePasse}
                  onChange={setMotDePasse}
                  autoComplete="current-password"
                  invalid={!!errors.motDePasse}
                  describedBy={errors.motDePasse ? errorId("mot-de-passe") : undefined}
                />
              </AuthField>
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <Checkbox
                  id="rester"
                  checked={rester}
                  onChange={(e) => setRester(e.target.checked)}
                  label="Rester connecté"
                />
                <Link
                  href="/mot-de-passe-oublie"
                  className="shrink-0 text-[12.5px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </div>
      ) : null}

      {/* ---- Panneau OTP ---- */}
      {method === "otp" ? (
        <div role="tabpanel" id="panneau-otp" aria-labelledby="onglet-otp" className="mt-6">
          {!codeEnvoye ? (
            <form onSubmit={handlePhoneSubmit} noValidate className="space-y-4">
              <AuthField
                label="Numéro de téléphone"
                htmlFor="telephone"
                required
                hint="Vous recevrez un code à 6 chiffres par SMS ou WhatsApp."
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
                  aria-describedby={errors.telephone ? errorId("telephone") : undefined}
                />
              </AuthField>
              <Button type="submit" className="w-full">
                Recevoir un code
                <IconArrowRight size={16} />
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
                <IconWhatsApp size={14} />
                Code envoyé par SMS, ou sur WhatsApp si votre numéro y est lié.
              </p>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} noValidate className="space-y-4">
              <Alert tone="success" icon={<IconMail size={16} />}>
                Code envoyé au <strong className="font-semibold">{telephone}</strong>. Il expire dans 10
                minutes.
              </Alert>

              <div>
                <p className="mb-2 text-[12.5px] font-medium text-[var(--color-text)]">Code à 6 chiffres</p>
                <OtpInput
                  idPrefix="code"
                  value={code}
                  onChange={setCode}
                  label="Code de connexion à 6 chiffres"
                  describedBy={errors.code ? errorId("code") : undefined}
                />
                {errors.code ? (
                  <p id={errorId("code")} role="alert" className="mt-1.5 text-[12px] text-[var(--color-danger)]">
                    {errors.code}
                  </p>
                ) : null}
              </div>

              <Button type="submit" className="w-full">
                Vérifier et se connecter
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                <button
                  type="button"
                  onClick={() => {
                    setCodeEnvoye(false);
                    setCode(["", "", "", "", "", ""]);
                    setErrors({});
                  }}
                  className="rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline"
                >
                  Changer de numéro
                </button>
                <button
                  type="button"
                  disabled={secondes > 0}
                  onClick={startCountdown}
                  className="rounded-md font-medium text-[var(--color-primary)] hover:underline disabled:pointer-events-none disabled:text-[var(--color-text-subtle)]"
                >
                  {secondes > 0 ? `Renvoyer le code dans ${formatCountdown(secondes)}` : "Renvoyer le code"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      <p className="mt-8 border-t border-[var(--color-border)] pt-6 text-[13px] text-[var(--color-text-muted)]">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-[var(--color-primary)] hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
