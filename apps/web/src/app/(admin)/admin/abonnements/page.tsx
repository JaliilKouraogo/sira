/**
 * Back-office — abonnements [T §21.4].
 *
 * La démonstration n'expose pas d'endpoint d'abonnements : la liste est
 * reconstituée depuis l'abonnement connu et les paiements d'abonnement,
 * ce que dit l'encart en tête de tableau.
 *
 * Direction épurée : tableaux et compteurs posés à même la page, séparés par
 * des filets, sans carte ni ombre.
 */

import type { Metadata } from "next";
import {
  BarChart,
  SUBSCRIPTION_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
  fullName,
} from "@/components/admin-kit";
import { Alert, Badge, PageHeader, Progress, Stat, formatDate } from "@/components/ui";
import { getAllUsers, getPayments, getSubscription, getUsageCounters, getUserById } from "@/data/queries";
import {
  PLAN_CODES,
  PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  formatMoney,
  type PlanCode,
  type SubscriptionStatus,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Abonnements | Administration SIRA",
};

/** Grille tarifaire mensuelle, en francs CFA. Enterprise se négocie. */
const PLAN_PRICE: Record<PlanCode, number | null> = {
  candidat_gratuit: 0,
  candidat_premium: 5000,
  recruteur_gratuit: 0,
  recruteur_pro: 25000,
  recruteur_enterprise: null,
};

const PLAN_AUDIENCE: Record<PlanCode, string> = {
  candidat_gratuit: "Candidat",
  candidat_premium: "Candidat",
  recruteur_gratuit: "Recruteur",
  recruteur_pro: "Recruteur",
  recruteur_enterprise: "Recruteur",
};

const PLAN_SUMMARY: Record<PlanCode, string> = {
  candidat_gratuit: "Recherche, candidature manuelle et quotas d'IA limités.",
  candidat_premium: "Préparation illimitée des candidatures, score détaillé, alertes WhatsApp.",
  recruteur_gratuit: "Une offre en ligne à la fois, sans recherche de talents.",
  recruteur_pro: "Offres illimitées, recherche de talents, résumés de candidats par l'IA.",
  recruteur_enterprise: "Multi-comptes, quotas négociés, accompagnement dédié.",
};

interface DerivedSubscription {
  id: string;
  userId: string;
  plan: PlanCode;
  status: SubscriptionStatus;
  startedAt: string;
  amount: number | null;
}

export default function AdminSubscriptionsPage() {
  const base = getSubscription();
  const payments = getPayments();
  const users = getAllUsers();
  const usage = getUsageCounters();

  const subscriptions: DerivedSubscription[] = [
    { id: base.id, userId: base.userId, plan: base.plan, status: base.status, startedAt: base.startedAt, amount: PLAN_PRICE[base.plan] },
    ...payments
      .filter((p) => p.description.toLowerCase().includes("abonnement"))
      .map<DerivedSubscription>((p) => ({
        id: `sub_${p.id}`,
        userId: p.userId,
        plan: p.description.toLowerCase().includes("premium") ? "candidat_premium" : "recruteur_pro",
        status: p.status === "paid" ? "active" : "en_attente_paiement",
        startedAt: p.createdAt,
        amount: p.amount,
      })),
  ];

  const active = subscriptions.filter((s) => s.status === "active");
  const paying = active.filter((s) => (s.amount ?? 0) > 0);
  const mrr = paying.reduce((sum, s) => sum + (s.amount ?? 0), 0);

  const candidates = users.filter((u) => u.role === "candidate").length;
  const premium = active.filter((s) => s.plan === "candidat_premium").length;

  const byPlan = PLAN_CODES.map((plan) => ({
    label: `${PLAN_AUDIENCE[plan]} · ${PLAN_LABEL[plan]}`,
    value: subscriptions.filter((s) => s.plan === plan && s.status === "active").length,
  }));

  return (
    <>
      <PageHeader
        title="Abonnements"
        description="Cinq plans, deux audiences. Le plan gratuit reste utilisable de bout en bout : il limite les quotas d'IA, jamais l'accès aux offres."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Abonnements actifs" value={formatInt(active.length)} />
        <Stat label="Abonnements payants" value={formatInt(paying.length)} />
        <Stat label="Revenu mensuel récurrent" value={formatMoney(mrr)} />
        <Stat
          label="Conversion vers Premium"
          value={formatPercent(candidates === 0 ? 0 : (premium / candidates) * 100, 1)}
          hint={`${premium} sur ${candidates} candidats`}
        />
      </div>

      <div className="mt-6">
        <Alert tone="neutral" title="Source des données">
          La démonstration n&apos;expose pas encore de lecture globale des abonnements : la liste ci-dessous est
          reconstituée depuis l&apos;abonnement du compte de démonstration et les paiements portant la mention
          « abonnement ». Les compteurs suivront l&apos;endpoint réel sans changer d&apos;écran.
        </Alert>
      </div>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Abonnements</h2>
          <p className="mt-0.5 max-w-2xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Un abonnement en attente de paiement conserve l&apos;accès du plan précédent
          </p>
        </div>
        <Table head={["Titulaire", "Plan", "Audience", "Statut", "Montant mensuel", "Depuis"]} minWidth={840}>
          {subscriptions.map((sub) => {
            const user = getUserById(sub.userId);
            return (
              <Tr key={sub.id}>
                <Td>
                  <p className="text-[13.5px] font-medium">{fullName(user)}</p>
                  <p className="text-[12.5px] text-[var(--color-text-muted)]">{user?.email}</p>
                </Td>
                <Td>
                  <Badge tone={PLAN_PRICE[sub.plan] === 0 ? "neutral" : "accent"}>{PLAN_LABEL[sub.plan]}</Badge>
                </Td>
                <TdMuted>{PLAN_AUDIENCE[sub.plan]}</TdMuted>
                <Td>
                  <Badge tone={SUBSCRIPTION_STATUS_TONE[sub.status]}>{SUBSCRIPTION_STATUS_LABEL[sub.status]}</Badge>
                </Td>
                <TdMuted>{sub.amount == null ? "Sur devis" : formatMoney(sub.amount)}</TdMuted>
                <TdMuted>{formatDate(sub.startedAt)}</TdMuted>
              </Tr>
            );
          })}
        </Table>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Grille des plans</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Tarifs mensuels affichés toutes taxes comprises
            </p>
          </div>
          <Table head={["Plan", "Audience", "Tarif mensuel", "Ce qu'il ouvre", "Actifs"]} minWidth={820}>
            {PLAN_CODES.map((plan) => (
              <Tr key={plan}>
                <Td className="font-medium">{PLAN_LABEL[plan]}</Td>
                <TdMuted>{PLAN_AUDIENCE[plan]}</TdMuted>
                <TdMuted>{PLAN_PRICE[plan] == null ? "Sur devis" : formatMoney(PLAN_PRICE[plan] as number)}</TdMuted>
                <Td className="text-[13px] text-[var(--color-text-muted)]">{PLAN_SUMMARY[plan]}</Td>
                <TdMuted>{subscriptions.filter((s) => s.plan === plan && s.status === "active").length}</TdMuted>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="min-w-0 space-y-8">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Abonnements actifs par plan</h2>
            <div className="mt-4">
              <BarChart items={byPlan} />
            </div>
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Quotas du plan gratuit</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Compteurs du compte de démonstration
            </p>
            <ul className="mt-4 space-y-3">
              {usage.map((counter) => (
                <li key={counter.feature}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-[var(--color-text)]">{counter.label}</span>
                    <span className="text-[12.5px] tabular-nums text-[var(--color-text-muted)]">
                      {counter.consumed} / {counter.limit ?? "illimité"}
                    </span>
                  </div>
                  <Progress
                    value={counter.limit ? (counter.consumed / counter.limit) * 100 : 0}
                    tone={counter.limit && counter.consumed >= counter.limit ? "warning" : "primary"}
                    label={counter.label}
                  />
                  <p className="mt-0.5 text-[12px] text-[var(--color-text-subtle)]">{counter.period}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
