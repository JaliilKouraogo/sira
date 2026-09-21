"use client";

import { useState } from "react";
import { Alert, Badge, Button, Card, CardHeader, Checkbox, Field, Input, Tag, Textarea } from "@/components/ui";
import { formatMoney } from "@/lib/enums";

const MESSAGE_MAX = 180;

/** Coût indicatif d'une impression, en francs CFA. Sert à estimer la portée. */
const COST_PER_IMPRESSION = 4;

/**
 * Composition d'une campagne : message, ciblage, budget et aperçu.
 *
 * Rien n'est envoyé : le bouton simule le dépôt en modération, première
 * étape imposée du parcours. Le paiement n'intervient qu'après validation.
 */
export function CampaignComposer({
  trainings,
  domains,
  cities,
}: {
  trainings: { id: string; title: string }[];
  domains: string[];
  cities: string[];
}) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(trainings[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("30000");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetDomains, setTargetDomains] = useState<string[]>([]);
  const [targetCities, setTargetCities] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const budgetValue = Number(budget) || 0;
  const estimatedImpressions = Math.round(budgetValue / COST_PER_IMPRESSION);
  const subject = trainings.find((t) => t.id === subjectId);

  const problems: string[] = [];
  if (!title.trim()) problems.push("Donnez un titre interne à la campagne.");
  if (!message.trim()) problems.push("Rédigez le message diffusé.");
  if (message.length > MESSAGE_MAX) problems.push(`Le message dépasse ${MESSAGE_MAX} caractères.`);
  if (budgetValue < 10000) problems.push("Le budget minimum d'une campagne est de 10 000 FCFA.");
  if (targetDomains.length === 0) problems.push("Choisissez au moins un domaine de ciblage.");
  if (targetCities.length === 0) problems.push("Choisissez au moins une zone de diffusion.");
  if (!startDate || !endDate) problems.push("Indiquez la période de diffusion.");
  if (startDate && endDate && endDate < startDate) problems.push("La date de fin précède la date de début.");

  const ready = problems.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) setSubmitted(true);
        }}
        noValidate
        className="space-y-6"
      >
        <Card>
          <CardHeader title="Message" subtitle="Ce que verra le candidat, dans son fil et dans ses notifications" />
          <div className="space-y-4 p-4">
            <Field label="Titre interne de la campagne" htmlFor="titre-campagne" required>
              <Input
                id="titre-campagne"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSubmitted(false);
                }}
                placeholder="Promotion du parcours React"
              />
            </Field>

            <Field label="Formation mise en avant" htmlFor="sujet">
              <select
                id="sujet"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 pr-8 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
              >
                {trainings.map((training) => (
                  <option key={training.id} value={training.id}>
                    {training.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Message diffusé"
              htmlFor="message"
              required
              hint={`${message.length} / ${MESSAGE_MAX} caractères. Une promesse vérifiable, jamais une promesse d'emploi.`}
            >
              <Textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setSubmitted(false);
                }}
                placeholder="Formez-vous au développement web en 8 semaines, places limitées."
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Ciblage" subtitle="Par domaine professionnel et par zone géographique" />
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Domaines</legend>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {domains.map((domain) => (
                  <Checkbox
                    key={domain}
                    label={domain}
                    checked={targetDomains.includes(domain)}
                    onChange={() => {
                      setTargetDomains((prev) => toggle(prev, domain));
                      setSubmitted(false);
                    }}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Zones</legend>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {cities.map((city) => (
                  <Checkbox
                    key={city}
                    label={city}
                    checked={targetCities.includes(city)}
                    onChange={() => {
                      setTargetCities((prev) => toggle(prev, city));
                      setSubmitted(false);
                    }}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </Card>

        <Card>
          <CardHeader title="Budget et période" subtitle="Le budget n'est appelé qu'après validation de la campagne" />
          <div className="grid gap-4 p-4 sm:grid-cols-3">
            <Field label="Budget, en FCFA" htmlFor="budget" required hint="Minimum 10 000 FCFA.">
              <Input
                id="budget"
                type="number"
                min={10000}
                step={5000}
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  setSubmitted(false);
                }}
              />
            </Field>
            <Field label="Début de diffusion" htmlFor="debut-campagne" required>
              <Input
                id="debut-campagne"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSubmitted(false);
                }}
              />
            </Field>
            <Field label="Fin de diffusion" htmlFor="fin-campagne" required>
              <Input
                id="fin-campagne"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSubmitted(false);
                }}
              />
            </Field>
          </div>
        </Card>

        {problems.length > 0 ? (
          <Alert tone="warning" title="À compléter avant de déposer la campagne">
            <ul className="list-disc space-y-0.5 pl-4">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {submitted ? (
          <Alert tone="success" title="Campagne déposée en modération">
            Dépôt simulé. Dans le produit, la campagne passerait en modération, puis en attente de paiement une fois
            validée, et ne serait diffusée qu&apos;après règlement.
          </Alert>
        ) : null}

        <Button type="submit" variant="accent" disabled={!ready}>
          Déposer la campagne en modération
        </Button>
      </form>

      <div className="space-y-4 lg:sticky lg:top-20">
        <Card>
          <CardHeader title="Aperçu" subtitle="Encart tel qu'il apparaît au candidat ciblé" />
          <div className="p-4">
            <div className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] p-3">
              <Badge tone="accent">Contenu sponsorisé</Badge>
              <p className="mt-2 text-[14px] font-semibold text-[var(--color-text)]">
                {subject?.title ?? "Votre formation"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {message || "Votre message apparaîtra ici."}
              </p>
              <p className="mt-2 text-[11.5px] text-[var(--color-text-subtle)]">
                Proposé par Numerika Formation · vous recevez ce message parce que vous avez accepté les
                communications commerciales.
              </p>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
              Un candidat qui n&apos;a pas donné son consentement ne verra jamais cet encart, sur aucun canal, pas
              même dans l&apos;application.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Estimation" subtitle="Indicative, calculée sur le budget saisi" />
          <dl className="divide-y divide-[var(--color-border)] px-4">
            {[
              { label: "Budget", value: formatMoney(budgetValue) },
              { label: "Impressions estimées", value: new Intl.NumberFormat("fr-FR").format(estimatedImpressions) },
              { label: "Domaines ciblés", value: targetDomains.length === 0 ? "Aucun" : String(targetDomains.length) },
              { label: "Zones ciblées", value: targetCities.length === 0 ? "Aucune" : String(targetCities.length) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[13px] text-[var(--color-text-muted)]">{row.label}</dt>
                <dd className="text-sm font-medium tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
          {targetDomains.length + targetCities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 p-4 pt-0">
              {[...targetDomains, ...targetCities].map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
