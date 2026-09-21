"use client";

import { useState } from "react";
import { Alert, Badge, Button, Card, CardHeader, Field, Input } from "@/components/ui";
import { BLOCKING_CRITERIA_CAP, SCORE_COMPONENT_LABEL, SCORE_WEIGHTS, type ScoreComponent } from "@/lib/enums";

const COMPONENTS = Object.keys(SCORE_WEIGHTS) as ScoreComponent[];

/** Pondérations par défaut, exprimées en points de pourcentage. */
const DEFAULT_WEIGHTS: Record<ScoreComponent, number> = COMPONENTS.reduce(
  (acc, key) => ({ ...acc, [key]: Math.round(SCORE_WEIGHTS[key] * 100) }),
  {} as Record<ScoreComponent, number>,
);

/**
 * Réglage du modèle de score — section 9.4 du plan.
 * Les six pondérations doivent totaliser exactement 100 % : tant que ce n'est
 * pas le cas, l'enregistrement est refusé, parce qu'un total différent
 * rendrait les scores incomparables entre deux offres.
 */
export function AdminScoreWeights() {
  const [weights, setWeights] = useState<Record<ScoreComponent, number>>(DEFAULT_WEIGHTS);
  const [cap, setCap] = useState<number>(BLOCKING_CRITERIA_CAP);
  const [threshold, setThreshold] = useState<number>(70);
  const [saved, setSaved] = useState<string | null>(null);

  const total = COMPONENTS.reduce((sum, key) => sum + (weights[key] || 0), 0);
  const valid = total === 100;
  const dirty =
    COMPONENTS.some((key) => weights[key] !== DEFAULT_WEIGHTS[key]) ||
    cap !== BLOCKING_CRITERIA_CAP ||
    threshold !== 70;

  const setWeight = (key: ScoreComponent, raw: string) => {
    const value = Math.max(0, Math.min(100, Number.parseInt(raw, 10) || 0));
    setWeights((prev) => ({ ...prev, [key]: value }));
    setSaved(null);
  };

  return (
    <Card>
      <CardHeader
        title="Pondérations du score de compatibilité"
        subtitle="Six composantes, un total imposé de 100 %. Toute modification s'applique aux scores recalculés après enregistrement, jamais aux scores gelés sur une candidature déjà envoyée."
        action={
          <Badge tone={valid ? "success" : "danger"}>
            Total {total} %
          </Badge>
        }
      />

      <div className="space-y-4 p-4">
        <ul className="space-y-3">
          {COMPONENTS.map((key) => (
            <li key={key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <label htmlFor={`poids-${key}`} className="text-[13px] font-medium text-[var(--color-text)]">
                    {SCORE_COMPONENT_LABEL[key]}
                  </label>
                  <span className="text-[12px] text-[var(--color-text-subtle)]">
                    défaut {DEFAULT_WEIGHTS[key]} %
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, weights[key])}%`,
                      background: "var(--color-primary)",
                      opacity: 0.75,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 sm:w-32 sm:justify-end">
                <Input
                  id={`poids-${key}`}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={weights[key]}
                  onChange={(e) => setWeight(key, e.target.value)}
                  className="w-20 text-right tabular-nums"
                  aria-label={`Pondération ${SCORE_COMPONENT_LABEL[key]} en pourcentage`}
                />
                <span className="text-[13px] text-[var(--color-text-muted)]">%</span>
              </div>
            </li>
          ))}
        </ul>

        {valid ? null : (
          <Alert tone="danger" title="Total invalide">
            Les pondérations totalisent {total} %. Ajustez-les jusqu&apos;à 100 % : en dessous ou au-dessus, deux
            offres ne seraient plus comparables entre elles.
          </Alert>
        )}

        <div className="grid gap-4 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2">
          <Field
            label="Plafond en cas de critère indispensable non satisfait"
            htmlFor="plafond"
            hint="Un critère indispensable manquant borne le score, quelle que soit la qualité du reste du profil."
          >
            <Input
              id="plafond"
              type="number"
              min={0}
              max={100}
              step={5}
              value={cap}
              onChange={(e) => {
                setCap(Math.max(0, Math.min(100, Number.parseInt(e.target.value, 10) || 0)));
                setSaved(null);
              }}
              className="tabular-nums"
            />
          </Field>
          <Field
            label="Seuil de notification d'offre compatible"
            htmlFor="seuil"
            hint="En dessous de ce score, le candidat n'est pas notifié. Relever le seuil réduit le volume de notifications et le coût WhatsApp."
          >
            <Input
              id="seuil"
              type="number"
              min={0}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => {
                setThreshold(Math.max(0, Math.min(100, Number.parseInt(e.target.value, 10) || 0)));
                setSaved(null);
              }}
              className="tabular-nums"
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
          <Button
            disabled={!valid}
            onClick={() =>
              setSaved(
                `Réglages simulés : ${COMPONENTS.map((k) => `${SCORE_COMPONENT_LABEL[k]} ${weights[k]} %`).join(", ")} ; plafond ${cap} ; seuil de notification ${threshold}.`,
              )
            }
          >
            Enregistrer les réglages
          </Button>
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setWeights(DEFAULT_WEIGHTS);
              setCap(BLOCKING_CRITERIA_CAP);
              setThreshold(70);
              setSaved(null);
            }}
          >
            Rétablir les valeurs du référentiel
          </Button>
        </div>

        {saved ? (
          <p
            role="status"
            className="rounded-r border-l-2 border-[var(--color-success)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]"
          >
            {saved} Aucun enregistrement réel : la démonstration n&apos;a pas de backend.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
