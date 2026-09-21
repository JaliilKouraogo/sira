/**
 * Back-office — indicateurs de performance [T §21.5].
 *
 * Un indicateur sans définition ni formule ne se pilote pas : chaque ligne
 * porte donc son énoncé, son calcul et sa source. Ce qui n'est pas encore
 * instrumenté est affiché comme tel, jamais estimé en silence.
 *
 * Direction épurée : chaque famille d'indicateurs est une section séparée par
 * un filet, avec son tableau posé à même la page.
 */

import type { Metadata } from "next";
import { BarChart, ColumnChart, Table, Td, Tr, formatInt, formatPercent, formatUsd } from "@/components/admin-kit";
import { Badge, PageHeader, Stat } from "@/components/ui";
import {
  getAiJobs,
  getAllUsers,
  getApplications,
  getContactEvents,
  getEnrollments,
  getNotifications,
  getOrganization,
  getPayments,
  getPublishedJobs,
  getTrainings,
} from "@/data/queries";
import { formatMoney } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Rapports | Administration SIRA",
};

/** Hypothèse de coût unitaire WhatsApp, en francs CFA par message de modèle. */
const WHATSAPP_UNIT_COST = 25;

interface Kpi {
  name: string;
  definition: string;
  formula: string;
  source: string;
  value: string;
  instrumented: boolean;
}

export default function AdminReportsPage() {
  const users = getAllUsers();
  const applications = getApplications();
  const notifications = getNotifications();
  const contactEvents = getContactEvents();
  const enrollments = getEnrollments();
  const aiJobs = getAiJobs();
  const payments = getPayments();
  const published = getPublishedJobs();
  const trainings = getTrainings();

  const candidates = users.filter((u) => u.role === "candidate");
  const recruiters = users.filter((u) => u.role === "recruiter");

  const sent = applications.filter((a) => a.preparationStatus === "envoyee");
  const aiPrepared = applications.filter((a) => a.documents.some((d) => d.aiJobId));
  const activeCandidates = applications.length > 0 ? 1 : 0;
  const activeRecruiterOrgs = new Set(published.map((j) => j.organizationId)).size;
  const verifiedJobs = published.filter((j) => getOrganization(j.organizationId)?.verificationStatus === "verifie");

  const readNotifications = notifications.filter((n) => n.readAt);
  const whatsappEvents = contactEvents.filter((e) => e.channel === "whatsapp");
  const whatsappRead = whatsappEvents.filter((e) => e.status === "lu");

  const paid = payments.filter((p) => p.status === "paid");
  const mrr = paid
    .filter((p) => p.description.toLowerCase().includes("abonnement"))
    .reduce((sum, p) => sum + p.amount, 0);
  const premium = 0; // Aucun abonnement Premium candidat actif à ce jour.

  const aiCost = aiJobs.reduce((sum, j) => sum + j.costUsd, 0);
  const whatsappMessages = whatsappEvents.length + notifications.filter((n) => n.channel === "whatsapp").length;
  const whatsappCost = whatsappMessages * WHATSAPP_UNIT_COST;

  const kpis: { family: string; rows: Kpi[] }[] = [
    {
      family: "Adoption",
      rows: [
        {
          name: "Inscrits",
          definition: "Comptes créés sur la plateforme, tous rôles confondus, y compris inactifs.",
          formula: "Nombre de comptes existants",
          source: "Table utilisateurs",
          value: formatInt(users.length),
          instrumented: true,
        },
        {
          name: "Candidats actifs",
          definition: "Candidats ayant ouvert une session ou touché une candidature sur les 30 derniers jours.",
          formula: "Candidats distincts avec au moins un événement sur 30 jours / rien d'autre",
          source: "Journal d'activité et table candidatures",
          value: `${formatInt(activeCandidates)} sur ${formatInt(candidates.length)}`,
          instrumented: true,
        },
        {
          name: "Recruteurs actifs",
          definition: "Organisations ayant au moins une offre en ligne à la date d'observation.",
          formula: "Organisations distinctes portant une offre publiée",
          source: "Table offres, jointe aux organisations",
          value: `${formatInt(activeRecruiterOrgs)} organisations, ${formatInt(recruiters.length)} comptes recruteur`,
          instrumented: true,
        },
      ],
    },
    {
      family: "Contenu",
      rows: [
        {
          name: "Offres publiées",
          definition: "Offres au statut « publiée », donc visibles, indexées et ouvertes aux candidatures.",
          formula: "Offres dont le statut vaut « publiée »",
          source: "Table offres",
          value: formatInt(published.length),
          instrumented: true,
        },
        {
          name: "Offres vérifiées",
          definition: "Offres publiées par une organisation au niveau « vérifié », qui portent le badge.",
          formula: "Offres publiées dont l'organisation est vérifiée / offres publiées",
          source: "Table offres jointe aux organisations",
          value: `${formatInt(verifiedJobs.length)} (${formatPercent(
            published.length === 0 ? 0 : (verifiedJobs.length / published.length) * 100,
            0,
          )})`,
          instrumented: true,
        },
        {
          name: "Formations suivies",
          definition: "Inscriptions à une formation référencée, déclarées par l'organisme ou par le candidat.",
          formula: "Nombre d'inscriptions enregistrées",
          source: "Table inscriptions aux formations",
          value: `${formatInt(enrollments.length)} sur ${formatInt(trainings.length)} formations référencées`,
          instrumented: true,
        },
      ],
    },
    {
      family: "Usage et engagement",
      rows: [
        {
          name: "Candidatures préparées par l'IA",
          definition: "Candidatures dont au moins un document a été produit par une tâche IA.",
          formula: "Candidatures avec un document lié à une tâche IA / candidatures",
          source: "Table documents de candidature, jointe au journal IA",
          value: `${formatInt(aiPrepared.length)} (${formatPercent(
            applications.length === 0 ? 0 : (aiPrepared.length / applications.length) * 100,
            0,
          )})`,
          instrumented: true,
        },
        {
          name: "Candidatures envoyées",
          definition: "Candidatures effectivement transmises au recruteur, quel que soit le canal.",
          formula: "Candidatures dont l'état de préparation vaut « envoyée »",
          source: "Table candidatures",
          value: `${formatInt(sent.length)} sur ${formatInt(applications.length)} préparées`,
          instrumented: true,
        },
        {
          name: "Taux d'ouverture",
          definition: "Part des notifications lues par leur destinataire, tous canaux confondus.",
          formula: "Notifications lues / notifications envoyées",
          source: "Table notifications",
          value: formatPercent(
            notifications.length === 0 ? 0 : (readNotifications.length / notifications.length) * 100,
            1,
          ),
          instrumented: true,
        },
        {
          name: "Taux de clic WhatsApp",
          definition: "Part des messages WhatsApp ouverts ou cliqués parmi ceux effectivement remis.",
          formula: "Messages lus ou cliqués / messages remis",
          source: "Journal des contacts, retours d'état de l'opérateur",
          value:
            whatsappEvents.length === 0
              ? "Non instrumenté"
              : formatPercent((whatsappRead.length / whatsappEvents.length) * 100, 1),
          instrumented: whatsappEvents.length > 0,
        },
      ],
    },
    {
      family: "Monétisation",
      rows: [
        {
          name: "Conversion gratuit vers Premium",
          definition: "Part des candidats en plan gratuit passés au plan Premium sur la période.",
          formula: "Candidats Premium actifs / candidats inscrits",
          source: "Table abonnements",
          value: formatPercent(candidates.length === 0 ? 0 : (premium / candidates.length) * 100, 1),
          instrumented: true,
        },
        {
          name: "Revenu mensuel récurrent",
          definition: "Somme des abonnements actifs ramenée à un mois, hors achats ponctuels de campagne.",
          formula: "Somme des montants mensuels des abonnements actifs",
          source: "Tables abonnements et paiements",
          value: formatMoney(mrr),
          instrumented: true,
        },
        {
          name: "Coût d'acquisition",
          definition: "Dépense marketing nécessaire pour obtenir un compte payant supplémentaire.",
          formula: "Dépense marketing de la période / nouveaux comptes payants de la période",
          source: "Comptabilité analytique, non encore reliée à la plateforme",
          value: "Non instrumenté",
          instrumented: false,
        },
        {
          name: "Valeur vie client",
          definition: "Revenu cumulé attendu d'un compte payant sur toute sa durée d'abonnement.",
          formula: "Revenu moyen mensuel × durée de vie moyenne, en mois",
          source: "Historique d'abonnements, profondeur insuffisante à ce stade",
          value: "Non instrumenté",
          instrumented: false,
        },
      ],
    },
    {
      family: "Coûts variables",
      rows: [
        {
          name: "Coût IA moyen par utilisateur",
          definition: "Dépense de modèles de langage rapportée au nombre de comptes inscrits.",
          formula: "Somme des coûts d'appels IA / comptes inscrits",
          source: "Journal des tâches IA",
          value: formatUsd(aiCost / Math.max(1, users.length)),
          instrumented: true,
        },
        {
          name: "Coût WhatsApp par utilisateur",
          definition: "Dépense de messagerie WhatsApp rapportée au nombre de comptes inscrits.",
          formula: `Messages envoyés × ${WHATSAPP_UNIT_COST} FCFA / comptes inscrits`,
          source: "Journal des contacts et des notifications, tarif opérateur",
          value: formatMoney(Math.round(whatsappCost / Math.max(1, users.length))),
          instrumented: true,
        },
      ],
    },
  ];

  const instrumented = kpis.flatMap((f) => f.rows).filter((k) => k.instrumented).length;
  const total = kpis.flatMap((f) => f.rows).length;

  const funnel = [
    { label: "Inscrits", value: users.length },
    { label: "Candidatures préparées", value: applications.length },
    { label: "Préparées par l'IA", value: aiPrepared.length },
    { label: "Envoyées", value: sent.length },
    { label: "Entretien ou retenue", value: applications.filter((a) => a.reviewStatus === "entretien" || a.reviewStatus === "retenue").length },
  ];

  const costs = [
    { label: "Coût IA cumulé", value: aiCost, display: formatUsd(aiCost) },
    { label: "Coût WhatsApp cumulé", value: whatsappCost / 600, display: formatMoney(whatsappCost) },
  ];

  return (
    <>
      <PageHeader
        title="Rapports"
        description="Les indicateurs de pilotage de SIRA, avec pour chacun sa définition, sa formule et sa source. Ce qui n'est pas mesurable aujourd'hui est signalé comme non instrumenté."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Indicateurs suivis" value={formatInt(total)} />
        <Stat
          label="Indicateurs instrumentés"
          value={`${instrumented} / ${total}`}
          hint="Les autres attendent une source"
        />
        <Stat label="Revenu mensuel récurrent" value={formatMoney(mrr)} />
        <Stat label="Coût IA cumulé" value={formatUsd(aiCost)} />
      </div>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Entonnoir candidat</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">De l&apos;inscription à l&apos;entretien</p>
          <div className="mt-5">
            <ColumnChart items={funnel} ariaLabel="Entonnoir de conversion du candidat" />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Coûts variables cumulés</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Deux unités différentes, affichées en clair
          </p>
          <div className="mt-5">
            <BarChart items={costs} tone="accent" />
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
              Le coût IA est facturé en dollars, le coût WhatsApp en francs CFA. Les barres ne se comparent donc pas
              entre elles : seule la valeur affichée fait foi.
            </p>
          </div>
        </div>
      </section>

      {kpis.map((family) => (
        <section key={family.family} className="mt-10 border-t border-[var(--color-border)] pt-6">
          <h2 className="mb-4 text-[17px] font-semibold text-[var(--color-text)]">{family.family}</h2>
          <Table head={["Indicateur", "Définition", "Formule", "Source", "Valeur"]} minWidth={1080}>
            {family.rows.map((kpi) => (
              <Tr key={kpi.name}>
                <Td className="font-medium">{kpi.name}</Td>
                <Td className="max-w-[280px] text-[13px] text-[var(--color-text-muted)]">{kpi.definition}</Td>
                <Td className="max-w-[240px] text-[12.5px] text-[var(--color-text-muted)]">{kpi.formula}</Td>
                <Td className="max-w-[220px] text-[12.5px] text-[var(--color-text-muted)]">{kpi.source}</Td>
                <Td>
                  {kpi.instrumented ? (
                    <span className="whitespace-nowrap text-[13.5px] font-medium tabular-nums">{kpi.value}</span>
                  ) : (
                    <Badge tone="warning">Non instrumenté</Badge>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </section>
      ))}
    </>
  );
}
