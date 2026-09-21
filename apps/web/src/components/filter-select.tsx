"use client";

/**
 * Liste déroulante compacte de la barre de filtres.
 *
 * Elle soumet son formulaire dès que la valeur change, ce qui évite le bouton
 * « Appliquer » et rend le filtrage immédiat. Sans JavaScript, le bouton de
 * secours de la barre prend le relais : rien n'est perdu.
 *
 * L'apparence change selon qu'un filtre est actif ou non, pour qu'on voie
 * d'un coup d'œil ce qui est appliqué.
 */
export function FilterSelect({
  name,
  label,
  allLabel,
  value,
  options,
}: {
  name: string;
  label: string;
  allLabel: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  const active = Boolean(value);

  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={value}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={[
        "h-8 max-w-[13rem] cursor-pointer truncate rounded-full border py-0 pl-3 pr-7 text-[12.5px] transition-colors outline-none",
        "focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)]"
          : "border-[var(--color-border-strong)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:border-[var(--color-text-subtle)] hover:text-[var(--color-text)]",
      ].join(" ")}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
