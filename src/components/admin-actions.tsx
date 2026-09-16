"use client";

import { useState } from "react";
import { Button, cx } from "@/components/ui";

type ActionVariant = "primary" | "accent" | "outline" | "ghost" | "danger";

export interface SimulatedAction {
  label: string;
  variant?: ActionVariant;
  /** Message affiché après le clic. À défaut, un message générique est composé. */
  confirmation?: string;
}

/**
 * Boutons d'action du back-office. Il n'y a pas de backend à ce stade :
 * le clic n'écrit rien, il affiche la décision qui serait enregistrée et
 * tracée au journal d'audit. Aucun écran ne laisse croire à un effet réel.
 */
export function AdminActions({
  actions,
  subject,
  size = "sm",
  className,
}: {
  actions: SimulatedAction[];
  subject?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            size={size}
            variant={action.variant ?? "outline"}
            onClick={() =>
              setDone(
                action.confirmation ??
                  `Action simulée : « ${action.label} »${subject ? ` sur ${subject}` : ""}. Elle serait inscrite au journal d'audit.`,
              )
            }
          >
            {action.label}
          </Button>
        ))}
      </div>
      {done ? (
        <p
          role="status"
          className="rounded-r border-l-2 border-[var(--color-info)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]"
        >
          {done}
        </p>
      ) : null}
    </div>
  );
}
