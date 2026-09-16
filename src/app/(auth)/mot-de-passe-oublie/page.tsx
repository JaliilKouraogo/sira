"use client";

/**
 * Mot de passe oublié — l'utilisateur choisit le canal de récupération.
 *
 * Le message de confirmation reste volontairement neutre : il n'indique jamais
 * si le compte existe, pour ne pas transformer ce formulaire en outil de
 * vérification d'adresses.
 *
 * Direction épurée : pas de carte, pas d'ombre ; le formulaire et sa
 * confirmation tiennent sur fond blanc, séparés par de simples filets.
 */

import Link from "next/link";
import { useState } from "react";
import { AuthField, ToggleChips, errorId, formatCountdown } from "@/components/auth-fields";
import { IconArrowRight, IconCheckCircle, IconMail, IconShield, IconWhatsApp } from "@/components/icons";
import { Alert, Button, ButtonLink, Input } from "@/components/ui";

type Canal = "email" | "telephone";

export default function MotDePasseOubliePage() {
  const [canal, setCanal] = useState<Canal>("email");
  const [valeur, setValeur] = useState("");
  const [error, setError] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [secondes, setSecondes] = useState(0);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canal === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    if (canal === "telephone" && valeur.replace(/\D/g, "").length < 8) {
      setError("Numéro incomplet : au moins 8 chiffres.");
      return;
    }
    setError("");
    setEnvoye(true);
    countdown();
  }

  function countdown() {
    setSecondes(60);
    const id = window.setInterval(() => {
      setSecondes((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // ---- Confirmation d'envoi --------------------------------------------
  if (envoye) {
    return (
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <span
            className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            aria-hidden
          >
            {canal === "email" ? <IconMail size={19} /> : <IconWhatsApp size={19} />}
          </span>
          <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Instructions envoyées</h1>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
            Si un compte SIRA est associé à{" "}
            <strong className="font-semibold text-[var(--color-text)]">{valeur}</strong>, vous recevez un lien
            de réinitialisation valable 30 minutes.
          </p>
        </div>

        <ul className="mt-7 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          <li className="flex gap-2.5 py-3">
            <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
              <IconCheckCircle size={15} />
            </span>
            <span className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              {canal === "email"
                ? "Pensez à regarder dans vos courriers indésirables."
                : "Le message arrive par SMS, ou sur WhatsApp si votre numéro y est lié."}
            </span>
          </li>
          <li className="flex gap-2.5 py-3">
            <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
              <IconShield size={15} />
            </span>
            <span className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              Le lien ne peut servir qu&apos;une fois. Vos sessions ouvertes seront déconnectées.
            </span>
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href="/connexion">Retour à la connexion</ButtonLink>
          <Button variant="outline" disabled={secondes > 0} onClick={countdown}>
            {secondes > 0 ? `Renvoyer dans ${formatCountdown(secondes)}` : "Renvoyer le message"}
          </Button>
        </div>

        <p className="mt-8 border-t border-[var(--color-border)] pt-6 text-[13px] text-[var(--color-text-muted)]">
          Mauvaise adresse ?{" "}
          <button
            type="button"
            onClick={() => setEnvoye(false)}
            className="rounded-md font-medium text-[var(--color-primary)] hover:underline"
          >
            Recommencer
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Mot de passe oublié</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
        Indiquez l&apos;e-mail ou le téléphone associé à votre compte : nous vous envoyons un lien de
        réinitialisation.
      </p>

      <form onSubmit={submit} noValidate className="mt-7 space-y-5">
        <ToggleChips
          idPrefix="canal"
          legend="Comment souhaitez-vous recevoir les instructions ?"
          single
          options={[
            { value: "email", label: "Par e-mail" },
            { value: "telephone", label: "Par téléphone" },
          ]}
          values={[canal]}
          onChange={(next) => {
            const choix = next[0] === "telephone" ? "telephone" : "email";
            setCanal(choix);
            setValeur("");
            setError("");
          }}
        />

        {canal === "email" ? (
          <AuthField label="Adresse e-mail" htmlFor="identifiant" required error={error}>
            <Input
              id="identifiant"
              type="email"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              autoComplete="email"
              placeholder="vous@exemple.bf"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? errorId("identifiant") : undefined}
            />
          </AuthField>
        ) : (
          <AuthField label="Numéro de téléphone" htmlFor="identifiant" required error={error}>
            <Input
              id="identifiant"
              type="tel"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              autoComplete="tel"
              placeholder="+226 70 00 00 00"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? errorId("identifiant") : undefined}
            />
          </AuthField>
        )}

        <Button type="submit" className="w-full">
          Envoyer les instructions
          <IconArrowRight size={16} />
        </Button>
      </form>

      <div className="mt-5">
        <Alert tone="neutral" icon={<IconShield size={15} />}>
          Par sécurité, nous confirmons l&apos;envoi sans révéler si un compte existe pour cet identifiant.
        </Alert>
      </div>

      <p className="mt-8 border-t border-[var(--color-border)] pt-6 text-[13px] text-[var(--color-text-muted)]">
        Vous vous en souvenez ?{" "}
        <Link href="/connexion" className="font-medium text-[var(--color-primary)] hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
