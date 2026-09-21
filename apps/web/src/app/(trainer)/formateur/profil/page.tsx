/**
 * Espace formateur — profil de l'organisme [T §3.4].
 *
 * C'est la fiche que voit un candidat avant de s'inscrire : elle porte la
 * confiance, donc le niveau de vérification et les coordonnées y figurent
 * en premier.
 *
 * Direction épurée : en-tête sans carte, listes de définition séparées par
 * des filets, et sections délimitées par un filet de 1 pixel.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { AdminActions } from "@/components/admin-actions";
import { VERIFICATION_TONE, formatInt, orgName } from "@/components/admin-kit";
import { IconBuilding, IconCheckCircle, IconMapPin } from "@/components/icons";
import { Alert, Avatar, Badge, DataList, PageHeader, Stat, Tag, formatDate } from "@/components/ui";
import {
  ORGANIZATION_CAPABILITIES,
  ORGANIZATION_TYPE_LABEL,
  VERIFICATION_STATUS_LABEL,
} from "@/lib/enums";
import { getTrainerOrganization, getTrainerTrainings, getTrainerUser } from "../../trainer-context";

export const metadata: Metadata = {
  title: "Profil | Espace formateur SIRA",
};

export default function TrainerProfilePage() {
  const organization = getTrainerOrganization();
  const user = getTrainerUser();
  const trainings = getTrainerTrainings();

  if (!organization || !user) {
    return (
      <Alert tone="danger" title="Organisme introuvable">
        Le compte de démonstration n&apos;est rattaché à aucun organisme.
      </Alert>
    );
  }

  const capabilities = ORGANIZATION_CAPABILITIES[organization.type];
  const categories = Array.from(new Set(trainings.map((t) => t.category)));
  const skills = Array.from(new Set(trainings.flatMap((t) => t.skillsCovered)));

  return (
    <>
      <PageHeader
        title="Profil de l'organisme"
        description="La fiche publique de votre centre de formation, telle qu'elle apparaît aux candidats."
        action={
          <AdminActions
            size="md"
            subject="la fiche de l'organisme"
            actions={[{ label: "Modifier la fiche", variant: "outline" }]}
          />
        }
      />

      <section className="border-y border-[var(--color-border)] py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar initials={organization.logoInitials} color={organization.logoColor} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-semibold text-[var(--color-text)]">{orgName(organization)}</h2>
              <Badge tone={VERIFICATION_TONE[organization.verificationStatus]} icon={<IconCheckCircle size={13} />}>
                {VERIFICATION_STATUS_LABEL[organization.verificationStatus]}
              </Badge>
              {organization.isPartner ? <Badge tone="accent">Partenaire</Badge> : null}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--color-text-muted)]">
              <span className="inline-flex items-center gap-1">
                <IconBuilding size={14} />
                {ORGANIZATION_TYPE_LABEL[organization.type]}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconMapPin size={14} />
                {organization.city}, {organization.country}
              </span>
            </p>
            <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-[var(--color-text)]">
              {organization.description}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Formations publiées" value={formatInt(trainings.length)} />
        <Stat label="Catégories couvertes" value={formatInt(categories.length)} />
        <Stat label="Compétences enseignées" value={formatInt(skills.length)} />
      </div>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Identité et coordonnées</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Visibles sur la fiche publique</p>
          <div className="mt-3 border-t border-[var(--color-border)]">
            <DataList
              rows={[
                { label: "Raison sociale", value: organization.legalName },
                { label: "Nom commercial", value: organization.tradeName ?? "Identique à la raison sociale" },
                { label: "Type d'organisation", value: ORGANIZATION_TYPE_LABEL[organization.type] },
                { label: "Secteur", value: organization.sector },
                { label: "Taille", value: organization.size ?? "Non précisée" },
                { label: "Ville", value: `${organization.city}, ${organization.country}` },
                { label: "Adresse", value: organization.address ?? "Non précisée" },
                {
                  label: "Site web",
                  value: organization.website ? (
                    <Link href={organization.website} className="text-[var(--color-primary)] hover:underline">
                      {organization.website}
                    </Link>
                  ) : (
                    "Non précisé"
                  ),
                },
                { label: "Inscrit depuis", value: formatDate(organization.createdAt) },
              ]}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Responsable du compte</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Contact de référence pour SIRA</p>
            <div className="mt-3 border-t border-[var(--color-border)]">
              <DataList
                rows={[
                  { label: "Nom", value: `${user.firstName} ${user.lastName}` },
                  { label: "Adresse e-mail", value: user.email },
                  { label: "Téléphone", value: user.phone ?? "Non renseigné" },
                  {
                    label: "E-mail vérifié",
                    value: user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Non vérifié",
                  },
                  {
                    label: "Double authentification",
                    value: (
                      <Badge tone={user.twoFactorEnabled ? "success" : "warning"}>
                        {user.twoFactorEnabled ? "Activée" : "Inactive"}
                      </Badge>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Vérification et droits</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Ce que votre niveau de vérification vous ouvre
            </p>
            <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-1">
              <DataList
                rows={[
                  {
                    label: "Niveau",
                    value: (
                      <Badge tone={VERIFICATION_TONE[organization.verificationStatus]}>
                        {VERIFICATION_STATUS_LABEL[organization.verificationStatus]}
                      </Badge>
                    ),
                  },
                  { label: "Pièces attendues", value: capabilities.documents },
                  { label: "Publier des offres d'emploi", value: capabilities.jobs ? "Autorisé" : "Non autorisé" },
                  { label: "Référencer des formations", value: capabilities.trainings ? "Autorisé" : "Non autorisé" },
                  { label: "Acheter des campagnes", value: capabilities.campaigns ? "Autorisé" : "Non autorisé" },
                ]}
              />
              <Alert tone="success" title="Organisme vérifié">
                Vos fiches paraissent immédiatement au catalogue, avec le badge de vérification. Elles restent
                soumises à une modération a posteriori en cas de signalement.
              </Alert>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Domaines et compétences enseignés</h2>
        <div className="mt-4">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Catégories</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <Badge key={category} tone="primary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Compétences couvertes</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))}
              </div>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Ces compétences déclenchent la recommandation automatique : quand elles manquent au profil d&apos;un
              candidat, votre formation lui est proposée sans que vous ayez à payer quoi que ce soit.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
