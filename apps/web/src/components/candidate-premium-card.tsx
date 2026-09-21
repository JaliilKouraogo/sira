/**
 * Encart d'invitation à passer Premium.
 *
 * Règle produit : une fonction réservée au Premium n'est jamais masquée, elle
 * est présentée accompagnée de cette invitation.
 *
 * Direction épurée : plus d'aplat or sur le bloc, un simple filet le délimite.
 * L'or ne subsiste que sur l'étiquette et le bouton, où il porte toujours du
 * texte noir.
 */

import { IconCheck, IconSparkles } from "./icons";
import { ButtonLink, Card, cx } from "./ui";

export function CandidatePremiumCard({
  title,
  description,
  features,
  cta = "Découvrir Premium",
  href = "/mon-espace/abonnement",
  className,
}: {
  title: string;
  description: string;
  features?: string[];
  cta?: string;
  href?: string;
  className?: string;
}) {
  return (
    <Card className={cx("p-4", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-[var(--color-accent-text)]" aria-hidden>
          <IconSparkles size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[var(--color-text)]">
            {title}
            <span className="ml-2 inline-flex rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-accent-fg)]">
              Premium
            </span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>

          {features && features.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-[var(--color-text-muted)]">
                  <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                    <IconCheck size={14} />
                  </span>
                  <span className="min-w-0">{f}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <ButtonLink href={href} variant="accent" size="sm" className="mt-3.5">
            {cta}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
