/**
 * Espace formateur — campagnes de promotion [T §3.4].
 *
 * Le parcours création → modération → paiement → diffusion est rappelé en
 * tête, et chaque campagne affiche l'étape où elle se trouve.
 *
 * Direction épurée : parcours numéroté sans pastille pleine, tableau posé à
 * même la page, sections séparées par un filet de 1 pixel.
 */

import type { Metadata } from "next";
import {
  CAMPAIGN_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
} from "@/components/admin-kit";
import { Alert, Badge, PageHeader, Stat, Tag, formatDate } from "@/components/ui";
import { getTrainingById } from "@/data/queries";
import { CAMPAIGN_STATUS_LABEL, CITIES, DOMAINS, formatMoney, type CampaignStatus } from "@/lib/enums";
import { getTrainerCampaigns, getTrainerTrainings } from "../../trainer-context";
import { CampaignComposer } from "./campaign-composer";

export const metadata: Metadata = {
  title: "Mes campagnes | Espace formateur SIRA",
};

const WORKFLOW = [
  { label: "Création", detail: "Vous rédigez le message, choisissez le ciblage et fixez le budget." },
  { label: "Modération", detail: "SIRA contrôle le message et le ciblage. Un refus est motivé et sans frais." },
  { label: "Paiement", detail: "Le règlement n'est appelé qu'après validation, par mobile money ou virement." },
  { label: "Diffusion", detail: "La campagne part à la date prévue et s'arrête quand le budget est consommé." },
];

/** Ce qui vous attend, selon l'étape où se trouve la campagne. */
const NEXT_STEP: Record<CampaignStatus, string> = {
  brouillon: "À compléter puis à déposer en modération.",
  en_moderation: "En attente d'un contrôle par SIRA. Aucun frais à ce stade.",
  validee: "Validée : le paiement peut être réglé pour lancer la diffusion.",
  en_attente_paiement: "En attente de votre règlement. La diffusion démarre dès le paiement confirmé.",
  diffusion: "En diffusion. Le budget se consomme jusqu'à la date de fin.",
  terminee: "Terminée. Les résultats restent consultables.",
  rejetee: "Rejetée, sans frais. Le motif vous a été notifié.",
};

export default function TrainerCampaignsPage() {
  const campaigns = getTrainerCampaigns();
  const trainings = getTrainerTrainings();

  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const budget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const live = campaigns.filter((c) => c.status === "diffusion");

  return (
    <>
      <PageHeader
        title="Mes campagnes"
        description="Promouvoir une formation auprès des candidats dont le profil correspond, par domaine et par zone géographique."
      />

      <section>
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Parcours d&apos;une campagne</h2>
        <ol className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((step, i) => (
            <li key={step.label}>
              <span className="font-mono text-[12px] text-[var(--color-text-subtle)]">{`0${i + 1}`}</span>
              <p className="mt-1.5 text-[14px] font-semibold text-[var(--color-text)]">{step.label}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8">
        <Alert tone="info" title="Aucun frais avant validation">
          Vous ne payez jamais une campagne rejetée. Le règlement n&apos;est appelé qu&apos;après le contrôle, et la
          diffusion ne démarre qu&apos;une fois le paiement confirmé par l&apos;opérateur.
        </Alert>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Campagnes" value={formatInt(campaigns.length)} />
        <Stat label="En diffusion" value={formatInt(live.length)} />
        <Stat label="Budget engagé" value={formatMoney(budget)} />
        <Stat
          label="Taux de clic moyen"
          value={impressions === 0 ? "—" : formatPercent((clicks / impressions) * 100, 2)}
          hint={`${formatInt(clicks)} clics sur ${formatInt(impressions)} impressions`}
        />
      </div>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Mes campagnes</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Étape en cours et résultats</p>
        </div>
        <Table
          head={["Campagne", "Sujet", "Statut", "Ce qui vous attend", "Budget", "Période", "Impressions", "Clics"]}
          minWidth={1200}
        >
          {campaigns.map((campaign) => {
            const subject = campaign.subjectId ? getTrainingById(campaign.subjectId) : undefined;
            return (
              <Tr key={campaign.id}>
                <Td className="max-w-[220px]">
                  <p className="truncate text-[13.5px] font-medium">{campaign.title}</p>
                  <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{campaign.message}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {[...campaign.targetDomains, ...campaign.targetCities].map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </Td>
                <TdMuted>{subject?.title ?? campaign.subjectType}</TdMuted>
                <Td>
                  <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
                </Td>
                <Td className="max-w-[240px] text-[12.5px] text-[var(--color-text-muted)]">
                  {NEXT_STEP[campaign.status]}
                </Td>
                <TdMuted>{formatMoney(campaign.budget)}</TdMuted>
                <TdMuted>
                  {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
                </TdMuted>
                <TdMuted>{formatInt(campaign.impressions)}</TdMuted>
                <TdMuted>{formatInt(campaign.clicks)}</TdMuted>
              </Tr>
            );
          })}
        </Table>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="mb-4 text-[17px] font-semibold text-[var(--color-text)]">Créer une campagne</h2>
        <CampaignComposer
          trainings={trainings.map((t) => ({ id: t.id, title: t.title }))}
          domains={[...DOMAINS]}
          cities={[...CITIES]}
        />
      </section>
    </>
  );
}
