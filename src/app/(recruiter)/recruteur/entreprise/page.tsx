/**
 * Profil de l'organisation — [T §7.2].
 * Tous les champs déclaratifs, l'état de vérification avec les justificatifs
 * déposés et le badge obtenu, et les membres de l'organisation.
 *
 * Direction épurée : fond blanc, aucune ombre, des filets de 1 pixel pour
 * séparer les sections et les lignes de liste.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrganization } from "@/data/queries";
import {
  ORG_MEMBERS,
  RECRUITER_EMAIL,
  RECRUITER_NAME,
  RECRUITER_ORG_ID,
  RECRUITER_PHONE,
  VERIFICATION_DOCUMENTS,
  getRecruiterPipeline,
} from "@/components/recruiter-data";
import { InviteMemberPanel, MemberRoleControl, SaveButton } from "@/components/recruiter-settings";
import { VerificationChip, VerificationPolicyPanel } from "@/components/recruiter-ui";
import {
  Alert,
  Avatar,
  Badge,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  cx,
  formatDate,
} from "@/components/ui";
import { IconBuilding, IconCheckCircle, IconFile, IconShield } from "@/components/icons";
import { IllustrationVerified } from "@/components/illustrations";
import {
  CITIES,
  DOMAINS,
  MEMBERSHIP_ROLE_LABEL,
  ORGANIZATION_CAPABILITIES,
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABEL,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Mon entreprise",
};

const ORG_SIZES = [
  "1 à 9 salariés",
  "10 à 49 salariés",
  "50 à 249 salariés",
  "250 à 500 salariés",
  "Plus de 500 salariés",
];

const DOC_STATUS = {
  valide: { label: "Validé", tone: "success" as const },
  en_controle: { label: "En contrôle", tone: "warning" as const },
  refuse: { label: "Refusé", tone: "danger" as const },
};

const H2 = "text-[17px] font-semibold text-[var(--color-text)]";
const SUB = "mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]";

export default function OrganizationPage() {
  const organization = getOrganization(RECRUITER_ORG_ID);
  if (!organization) notFound();

  const capabilities = ORGANIZATION_CAPABILITIES[organization.type];
  const pipeline = getRecruiterPipeline();

  return (
    <>
      <PageHeader
        title="Mon entreprise"
        description="La fiche que voient les candidats, et le dossier de vérification qui conditionne vos publications."
      />

      {/* ---- En-tête, délimité par deux filets ---- */}
      <div className="mb-9 flex flex-wrap items-center gap-4 border-y border-[var(--color-border)] py-5">
        <Avatar initials={organization.logoInitials} color={organization.logoColor} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
              {organization.tradeName ?? organization.legalName}
            </h2>
            <VerificationChip status={organization.verificationStatus} />
            {organization.isPartner ? <Badge tone="primary">Partenaire SIRA</Badge> : null}
          </div>
          <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">
            {organization.legalName} · {ORGANIZATION_TYPE_LABEL[organization.type]} · {organization.city},{" "}
            {organization.country}
          </p>
          <p className="mt-1 text-[12px] text-[var(--color-text-subtle)]">
            Inscrite le {formatDate(organization.createdAt)} · {pipeline.length} dossiers reçus
          </p>
        </div>
        <div className="shrink-0">
          <SaveButton label="Changer le logo" message="Nouveau logo envoyé, contrôlé sous 24 h." />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {/* ---- Identité ---- */}
          <section aria-labelledby="identite">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="identite" className={H2}>
                  Identité de l&apos;organisation
                </h2>
                <p className={SUB}>Ces informations apparaissent sur chacune de vos offres.</p>
              </div>
              <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
                <IconBuilding size={18} />
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nom légal" required htmlFor="org-legal">
                <Input id="org-legal" defaultValue={organization.legalName} />
              </Field>
              <Field label="Nom commercial" htmlFor="org-trade" hint="Affiché en priorité sur les offres.">
                <Input id="org-trade" defaultValue={organization.tradeName ?? ""} />
              </Field>
              <Field label="Type d'organisation" required htmlFor="org-type">
                <Select id="org-type" defaultValue={organization.type}>
                  {ORGANIZATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ORGANIZATION_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Secteur d'activité" required htmlFor="org-sector">
                <Select id="org-sector" defaultValue={organization.sector}>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Taille" htmlFor="org-size">
                <Select id="org-size" defaultValue={organization.size ?? ORG_SIZES[0]}>
                  {ORG_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Pays" htmlFor="org-country">
                <Input id="org-country" defaultValue={organization.country} />
              </Field>
              <Field label="Ville" required htmlFor="org-city">
                <Select id="org-city" defaultValue={organization.city}>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Adresse" htmlFor="org-address">
                <Input id="org-address" defaultValue={organization.address ?? ""} />
              </Field>
              <Field label="Site web" htmlFor="org-website">
                <Input id="org-website" type="url" defaultValue={organization.website ?? ""} />
              </Field>
              <Field label="Page LinkedIn" htmlFor="org-linkedin" hint="Facultatif.">
                <Input id="org-linkedin" type="url" placeholder="https://linkedin.com/company/…" />
              </Field>
              <Field label="Page Facebook" htmlFor="org-facebook" hint="Facultatif.">
                <Input id="org-facebook" type="url" placeholder="https://facebook.com/…" />
              </Field>
              <Field label="Compte X" htmlFor="org-x" hint="Facultatif.">
                <Input id="org-x" type="url" placeholder="https://x.com/…" />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  label="Description"
                  htmlFor="org-description"
                  hint="Ce que fait l'organisation, en quelques lignes. Visible sur la page entreprise."
                >
                  <Textarea id="org-description" rows={4} defaultValue={organization.description} />
                </Field>
              </div>
            </div>
          </section>

          {/* ---- Responsable et contacts ---- */}
          <section aria-labelledby="responsable" className="mt-10 border-t border-[var(--color-border)] pt-8">
            <h2 id="responsable" className={H2}>
              Responsable et contacts
            </h2>
            <p className={SUB}>Le responsable engage l&apos;organisation sur la plateforme.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Responsable" required htmlFor="org-owner">
                <Input id="org-owner" defaultValue={RECRUITER_NAME} />
              </Field>
              <Field label="Fonction" htmlFor="org-owner-role">
                <Input id="org-owner-role" defaultValue="Directeur des ressources humaines" />
              </Field>
              <Field label="E-mail professionnel" required htmlFor="org-email">
                <Input id="org-email" type="email" defaultValue={RECRUITER_EMAIL} />
              </Field>
              <Field label="Téléphone" required htmlFor="org-phone">
                <Input id="org-phone" type="tel" defaultValue={RECRUITER_PHONE} />
              </Field>
              <Field
                label="Numéro WhatsApp"
                htmlFor="org-whatsapp"
                hint="Utilisé pour les alertes de candidature. Consentement retirable à tout moment."
              >
                <Input id="org-whatsapp" type="tel" defaultValue="+226 70 55 66 77" />
              </Field>
              <div className="flex items-end">
                <SaveButton label="Enregistrer la fiche" message="Fiche entreprise mise à jour." />
              </div>
            </div>
          </section>

          {/* ---- Membres ---- */}
          <section aria-labelledby="membres" className="mt-10 border-t border-[var(--color-border)] pt-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="membres" className={H2}>
                  Membres de l&apos;organisation
                </h2>
                <p className={SUB}>{ORG_MEMBERS.length} membres sur les 10 inclus dans le plan Pro.</p>
              </div>
              <div className="shrink-0">
                <InviteMemberPanel />
              </div>
            </div>

            <ul className="mt-5 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {ORG_MEMBERS.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <Avatar initials={member.initials} color={member.color} size={34} rounded="full" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium text-[var(--color-text)]">{member.name}</p>
                      <Badge tone={member.role === "proprietaire" ? "primary" : "neutral"}>
                        {MEMBERSHIP_ROLE_LABEL[member.role]}
                      </Badge>
                    </div>
                    <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">
                      {member.jobTitle} · {member.email}
                    </p>
                    <p className="text-[11.5px] text-[var(--color-text-subtle)]">
                      Dernière activité : {formatDate(member.lastSeenAt)}
                    </p>
                  </div>
                  {member.role === "proprietaire" ? (
                    <span className="text-[12px] text-[var(--color-text-subtle)]">Rôle non modifiable</span>
                  ) : (
                    <MemberRoleControl name={member.name} role={member.role} />
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Les notes internes, la shortlist et l&apos;historique des candidatures sont partagés entre tous les
              membres. Un lecteur consulte sans pouvoir changer l&apos;état d&apos;une candidature.
            </p>
          </section>
        </div>

        {/* ---- Colonne vérification ---- */}
        <aside className="min-w-0">
          <section aria-labelledby="verification">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="verification" className="text-[14px] font-semibold text-[var(--color-text)]">
                  État de vérification
                </h2>
                <p className={SUB}>Contrôlé par la modération SIRA.</p>
              </div>
              <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
                <IconShield size={18} />
              </span>
            </div>

            <div className="mt-5 hidden justify-center text-[var(--color-text-subtle)] sm:flex">
              <IllustrationVerified size={168} accent="var(--color-zone-recruiter)" />
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <VerificationChip status={organization.verificationStatus} />
                {organization.verificationStatus === "verifie" ? (
                  <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--color-success)]">
                    <IconCheckCircle size={14} />
                    Badge vérifié actif sur vos offres
                  </span>
                ) : null}
              </div>

              <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {organization.verificationStatus === "verifie"
                  ? "Vos justificatifs légaux ont été contrôlés. Vos offres sont publiées immédiatement et restent soumises à la modération a posteriori et au signalement."
                  : "Déposez vos justificatifs pour obtenir le badge vérifié et publier sans validation préalable."}
              </p>

              <div>
                <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Justificatifs déposés</h3>
                <ul className="mt-2 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {VERIFICATION_DOCUMENTS.map((doc) => (
                    <li key={doc.fileName} className="flex flex-wrap items-center gap-2.5 py-2.5">
                      <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
                        <IconFile size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-[var(--color-text)]">{doc.label}</p>
                        <p className="truncate text-[11.5px] text-[var(--color-text-subtle)]">
                          {doc.fileName} · déposé le {formatDate(doc.submittedAt)}
                        </p>
                      </div>
                      <Badge tone={DOC_STATUS[doc.status].tone}>{DOC_STATUS[doc.status].label}</Badge>
                    </li>
                  ))}
                </ul>
              </div>

              <Alert tone="neutral">
                Pièces attendues pour une organisation de type «{" "}
                {ORGANIZATION_TYPE_LABEL[organization.type].toLowerCase()} » : {capabilities.documents}.
              </Alert>

              <SaveButton label="Déposer un justificatif" message="Fichier transmis à la modération." />
            </div>
          </section>

          <div className="mt-8">
            <VerificationPolicyPanel status={organization.verificationStatus} />
          </div>

          <section aria-labelledby="capacites" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 id="capacites" className="text-[14px] font-semibold text-[var(--color-text)]">
              Ce que votre type autorise
            </h2>
            <ul className="mt-3 space-y-1.5 text-[13px]">
              {[
                ["Publier des offres d'emploi", capabilities.jobs],
                ["Publier des formations", capabilities.trainings],
                ["Lancer des campagnes de promotion", capabilities.campaigns],
              ].map(([label, allowed]) => (
                <li key={String(label)} className="flex items-center gap-2">
                  <span
                    className={cx(
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      allowed
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : "bg-[var(--color-surface-3)] text-[var(--color-text-subtle)]",
                    )}
                    aria-hidden
                  >
                    {allowed ? "✓" : "—"}
                  </span>
                  <span className={allowed ? "text-[var(--color-text)]" : "text-[var(--color-text-subtle)]"}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
