"use client";

/**
 * Inscription à la lettre d'information du pied de page.
 * Aucun envoi réel tant que l'API n'est pas branchée : la validation et le
 * message de confirmation sont simulés, mais l'accessibilité est complète.
 */

import { useId, useState, type FormEvent } from "react";

export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");

  function submit(e: FormEvent) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    setStatus(valid ? "done" : "error");
  }

  if (status === "done") {
    return (
      <p role="status" className="rounded-[0.5rem] bg-site-soft px-4 py-3.5 text-[0.9375rem] text-site-navy">
        Merci. Vous recevrez nos prochains conseils emploi à l&apos;adresse {email.trim()}.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor={`${id}-email`} className="sr-only">
        Adresse e-mail
      </label>
      <div className="flex flex-col gap-3 xs:flex-row">
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Votre adresse e-mail"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? `${id}-err` : undefined}
          className="min-h-12 w-full flex-1 rounded-[0.5rem] border border-site-ink/60 bg-white px-4 text-[1rem] text-site-ink outline-none placeholder:text-site-muted focus:border-site-navy focus:ring-1 focus:ring-site-navy"
        />
        <button
          type="submit"
          className="min-h-12 shrink-0 rounded-[0.5rem] bg-site-navy px-6 text-[1rem] font-semibold text-white transition-colors duration-[250ms] hover:bg-site-navy-deep"
        >
          S&apos;abonner
        </button>
      </div>
      {status === "error" ? (
        <p id={`${id}-err`} className="mt-2 text-[0.875rem] text-[#b42318]">
          Saisissez une adresse e-mail valide.
        </p>
      ) : null}
    </form>
  );
}
