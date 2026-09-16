/**
 * Back-office — organismes de formation [T §21.3].
 *
 * Même politique de vérification que pour les recruteurs, avec des pièces
 * propres au type d'organisation : agrément, arrêté d'ouverture, statuts.
 *
 * Direction épurée : les organismes à vérifier forment une liste séparée par
 * des filets, et les tableaux sont posés à même la page.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import {
  BarChart,
  Table,
  Td,
  TdMuted,
  Tr,
  VERIFICATION_TONE,
  formatInt,
  formatPercent,
  orgName,
} from "@/components/admin-kit";
import { Alert, Avatar, Badge, PageHeader, Stat, Tag, formatDate } from "@/components/ui";
import { getCampaigns, getOrganizations, getTrainings } from "@/data/queries";
import {
  ORGANIZATION_CAPABILITIES,
  ORGANIZATION_TYPE_LABEL,
  VERIFICATION_STATUS_LABEL,
  formatMoney,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Formateurs | Administration SIRA",
};

export default function AdminTrainersPage() {
  const trainings = getTrainings();
  const campaigns = getCampaigns();
  const trainers = getOrganizations().filter((o) => ORGANIZATION_CAPABILITIES[o.type].trainings);

  const rows = trainers
    .map((org) => {
      const own = trainings.filter((t) => t.organizationId === org.id);
      const ownCampaigns = campaigns.filter((c) => c.organizationId === org.id);
      const seats = own.reduce((sum, t) => sum + (t.seats ?? 0), 0);
      const taken = own.reduce((sum, t) => sum + (t.seatsTaken ?? 0), 0);
      return { org, trainings: own, campaigns: ownCampaigns, seats, taken };
    })
    .sort((a, b) => b.trainings.length - a.trainings.length);

  const active = rows.filter((r) => r.trainings.length > 0);
  const pending = trainers.filter(
    (o) => o.verificationStatus === "en_verification" || o.verificationStatus === "non_verifie",
  );

  return (
    <>
      <PageHeader
        title="Formateurs"
        description="Organismes autorisés à référencer des formations et à acheter des campagnes de promotion. L'espace formateur reste derrière un drapeau de fonctionnalité jusqu'au lot 7."
      />

      <Alert tone="warning" title="Espace formateur derrière un drapeau de fonctionnalité">
        Les organismes listés ici peuvent déjà être vérifiés et voir leur catalogue référencé. L&apos;accès à
        l&apos;espace formateur en libre-service n&apos;est pas encore ouvert au public : il sert de démonstration
        jusqu&apos;à l&apos;ouverture du lot 7.
      </Alert>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Organismes habilités" value={formatInt(trainers.length)} />
        <Stat label="Organismes actifs" value={formatInt(active.length)} hint="Au moins une formation publiée" />
        <Stat label="Formations référencées" value={formatInt(trainings.length)} />
        <Stat
          label="Campagnes achetées"
          value={formatInt(campaigns.length)}
          hint={formatMoney(campaigns.reduce((sum, c) => sum + c.budget, 0))}
        />
      </div>

      {pending.length > 0 ? (
        <section className="mt-10 border-t border-[var(--color-border)] pt-6">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
            Organismes à vérifier ({pending.length})
          </h2>
          <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {pending.map((org) => (
              <li key={org.id} className="py-4">
                <div className="flex items-start gap-3">
                  <Avatar initials={org.logoInitials} color={org.logoColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[var(--color-text)]">{orgName(org)}</p>
                    <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                      {ORGANIZATION_TYPE_LABEL[org.type]} · {org.city}
                    </p>
                  </div>
                  <Badge tone={VERIFICATION_TONE[org.verificationStatus]}>
                    {VERIFICATION_STATUS_LABEL[org.verificationStatus]}
                  </Badge>
                </div>
                <p className="mt-2 text-[12.5px] text-[var(--color-text-muted)]">
                  Pièces attendues : {ORGANIZATION_CAPABILITIES[org.type].documents}
                </p>
                <AdminActions
                  className="mt-3"
                  subject={orgName(org)}
                  actions={[
                    { label: "Vérifier", variant: "primary" },
                    { label: "Refuser", variant: "outline" },
                    { label: "Suspendre", variant: "danger" },
                  ]}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Organismes de formation</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Catalogue, remplissage et campagnes par organisme
          </p>
        </div>
        <Table
          head={["Organisme", "Type", "Vérification", "Pièces", "Formations", "Remplissage", "Campagnes", "Actions"]}
          minWidth={1160}
        >
          {rows.map(({ org, trainings: own, campaigns: ownCampaigns, seats, taken }) => (
            <Tr key={org.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar initials={org.logoInitials} color={org.logoColor} size={30} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{orgName(org)}</p>
                    <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                      {org.city} · depuis {formatDate(org.createdAt)}
                    </p>
                  </div>
                </div>
              </Td>
              <TdMuted>{ORGANIZATION_TYPE_LABEL[org.type]}</TdMuted>
              <Td>
                <Badge tone={VERIFICATION_TONE[org.verificationStatus]}>
                  {VERIFICATION_STATUS_LABEL[org.verificationStatus]}
                </Badge>
              </Td>
              <Td>
                <Tag>{ORGANIZATION_CAPABILITIES[org.type].documents}</Tag>
              </Td>
              <TdMuted>{own.length}</TdMuted>
              <TdMuted>
                {seats === 0 ? "—" : `${formatPercent((taken / seats) * 100, 0)} (${taken}/${seats})`}
              </TdMuted>
              <TdMuted>{ownCampaigns.length}</TdMuted>
              <Td>
                <AdminActions
                  subject={orgName(org)}
                  actions={[
                    { label: "Voir le catalogue", variant: "outline" },
                    { label: "Suspendre", variant: "danger" },
                  ]}
                />
              </Td>
            </Tr>
          ))}
        </Table>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Formations par organisme</h2>
          <div className="mt-4">
            <BarChart items={rows.map((r) => ({ label: orgName(r.org), value: r.trainings.length }))} />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Places ouvertes par organisme</h2>
          <div className="mt-4">
            <BarChart items={rows.map((r) => ({ label: orgName(r.org), value: r.seats }))} tone="accent" />
          </div>
        </div>
      </section>
    </>
  );
}
