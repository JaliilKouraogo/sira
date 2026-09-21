"use client";

/**
 * Vérification des coordonnées — e-mail et téléphone.
 *
 * Les deux canaux sont traités séparément : on peut candidater avec un e-mail
 * vérifié seul, mais le lien WhatsApp et les alertes SMS exigent un numéro
 * vérifié. Chaque bloc porte donc son propre état et son propre compte à rebours.
 *
 * Direction épurée : les deux canaux forment une liste séparée par des filets,
 * sans carte ni ombre, et l'avancement est un indicateur fin.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { OtpInput, errorId, formatCountdown } from "@/components/auth-fields";
import { IconArrowRight, IconCheckCircle, IconClock, IconMail, IconShield, IconWhatsApp } from "@/components/icons";
import { Alert, Badge, Button, ButtonLink, Progress, cx } from "@/components/ui";

const RESEND_DELAY = 60;

type Channel = {
  key: "email" | "telephone";
  title: string;
  destination: string;
  help: string;
  icon: React.ReactNode;
};

const CHANNELS: Channel[] = [
  {
    key: "email",
    title: "Adresse e-mail",
    destination: "a.ouedraogo@exemple.bf",
    help: "Nous y envoyons vos accusés de candidature et la récupération de mot de passe.",
    icon: <IconMail size={16} />,
  },
  {
    key: "telephone",
    title: "Numéro de téléphone",
    destination: "+226 70 12 34 56",
    help: "Nécessaire pour la connexion par code et pour lier WhatsApp.",
    icon: <IconWhatsApp size={16} />,
  },
];

export default function VerificationPage() {
  const [verified, setVerified] = useState<Record<string, boolean>>({
    email: false,
    telephone: false,
  });

  const done = Object.values(verified).filter(Boolean).length;
  const total = CHANNELS.length;

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Vérifier mes coordonnées</h1>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
        Deux codes vous ont été envoyés. Cette étape protège votre compte et garantit aux recruteurs que vos
        coordonnées sont valides.
      </p>

      <div className="mt-5 flex items-center gap-3">
        <Progress
          className="flex-1"
          value={(done / total) * 100}
          tone={done === total ? "success" : "primary"}
          label={`Vérification : ${done} sur ${total}`}
        />
        <span className="shrink-0 text-[12px] tabular-nums text-[var(--color-text-subtle)]">
          {done} / {total}
        </span>
      </div>

      {done === total ? (
        <div className="mt-5">
          <Alert tone="success" title="Tout est vérifié" icon={<IconCheckCircle size={16} />}>
            Votre e-mail et votre téléphone sont confirmés. Vous pouvez maintenant candidater et activer la
            double authentification.
          </Alert>
        </div>
      ) : null}

      <div className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {CHANNELS.map((channel) => (
          <VerificationBlock
            key={channel.key}
            channel={channel}
            verified={verified[channel.key]}
            onVerified={() => setVerified((v) => ({ ...v, [channel.key]: true }))}
          />
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <span className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden>
          <IconShield size={17} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Renforcer la sécurité</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">
            La double authentification ajoute un code temporaire à chaque connexion. Elle est facultative,
            et recommandée pour les comptes recruteurs.
          </p>
          <ButtonLink href="/2fa" variant="outline" size="sm" className="mt-3">
            Activer la double authentification
            <IconArrowRight size={15} />
          </ButtonLink>
        </div>
      </div>

      <p className="mt-8 border-t border-[var(--color-border)] pt-6 text-[13px] text-[var(--color-text-muted)]">
        Une adresse ou un numéro erroné ?{" "}
        <Link href="/connexion" className="font-medium text-[var(--color-primary)] hover:underline">
          Revenir à la connexion
        </Link>
      </p>
    </div>
  );
}

function VerificationBlock({
  channel,
  verified,
  onVerified,
}: {
  channel: Channel;
  verified: boolean;
  onVerified: () => void;
}) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [secondes, setSecondes] = useState(RESEND_DELAY);
  const [renvoye, setRenvoye] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setSecondes((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  function resend() {
    setSecondes(RESEND_DELAY);
    setRenvoye(true);
    setError("");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.some((c) => c === "")) {
      setError("Saisissez les 6 chiffres reçus.");
      return;
    }
    setError("");
    onVerified();
  }

  const fieldId = `code-${channel.key}`;

  return (
    <section className="py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span
            className={cx(
              "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              verified
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
            )}
            aria-hidden
          >
            {channel.icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{channel.title}</h2>
            <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{channel.destination}</p>
          </div>
        </div>
        {verified ? (
          <Badge tone="success" icon={<IconCheckCircle size={13} />}>
            Vérifié
          </Badge>
        ) : (
          <Badge tone="warning" icon={<IconClock size={13} />}>
            En attente
          </Badge>
        )}
      </div>

      {verified ? (
        <p className="mt-3 pl-11 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{channel.help}</p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 space-y-3.5 pl-11">
          <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">{channel.help}</p>

          {renvoye ? (
            <Alert tone="info">Un nouveau code vient d&apos;être envoyé à {channel.destination}.</Alert>
          ) : null}

          <div>
            <p className="mb-2 text-[12.5px] font-medium text-[var(--color-text)]">Code reçu</p>
            <OtpInput
              idPrefix={fieldId}
              value={code}
              onChange={setCode}
              label={`Code de vérification pour ${channel.title}`}
              describedBy={error ? errorId(fieldId) : undefined}
            />
            {error ? (
              <p id={errorId(fieldId)} role="alert" className="mt-1.5 text-[12px] text-[var(--color-danger)]">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit">Vérifier</Button>
            <button
              type="button"
              disabled={secondes > 0}
              onClick={resend}
              className="rounded-md text-[12.5px] font-medium text-[var(--color-primary)] hover:underline disabled:pointer-events-none disabled:text-[var(--color-text-subtle)]"
            >
              {secondes > 0 ? `Renvoyer le code dans ${formatCountdown(secondes)}` : "Renvoyer le code"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
