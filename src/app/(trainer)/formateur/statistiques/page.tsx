/**
 * Espace formateur — statistiques [T §3.4].
 *
 * Ce qui est mesuré est affiché ; ce qui ne l'est pas encore est signalé
 * comme tel plutôt qu'estimé.
 *
 * Direction épurée : graphiques et tableaux posés à même la page, séparés par
 * des filets de 1 pixel.
 */

import type { Metadata } from "next";
import {
  BarChart,
  CAMPAIGN_STATUS_TONE,
  ColumnChart,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
} from "@/components/admin-kit";
import { Alert, Badge, PageHeader, Stat, formatDate } from "@/components/ui";
import { CAMPAIGN_STATUS_LABEL, TRAINING_FORMAT_LABEL, formatMoney } from "@/lib/enums";
import { getTrainerCampaigns, getTrainerTrainings } from "../../trainer-context";

export const metadata: Metadata = {
  title: "Statistiques | Espace formateur SIRA",
};

export default function TrainerStatisticsPage() {
  const trainings = getTrainerTrainings();
  const campaigns = getTrainerCampaigns();

  const seats = trainings.reduce((sum, t) => sum + (t.seats ?? 0), 0);
  const taken = trainings.reduce((sum, t) => sum + (t.seatsTaken ?? 0), 0);
  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const budget = campaigns.reduce((sum, c) => sum + c.budget, 0);

  const rated = trainings.filter((t) => t.rating);
  const averageRating = rated.length === 0 ? 0 : rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length;

  const fill = trainings
    .filter((t) => t.seats)
    .map((t) => ({
      label: t.title.length > 16 ? `${t.title.slice(0, 15)}…` : t.title,
      value: t.seatsTaken ?? 0,
      display: `${t.seatsTaken ?? 0}`,
    }));

  const ratings = rated
    .map((t) => ({ label: t.title, value: t.rating ?? 0, display: (t.rating ?? 0).toFixed(1) }))
    .sort((a, b) => b.value - a.value);

  const revenueByTraining = trainings
    .filter((t) => t.access === "payant")
    .map((t) => ({
      label: t.title,
      value: (t.price ?? 0) * (t.seatsTaken ?? 0),
      display: formatMoney((t.price ?? 0) * (t.seatsTaken ?? 0)),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader
        title="Statistiques"
        description="Remplissage, satisfaction et rendement de vos campagnes. Les données couvrent le catalogue de Numerika Formation au 12 septembre 2026."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Taux de remplissage"
          value={formatPercent(seats === 0 ? 0 : (taken / seats) * 100, 0)}
          hint={`${formatInt(taken)} sur ${formatInt(seats)} places`}
        />
        <Stat label="Note moyenne" value={averageRating.toFixed(1)} hint={`${rated.length} formations notées`} />
        <Stat
          label="Taux de clic des campagnes"
          value={impressions === 0 ? "—" : formatPercent((clicks / impressions) * 100, 2)}
          hint={`${formatInt(clicks)} clics`}
        />
        <Stat
          label="Coût par clic"
          value={clicks === 0 ? "—" : formatMoney(Math.round(budget / clicks))}
          hint={`${formatMoney(budget)} engagés`}
        />
      </div>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Remplissage</h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Places pourvues par formation, d&apos;après le nombre d&apos;inscrits déclarés
        </p>
        <div className="mt-5">
          <ColumnChart items={fill} ariaLabel="Places pourvues par formation" />
        </div>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Satisfaction</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Note déclarative sur 5</p>
          <div className="mt-4">
            <BarChart items={ratings} tone="success" />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
            Chiffre d&apos;affaires par formation
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Encaissé par vos soins, hors SIRA</p>
          <div className="mt-4">
            <BarChart items={revenueByTraining} tone="accent" emptyLabel="Aucune formation payante au catalogue" />
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Détail par formation</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Remplissage, tarif et rendement</p>
        </div>
        <Table
          head={["Formation", "Format", "Durée", "Places", "Remplissage", "Note", "Tarif", "Chiffre d'affaires"]}
          minWidth={1040}
        >
          {trainings.map((training) => {
            const rate = training.seats ? ((training.seatsTaken ?? 0) / training.seats) * 100 : null;
            return (
              <Tr key={training.id}>
                <Td className="max-w-[240px] font-medium">{training.title}</Td>
                <TdMuted>{TRAINING_FORMAT_LABEL[training.format]}</TdMuted>
                <TdMuted>{training.durationHours} h</TdMuted>
                <TdMuted>
                  {training.seats ? `${training.seatsTaken ?? 0} / ${training.seats}` : "Sans limite"}
                </TdMuted>
                <TdMuted>{rate === null ? "—" : formatPercent(rate, 0)}</TdMuted>
                <TdMuted>{training.rating ? training.rating.toFixed(1) : "—"}</TdMuted>
                <TdMuted>{training.access === "payant" ? formatMoney(training.price) : "Sans frais"}</TdMuted>
                <TdMuted>
                  {training.access === "payant"
                    ? formatMoney((training.price ?? 0) * (training.seatsTaken ?? 0))
                    : "—"}
                </TdMuted>
              </Tr>
            );
          })}
        </Table>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Rendement des campagnes</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Impressions, clics et coût par clic
          </p>
        </div>
        <Table head={["Campagne", "Statut", "Budget", "Période", "Impressions", "Clics", "Taux de clic", "Coût par clic"]} minWidth={1040}>
          {campaigns.map((campaign) => {
            const ctr = campaign.impressions === 0 ? null : (campaign.clicks / campaign.impressions) * 100;
            return (
              <Tr key={campaign.id}>
                <Td className="max-w-[220px] font-medium">{campaign.title}</Td>
                <Td>
                  <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
                </Td>
                <TdMuted>{formatMoney(campaign.budget)}</TdMuted>
                <TdMuted>
                  {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
                </TdMuted>
                <TdMuted>{formatInt(campaign.impressions)}</TdMuted>
                <TdMuted>{formatInt(campaign.clicks)}</TdMuted>
                <TdMuted>{ctr === null ? "—" : formatPercent(ctr, 2)}</TdMuted>
                <TdMuted>
                  {campaign.clicks === 0 ? "—" : formatMoney(Math.round(campaign.budget / campaign.clicks))}
                </TdMuted>
              </Tr>
            );
          })}
        </Table>
      </section>

      <div className="mt-10">
        <Alert tone="neutral" title="Ce qui n'est pas encore mesuré">
          Le nombre de vues d&apos;une fiche de formation, le taux de passage de la fiche au contact et le devenir
          des inscrits ne sont pas instrumentés à ce stade. Ils supposent un suivi côté organisme que la plateforme
          ne collecte pas encore : ils ne sont donc pas estimés ici.
        </Alert>
      </div>
    </>
  );
}
