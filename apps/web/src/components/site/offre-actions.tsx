"use client";

/**
 * Parties interactives du détail d'une offre :
 * - `OffreCountdown` : compte à rebours jusqu'à la clôture des candidatures ;
 * - `OffreActions` : enregistrer, partager et signaler l'offre.
 *
 * Le nombre de jours restants est calculé par la page, sur la même date de
 * référence que le reste du site. Le compte à rebours n'ajoute que les heures,
 * minutes et secondes qui séparent de la fin de la journée : le rendu serveur
 * affiche des tirets à leur place, puis le navigateur prend le relais.
 */

import { useEffect, useId, useRef, useState } from "react";
import { IconBookmark, IconCheck, IconFlag, IconShare } from "@/components/icons";
import { SiteButton, cn } from "./kit";

// ---------------------------------------------------------------------------
// Compte à rebours
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Temps restant avant minuit (UTC), en secondes. */
function secondsLeftToday(): number {
  const now = new Date();
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, Math.floor((end - now.getTime()) / 1000));
}

export function OffreCountdown({ remainingDays }: { remainingDays: number }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (remainingDays < 0) return;
    const tick = () => setLeft(secondsLeftToday());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [remainingDays]);

  if (remainingDays < 0) {
    return (
      <p className="rounded-[0.75rem] bg-site-soft px-4 py-3 text-[0.9375rem] font-semibold text-site-navy">
        Candidatures closes
      </p>
    );
  }

  const units: { value: string; label: string }[] = [
    { value: pad(remainingDays), label: remainingDays > 1 ? "jours" : "jour" },
    { value: left === null ? "--" : pad(Math.floor(left / 3600)), label: "heures" },
    { value: left === null ? "--" : pad(Math.floor((left % 3600) / 60)), label: "min" },
    { value: left === null ? "--" : pad(left % 60), label: "s" },
  ];

  const status =
    remainingDays === 0
      ? "Dernier jour pour postuler"
      : remainingDays <= 7
        ? `Plus que ${remainingDays} jour${remainingDays > 1 ? "s" : ""} pour postuler`
        : `Encore ${remainingDays} jours pour candidater`;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2" aria-hidden>
        {units.map((u, i) => (
          <div
            key={u.label}
            className={cn(
              "flex flex-col items-center rounded-[0.75rem] border border-site-border px-1 py-2.5",
              i === 0 ? "bg-site-navy text-white" : "bg-white text-site-navy",
            )}
          >
            <span
              className={cn(
                "site-display text-[1.625rem] leading-none tabular-nums",
                i === 0 ? "text-site-gold" : "text-site-navy",
              )}
            >
              {u.value}
            </span>
            <span className={cn("mt-1 text-[0.75rem]", i === 0 ? "text-white/80" : "text-site-muted")}>{u.label}</span>
          </div>
        ))}
      </div>
      <p
        className={cn(
          "mt-3 text-[0.875rem]",
          remainingDays <= 7 ? "font-semibold text-site-navy" : "text-site-muted",
        )}
      >
        {status}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enregistrer, partager, signaler
// ---------------------------------------------------------------------------

const REPORT_REASONS = [
  "Offre frauduleuse ou suspecte",
  "Demande d'argent au candidat",
  "Contenu discriminatoire",
  "Offre déjà pourvue ou expirée",
  "Doublon d'une autre offre",
  "Autre motif",
];

const FIELD =
  "w-full rounded-[0.5rem] border border-site-line bg-white px-3 text-[0.9375rem] text-site-ink transition-colors focus:border-site-navy focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-navy";

const ACTION =
  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[0.75rem] border px-1 py-2 text-[0.8125rem] font-semibold transition-colors duration-[250ms]";

export function OffreActions({ jobTitle }: { jobTitle: string }) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState<"idle" | "copie" | "echec">("idle");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const base = useId();
  const formId = `${base}-signalement`;
  const reasonRef = useRef<HTMLSelectElement | null>(null);

  // À l'ouverture, le focus passe au premier champ une fois le volet déplié :
  // le navigateur fait alors défiler l'encadré jusqu'au formulaire.
  useEffect(() => {
    if (!reportOpen) return;
    const t = window.setTimeout(() => reasonRef.current?.focus(), 450);
    return () => window.clearTimeout(t);
  }, [reportOpen]);

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: jobTitle, url });
        setShared("idle");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared("copie");
    } catch (err) {
      // Fermer la feuille de partage n'est pas un échec.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShared("echec");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          className={cn(
            ACTION,
            saved
              ? "border-site-navy bg-site-navy text-white"
              : "border-site-line bg-white text-site-navy hover:border-site-navy",
          )}
        >
          <IconBookmark size={18} strokeWidth={1.6} className={saved ? "text-site-gold" : undefined} />
          {saved ? "Enregistrée" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={share}
          className={cn(ACTION, "border-site-line bg-white text-site-navy hover:border-site-navy")}
        >
          <IconShare size={18} strokeWidth={1.6} />
          Partager
        </button>
        <button
          type="button"
          onClick={() => setReportOpen((v) => !v)}
          aria-expanded={reportOpen}
          aria-controls={formId}
          className={cn(
            ACTION,
            reportOpen
              ? "border-site-navy bg-site-soft text-site-navy"
              : "border-site-line bg-white text-site-navy hover:border-site-navy",
          )}
        >
          <IconFlag size={18} strokeWidth={1.6} />
          Signaler
        </button>
      </div>

      <div aria-live="polite">
        {shared === "copie" ? (
          <p className="mt-3 flex items-center gap-1.5 text-[0.8125rem] text-site-navy">
            <IconCheck size={14} className="shrink-0 text-site-gold" />
            Lien de l&apos;offre copié dans le presse-papiers.
          </p>
        ) : null}
        {shared === "echec" ? (
          <p className="mt-3 text-[0.8125rem] text-site-muted">
            Le partage n&apos;a pas abouti. Copiez l&apos;adresse de la page depuis la barre du navigateur.
          </p>
        ) : null}
        {saved ? (
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-site-muted">
            Enregistrée pour cette visite. Créez un compte pour retrouver vos offres sur tous vos appareils.
          </p>
        ) : null}
      </div>

      <div id={formId} className="site-collapse" data-open={reportOpen} inert={!reportOpen}>
        <div>
          <div className="mt-4 rounded-[0.75rem] border border-site-line bg-site-light p-4">
            {reportSent ? (
              <div role="status">
                <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-site-navy">
                  <IconCheck size={16} className="shrink-0 text-site-gold" />
                  Signalement transmis
                </p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-site-muted">
                  Un modérateur examinera cette offre. Vous ne recevrez pas de réponse individuelle, mais l&apos;offre
                  peut être suspendue le temps de la vérification.
                </p>
              </div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setReportSent(true);
                }}
              >
                <div>
                  <label htmlFor={`${base}-motif`} className="block text-[0.8125rem] font-semibold text-site-navy">
                    Motif du signalement <span aria-hidden>*</span>
                  </label>
                  <select
                    ref={reasonRef}
                    id={`${base}-motif`}
                    name="motif"
                    required
                    defaultValue=""
                    className={cn(FIELD, "mt-1.5 min-h-11")}
                  >
                    <option value="" disabled>
                      Choisir un motif
                    </option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${base}-detail`} className="block text-[0.8125rem] font-semibold text-site-navy">
                    Précisions
                  </label>
                  <p id={`${base}-detail-aide`} className="text-[0.75rem] text-site-muted">
                    Facultatif. Décrivez ce qui vous semble anormal dans cette offre.
                  </p>
                  <textarea
                    id={`${base}-detail`}
                    name="detail"
                    rows={3}
                    aria-describedby={`${base}-detail-aide`}
                    className={cn(FIELD, "mt-1.5 py-2")}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <SiteButton type="submit" size="sm">
                    Envoyer le signalement
                  </SiteButton>
                  <SiteButton type="button" variant="outline-dark" size="sm" onClick={() => setReportOpen(false)}>
                    Annuler
                  </SiteButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
