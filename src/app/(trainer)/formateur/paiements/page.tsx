/**
 * Espace formateur — paiements [T §3.4].
 *
 * Point de clarté indispensable : SIRA facture la promotion, pas
 * l'inscription. Aucun reversement n'est dû, parce qu'aucune place
 * n'est vendue sur la plateforme.
 *
 * Direction épurée : listes séparées par des filets, tableau posé à même la
 * page, chiffres clés neutres.
 */

import type { Metadata } from "next";
import { PAYMENT_STATUS_TONE, Table, Td, TdMuted, Tr, formatInt } from "@/components/admin-kit";
import { IllustrationNoDocuments } from "@/components/illustrations";
import { Alert, Badge, EmptyState, PageHeader, Stat, formatDate } from "@/components/ui";
import { getPayments } from "@/data/queries";
import { PAYMENT_PROVIDER_LABEL, PAYMENT_STATUS_LABEL, formatMoney } from "@/lib/enums";
import { TRAINER_USER_ID, getTrainerTrainings } from "../../trainer-context";

export const metadata: Metadata = {
  title: "Paiements | Espace formateur SIRA",
};

export default function TrainerPaymentsPage() {
  const payments = getPayments()
    .filter((p) => p.userId === TRAINER_USER_ID)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const trainings = getTrainerTrainings();

  const paid = payments.filter((p) => p.status === "paid");
  const spent = paid.reduce((sum, p) => sum + p.amount, 0);
  const failed = payments.filter((p) => p.status === "failed");

  /** Chiffre d'affaires du catalogue, encaissé directement par l'organisme. */
  const catalogueRevenue = trainings
    .filter((t) => t.access === "payant")
    .reduce((sum, t) => sum + (t.price ?? 0) * (t.seatsTaken ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Paiements"
        description="Ce que vous réglez à SIRA pour vos campagnes de promotion, et ce que vous encaissez vous-même auprès de vos stagiaires."
      />

      <Alert tone="warning" title="SIRA est un annuaire et un service de promotion">
        L&apos;inscription à une formation et son règlement se font chez vous, par vos moyens habituels. SIRA ne
        collecte aucun paiement de stagiaire, ne prend aucune commission sur vos ventes et ne vous doit donc aucun
        reversement. La place de marché avec reversements est une option ultérieure, non retenue à ce stade : elle
        supposerait un tiers de confiance, une garantie de remboursement et un traitement des litiges que la
        plateforme n&apos;assure pas encore.
      </Alert>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Réglé à SIRA" value={formatMoney(spent)} hint="Campagnes de promotion" />
        <Stat label="Transactions" value={formatInt(payments.length)} hint={`${paid.length} réglées`} />
        <Stat label="Échecs de paiement" value={formatInt(failed.length)} />
        <Stat
          label="Encaissé par vos soins"
          value={formatMoney(catalogueRevenue)}
          hint="Hors SIRA, d'après les places pourvues"
        />
      </div>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Vos règlements à SIRA</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Historique : campagnes de promotion et services facturés
          </p>
        </div>
        <div>
          {payments.length === 0 ? (
            <EmptyState
              icon={<IllustrationNoDocuments size={170} accent="var(--color-zone-trainer)" />}
              title="Aucun règlement"
              description="Vous n'avez encore réglé aucune campagne. Le référencement de vos formations reste gratuit."
            />
          ) : (
            <Table head={["Référence", "Objet", "Fournisseur", "Montant", "Statut", "Date"]} minWidth={860}>
              {payments.map((payment) => (
                <Tr key={payment.id}>
                  <Td className="font-mono text-[12.5px]">{payment.reference}</Td>
                  <Td className="max-w-[260px] text-[13px]">{payment.description}</Td>
                  <TdMuted>{PAYMENT_PROVIDER_LABEL[payment.provider]}</TdMuted>
                  <Td className="whitespace-nowrap font-medium tabular-nums">{formatMoney(payment.amount)}</Td>
                  <Td>
                    <Badge tone={PAYMENT_STATUS_TONE[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
                  </Td>
                  <TdMuted>{formatDate(payment.createdAt)}</TdMuted>
                </Tr>
              ))}
            </Table>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Ce que SIRA facture</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Aujourd&apos;hui</p>
          <ul className="mt-3 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {[
              { label: "Référencement d'une formation", price: "Gratuit" },
              { label: "Recommandation automatique aux candidats", price: "Gratuit" },
              { label: "Campagne de promotion ciblée", price: "À partir de 10 000 FCFA de budget" },
              { label: "Mise en avant dans le catalogue", price: "Incluse dans le budget de campagne" },
            ].map((row) => (
              <li key={row.label} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-[13px] text-[var(--color-text)]">{row.label}</span>
                <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{row.price}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Ce que SIRA ne facture pas</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Et ne collecte pas</p>
          <ul className="mt-3 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {[
              "Aucune commission sur le prix d'une formation.",
              "Aucun encaissement d'inscription de stagiaire.",
              "Aucun reversement, puisqu'aucune somme n'est collectée pour votre compte.",
              "Aucun frais de dossier réclamé à un candidat, sur aucun écran.",
            ].map((line) => (
              <li key={line} className="py-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
