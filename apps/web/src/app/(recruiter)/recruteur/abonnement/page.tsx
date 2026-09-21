/**
 * Abonnement recruteur.
 * Plan « Pro, offre de lancement » : gratuit pendant la phase de lancement,
 * avec une date d'expiration fixée par l'administration SIRA.
 *
 * Direction épurée : aucun aplat coloré, aucun grand bloc de marque. Les
 * tableaux portent un en-tête discret et des lignes séparées par un filet.
 */

import type { Metadata } from "next";
import {
  PLAN_COMPARISON,
  PLAN_PRICES,
  RECRUITER_PAYMENTS,
  RECRUITER_SUBSCRIPTION,
  RECRUITER_USAGE,
} from "@/components/recruiter-data";
import { PlanActions } from "@/components/recruiter-settings";
import { ProBadge } from "@/components/recruiter-ui";
import {
  Alert,
  Badge,
  PageHeader,
  Progress,
  cx,
  daysUntil,
  formatDate,
} from "@/components/ui";
import { IconCheck, IconClose, IconCreditCard, IconShield } from "@/components/icons";
import {
  PAYMENT_PROVIDER_LABEL,
  PAYMENT_STATUS_LABEL,
  PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  formatMoney,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Abonnement",
};

const PLAN_COLUMNS = [
  { key: "gratuit" as const, name: "Gratuit", price: PLAN_PRICES.gratuit, note: "Pour tester la plateforme" },
  { key: "pro" as const, name: "Pro", price: PLAN_PRICES.pro, note: "Votre plan actuel" },
  { key: "enterprise" as const, name: "Enterprise", price: PLAN_PRICES.enterprise, note: "Volume et accompagnement" },
];

const H2 = "text-[17px] font-semibold text-[var(--color-text)]";
const SUB = "mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]";
const TH =
  "px-3 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)]";

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === "string") {
    return <span className="text-[13px] text-[var(--color-text)]">{value}</span>;
  }
  return value ? (
    <span className="inline-flex items-center text-[var(--color-success)]" title="Inclus">
      <IconCheck size={16} />
      <span className="sr-only">Inclus</span>
    </span>
  ) : (
    <span className="inline-flex items-center text-[var(--color-text-subtle)]" title="Non inclus">
      <IconClose size={15} />
      <span className="sr-only">Non inclus</span>
    </span>
  );
}

export default function SubscriptionPage() {
  const subscription = RECRUITER_SUBSCRIPTION;
  const expiresAt = subscription.renewsAt ?? "";
  const remaining = expiresAt ? daysUntil(expiresAt) : 0;
  const paid = RECRUITER_PAYMENTS.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Abonnement"
        description="Votre plan, ce qu'il inclut, ce que vous consommez et comment il sera facturé après le lancement."
      />

      {/* ---- Plan actuel ---- */}
      <section aria-labelledby="plan-actuel" className="border-t border-[var(--color-border)] pt-7">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="plan-actuel" className={H2}>
                {PLAN_LABEL[subscription.plan]}
              </h2>
              <ProBadge />
              <Badge tone="accent">Offre de lancement</Badge>
              <Badge tone="success">{SUBSCRIPTION_STATUS_LABEL[subscription.status]}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
              Pendant la phase de lancement de SIRA, le plan Pro est offert aux organisations vérifiées. Vous
              disposez de toutes les fonctions Pro sans aucun paiement. La date d&apos;expiration de l&apos;offre
              est fixée par l&apos;administration de la plateforme et peut être prolongée : vous serez prévenu au
              moins trente jours avant l&apos;échéance.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[26px] font-semibold leading-none text-[var(--color-text)]">0 FCFA</p>
            <p className="mt-1.5 text-[12.5px] text-[var(--color-text-muted)]">
              au lieu de {formatMoney(PLAN_PRICES.pro)} par mois
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-5 border-t border-[var(--color-border)] pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-[12.5px] text-[var(--color-text-muted)]">Activé le</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-[var(--color-text)]">
              {formatDate(subscription.startedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-[var(--color-text-muted)]">Expiration de l&apos;offre</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-[var(--color-text)]">
              {expiresAt ? formatDate(expiresAt) : "Non fixée"}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-[var(--color-text-muted)]">Temps restant</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-[var(--color-text)]">
              {remaining > 0 ? `${remaining} jours` : "Échue"}
            </dd>
            <Progress
              value={Math.max(0, Math.min(100, (remaining / 180) * 100))}
              tone="accent"
              className="mt-2"
              label="Temps restant sur l'offre de lancement"
            />
          </div>
        </dl>

        <div className="mt-6">
          <Alert tone="accent" icon={<IconShield size={15} />} title="Ce qui se passe à l'échéance">
            <p>
              À l&apos;expiration de l&apos;offre, aucun prélèvement n&apos;est déclenché automatiquement. Votre
              compte bascule sur le plan Gratuit, sauf si vous confirmez le passage à Pro payant. Les offres déjà
              publiées restent en ligne jusqu&apos;à leur date limite, et vos candidatures restent accessibles.
            </p>
          </Alert>
          <div className="mt-4">
            <PlanActions />
          </div>
        </div>
      </section>

      {/* ---- Consommation ---- */}
      <section aria-labelledby="consommation" className="mt-10 border-t border-[var(--color-border)] pt-7">
        <h2 id="consommation" className={H2}>
          Consommation
        </h2>
        <p className={SUB}>Compteurs remis à zéro au premier jour de chaque période.</p>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2">
          {RECRUITER_USAGE.map((usage) => {
            const ratio = usage.limit ? Math.round((usage.consumed / usage.limit) * 100) : 0;
            return (
              <li key={usage.feature}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium text-[var(--color-text)]">{usage.label}</span>
                  <span className="text-[12.5px] tabular-nums text-[var(--color-text-muted)]">
                    {usage.consumed} {usage.limit ? `/ ${usage.limit}` : "· illimité"}
                  </span>
                </div>
                <Progress
                  value={usage.limit ? ratio : 8}
                  tone={ratio >= 90 ? "danger" : ratio >= 70 ? "warning" : "primary"}
                  label={usage.label}
                />
                <p className="mt-1 text-[11.5px] text-[var(--color-text-subtle)]">{usage.period}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---- Comparatif ---- */}
      <section aria-labelledby="comparatif" className="mt-10 border-t border-[var(--color-border)] pt-7">
        <h2 id="comparatif" className={H2}>
          Comparatif des plans
        </h2>
        <p className={SUB}>
          Gratuit, Pro et Enterprise. Les tarifs s&apos;entendent par organisation et par mois.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">Comparatif des fonctions incluses dans chaque plan recruteur</caption>
            <thead>
              <tr className="border-y border-[var(--color-border)]">
                <th scope="col" className={TH}>
                  Fonction
                </th>
                {PLAN_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cx("px-3 py-3 text-center align-top", col.key === "pro" ? "bg-[var(--color-surface-2)]" : "")}
                  >
                    <span className="block text-[14px] font-semibold text-[var(--color-text)]">{col.name}</span>
                    <span className="block text-[13px] font-medium text-[var(--color-text)]">
                      {col.price === 0 ? "0 FCFA" : formatMoney(col.price)}
                    </span>
                    <span className="block text-[11.5px] font-normal text-[var(--color-text-muted)]">
                      {col.note}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {PLAN_COMPARISON.map((feature) => (
                <tr key={feature.label}>
                  <th scope="row" className="px-3 py-2.5 text-[13px] font-normal text-[var(--color-text)]">
                    {feature.label}
                  </th>
                  <td className="px-3 py-2.5 text-center">
                    <FeatureCell value={feature.gratuit} />
                  </td>
                  <td className="bg-[var(--color-surface-2)] px-3 py-2.5 text-center">
                    <FeatureCell value={feature.pro} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <FeatureCell value={feature.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---- Historique de paiement ---- */}
        <section aria-labelledby="historique" className="min-w-0 border-t border-[var(--color-border)] pt-7">
          <h2 id="historique" className={H2}>
            Historique de paiement
          </h2>
          <p className={SUB}>{formatMoney(paid)} réglés depuis l&apos;ouverture du compte.</p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <caption className="sr-only">Historique des paiements de l&apos;organisation</caption>
              <thead>
                <tr className="border-y border-[var(--color-border)]">
                  {["Date", "Objet", "Moyen", "Référence", "Montant", "Statut"].map((h) => (
                    <th key={h} scope="col" className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {RECRUITER_PAYMENTS.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-3 py-3 text-[13px] text-[var(--color-text-muted)]">
                      {formatDate(payment.createdAt)}
                    </td>
                    <th scope="row" className="px-3 py-3 text-[13px] font-normal text-[var(--color-text)]">
                      {payment.description}
                    </th>
                    <td className="px-3 py-3 text-[13px] text-[var(--color-text-muted)]">
                      {PAYMENT_PROVIDER_LABEL[payment.provider]}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-[var(--color-text-subtle)]">
                      {payment.reference}
                    </td>
                    <td className="px-3 py-3 text-[13px] tabular-nums text-[var(--color-text)]">
                      {payment.amount === 0 ? "Offert" : formatMoney(payment.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={
                          payment.status === "paid"
                            ? "success"
                            : payment.status === "failed"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {PAYMENT_STATUS_LABEL[payment.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---- Moyens de paiement ---- */}
        <aside className="min-w-0">
          <section aria-labelledby="moyens" className="border-t border-[var(--color-border)] pt-7">
            <div className="flex items-start justify-between gap-4">
              <h2 id="moyens" className="text-[14px] font-semibold text-[var(--color-text)]">
                Moyens de paiement
              </h2>
              <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
                <IconCreditCard size={18} />
              </span>
            </div>
            <ul className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {[
                {
                  name: "Orange Money",
                  detail: "+226 70 •• •• 77, compte principal",
                  badge: "Par défaut",
                  tone: "success" as const,
                },
                {
                  name: "Moov Money",
                  detail: "+226 60 •• •• 12, compte de secours",
                  badge: "Enregistré",
                  tone: "neutral" as const,
                },
              ].map((method) => (
                <li key={method.name} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium text-[var(--color-text)]">{method.name}</p>
                    <p className="text-[12.5px] text-[var(--color-text-muted)]">{method.detail}</p>
                  </div>
                  <Badge tone={method.tone}>{method.badge}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Le paiement s&apos;effectue par Mobile Money, en francs CFA. La carte bancaire et le virement sont
              réservés au plan Enterprise, sur facture. Aucun prélèvement n&apos;est automatique : chaque
              reconduction demande une validation depuis votre téléphone.
            </p>
          </section>

          <section aria-labelledby="facturation" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 id="facturation" className="text-[14px] font-semibold text-[var(--color-text)]">
              Facturation
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              Sahel Agro Industries SA · Zone industrielle, Bobo-Dioulasso · Burkina Faso. Les reçus sont envoyés
              à {"recrutement@sahelagro.bf"} après chaque paiement.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
