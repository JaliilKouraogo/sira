"use client";

/**
 * Actions secondaires d'une offre : enregistrer, partager, signaler.
 * Seul composant client de la zone publique, parce que ces trois actions
 * exigent un état local et l'API de partage du navigateur.
 */

import { useState } from "react";
import { IconBookmark, IconCheck, IconFlag, IconShare } from "@/components/icons";
import { Alert, Button, Field, Select, Textarea, cx } from "@/components/ui";

const REPORT_REASONS = [
  "Offre frauduleuse ou suspecte",
  "Demande d'argent au candidat",
  "Contenu discriminatoire",
  "Offre déjà pourvue ou expirée",
  "Doublon d'une autre offre",
  "Autre motif",
];

export function PublicJobActions({ jobTitle, jobPath }: { jobTitle: string; jobPath: string }) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState<"idle" | "copie" | "echec">("idle");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  async function share() {
    const url = typeof window === "undefined" ? jobPath : `${window.location.origin}${jobPath}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: jobTitle, url });
        setShared("idle");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared("copie");
    } catch {
      setShared("echec");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          className={cx(saved && "border-[var(--color-primary)] text-[var(--color-primary)]")}
        >
          <IconBookmark size={16} />
          {saved ? "Offre enregistrée" : "Enregistrer"}
        </Button>

        <Button variant="outline" onClick={share}>
          <IconShare size={16} />
          Partager
        </Button>

        <Button
          variant="ghost"
          onClick={() => setReportOpen((v) => !v)}
          aria-expanded={reportOpen}
          aria-controls="formulaire-signalement"
        >
          <IconFlag size={16} />
          Signaler
        </Button>
      </div>

      {shared === "copie" ? (
        <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-success)]">
          <IconCheck size={14} />
          Lien de l&apos;offre copié dans le presse-papiers.
        </p>
      ) : null}
      {shared === "echec" ? (
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Le partage n&apos;a pas abouti. Copiez l&apos;adresse de la page depuis la barre du navigateur.
        </p>
      ) : null}

      {saved ? (
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Enregistrée pour cette visite. Créez un compte pour retrouver vos offres sur tous vos appareils.
        </p>
      ) : null}

      {reportOpen ? (
        <div
          id="formulaire-signalement"
          className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4"
        >
          {reportSent ? (
            <Alert tone="success" title="Signalement transmis" icon={<IconCheck size={16} />}>
              Un modérateur examinera cette offre. Vous ne recevrez pas de réponse individuelle, mais l&apos;offre
              peut être suspendue le temps de la vérification.
            </Alert>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setReportSent(true);
              }}
            >
              <Field label="Motif du signalement" htmlFor="motif-signalement" required>
                <Select id="motif-signalement" name="motif" required defaultValue="">
                  <option value="" disabled>
                    Choisir un motif
                  </option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Précisions"
                htmlFor="detail-signalement"
                hint="Facultatif. Décrivez ce qui vous semble anormal dans cette offre."
              >
                <Textarea id="detail-signalement" name="detail" rows={3} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm">
                  Envoyer le signalement
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReportOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
