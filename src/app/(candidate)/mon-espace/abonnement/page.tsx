/**
 * Abonnement — [T §6.10].
 *
 * Plan en cours, fonctionnalités incluses, consommation réelle des quotas,
 * renouvellement, moyen de paiement, historique et comparatif.
 *
 * Point de modèle économique rappelé à l'écran : le paiement se fait par
 * Mobile Money, en prépayé, avec rappel avant échéance. SIRA ne détient aucun
 * mandat de prélèvement automatique.
 */

import { SimulatedActionBar } from "@/components/account-actions";
import { PremiumTag } from "@/components/account-shared";
import {
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import { IllustrationNoDocuments } from "@/components/illustrations";
import {
  Alert,
  Badge,
  DataList,
  EmptyState,
  PageHeader,
  Progress,
  cx,
  formatDate,
} from "@/components/ui";
import { CURRENT_USER_ID, getPayments, getSubscription, getUsageCounters } from "@/data/queries";
import {
  PAYMENT_PROVIDER_LABEL,
  PAYMENT_STATUS_LABEL,
  PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  formatMoney,
  type PaymentStatus,
} from "@/lib/enums";

export const metadata = {
  title: "Mon abonnement — SIRA",
};

const PREMIUM_PRICE = 5000;

const PAYMENT_STATUS_TONE: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  cancelled: "neutral",
  refunded: "neutral",
};

/** Comparatif Gratuit / Premium — une ligne par promesse produit. */
const COMPARISON: { feature: string; free: string | boolean; premium: string | boolean }[] = [
  { feature: "Recherche et consultation des offres", free: true, premium: true },
  { feature: "Score de compatibilité et explication", free: true, premium: true },
  { feature: "Recommandations d'offres par l'IA", free: "5 par semaine", premium: "Illimitées" },
  { feature: "Analyse approfondie du CV", free: "1 par mois", premium: "Illimitée" },
  { feature: "Préparation de candidature assistée", free: "2 par mois", premium: "Illimitée" },
  { feature: "Notifications WhatsApp", free: "5 par semaine", premium: "Illimitées" },
  { feature: "Coach carrière", free: false, premium: true },
  { feature: "Préparation aux entretiens", free: false, premium: true },
  { feature: "Analyse des points faibles du profil", free: false, premium: true },
  { feature: "Suivi avancé des candidatures", free: false, premium: true },
  { feature: "Formations partenaires incluses", free: false, premium: true },
];

const FREE_FEATURES = [
  "Accès complet aux offres publiées et à leur détail",
  "Score de compatibilité avec le détail des six composantes",
  "5 recommandations d'offres par semaine",
  "1 analyse approfondie du CV par mois",
  "2 préparations de candidature par mois",
  "5 notifications WhatsApp par semaine",
  "Formations gratuites et suivi de vos inscriptions",
];

const PREMIUM_FEATURES = [
  "Coach carrière : conseils personnalisés sur votre trajectoire",
  "Préparation aux entretiens, questions et simulation",
  "Analyse des points faibles de votre profil et de votre CV",
  "Suivi avancé de vos candidatures et relances",
  "Formations partenaires incluses sans frais supplémentaires",
  "Recommandations, analyses et préparations sans quota",
];

function Availability({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
        <IconCheck size={15} />
        <span className="sr-only">Inclus</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--color-text-subtle)]">
        <IconClose size={15} />
        <span className="sr-only">Non inclus</span>
      </span>
    );
  }
  return <span className="text-[13px] text-[var(--color-text)]">{value}</span>;
}

export default function SubscriptionPage() {
  const subscription = getSubscription();
  const counters = getUsageCounters();
  const payments = getPayments().filter((payment) => payment.userId === CURRENT_USER_ID);
  const isFree = subscription.plan === "candidat_gratuit";

  return (
    <>
      <PageHeader
        title="Mon abonnement"
        description="Votre formule, ce qu'elle inclut, ce que vous avez consommé, et comment passer Premium."
      />

      <div className="grid gap-x-10 lg:grid-cols-3">
        {/* ---------------- Plan actuel ---------------- */}
        <div className="lg:col-span-2">
          <section className="border-t border-[var(--color-border)] py-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Formule en cours</h2>
              <Badge tone={subscription.status === "active" ? "success" : "warning"}>
                {SUBSCRIPTION_STATUS_LABEL[subscription.status]}
              </Badge>
            </div>
            <div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[22px] font-semibold text-[var(--color-text)]">
                    {PLAN_LABEL[subscription.plan]}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                    {isFree
                      ? "Sans engagement, sans échéance, sans moyen de paiement enregistré."
                      : `${formatMoney(PREMIUM_PRICE)} par mois, en prépayé.`}
                  </p>
                </div>
                {isFree ? (
                  <div className="text-right">
                    <p className="text-[12.5px] text-[var(--color-text-muted)]">Premium</p>
                    <p className="text-[17px] font-semibold text-[var(--color-text)]">{formatMoney(PREMIUM_PRICE)}</p>
                    <p className="text-[12px] text-[var(--color-text-subtle)]">par mois</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <DataList
                  rows={[
                    { label: "Depuis le", value: formatDate(subscription.startedAt) },
                    {
                      label: "Renouvellement",
                      value: subscription.renewsAt
                        ? formatDate(subscription.renewsAt)
                        : "Aucun : le plan Gratuit n'expire pas et ne se renouvelle pas",
                    },
                    {
                      label: "Offre de lancement",
                      value: subscription.isLaunchOffer ? "Appliquée" : "Non applicable",
                    },
                    { label: "Référence", value: <span className="font-mono text-[12.5px]">{subscription.id}</span> },
                  ]}
                />
              </div>

              <SimulatedActionBar
                className="mt-4 border-t border-[var(--color-border)] pt-4"
                actions={[
                  {
                    label: "Changer de formule",
                    variant: "accent",
                    size: "md",
                    icon: <IconSparkles size={15} />,
                    message: `Le passage à Premium (${formatMoney(
                      PREMIUM_PRICE,
                    )} pour 30 jours) déclencherait une demande de paiement Orange Money ou Moov Money sur votre téléphone. L'abonnement ne démarre qu'une fois le paiement confirmé.`,
                  },
                  {
                    label: "Annuler mon abonnement",
                    variant: "ghost",
                    size: "md",
                    tone: "neutral",
                    disabled: isFree,
                    disabledReason: isFree
                      ? "vous êtes sur le plan Gratuit : il n'y a ni engagement ni prélèvement à annuler."
                      : undefined,
                    message:
                      "Votre abonnement resterait actif jusqu'à la fin de la période déjà payée, puis basculerait automatiquement sur le plan Gratuit. Aucun remboursement partiel n'est prévu.",
                  },
                ]}
              />
            </div>
          </section>

          {/* ---------------- Limites et consommation ---------------- */}
          <section className="border-t border-[var(--color-border)] py-7">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Limites et consommation</h2>
            <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
              Vos compteurs du plan Gratuit, remis à zéro à chaque période.
            </p>
            <div className="mt-4 space-y-4">
              {counters.map((counter) => {
                const ratio = counter.limit ? Math.min(100, (counter.consumed / counter.limit) * 100) : 0;
                const exhausted = counter.limit !== null && counter.consumed >= counter.limit;
                return (
                  <div key={counter.feature}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[13.5px] font-medium text-[var(--color-text)]">
                        {counter.label}
                        <span className="ml-1.5 text-[12px] font-normal text-[var(--color-text-subtle)]">
                          {counter.period.toLowerCase()}
                        </span>
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-[var(--color-text)]">
                        {counter.consumed} / {counter.limit ?? "∞"}
                        {exhausted ? (
                          <Badge tone="warning" className="ml-2">
                            Quota atteint
                          </Badge>
                        ) : null}
                      </span>
                    </div>
                    <Progress
                      value={ratio}
                      tone={exhausted ? "warning" : ratio >= 75 ? "accent" : "primary"}
                      label={counter.label}
                    />
                  </div>
                );
              })}

              <Alert tone="accent" title="Ces limites disparaissent avec Premium">
                Recommandations, analyses de CV, préparations de candidature et notifications WhatsApp deviennent
                illimitées. Les fonctions Premium — coach carrière, préparation aux entretiens, analyse des points
                faibles, suivi avancé, formations incluses — s&apos;y ajoutent.
              </Alert>
            </div>
          </section>

          {/* ---------------- Comparatif ---------------- */}
          <section className="border-t border-[var(--color-border)] py-7">
            <h2 className="mb-4 text-[17px] font-semibold text-[var(--color-text)]">Comparatif Gratuit / Premium</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <caption className="sr-only">Comparaison des fonctionnalités des formules Gratuit et Premium</caption>
                <thead>
                  <tr className="border-y border-[var(--color-border)]">
                    <th scope="col" className="py-2.5 pr-3 text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)]">
                      Fonctionnalité
                    </th>
                    <th scope="col" className="w-32 px-3 py-2.5 text-[12.5px] font-semibold text-[var(--color-text)]">
                      Gratuit
                      <span className="ml-1.5 align-middle">
                        <Badge tone="primary">Actuel</Badge>
                      </span>
                    </th>
                    <th scope="col" className="w-32 py-2.5 pl-3 text-[12.5px] font-semibold text-[var(--color-text)]">
                      Premium
                      <span className="ml-1.5 align-middle">
                        <PremiumTag />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b border-[var(--color-border)] last:border-0">
                      <th scope="row" className="py-3 pr-3 text-[13px] font-normal text-[var(--color-text)]">
                        {row.feature}
                      </th>
                      <td className="px-3 py-3">
                        <Availability value={row.free} />
                      </td>
                      <td className="py-3 pl-3">
                        <Availability value={row.premium} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---------------- Historique ---------------- */}
          <section className="border-t border-[var(--color-border)] py-7">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Historique de paiement</h2>
            <p className="mb-4 mt-1 text-[12.5px] text-[var(--color-text-muted)]">Vos transactions liées à SIRA.</p>
            <div>
              {payments.length === 0 ? (
                <EmptyState
                  icon={<IllustrationNoDocuments size={165} accent="var(--color-zone-candidate)" />}
                  title="Aucun paiement"
                  description="Le plan Gratuit n'implique aucune transaction."
                />
              ) : (
                <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-[var(--color-text)]">{payment.description}</p>
                        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                          {formatDate(payment.createdAt)} · {PAYMENT_PROVIDER_LABEL[payment.provider]} ·{" "}
                          <span className="font-mono">{payment.reference}</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13.5px] font-semibold tabular-nums text-[var(--color-text)]">
                          {formatMoney(payment.amount)}
                        </p>
                        <Badge tone={PAYMENT_STATUS_TONE[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* ---------------- Colonne latérale ---------------- */}
        <div className="lg:border-l lg:border-[var(--color-border)] lg:pl-8">
          <section className="border-t border-[var(--color-border)] py-7">
            <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-text)]">Ce que votre formule inclut</h2>
            <ul className="space-y-2">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--color-text)]">
                  <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                    <IconCheckCircle size={15} />
                  </span>
                  <span className="min-w-0">{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-[var(--color-border)] py-7">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]">
              Avec Premium
              <PremiumTag />
            </h2>
            <p className="mb-3 mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              {`${formatMoney(PREMIUM_PRICE)} par mois, sans engagement`}
            </p>
            <ul className="space-y-2">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--color-text)]">
                  <span className="mt-0.5 shrink-0 text-[var(--color-accent-hover)]" aria-hidden>
                    <IconSparkles size={15} />
                  </span>
                  <span className="min-w-0">{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-[var(--color-border)] py-7">
            <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-text)]">Paiement</h2>
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="accent">{PAYMENT_PROVIDER_LABEL.mobile_money_orange}</Badge>
                <Badge tone="info">{PAYMENT_PROVIDER_LABEL.mobile_money_moov}</Badge>
              </div>

              <p className={cx("mt-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]")}>
                L&apos;abonnement se règle par <strong className="font-semibold text-[var(--color-text)]">Mobile
                Money</strong>, Orange Money ou Moov Money, en{" "}
                <strong className="font-semibold text-[var(--color-text)]">prépayé</strong> : vous payez 30 jours
                d&apos;avance. Trois jours avant l&apos;échéance, SIRA vous envoie un rappel et vous décidez de
                renouveler ou non.
              </p>

              <Alert tone="success" title="Aucun prélèvement automatique">
                SIRA ne conserve aucun mandat de prélèvement et ne peut pas débiter votre compte Mobile Money sans une
                validation de votre part sur votre téléphone. Si vous ne renouvelez pas, votre compte repasse
                simplement en plan Gratuit.
              </Alert>

              <div className="mt-4">
                <DataList
                  rows={[
                    { label: "Moyen enregistré", value: "Aucun — le paiement est validé à chaque échéance" },
                    { label: "Devise", value: "Franc CFA (XOF)" },
                    { label: "Facturation", value: "Reçu envoyé par e-mail après chaque paiement" },
                  ]}
                />
              </div>

              <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                <span className="mt-0.5 shrink-0" aria-hidden>
                  <IconShield size={13} />
                </span>
                <span>
                  Un échec de paiement n&apos;entraîne aucune pénalité : la dernière tentative du 20 août 2026 a
                  simplement laissé votre compte en plan Gratuit.
                </span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
