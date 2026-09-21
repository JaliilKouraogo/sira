"use client";

/**
 * Actions simulées de l'espace candidat.
 *
 * Il n'y a pas de backend : chaque bouton confirme à l'écran ce qui se
 * passerait réellement, dans une région `role="status"` annoncée aux lecteurs
 * d'écran. Les actions impossibles restent visibles mais désactivées, avec la
 * raison écrite en toutes lettres — jamais un bouton muet.
 */

import { useState, type ReactNode } from "react";
import { Alert, Button, cx, type Tone } from "./ui";

export interface SimulatedAction {
  label: string;
  /** Message affiché après le clic : ce que SIRA ferait vraiment. */
  message: string;
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  tone?: Tone;
  disabled?: boolean;
  /** Obligatoire dès que `disabled` est vrai : la raison lisible à l'écran. */
  disabledReason?: string;
}

export function SimulatedActionBar({
  actions,
  className,
  note,
  align = "start",
}: {
  actions: SimulatedAction[];
  className?: string;
  note?: ReactNode;
  align?: "start" | "end";
}) {
  const [feedback, setFeedback] = useState<{ message: string; tone: Tone } | null>(null);

  return (
    <div className={className}>
      <div className={cx("flex flex-wrap items-center gap-2", align === "end" ? "justify-end" : undefined)}>
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? "outline"}
            size={action.size ?? "sm"}
            disabled={action.disabled}
            title={action.disabled ? action.disabledReason : undefined}
            onClick={() => setFeedback({ message: action.message, tone: action.tone ?? "success" })}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>

      {actions
        .filter((action) => action.disabled && action.disabledReason)
        .map((action) => (
          <p
            key={`reason-${action.label}`}
            className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--color-text-muted)]"
          >
            <span aria-hidden>•</span>
            <span className="min-w-0">
              <strong className="font-medium text-[var(--color-text)]">{action.label}</strong> — {action.disabledReason}
            </span>
          </p>
        ))}

      {note ? <div className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">{note}</div> : null}

      <div role="status" aria-live="polite" className={feedback ? "mt-3" : undefined}>
        {feedback ? (
          <Alert tone={feedback.tone} title="Action simulée">
            {feedback.message}
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

/** Bouton unique, raccourci du composant ci-dessus. */
export function SimulatedButton(props: SimulatedAction & { className?: string }) {
  const { className, ...action } = props;
  return <SimulatedActionBar actions={[action]} className={className} />;
}
