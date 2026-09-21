"use client";

/**
 * Briques de formulaire propres au parcours d'authentification SIRA.
 * Elles s'appuient sur les primitives partagées de `@/components/ui` et
 * n'introduisent aucune dépendance : l'état est géré avec `useState`.
 *
 * Accessibilité : chaque champ porte un `<label>` lié, les messages d'erreur
 * sont reliés par `aria-describedby` et le focus reste visible partout.
 */

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { IconCheck, IconClose, IconFile, IconPlus } from "@/components/icons";
import { Field, Input, cx } from "@/components/ui";

// --------------------------------------------------------------------------
// Champ avec message d'erreur identifié
// --------------------------------------------------------------------------

/** Identifiant du message d'erreur d'un champ, à passer en aria-describedby. */
export function errorId(id: string): string {
  return `${id}-erreur`;
}

/**
 * Enveloppe `Field` en ajoutant un message d'erreur porteur d'un `id`, de
 * façon à pouvoir le relier au champ par `aria-describedby`.
 */
export function AuthField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Field label={label} htmlFor={htmlFor} required={required} hint={error ? undefined : hint}>
      {children}
      {error ? (
        <p id={errorId(htmlFor)} role="alert" className="text-[12px] text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </Field>
  );
}

/** Légende de groupe (fieldset) alignée sur le style des labels. */
export function GroupLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <>
      <legend className="block text-[13px] font-medium text-[var(--color-text)]">{children}</legend>
      {hint ? <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{hint}</p> : null}
    </>
  );
}

// --------------------------------------------------------------------------
// Mot de passe avec bouton afficher / masquer
// --------------------------------------------------------------------------

const IconEye = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 4l16 16" />
    <path d="M9.9 5.7A9.8 9.8 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.5 4.2" />
    <path d="M6.4 7.6A16.6 16.6 0 0 0 2 12s3.6 6.5 10 6.5c1.3 0 2.4-.2 3.4-.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  describedBy,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoComplete?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute right-1 top-1 inline-flex h-8 w-9 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Code à 6 chiffres — 6 champs liés, passage automatique au suivant
// --------------------------------------------------------------------------

export function OtpInput({
  idPrefix,
  value,
  onChange,
  describedBy,
  label = "Code à 6 chiffres",
}: {
  idPrefix: string;
  value: string[];
  onChange: (next: string[]) => void;
  describedBy?: string;
  label?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function write(from: number, digits: string) {
    const next = [...value];
    for (let k = 0; k < digits.length && from + k < 6; k += 1) next[from + k] = digits[k];
    onChange(next);
    refs.current[Math.min(from + digits.length, 5)]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = [...value];
      next[index] = "";
      onChange(next);
      return;
    }
    write(index, digits);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      event.preventDefault();
      const next = [...value];
      next[index - 1] = "";
      onChange(next);
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className="flex gap-1.5 sm:gap-2"
      onPaste={(e) => {
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (digits) {
          e.preventDefault();
          write(0, digits);
        }
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Chiffre ${i + 1} sur 6`}
          className="h-11 w-full min-w-0 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-center text-[17px] font-semibold tabular-nums text-[var(--color-text)] transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:h-12 sm:w-12"
        />
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------
// Saisie par étiquettes
// --------------------------------------------------------------------------

export function TagInput({
  id,
  values,
  onChange,
  placeholder,
  describedBy,
  invalid,
}: {
  id: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const clean = raw.trim().replace(/,$/, "").trim();
    if (!clean || values.includes(clean)) {
      setDraft("");
      return;
    }
    onChange([...values, clean]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          onClick={() => add(draft)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <IconPlus size={15} />
          Ajouter
        </button>
      </div>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li key={v}>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] py-0.5 pl-2.5 pr-1 text-[12.5px] text-[var(--color-primary)]">
                {v}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`Retirer ${v}`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-primary)]/15"
                >
                  <IconClose size={12} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// Étiquettes à cocher (multi-sélection)
// --------------------------------------------------------------------------

export function ToggleChips({
  legend,
  hint,
  options,
  values,
  onChange,
  idPrefix,
  single = false,
}: {
  legend: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
  values: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
  single?: boolean;
}) {
  return (
    <fieldset>
      <GroupLabel hint={hint}>{legend}</GroupLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option.value);
          const id = `${idPrefix}-${option.value.replace(/[^\w-]/g, "")}`;
          return (
            <span key={option.value} className="inline-flex">
              <input
                type={single ? "radio" : "checkbox"}
                name={single ? idPrefix : undefined}
                id={id}
                checked={active}
                onChange={() => {
                  if (single) {
                    onChange([option.value]);
                    return;
                  }
                  onChange(active ? values.filter((v) => v !== option.value) : [...values, option.value]);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cx(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-primary)]",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)]"
                    : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
                )}
              >
                {active ? <IconCheck size={13} /> : null}
                {option.label}
              </label>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}

// --------------------------------------------------------------------------
// Zone de dépôt de fichier (glisser-déposer simulé)
// --------------------------------------------------------------------------

export function FileDrop({
  id,
  title,
  hint,
  accept,
  multiple = false,
  onFiles,
}: {
  id: string;
  title: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onFiles?: (names: string[]) => void;
}) {
  const [names, setNames] = useState<string[]>([]);
  const [over, setOver] = useState(false);

  function accepted(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next = multiple
      ? [...names, ...Array.from(list).map((f) => f.name)].filter((v, i, a) => a.indexOf(v) === i)
      : [list[0].name];
    setNames(next);
    onFiles?.(next);
  }

  function remove(name: string) {
    const next = names.filter((n) => n !== name);
    setNames(next);
    onFiles?.(next);
  }

  return (
    <div>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="peer sr-only"
        onChange={(e) => accepted(e.target.files)}
      />
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accepted(e.dataTransfer.files);
        }}
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed px-4 py-7 text-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-primary)]",
          over
            ? "border-[var(--color-primary)] bg-[var(--color-surface-2)]"
            : "border-[var(--color-border-strong)] hover:border-[var(--color-primary)]",
        )}
      >
        <span className="text-[var(--color-text-subtle)]">
          <IconFile size={22} />
        </span>
        <span className="mt-2 text-[13px] font-medium text-[var(--color-text)]">{title}</span>
        <span className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
          Glissez le fichier ici ou cliquez pour le choisir
        </span>
        {hint ? <span className="mt-1 text-[12px] text-[var(--color-text-subtle)]">{hint}</span> : null}
      </label>

      {names.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {names.map((name) => (
            <li
              key={name}
              className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-[var(--color-success)]">
                  <IconCheck size={14} />
                </span>
                <span className="truncate text-[13px] text-[var(--color-text)]">{name}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(name)}
                aria-label={`Retirer le fichier ${name}`}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)]"
              >
                <IconClose size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// Compte à rebours de renvoi de code
// --------------------------------------------------------------------------

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
