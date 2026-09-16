/**
 * Back-office — recruteurs et vérification des organisations [T §21.2].
 *
 * L'écran instruit la politique de vérification à trois niveaux : le niveau
 * attribué détermine ce que l'organisation peut publier et selon quel
 * contrôle, a priori ou a posteriori.
 *
 * Direction épurée : les dossiers à instruire sont une liste séparée par des
 * filets, et non une pile de cartes.
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
import { Alert, Avatar, Badge, PageHeader, Stat, Tag, formatDate, relativeDays } from "@/components/ui";
import { getOrganizations } from "@/data/queries";
import {
  ORGANIZATION_CAPABILITIES,
  ORGANIZATION_TYPE_LABEL,
  VERIFICATION_STATUS_LABEL,
  type VerificationStatus,
} from "@/lib/enums";
import type { Organization } from "@/lib/types";

export const metadata: Metadata = {
  title: "Recruteurs | Administration SIRA",
};

/** Les trois niveaux de la politique de vérification, et leurs conséquences. */
const LEVELS: { status: VerificationStatus; title: string; rule: string }[] = [
  {
    status: "non_verifie",
    title: "Non vérifié",
    rule: "L'organisation rédige, mais ne publie pas. Ses offres restent des brouillons tant qu'aucun justificatif n'est contrôlé.",
  },
  {
    status: "en_verification",
    title: "Vérification légère",
    rule: "Les justificatifs sont déposés et en cours de contrôle. Chaque offre part en file de validation et n'est publiée qu'après accord d'un administrateur.",
  },
  {
    status: "verifie",
    title: "Vérifié",
    rule: "Justificatifs contrôlés. Publication immédiate, badge « Vérifié » sur les offres, et modération a posteriori en cas de signalement.",
  },
];

/**
 * État des justificatifs, déduit du niveau de vérification : la démonstration
 * n'a pas de coffre de documents, mais la règle d'affichage est celle du
 * produit — un dossier vérifié a forcément des pièces contrôlées.
 */
function documentState(org: Organization): { label: string; tone: "success" | "warning" | "neutral" | "danger" } {
  switch (org.verificationStatus) {
    case "verifie":
      return { label: "Déposés et contrôlés", tone: "success" };
    case "en_verification":
      return { label: "Déposés, contrôle en cours", tone: "warning" };
    case "refuse":
      return { label: "Refusés, pièces non conformes", tone: "danger" };
    case "suspendu":
      return { label: "Dossier gelé", tone: "danger" };
    default:
      return { label: "Aucun justificatif déposé", tone: "neutral" };
  }
}

export default function AdminRecruitersPage() {
  const jobs = getAllJobsAdmin();
  const recruiting = getOrganizations().filter((o) => ORGANIZATION_CAPABILITIES[o.type].jobs);

  const pendingFirst = [...recruiting].sort((a, b) => {
    const rank = (s: VerificationStatus) =>
      s === "en_verification" ? 0 : s === "non_verifie" ? 1 : s === "suspendu" ? 2 : s === "refuse" ? 3 : 4;
    return rank(a.verificationStatus) - rank(b.verificationStatus) || a.legalName.localeCompare(b.legalName);
  });

  const pending = recruiting.filter(
    (o) => o.verificationStatus === "en_verification" || o.verificationStatus === "non_verifie",
  );
  const verified = recruiting.filter((o) => o.verificationStatus === "verifie");
  const jobCount = (orgId: string) => jobs.filter((j) => j.organizationId === orgId).length;

  return (
    <>
      <PageHeader
        title="Recruteurs"
        description="Organisations autorisées à publier des offres. Le niveau de vérification décide du régime de publication : brouillon seul, contrôle a priori ou publication immédiate."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Organisations recruteuses" value={formatInt(recruiting.length)} />
        <Stat label="Dossiers en attente" value={formatInt(pending.length)} hint="À instruire en priorité" />
        <Stat
          label="Organisations vérifiées"
          value={formatInt(verified.length)}
          hint="Publication immédiate avec badge"
        />
      </div>

      {/* ---- Politique de vérification ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
          Politique de vérification à trois niveaux
        </h2>
        <dl className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {LEVELS.map((level) => (
            <div key={level.status} className="grid gap-1 py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
              <dt>
                <Badge tone={VERIFICATION_TONE[level.status]}>{level.title}</Badge>
              </dt>
              <dd className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">{level.rule}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- File des dossiers en attente ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
          Dossiers à instruire ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="mt-4">
            <Alert tone="success" title="File à jour">
              Aucun dossier de vérification n&apos;attend d&apos;instruction.
            </Alert>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {pending.map((org) => {
              const docs = documentState(org);
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

                  <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                    {org.description}
                  </p>

                  <dl className="mt-2.5 space-y-1 text-[12.5px]">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-[var(--color-text-muted)]">Pièces attendues :</dt>
                      <dd className="text-[var(--color-text)]">{ORGANIZATION_CAPABILITIES[org.type].documents}</dd>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <dt className="text-[var(--color-text-muted)]">État du dossier :</dt>
                      <dd>
                        <Badge tone={docs.tone}>{docs.label}</Badge>
                      </dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-[var(--color-text-muted)]">Compte créé :</dt>
                      <dd className="text-[var(--color-text)]">
                        {formatDate(org.createdAt)} ({relativeDays(org.createdAt)})
                      </dd>
                    </div>
                  </dl>

                  <AdminActions
                    className="mt-3.5"
                    subject={orgName(org)}
                    actions={[
                      { label: "Vérifier", variant: "primary" },
                      { label: "Refuser", variant: "outline" },
                      { label: "Suspendre", variant: "danger" },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- Toutes les organisations recruteuses ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
            Toutes les organisations recruteuses
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Les dossiers en attente sont remontés en tête
          </p>
        </div>
        <Table
          head={["Organisation", "Type", "Ville", "Vérification", "Justificatifs", "Offres", "Actions"]}
          minWidth={1000}
        >
          {pendingFirst.map((org) => {
            const docs = documentState(org);
            return (
              <Tr key={org.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar initials={org.logoInitials} color={org.logoColor} size={30} />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium">{orgName(org)}</p>
                      <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{org.legalName}</p>
                    </div>
                  </div>
                </Td>
                <TdMuted>{ORGANIZATION_TYPE_LABEL[org.type]}</TdMuted>
                <TdMuted>{org.city}</TdMuted>
                <Td>
                  <Badge tone={VERIFICATION_TONE[org.verificationStatus]}>
                    {VERIFICATION_STATUS_LABEL[org.verificationStatus]}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={docs.tone}>{docs.label}</Badge>
                  <span className="mt-1 block">
                    <Tag>{ORGANIZATION_CAPABILITIES[org.type].documents}</Tag>
                  </span>
                </Td>
                <TdMuted>{jobCount(org.id)}</TdMuted>
                <Td>
                  <AdminActions
                    subject={orgName(org)}
                    actions={[
                      { label: "Vérifier", variant: "primary" },
                      { label: "Refuser", variant: "outline" },
                      { label: "Suspendre", variant: "danger" },
                    ]}
                  />
                </Td>
              </Tr>
            );
          })}
        </Table>
      </section>
    </>
  );
}
