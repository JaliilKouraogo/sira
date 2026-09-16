/**
 * Primitives du design system SIRA.
 *
 * Direction visuelle : épuré et clair. Pas d'ombre, pas de dégradé, pas de
 * grand aplat coloré. Les blocs sont délimités par un filet de 1 pixel ou
 * par un simple espace, les rayons sont courts, et la couleur ne sert qu'aux
 * actions et aux signaux. L'interface de programmation est inchangée : les
 * écrans n'ont rien à modifier.
 *
 * Les états loading, empty, error et success exigés par [T §19] sont fournis ici.
 */

import Link from "next/link";
import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// --------------------------------------------------------------------------
// Boutons
// --------------------------------------------------------------------------

type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)]",
  // L'or reste une touche : réservé aux appels à l'action secondaires, texte noir.
  accent: "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]",
  outline:
    "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
  ghost: "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
  danger: "bg-transparent border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-[13.5px]",
  lg: "h-11 px-5 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

// --------------------------------------------------------------------------
// Surfaces
// --------------------------------------------------------------------------

export function Card({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={cx(
        "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  id,
}: {
  children: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 id={id} className="text-[17px] font-semibold text-[var(--color-text)]">
        {children}
      </h2>
      {action}
    </div>
  );
}

// --------------------------------------------------------------------------
// Badges et puces de statut
// --------------------------------------------------------------------------

export type Tone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger" | "info";

/**
 * Badges discrets : fond très pâle, texte coloré, filet absent.
 * L'or passe par `--color-accent-text`, seule nuance lisible sur fond clair.
 */
const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  icon,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11.5px] font-medium leading-[18px]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Puce de statut : lit toujours les libellés du référentiel (section 5). */
export function StatusChip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <Badge tone={tone}>{label}</Badge>;
}

// --------------------------------------------------------------------------
// Formulaires
// --------------------------------------------------------------------------

const FIELD_BASE =
  "w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-[13.5px] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-[var(--color-text)]">
        {label}
        {required ? <span className="ml-0.5 text-[var(--color-danger)]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-[var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(FIELD_BASE, "h-9", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(FIELD_BASE, "py-2 leading-relaxed", className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cx(FIELD_BASE, "h-9 pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  ...rest
}: { label: string; description?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-[var(--color-border-strong)] accent-[var(--color-primary)]"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] text-[var(--color-text)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[12px] text-[var(--color-text-muted)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

// --------------------------------------------------------------------------
// Indicateurs
// --------------------------------------------------------------------------

export function Progress({
  value,
  tone = "primary",
  className,
  label,
}: {
  value: number;
  tone?: "primary" | "accent" | "success" | "warning" | "danger";
  className?: string;
  label?: string;
}) {
  const colors = {
    primary: "var(--color-primary)",
    accent: "var(--color-accent)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  } as const;
  return (
    <div className={className}>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: colors[tone] }}
        />
      </div>
    </div>
  );
}

/** Chiffre clé : pas de cadre, la valeur porte seule la hiérarchie. */
export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1 text-[26px] font-semibold leading-tight text-[var(--color-text)]">{value}</p>
          {hint ? <p className="mt-0.5 text-[12px] text-[var(--color-text-subtle)]">{hint}</p> : null}
        </div>
        {icon ? (
          <span className={cx("rounded p-1.5", TONE_CLASSES[tone])} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Avatar({
  initials,
  color,
  size = 40,
  rounded = "lg",
}: {
  initials: string;
  color?: string;
  size?: number;
  rounded?: "lg" | "full";
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface-2)] font-semibold text-[var(--color-text-muted)]",
        rounded === "full" ? "rounded-full" : "rounded-md",
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        // La couleur de marque d'une organisation reste admise, en texte seul.
        color: color ?? undefined,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

// --------------------------------------------------------------------------
// États : vide, erreur, chargement — exigés par [T §19]
// --------------------------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border-t border-[var(--color-border)] px-6 py-16 text-center">
      {icon ? <div className="mb-3 text-[var(--color-text-subtle)]">{icon}</div> : null}
      <p className="text-[14px] font-medium text-[var(--color-text)]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border-l-2 border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3">
      <p className="text-[13.5px] font-semibold text-[var(--color-danger)]">{title}</p>
      {description ? <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("sira-skeleton rounded", className)} />;
}

/** Encart d'information : un filet coloré à gauche plutôt qu'un aplat. */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  const accents: Record<Tone, string> = {
    neutral: "var(--color-border-strong)",
    primary: "var(--color-primary)",
    accent: "var(--color-accent)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    info: "var(--color-info)",
  };
  return (
    <div
      className="rounded-r border-l-2 bg-[var(--color-surface-2)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]"
      style={{ borderLeftColor: accents[tone] }}
    >
      <div className="flex gap-2.5">
        {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
        <div className="min-w-0">
          {title ? <p className="mb-0.5 font-semibold text-[var(--color-text)]">{title}</p> : null}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Divers
// --------------------------------------------------------------------------

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-1.5 text-[12.5px]">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-[var(--color-text-subtle)]">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DataList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-[var(--color-border)]">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
          <dt className="text-[12.5px] text-[var(--color-text-muted)]">{row.label}</dt>
          <dd className="text-[13.5px] text-[var(--color-text)] sm:col-span-2">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[11.5px] text-[var(--color-text-muted)]">
      {children}
    </span>
  );
}

/** Date lisible en français, à partir d'une chaîne ISO courte. */
export function formatDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}

/** Ancienneté relative, calculée par rapport à la date de référence de la démo. */
export function relativeDays(iso: string, today = "2026-09-12"): string {
  const a = Date.parse(`${iso.slice(0, 10)}T12:00:00Z`);
  const b = Date.parse(`${today}T12:00:00Z`);
  const days = Math.round((b - a) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 31) return `il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? "s" : ""}`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

export function daysUntil(iso: string, today = "2026-09-12"): number {
  const a = Date.parse(`${iso.slice(0, 10)}T12:00:00Z`);
  const b = Date.parse(`${today}T12:00:00Z`);
  return Math.round((a - b) / 86400000);
}
