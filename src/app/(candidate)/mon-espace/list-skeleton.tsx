/**
 * Squelette des listes à onglets de l'espace candidat.
 *
 * Les onglets et les filtres vivent dans l'adresse, lue dans le navigateur
 * pour permettre l'export statique. Pendant cette lecture, ce squelette
 * réserve la place des onglets et de quelques lignes, sans rien affirmer
 * sur le contenu.
 */

import { cx } from "@/components/ui";

export function TabbedListSkeleton({
  label,
  tabs = 5,
  rows = 4,
  cards = false,
}: {
  /** Message lu par les technologies d'assistance pendant le chargement. */
  label: string;
  tabs?: number;
  rows?: number;
  /** Cartes sur deux colonnes plutôt que lignes séparées par un filet. */
  cards?: boolean;
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">{label}</p>
      <div className="mb-5 flex items-center gap-5 overflow-hidden border-b border-[var(--color-border)] pb-2.5" aria-hidden>
        {Array.from({ length: tabs }, (_, i) => (
          <div key={i} className={cx("sira-skeleton h-4 shrink-0 rounded", i === 0 ? "w-28" : "w-20")} />
        ))}
      </div>
      <div
        className={cx(
          cards
            ? "grid gap-3 lg:grid-cols-2"
            : "divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]",
        )}
        aria-hidden
      >
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className={cx(
              "flex gap-3.5",
              cards ? "rounded-[var(--radius-card)] border border-[var(--color-border)] p-4" : "py-4",
            )}
          >
            <div className="sira-skeleton h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="sira-skeleton h-4 w-2/3 rounded" />
              <div className="sira-skeleton h-3 w-1/3 rounded" />
              <div className="sira-skeleton h-3 w-4/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
