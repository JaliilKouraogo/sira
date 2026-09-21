/**
 * Espace formateur — tableau de bord [T §3.4].
 *
 * Le formateur veut savoir quatre choses en arrivant : ce qui est en ligne,
 * combien de personnes se sont inscrites, où en sont ses campagnes, et ce que
 * cela lui rapporte.
 *
 * Direction épurée : fond blanc, aucune ombre, files d'attente en lignes et
 * non en cartes accentuées, sections séparées par un filet de 1 pixel.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart,
  CAMPAIGN_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
} from "@/components/admin-kit";
import { ZoneHeader } from "@/components/illustrations";
import {
  Alert,
  Badge,
  ButtonLink,
  Progress,
  Stat,
  formatDate,
  daysUntil,
} from "@/components/ui";
import { CAMPAIGN_STATUS_LABEL, TRAINING_ACCESS_LABEL, TRAINING_FORMAT_LABEL, formatMoney } from "@/lib/enums";
import { getTrainerCampaigns, getTrainerOrganization, getTrainerTrainings } from "../trainer-context";

export const metadata: Metadata = {
  title: "Tableau de bord | Espace formateur SIRA",
};

export default function TrainerDashboardPage() {
  const organization = getTrainerOrganization();
  const trainings = getTrainerTrainings();
  const campaigns = getTrainerCampaigns();

  const seats = trainings.reduce((sum, t) => sum + (t.seats ?? 0), 0);
  const enrolled = trainings.reduce((sum, t) => sum + (t.seatsTaken ?? 0), 0);
  const liveCampaigns = campaigns.filter((c) => c.status === "diffusion");
  const pendingCampaigns = campaigns.filter(
    (c) => c.status === "en_moderation" || c.status === "en_attente_paiement",
  );

  /** Chiffre d'affaires du catalogue, encaissé par l'organisme et non par SIRA. */
  const revenue = trainings
    .filter((t) => t.access === "payant")
    .reduce((sum, t) => sum + (t.price ?? 0) * (t.seatsTaken ?? 0), 0);

  const promotionSpend = campaigns.reduce((sum, c) => sum + c.budget, 0);

  const upcoming = trainings
    .filter((t) => t.startDate && daysUntil(t.startDate) >= 0)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));

  /** Ce qui attend une action, rendu en lignes sobres plutôt qu'en cartes. */
  const queues = [
    {
      title: "Campagnes en attente",
      count: pendingCampaigns.length,
      description:
        "Une campagne validée appelle son paiement ; une fois payée, elle part en diffusion à la date prévue.",
      href: "/formateur/campagnes",
      linkLabel: "Voir mes campagnes",
      tone: "warning" as const,
    },
    {
      title: "Sessions à venir",
      count: upcoming.length,
      description:
        "Sessions dont la date de démarrage est encore devant vous. Les places restantes se remplissent surtout la dernière semaine.",
      href: "/formateur/formations",
      linkLabel: "Voir le catalogue",
      tone: "primary" as const,
    },
    {
      title: "Formations sans session datée",
      count: trainings.filter((t) => !t.startDate).length,
      description:
        "Une formation sans date de démarrage remonte moins bien dans le catalogue : renseignez une session.",
      href: "/formateur/formations",
      linkLabel: "Compléter les fiches",
      tone: "neutral" as const,
    },
  ];

  const fillByTraining = trainings
    .filter((t) => t.seats)
    .map((t) => ({
      label: t.title,
      value: ((t.seatsTaken ?? 0) / (t.seats ?? 1)) * 100,
      display: `${t.seatsTaken ?? 0} / ${t.seats}`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <ZoneHeader
        zone="trainer"
        title="Tableau de bord"
        description={`Bonjour Fatoumata Ouédraogo. Voici l'activité de ${organization?.legalName ?? "votre organisme"} au 12 septembre 2026.`}
        action={
          <ButtonLink href="/formateur/formations/nouvelle" variant="accent">
            Créer une formation
          </ButtonLink>
        }
      />

      <Alert tone="warning" title="Espace en préouverture">
        L&apos;espace formateur est derrière un drapeau de fonctionnalité jusqu&apos;au lot 7. Vos formations sont
        déjà visibles dans le catalogue public ; la gestion en libre-service décrite ici sera ouverte à tous les
        organismes à ce moment-là.
      </Alert>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Formations publiées"
          value={formatInt(trainings.length)}
          hint={`${trainings.filter((t) => t.certificate).length} avec certificat`}
        />
        <Stat
          label="Inscrits"
          value={formatInt(enrolled)}
          hint={`${formatPercent(seats === 0 ? 0 : (enrolled / seats) * 100, 0)} des places ouvertes`}
        />
        <Stat
          label="Campagnes en cours"
          value={formatInt(liveCampaigns.length)}
          hint={pendingCampaigns.length > 0 ? `${pendingCampaigns.length} en attente` : "Aucune en attente"}
        />
        <Stat
          label="Revenus du catalogue"
          value={formatMoney(revenue)}
          hint="Encaissés par vos soins, hors SIRA"
        />
      </div>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">À suivre</h2>
        <ul className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {queues.map((queue) => (
            <li key={queue.title} className="flex flex-wrap items-start gap-x-5 gap-y-2 py-4">
              <span className="w-10 shrink-0 text-[22px] font-semibold leading-tight tabular-nums text-[var(--color-text)]">
                {queue.count}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[var(--color-text)]">{queue.title}</p>
                  <Badge tone={queue.count === 0 ? "success" : queue.tone}>
                    {queue.count === 0 ? "À jour" : "À traiter"}
                  </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                  {queue.description}
                </p>
              </div>
              <Link
                href={queue.href}
                className="shrink-0 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                {queue.count === 0 ? "Consulter" : queue.linkLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Prochaines sessions</h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Par date de démarrage</p>
            </div>
            <Link
              href="/formateur/formations"
              className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
            >
              Tout voir
            </Link>
          </div>
          <Table head={["Formation", "Format", "Démarrage", "Places"]} minWidth={560}>
            {upcoming.map((training) => (
              <Tr key={training.id}>
                <Td className="max-w-[220px]">
                  <p className="truncate text-[13.5px] font-medium">{training.title}</p>
                  <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                    {TRAINING_ACCESS_LABEL[training.access]}
                  </p>
                </Td>
                <TdMuted>{TRAINING_FORMAT_LABEL[training.format]}</TdMuted>
                <TdMuted>
                  {training.startDate ? formatDate(training.startDate) : "—"}
                  {training.startDate ? (
                    <span className="block text-[11.5px] text-[var(--color-text-subtle)]">
                      dans {daysUntil(training.startDate)} jours
                    </span>
                  ) : null}
                </TdMuted>
                <Td className="min-w-[120px]">
                  {training.seats ? (
                    <>
                      <Progress
                        value={((training.seatsTaken ?? 0) / training.seats) * 100}
                        label="Remplissage"
                        tone={(training.seatsTaken ?? 0) / training.seats > 0.85 ? "warning" : "primary"}
                      />
                      <span className="mt-1 block text-[12px] tabular-nums text-[var(--color-text-muted)]">
                        {training.seatsTaken ?? 0} / {training.seats}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-subtle)]">Sans limite</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Mes campagnes</h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                {formatMoney(promotionSpend)} engagés en promotion
              </p>
            </div>
            <Link
              href="/formateur/campagnes"
              className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
            >
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{campaign.title}</p>
                    <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                      {formatMoney(campaign.budget)} · {formatDate(campaign.startDate)} au{" "}
                      {formatDate(campaign.endDate)}
                    </p>
                  </div>
                  <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[12.5px]">
                  <div className="flex gap-1.5">
                    <dt className="text-[var(--color-text-muted)]">Impressions :</dt>
                    <dd className="tabular-nums">{formatInt(campaign.impressions)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-[var(--color-text-muted)]">Clics :</dt>
                    <dd className="tabular-nums">{formatInt(campaign.clicks)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-[var(--color-text-muted)]">Taux de clic :</dt>
                    <dd className="tabular-nums">
                      {campaign.impressions === 0
                        ? "—"
                        : formatPercent((campaign.clicks / campaign.impressions) * 100, 2)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Remplissage par formation</h2>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Part des places pourvues</p>
        <div className="mt-5">
          <BarChart items={fillByTraining} tone="accent" />
        </div>
      </section>
    </>
  );
}
