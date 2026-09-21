/**
 * Composants de score de compatibilité.
 *
 * Règle non négociable de [T §6.4] : partout où un score est affiché, la
 * mention d'estimation algorithmique l'accompagne. Elle est portée par les
 * composants eux-mêmes et n'est jamais laissée à l'appelant.
 *
 * Direction épurée : le score est la seule touche de couleur autorisée dans
 * une liste. Pas de pastille pleine, pas de fond saturé, juste un chiffre
 * coloré et des filets.
 */

import Link from "next/link";
import { SCORE_COMPONENT_LABEL, SCORE_DISCLAIMER, type ScoreComponent } from "@/lib/enums";
import type { MatchScore } from "@/lib/types";
import { Progress, cx, type Tone } from "./ui";

export function scoreTone(score: number): Tone {
  if (score >= 75) return "success";
  if (score >= 50) return "accent";
  if (score >= 35) return "warning";
  return "danger";
}

export function scoreLabel(score: number): string {
  if (score >= 75) return "Très compatible";
  if (score >= 50) return "Compatible";
  if (score >= 35) return "Partiellement compatible";
  return "Peu compatible";
}

function scoreColor(score: number): string {
  if (score >= 75) return "var(--color-success)";
  if (score >= 50) return "var(--color-accent-text)";
  if (score >= 35) return "var(--color-warning)";
  return "var(--color-danger)";
}

/**
 * Score compact, utilisé sur les cartes et les lignes de liste.
 * `title` porte la mention obligatoire pour le survol et les lecteurs d'écran.
 */
export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  return (
    <span
      title={SCORE_DISCLAIMER}
      className={cx(
        "inline-flex shrink-0 items-baseline gap-1 font-semibold tabular-nums",
        size === "sm" ? "text-[13px]" : "text-[15px]",
      )}
      style={{ color: scoreColor(score) }}
    >
      {score}
      <span className={size === "sm" ? "text-[10.5px]" : "text-[11.5px]"}>%</span>
      <span className="sr-only">de compatibilité. {SCORE_DISCLAIMER}</span>
    </span>
  );
}

/** Anneau de score, utilisé en tête d'écran de détail. Trait fin. */
export function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  const stroke = Math.max(3, size * 0.055);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Score de compatibilité : ${score} sur 100`}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-semibold leading-none tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-[11px] text-[var(--color-text-subtle)]">sur 100</span>
      </span>
    </div>
  );
}

/**
 * Détail du score : les six composantes de [T §6.4], les critères
 * indispensables, les lacunes et les actions recommandées.
 */
export function ScoreBreakdown({ score }: { score: MatchScore }) {
  const components = Object.entries(score.breakdown) as [ScoreComponent, MatchScore["breakdown"][ScoreComponent]][];

  return (
    <div className="space-y-6">
      {score.blockingCriteria.length > 0 ? (
        <div className="rounded-r border-l-2 border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3.5 py-3">
          <p className="text-[13.5px] font-semibold text-[var(--color-danger)]">
            Critère indispensable non satisfait
          </p>
          <ul className="mt-1.5 ml-4 list-disc space-y-0.5 text-[13px] text-[var(--color-text-muted)]">
            {score.blockingCriteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
            Tant que ce critère n&apos;est pas rempli, votre score reste plafonné, quelle que soit la qualité du reste
            de votre profil.
          </p>
        </div>
      ) : null}

      <div className="divide-y divide-[var(--color-border)]">
        {components.map(([key, item]) => (
          <div key={key} className="py-3.5 first:pt-0">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-medium text-[var(--color-text)]">
                {SCORE_COMPONENT_LABEL[key]}
                <span className="ml-1.5 text-[11.5px] font-normal text-[var(--color-text-subtle)]">
                  poids {Math.round(item.weight * 100)} %
                </span>
              </span>
              <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: scoreColor(item.score) }}>
                {item.score} %
              </span>
            </div>
            <Progress
              value={item.score}
              tone={item.score >= 75 ? "success" : item.score >= 50 ? "accent" : item.score >= 35 ? "warning" : "danger"}
              label={SCORE_COMPONENT_LABEL[key]}
            />
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{item.detail}</p>
            {(item.matched?.length ?? 0) > 0 || (item.missing?.length ?? 0) > 0 ? (
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
                {item.matched && item.matched.length > 0 ? (
                  <span className="text-[var(--color-success)]">Présent : {item.matched.join(", ")}</span>
                ) : null}
                {item.missing && item.missing.length > 0 ? (
                  <span className="text-[var(--color-danger)]">Manquant : {item.missing.join(", ")}</span>
                ) : null}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {score.gaps.length > 0 ? (
        <div className="border-t border-[var(--color-border)] pt-4">
          <h3 className="text-[13.5px] font-semibold text-[var(--color-text)]">Ce qu&apos;il vous manque</h3>
          <p className="mt-1.5 text-[13px] text-[var(--color-text-muted)]">{score.gaps.join(" · ")}</p>
        </div>
      ) : null}

      {score.recommendedActions.length > 0 ? (
        <div className="border-t border-[var(--color-border)] pt-4">
          <h3 className="text-[13.5px] font-semibold text-[var(--color-text)]">Actions recommandées</h3>
          <ul className="mt-2 space-y-1.5">
            {score.recommendedActions.map((a, i) => (
              <li key={`${a.label}-${i}`} className="text-[13px]">
                {a.trainingId ? (
                  <Link
                    href={`/mon-espace/formations?focus=${a.trainingId}`}
                    className="font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {a.label}
                  </Link>
                ) : (
                  <span className="text-[var(--color-text-muted)]">{a.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ScoreDisclaimer model={score.model} computedAt={score.computedAt} />
    </div>
  );
}

/** Mention obligatoire [T §6.4], non désactivable. */
export function ScoreDisclaimer({ model, computedAt }: { model?: string; computedAt?: string }) {
  return (
    <p className="border-t border-[var(--color-border)] pt-3 text-[11.5px] leading-relaxed text-[var(--color-text-subtle)]">
      <span className="font-medium text-[var(--color-text-muted)]">{SCORE_DISCLAIMER}</span>
      {model ? (
        <>
          {" "}
          Score calculé par le modèle <span className="font-mono">{model}</span>
          {computedAt
            ? ` le ${new Date(`${computedAt}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" })}`
            : ""}
          . Il est recalculé si votre profil ou l&apos;offre évolue.
        </>
      ) : null}
    </p>
  );
}
