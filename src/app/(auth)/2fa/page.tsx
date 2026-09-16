"use client";

/**
 * Double authentification — facultative, proposée après la vérification.
 *
 * Le QR code est simulé : un motif déterministe dessiné en CSS, sans image
 * externe ni dépendance. Le motif est calculé une fois au chargement du module,
 * donc identique côté serveur et côté client (pas de désynchronisation).
 *
 * Direction épurée : les trois étapes sont des sections séparées par un filet,
 * sans carte ni ombre. Le cadre blanc du QR est fonctionnel : un code doit
 * rester scannable, y compris en thème sombre.
 */

import Link from "next/link";
import { useState } from "react";
import { OtpInput, errorId } from "@/components/auth-fields";
import {
  IconArrowRight,
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconShield,
} from "@/components/icons";
import { Alert, Badge, Button, ButtonLink } from "@/components/ui";

const SECRET = "JBSW Y3DP EHPK 3PXP MZQ2 F5TG";

const BACKUP_CODES = [
  "4F7K-2P9D",
  "8M3Q-6R1T",
  "9X2B-7L5V",
  "1C8N-4H6Z",
  "5J7W-3S2Y",
  "6G9R-8K4M",
  "2T5P-9B7C",
  "7V4L-1D3X",
];

// ---- Motif du QR simulé ---------------------------------------------------

const QR_SIZE = 25;
const FINDERS: [number, number][] = [
  [0, 0],
  [0, 18],
  [18, 0],
];

function finderModule(row: number, col: number): boolean | null {
  for (const [fr, fc] of FINDERS) {
    if (row >= fr && row < fr + 7 && col >= fc && col < fc + 7) {
      const ring = row === fr || row === fr + 6 || col === fc || col === fc + 6;
      const core = row >= fr + 2 && row <= fr + 4 && col >= fc + 2 && col <= fc + 4;
      return ring || core;
    }
  }
  for (const [fr, fc] of FINDERS) {
    if (row >= fr - 1 && row <= fr + 7 && col >= fc - 1 && col <= fc + 7) return false;
  }
  return null;
}

const QR_MODULES: boolean[][] = Array.from({ length: QR_SIZE }, (_, row) =>
  Array.from({ length: QR_SIZE }, (_, col) => {
    const finder = finderModule(row, col);
    if (finder !== null) return finder;
    return (row * 7 + col * 13 + ((row * col) % 11) + ((row ^ col) % 5)) % 3 === 0;
  }),
);

export default function DoubleAuthentificationPage() {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const [copie, setCopie] = useState<"secret" | "codes" | null>(null);

  async function copier(texte: string, quoi: "secret" | "codes") {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(quoi);
      window.setTimeout(() => setCopie(null), 2000);
    } catch {
      setCopie(null);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.some((c) => c === "")) {
      setError("Saisissez les 6 chiffres affichés par votre application.");
      return;
    }
    setError("");
    setActive(true);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Double authentification</h1>
        <Badge tone={active ? "success" : "neutral"}>{active ? "Activée" : "Facultative"}</Badge>
      </div>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
        En plus de votre mot de passe, la connexion demandera un code à 6 chiffres généré par une
        application d&apos;authentification. Même si votre mot de passe fuite, votre compte reste protégé.
      </p>

      {active ? (
        <div className="mt-5">
          <Alert tone="success" title="Double authentification activée" icon={<IconCheckCircle size={16} />}>
            À la prochaine connexion, un code vous sera demandé après votre mot de passe. Conservez vos codes de
            secours : ce sont eux qui vous permettront d&apos;entrer si vous perdez votre téléphone.
          </Alert>
        </div>
      ) : null}

      {/* ---- 1. QR code ---- */}
      <section className="mt-9 border-t border-[var(--color-border)] pt-8">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">1. Scanner le QR code</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          Ouvrez Google Authenticator, Authy ou toute application compatible TOTP, puis scannez ce code.
        </p>

        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* QR simulé : motif CSS, aucune image externe */}
          <div
            className="shrink-0 rounded-md border border-[var(--color-border)] bg-white p-3"
            role="img"
            aria-label="QR code de configuration de la double authentification (simulé)"
          >
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: `repeat(${QR_SIZE}, 6px)`,
                gridTemplateRows: `repeat(${QR_SIZE}, 6px)`,
              }}
            >
              {QR_MODULES.map((line, row) =>
                line.map((on, col) => (
                  <span
                    key={`${row}-${col}`}
                    className={on ? "bg-[var(--color-ink)]" : "bg-white"}
                    style={{ width: 6, height: 6 }}
                  />
                )),
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[var(--color-text)]">
              Impossible de scanner ? Saisissez la clé manuellement
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-[13px] text-[var(--color-text)]">
                {SECRET}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copier(SECRET.replace(/\s/g, ""), "secret")}
                className="shrink-0"
              >
                {copie === "secret" ? <IconCheck size={14} /> : null}
                {copie === "secret" ? "Clé copiée" : "Copier la clé"}
              </Button>
            </div>
            <p className="mt-2 text-[12px] text-[var(--color-text-subtle)]">
              Cette clé ne s&apos;affichera plus après l&apos;activation. Ne la partagez avec personne.
            </p>
          </div>
        </div>
      </section>

      {/* ---- 2. Confirmation par code ---- */}
      <section className="mt-9 border-t border-[var(--color-border)] pt-8">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">2. Confirmer avec un code</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          Saisissez le code à 6 chiffres affiché par votre application. Il change toutes les 30 secondes.
        </p>

        <form onSubmit={submit} noValidate className="mt-5 max-w-sm space-y-3.5">
          <OtpInput
            idPrefix="totp"
            value={code}
            onChange={setCode}
            label="Code de double authentification à 6 chiffres"
            describedBy={error ? errorId("totp") : undefined}
          />
          {error ? (
            <p id={errorId("totp")} role="alert" className="text-[12px] text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={active}>
              {active ? "Déjà activée" : "Activer la double authentification"}
            </Button>
            {active ? (
              <button
                type="button"
                onClick={() => {
                  setActive(false);
                  setCode(["", "", "", "", "", ""]);
                }}
                className="inline-flex items-center gap-1.5 rounded-md text-[12.5px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:underline"
              >
                <IconClose size={14} />
                Désactiver
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {/* ---- Codes de secours ---- */}
      <section className="mt-9 border-t border-[var(--color-border)] pt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 shrink-0 text-[var(--color-accent-text)]" aria-hidden>
              <IconShield size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Codes de secours</h2>
              <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                Huit codes à usage unique, à conserver hors de votre téléphone.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => copier(BACKUP_CODES.join("\n"), "codes")}
          >
            {copie === "codes" ? <IconCheck size={14} /> : null}
            {copie === "codes" ? "Codes copiés" : "Copier les codes"}
          </Button>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BACKUP_CODES.map((c) => (
            <li
              key={c}
              className="rounded-md border border-[var(--color-border)] px-2 py-1.5 text-center font-mono text-[13px] text-[var(--color-text)]"
            >
              {c}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
          Chaque code ne fonctionne qu&apos;une fois. Si vous perdez à la fois votre téléphone et ces codes, la
          récupération du compte passera par une vérification d&apos;identité auprès de notre équipe.
        </p>
      </section>

      <div className="mt-9 flex flex-col gap-2 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:justify-between">
        <ButtonLink href="/verification" variant="ghost">
          Revenir à la vérification
        </ButtonLink>
        <ButtonLink href="/emplois">
          Continuer vers les offres
          <IconArrowRight size={16} />
        </ButtonLink>
      </div>

      <p className="mt-6 text-[13px] text-[var(--color-text-muted)]">
        Vous pourrez activer ou désactiver cette option plus tard depuis{" "}
        <Link href="/connexion" className="font-medium text-[var(--color-primary)] hover:underline">
          vos paramètres de sécurité
        </Link>
        .
      </p>
    </div>
  );
}
