/**
 * Back-office — partenaires institutionnels [T §21.5].
 *
 * Un partenariat n'est pas un statut d'affichage : il ouvre des droits
 * précis (import de flux, diffusion croisée, co-marquage) et s'éteint à
 * l'échéance de la convention.
 *
 * Direction épurée : les conventions forment une liste séparée par des
 * filets, et les tableaux sont posés à même la page.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import {
  Table,
  Td,
  TdMuted,
  Tr,
  VERIFICATION_TONE,
  formatInt,
  getAllJobsAdmin,
  orgName,
} from "@/components/admin-kit";
import { IconCheck, IconClose } from "@/components/icons";
import { Alert, Avatar, Badge, PageHeader, Stat, Tag, daysUntil, formatDate } from "@/components/ui";
import { getOrganizations, getTrainings } from "@/data/queries";
import { JOB_ORIGIN_LABEL, ORGANIZATION_TYPE_LABEL, VERIFICATION_STATUS_LABEL } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Partenaires | Administration SIRA",
};

interface Convention {
  organizationId: string;
  reference: string;
  object: string;
  signedAt: string;
  endsAt: string;
  rights: { publishJobs: boolean; importFeed: boolean; crossPromotion: boolean; coBranding: boolean };
}

/** Conventions de partenariat, simulées faute de backend contractuel. */
const CONVENTIONS: Convention[] = [
  {
    organizationId: "org_02",
    reference: "CONV-2026-004",
    object: "Diffusion prioritaire des offres bancaires et parrainage du programme jeunes diplômés",
    signedAt: "2026-02-10",
    endsAt: "2027-02-09",
    rights: { publishJobs: true, importFeed: true, crossPromotion: true, coBranding: false },
  },
  {
    organizationId: "org_03",
    reference: "CONV-2025-011",
    object: "Relais des missions humanitaires et volontariats dans les régions du Nord",
    signedAt: "2025-11-03",
    endsAt: "2026-11-02",
    rights: { publishJobs: true, importFeed: false, crossPromotion: true, coBranding: false },
  },
  {
    organizationId: "org_06",
    reference: "CONV-2025-002",
    object: "Passerelle formation-emploi pour les diplômés, orientation et stages conventionnés",
    signedAt: "2025-03-18",
    endsAt: "2028-03-17",
    rights: { publishJobs: true, importFeed: true, crossPromotion: true, coBranding: true },
  },
  {
    organizationId: "org_07",
    reference: "CONV-2026-001",
    object: "Référencement du catalogue numérique et campagnes de promotion",
    signedAt: "2026-01-20",
    endsAt: "2026-12-31",
    rights: { publishJobs: false, importFeed: false, crossPromotion: true, coBranding: false },
  },
];

const RIGHT_LABEL: Record<keyof Convention["rights"], string> = {
  publishJobs: "Publication d'offres",
  importFeed: "Import de flux",
  crossPromotion: "Diffusion croisée",
  coBranding: "Co-marquage",
};

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className={value ? "text-[var(--color-success)]" : "text-[var(--color-text-subtle)]"}
      title={value ? "Droit ouvert" : "Droit fermé"}
    >
      {value ? <IconCheck size={16} /> : <IconClose size={16} />}
    </span>
  );
}

export default function AdminPartnersPage() {
  const partners = getOrganizations().filter((o) => o.isPartner);
  const jobs = getAllJobsAdmin();
  const trainings = getTrainings();

  const conventionOf = (orgId: string) => CONVENTIONS.find((c) => c.organizationId === orgId);
  const expiringSoon = CONVENTIONS.filter((c) => daysUntil(c.endsAt) <= 120 && daysUntil(c.endsAt) >= 0);

  const partnerJobs = jobs.filter((j) => partners.some((p) => p.id === j.organizationId));
  const partnerTrainings = trainings.filter((t) => partners.some((p) => p.id === t.organizationId));

  return (
    <>
      <PageHeader
        title="Partenaires"
        description="Institutions, établissements et organismes liés à SIRA par une convention. Les droits de diffusion s'ouvrent et se ferment ici, convention par convention."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Partenaires actifs" value={formatInt(partners.length)} />
        <Stat label="Conventions en cours" value={formatInt(CONVENTIONS.length)} />
        <Stat
          label="Échéances sous 4 mois"
          value={formatInt(expiringSoon.length)}
          hint="À renégocier avant expiration"
        />
        <Stat
          label="Contenus apportés"
          value={formatInt(partnerJobs.length + partnerTrainings.length)}
          hint={`${partnerJobs.length} offres et ${partnerTrainings.length} formations`}
        />
      </div>

      {expiringSoon.length > 0 ? (
        <div className="mt-6">
          <Alert tone="warning" title="Conventions arrivant à échéance">
            {expiringSoon.map((c) => `${c.reference} (${formatDate(c.endsAt)})`).join(", ")}. Une convention expirée
            ferme les droits de diffusion associés du jour au lendemain : les offres importées cessent d&apos;être
            rafraîchies et sortent du fil à leur expiration propre.
          </Alert>
        </div>
      ) : null}

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Partenaires et conventions</h2>
        <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {partners.map((org) => {
            const convention = conventionOf(org.id);
            const remaining = convention ? daysUntil(convention.endsAt) : null;
            return (
              <li key={org.id} className="py-5">
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

                {convention ? (
                  <>
                    <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                      {convention.object}
                    </p>
                    <dl className="mt-2.5 space-y-1 text-[12.5px]">
                      <div className="flex gap-2">
                        <dt className="text-[var(--color-text-muted)]">Référence :</dt>
                        <dd className="font-mono">{convention.reference}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-[var(--color-text-muted)]">Signée le :</dt>
                        <dd>{formatDate(convention.signedAt)}</dd>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <dt className="text-[var(--color-text-muted)]">Échéance :</dt>
                        <dd>
                          {formatDate(convention.endsAt)}{" "}
                          <Badge tone={remaining !== null && remaining <= 120 ? "warning" : "neutral"}>
                            {remaining !== null && remaining >= 0 ? `${remaining} jours restants` : "Échue"}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {(Object.keys(convention.rights) as (keyof Convention["rights"])[])
                        .filter((right) => convention.rights[right])
                        .map((right) => (
                          <li key={right}>
                            <Badge tone="primary">{RIGHT_LABEL[right]}</Badge>
                          </li>
                        ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-3 text-[13px] text-[var(--color-text-muted)]">
                    Aucune convention enregistrée : le statut de partenaire est affiché mais n&apos;ouvre aucun droit
                    particulier.
                  </p>
                )}

                <AdminActions
                  className="mt-4"
                  subject={orgName(org)}
                  actions={[
                    { label: "Renouveler la convention", variant: "primary" },
                    { label: "Modifier les droits", variant: "outline" },
                    { label: "Retirer le partenariat", variant: "danger" },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Droits de diffusion par convention</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Une case fermée bloque la fonctionnalité correspondante, sans autre réglage
          </p>
        </div>
        <Table
          head={[
            "Partenaire",
            "Convention",
            ...(Object.keys(RIGHT_LABEL) as (keyof Convention["rights"])[]).map((r) => RIGHT_LABEL[r]),
            "Échéance",
          ]}
          minWidth={980}
        >
          {CONVENTIONS.map((convention) => {
            const org = getOrganizations().find((o) => o.id === convention.organizationId);
            return (
              <Tr key={convention.reference}>
                <Td className="font-medium">{orgName(org)}</Td>
                <Td className="font-mono text-[12.5px]">{convention.reference}</Td>
                {(Object.keys(RIGHT_LABEL) as (keyof Convention["rights"])[]).map((right) => (
                  <Td key={right}>
                    <YesNo value={convention.rights[right]} />
                  </Td>
                ))}
                <TdMuted>{formatDate(convention.endsAt)}</TdMuted>
              </Tr>
            );
          })}
        </Table>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Origine des offres</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            L&apos;origine reste affichée au candidat : une offre partenaire ou importée n&apos;est pas présentée
            comme native
          </p>
        </div>
        <dl className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {(["native", "partenaire", "importee"] as const).map((origin) => (
            <div key={origin} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-[13px] font-medium text-[var(--color-text)]">{JOB_ORIGIN_LABEL[origin]}</dt>
              <dd className="text-[12.5px] tabular-nums text-[var(--color-text-muted)]">
                {formatInt(jobs.filter((j) => j.origin === origin).length)} offre(s)
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3">
          <Tag>Une offre importée renvoie toujours vers sa source</Tag>
        </p>
      </section>
    </>
  );
}
