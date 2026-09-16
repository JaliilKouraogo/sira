/**
 * Back-office — modération des campagnes [T §21.3].
 *
 * L'ordre création → modération → paiement → diffusion est imposé : une
 * campagne n'est jamais payée avant d'être validée, et jamais diffusée avant
 * d'être payée. L'écran l'explique, parce que l'annonceur le demandera.
 *
 * Direction épurée : le parcours est une suite numérotée sans pastille pleine,
 * la file de modération une liste séparée par des filets.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import {
  BarChart,
  CAMPAIGN_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
  orgName,
} from "@/components/admin-kit";
import { Alert, Badge, Field, PageHeader, Select, Stat, Tag, formatDate } from "@/components/ui";
import { getCampaigns, getOrganization, getTrainingById } from "@/data/queries";
import { CAMPAIGN_STATUSES, CAMPAIGN_STATUS_LABEL, formatMoney } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Campagnes | Administration SIRA",
};

const WORKFLOW = [
  {
    label: "Création",
    detail: "L'annonceur rédige le message, choisit le ciblage par domaine et par zone, et fixe son budget.",
  },
  {
    label: "Modération",
    detail: "Un administrateur contrôle le message, la promesse commerciale et le ciblage. Un rejet est motivé.",
  },
  {
    label: "Paiement",
    detail: "Le paiement n'est appelé qu'après validation. Une campagne rejetée n'est jamais facturée.",
  },
  {
    label: "Diffusion",
    detail: "La campagne part en diffusion à la date prévue, dans la limite du budget, et s'arrête d'elle-même.",
  },
];

/** Motifs de rejet d'une campagne, normalisés pour être notifiables. */
const REJECTION_REASONS = [
  "Promesse d'emploi non tenable",
  "Message trompeur sur le tarif",
  "Ciblage discriminatoire",
  "Organisme non vérifié",
  "Contenu sans rapport avec l'emploi ou la formation",
];

export default function AdminCampaignsPage() {
  const campaigns = getCampaigns();
  const toModerate = campaigns.filter((c) => c.status === "en_moderation");
  const live = campaigns.filter((c) => c.status === "diffusion");

  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const budget = campaigns.reduce((sum, c) => sum + c.budget, 0);

  const byStatus = CAMPAIGN_STATUSES.map((status) => ({
    label: CAMPAIGN_STATUS_LABEL[status],
    value: campaigns.filter((c) => c.status === status).length,
  })).filter((row) => row.value > 0);

  return (
    <>
      <PageHeader
        title="Campagnes"
        description="Promotion payante de formations, d'événements et de services. La publicité n'entre jamais dans le fil d'offres d'un candidat sans son consentement explicite."
      />

      <section>
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Ordre imposé du parcours</h2>
        <ol className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((step, i) => (
            <li key={step.label}>
              <span className="font-mono text-[12px] text-[var(--color-text-subtle)]">
                {`0${i + 1}`}
              </span>
              <p className="mt-1.5 text-[14px] font-semibold text-[var(--color-text)]">{step.label}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8">
        <Alert tone="info" title="Pourquoi cet ordre">
        Payer avant la modération obligerait à rembourser chaque rejet et créerait une pression à valider. Diffuser
        avant le paiement exposerait la plateforme à un impayé sur un espace déjà consommé. L&apos;ordre n&apos;est
        donc pas une préférence d&apos;outil : c&apos;est une règle de gestion.
        </Alert>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Campagnes" value={formatInt(campaigns.length)} />
        <Stat label="En modération" value={formatInt(toModerate.length)} />
        <Stat label="En diffusion" value={formatInt(live.length)} />
        <Stat label="Budget engagé" value={formatMoney(budget)} />
      </div>

      {/* ---- File de modération ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
          File de modération ({toModerate.length})
        </h2>
        {toModerate.length === 0 ? (
          <div className="mt-4">
            <Alert tone="success" title="File à jour">
              Aucune campagne n&apos;attend de modération.
            </Alert>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {toModerate.map((campaign) => {
              const org = getOrganization(campaign.organizationId);
              const subject = campaign.subjectId ? getTrainingById(campaign.subjectId) : undefined;
              return (
                <li key={campaign.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-[var(--color-text)]">{campaign.title}</h3>
                      <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                        {orgName(org)} · {campaign.subjectType}
                        {subject ? ` · ${subject.title}` : ""}
                      </p>
                    </div>
                    <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>
                      {CAMPAIGN_STATUS_LABEL[campaign.status]}
                    </Badge>
                  </div>

                  <blockquote className="mt-3 rounded-r border-l-2 border-[var(--color-accent)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--color-text)]">
                    {campaign.message}
                  </blockquote>

                  <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-[12px] text-[var(--color-text-muted)]">Budget</dt>
                      <dd className="text-[13.5px] font-medium">{formatMoney(campaign.budget)}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[var(--color-text-muted)]">Période</dt>
                      <dd className="text-[13.5px]">
                        {formatDate(campaign.startDate)} au {formatDate(campaign.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[var(--color-text-muted)]">Ciblage</dt>
                      <dd className="mt-0.5 flex flex-wrap gap-1.5">
                        {[...campaign.targetDomains, ...campaign.targetCities].map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)] sm:items-end">
                    <Field label="Motif en cas de rejet" htmlFor={`motif-${campaign.id}`}>
                      <Select id={`motif-${campaign.id}`} defaultValue="">
                        <option value="" disabled>
                          Choisir un motif
                        </option>
                        {REJECTION_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <AdminActions
                      subject={`la campagne « ${campaign.title} »`}
                      actions={[
                        { label: "Valider, appel au paiement", variant: "primary" },
                        { label: "Rejeter", variant: "danger" },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- Toutes les campagnes ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Toutes les campagnes</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Budget, ciblage et performance</p>
          </div>
          <Table
            head={["Campagne", "Annonceur", "Statut", "Budget", "Ciblage", "Période", "Impressions", "Clics", "Taux de clic"]}
            minWidth={1240}
          >
            {campaigns.map((campaign) => {
              const org = getOrganization(campaign.organizationId);
              const ctr = campaign.impressions === 0 ? 0 : (campaign.clicks / campaign.impressions) * 100;
              return (
                <Tr key={campaign.id}>
                  <Td className="max-w-[240px]">
                    <p className="truncate font-medium">{campaign.title}</p>
                    <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{campaign.message}</p>
                  </Td>
                  <TdMuted>{orgName(org)}</TdMuted>
                  <Td>
                    <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>
                      {CAMPAIGN_STATUS_LABEL[campaign.status]}
                    </Badge>
                  </Td>
                  <TdMuted>{formatMoney(campaign.budget)}</TdMuted>
                  <Td className="max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {[...campaign.targetDomains, ...campaign.targetCities].map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </Td>
                  <TdMuted>
                    {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
                  </TdMuted>
                  <TdMuted>{formatInt(campaign.impressions)}</TdMuted>
                  <TdMuted>{formatInt(campaign.clicks)}</TdMuted>
                  <TdMuted>{campaign.impressions === 0 ? "—" : formatPercent(ctr, 2)}</TdMuted>
                </Tr>
              );
            })}
          </Table>
        </div>

        <div className="min-w-0 space-y-8">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Répartition par statut</h2>
            <div className="mt-4">
              <BarChart items={byStatus} tone="accent" />
            </div>
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Performance cumulée</h2>
            <dl className="mt-2 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {[
                { label: "Impressions", value: formatInt(impressions) },
                { label: "Clics", value: formatInt(clicks) },
                {
                  label: "Taux de clic moyen",
                  value: impressions === 0 ? "—" : formatPercent((clicks / impressions) * 100, 2),
                },
                {
                  label: "Coût par clic",
                  value: clicks === 0 ? "—" : formatMoney(Math.round(budget / clicks)),
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-[var(--color-text-muted)]">{row.label}</dt>
                  <dd className="text-[13.5px] font-medium tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
