"use client";

/**
 * Actions candidat sur une offre : postuler, préparer, enregistrer, partager,
 * signaler. Aucun backend dans cette version : chaque action confirme son
 * effet localement et le dit explicitement à l'utilisatrice.
 */

import { useState } from "react";
import {
  IconBookmark,
  IconCheck,
  IconFlag,
  IconShare,
  IconSparkles,
} from "@/components/icons";
import { Alert, Button, ButtonLink, Field, Select, Textarea, cx } from "@/components/ui";
import { APPLICATION_CHANNEL_LABEL, type ApplicationChannel } from "@/lib/enums";

const REPORT_REASONS = [
  "Offre frauduleuse ou suspecte",
  "Demande d'argent au candidat",
  "Contenu discriminatoire",
  "Offre déjà pourvue ou expirée",
  "Doublon d'une autre offre",
  "Autre motif",
];

export function CandidateJobActions({
  jobId,
  jobTitle,
  preparationHref,
  channel,
  canApply,
  initiallySaved,
}: {
  jobId: string;
  jobTitle: string;
  preparationHref: string;
  channel: ApplicationChannel;
  canApply: boolean;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [applied, setApplied] = useState(false);
  const [shared, setShared] = useState<"idle" | "copied" | "failed">("idle");
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  const share = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: jobTitle, url });
        setShared("copied");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared("copied");
    } catch {
      setShared("failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <Button
          size="md"
          disabled={!canApply}
          onClick={() => setApplied(true)}
          aria-describedby={applied ? "action-feedback" : undefined}
        >
          Postuler
        </Button>
        <ButtonLink href={preparationHref} variant="accent" size="md">
          <IconSparkles size={16} />
          Préparer ma candidature
        </ButtonLink>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={saved}
            onClick={() => setSaved((s) => !s)}
            className={cx("flex-1", saved && "text-[var(--color-accent-text)]")}
          >
            <IconBookmark size={15} />
            {saved ? "Enregistrée" : "Enregistrer"}
          </Button>
          <Button variant="outline" size="sm" onClick={share} className="flex-1">
            <IconShare size={15} />
            Partager
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={reportOpen}
            aria-controls={`signalement-${jobId}`}
            onClick={() => setReportOpen((o) => !o)}
            className="flex-1 text-[var(--color-text-muted)]"
          >
            <IconFlag size={15} />
            Signaler
          </Button>
        </div>
      </div>

      <div id="action-feedback" role="status" className="space-y-3">
        {applied ? (
          <Alert tone="success" title="Candidature simulée" icon={<IconCheck size={15} />}>
            Dans cette démonstration, aucun envoi réel n&apos;est effectué. Votre dossier serait transmis via{" "}
            {APPLICATION_CHANNEL_LABEL[channel].toLowerCase()}, après votre validation. Préparez vos pièces pour
            maximiser vos chances.
          </Alert>
        ) : null}
        {!canApply ? (
          <Alert tone="warning" title="Offre fermée aux candidatures">
            Cette offre n&apos;accepte plus de dépôt. Elle reste consultable pour information.
          </Alert>
        ) : null}
        {saved && !initiallySaved ? (
          <p className="text-[12.5px] text-[var(--color-text-muted)]">
            Offre ajoutée à vos offres enregistrées (simulation locale).
          </p>
        ) : null}
        {shared === "copied" ? (
          <p className="text-[12.5px] text-[var(--color-success)]">Lien de l&apos;offre copié.</p>
        ) : null}
        {shared === "failed" ? (
          <p className="text-[12.5px] text-[var(--color-text-muted)]">
            Le partage n&apos;est pas disponible sur cet appareil. Copiez l&apos;adresse depuis la barre du navigateur.
          </p>
        ) : null}
      </div>

      {reportOpen ? (
        <div
          id={`signalement-${jobId}`}
          className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3.5"
        >
          {reported ? (
            <Alert tone="success" title="Signalement enregistré" icon={<IconCheck size={15} />}>
              Merci. L&apos;équipe de modération examinera cette offre. Vous serez informée de la suite donnée.
            </Alert>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setReported(true);
              }}
            >
              <Field label="Motif du signalement" htmlFor={`motif-${jobId}`} required>
                <Select id={`motif-${jobId}`} name="motif" required defaultValue={REPORT_REASONS[0]}>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Précisions" htmlFor={`detail-${jobId}`} hint="Facultatif, aide la modération à trancher.">
                <Textarea id={`detail-${jobId}`} name="detail" rows={3} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" variant="danger">
                  Envoyer le signalement
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setReportOpen(false)}>
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
