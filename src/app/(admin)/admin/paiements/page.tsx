/**
 * Back-office — paiements [T §21.4].
 *
 * Le mobile money domine les usages au Burkina Faso : un échec y est banal
 * (solde insuffisant, code expiré, réseau). L'écran traite donc les échecs
 * comme un flux normal, pas comme une exception.
 *
 * Direction épurée : les échecs sont une liste séparée par des filets, les
 * tableaux sont posés à même la page.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import {
  BarChart,
  PAYMENT_STATUS_TONE,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
  fullName,
} from "@/components/admin-kit";
import { Alert, Badge, PageHeader, Stat, formatDate, relativeDays } from "@/components/ui";
import { getPayments, getUserById } from "@/data/queries";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  formatMoney,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Paiements | Administration SIRA",
};

/** Causes d'échec observées sur le mobile money, et conduite à tenir. */
const FAILURE_PLAYBOOK = [
  { cause: "Solde insuffisant", action: "Relance au bout de 24 h, puis à J+3. Deux relances au maximum." },
  { cause: "Code de confirmation expiré", action: "Nouvelle tentative immédiate proposée depuis l'écran de paiement." },
  { cause: "Numéro non enregistré au service", action: "Orienter vers l'autre opérateur ou vers le virement." },
  { cause: "Indisponibilité de l'opérateur", action: "Rejouer automatiquement après rétablissement du service." },
];

export default function AdminPaymentsPage() {
  const payments = [...getPayments()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const paid = payments.filter((p) => p.status === "paid");
  const failed = payments.filter((p) => p.status === "failed");
  const pending = payments.filter((p) => p.status === "pending");

  const collected = paid.reduce((sum, p) => sum + p.amount, 0);
  const lost = failed.reduce((sum, p) => sum + p.amount, 0);

  const byProvider = PAYMENT_PROVIDERS.map((provider) => ({
    label: PAYMENT_PROVIDER_LABEL[provider],
    value: payments.filter((p) => p.provider === provider).reduce((sum, p) => sum + p.amount, 0),
    display: formatMoney(payments.filter((p) => p.provider === provider).reduce((sum, p) => sum + p.amount, 0)),
  })).filter((row) => row.value > 0);

  const byStatus = PAYMENT_STATUSES.map((status) => ({
    label: PAYMENT_STATUS_LABEL[status],
    value: payments.filter((p) => p.status === status).length,
  })).filter((row) => row.value > 0);

  return (
    <>
      <PageHeader
        title="Paiements"
        description="Transactions d'abonnement et de campagne, tous fournisseurs confondus. Chaque transaction porte une référence opérateur, seule preuve opposable en cas de litige."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Encaissé" value={formatMoney(collected)} />
        <Stat
          label="Taux de réussite"
          value={formatPercent(payments.length === 0 ? 0 : (paid.length / payments.length) * 100, 1)}
          hint={`${paid.length} sur ${payments.length} transactions`}
        />
        <Stat label="Échecs à traiter" value={formatInt(failed.length)} hint={formatMoney(lost)} />
        <Stat label="En attente" value={formatInt(pending.length)} />
      </div>

      {/* ---- Gestion des échecs ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
          Échecs de paiement ({failed.length})
        </h2>
        {failed.length === 0 ? (
          <div className="mt-4">
            <Alert tone="success" title="Aucun échec en cours">
              Toutes les transactions récentes ont abouti.
            </Alert>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {failed.map((payment) => {
              const user = getUserById(payment.userId);
              return (
                <li key={payment.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-[var(--color-text)]">{payment.description}</p>
                      <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                        {fullName(user)} · {PAYMENT_PROVIDER_LABEL[payment.provider]} · référence{" "}
                        <span className="font-mono">{payment.reference}</span> · {relativeDays(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold tabular-nums">{formatMoney(payment.amount)}</span>
                      <Badge tone={PAYMENT_STATUS_TONE[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
                    </div>
                  </div>
                  <AdminActions
                    className="mt-3"
                    subject={`la transaction ${payment.reference}`}
                    actions={[
                      { label: "Relancer le paiement", variant: "primary" },
                      { label: "Marquer comme réglé hors ligne", variant: "outline" },
                      { label: "Annuler la transaction", variant: "danger" },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- Toutes les transactions ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Toutes les transactions</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Ordre antichronologique</p>
        </div>
        <Table
          head={["Référence", "Titulaire", "Objet", "Fournisseur", "Montant", "Statut", "Date"]}
          minWidth={1000}
        >
          {payments.map((payment) => {
            const user = getUserById(payment.userId);
            return (
              <Tr key={payment.id}>
                <Td className="font-mono text-[12.5px]">{payment.reference}</Td>
                <Td>
                  <p className="truncate text-[13.5px] font-medium">{fullName(user)}</p>
                  <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{user?.email}</p>
                </Td>
                <Td className="max-w-[240px] text-[13px] text-[var(--color-text-muted)]">{payment.description}</Td>
                <TdMuted>{PAYMENT_PROVIDER_LABEL[payment.provider]}</TdMuted>
                <Td className="whitespace-nowrap font-medium tabular-nums">{formatMoney(payment.amount)}</Td>
                <Td>
                  <Badge tone={PAYMENT_STATUS_TONE[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
                </Td>
                <TdMuted>{formatDate(payment.createdAt)}</TdMuted>
              </Tr>
            );
          })}
        </Table>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Volume par fournisseur</h2>
          <div className="mt-4">
            <BarChart items={byProvider} tone="accent" />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Transactions par statut</h2>
          <div className="mt-4">
            <BarChart items={byStatus} />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Conduite à tenir sur un échec</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Deux relances au maximum, puis abandon
          </p>
          <ul className="mt-3 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {FAILURE_PLAYBOOK.map((row) => (
              <li key={row.cause} className="py-2.5">
                <p className="text-[13px] font-medium text-[var(--color-text)]">{row.cause}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{row.action}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
