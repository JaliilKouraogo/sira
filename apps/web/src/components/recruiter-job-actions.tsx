"use client";

/**
 * Transitions d'état d'une offre : suspendre, clôturer, republier.
 * Actions simulées côté client, sans écriture. Chaque transition affiche
 * l'effet qu'elle aurait sur la visibilité de l'offre.
 */

import { useState } from "react";
import Link from "next/link";
import { JOB_STATUS_LABEL, type JobStatus } from "@/lib/enums";
import { Button, cx } from "./ui";
import { IconCheck } from "./icons";

interface Transition {
  label: string;
  next: JobStatus;
  variant: "outline" | "danger" | "primary";
  message: (title: string) => string;
}

const TRANSITIONS: Transition[] = [
  {
    label: "Suspendre",
    next: "suspendue",
    variant: "outline",
    message: (t) =>
      `« ${t} » est suspendue : elle disparaît des résultats et n'accepte plus de candidature. Les dossiers déjà reçus restent accessibles.`,
  },
  {
    label: "Clôturer",
    next: "cloturee",
    variant: "danger",
    message: (t) => `« ${t} » est clôturée. Le poste passe en archive et l'offre n'est plus consultable.`,
  },
  {
    label: "Republier",
    next: "publiee",
    variant: "primary",
    message: (t) =>
      `« ${t} » est de nouveau en ligne. Pensez à repousser la date limite depuis l'étape « Conditions et candidature ».`,
  },
];

export function JobStateActions({ status, title }: { status: JobStatus; title: string }) {
  const [current, setCurrent] = useState<JobStatus>(status);
  const [trace, setTrace] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[var(--color-text-muted)]">
        État actuel :{" "}
        <strong className="font-semibold text-[var(--color-text)]">{JOB_STATUS_LABEL[current]}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        {TRANSITIONS.map((t) => (
          <Button
            key={t.next}
            size="sm"
            variant={t.variant}
            disabled={current === t.next}
            onClick={() => {
              setCurrent(t.next);
              setTrace(t.message(title));
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>
      {trace ? (
        <p className="flex items-start gap-1.5 text-[12px] text-[var(--color-text-muted)]">
          <IconCheck size={13} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
          <span>{trace}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Actions compactes d'une ligne de tableau. */
export function JobRowActions({
  id,
  slug,
  title,
  status,
}: {
  id: string;
  slug: string;
  title: string;
  status: JobStatus;
}) {
  const [current, setCurrent] = useState<JobStatus>(status);
  const [trace, setTrace] = useState<string | null>(null);

  const linkClass =
    "inline-flex h-8 items-center rounded-lg border border-[var(--color-border-strong)] px-2.5 text-[12.5px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)]";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link href={`/recruteur/offres/${id}`} className={linkClass}>
        Modifier
      </Link>
      <Link href={`/offres/${slug}`} className={linkClass}>
        Voir
      </Link>
      {TRANSITIONS.filter((t) => (current === "publiee" ? t.next !== "publiee" : true)).map((t) => (
        <button
          key={t.next}
          type="button"
          disabled={current === t.next}
          onClick={() => {
            setCurrent(t.next);
            setTrace(t.message(title));
          }}
          className={cx(
            linkClass,
            t.next === "cloturee" ? "text-[var(--color-danger)]" : "",
            current === t.next ? "opacity-40" : "",
          )}
        >
          {t.label}
        </button>
      ))}
      {trace ? (
        <p className="w-full pt-1 text-right text-[11.5px] text-[var(--color-success)]">{trace}</p>
      ) : null}
    </div>
  );
}
