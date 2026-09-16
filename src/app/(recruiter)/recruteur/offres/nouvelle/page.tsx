/**
 * Publication d'une offre — [T §7.3].
 * Formulaire en étapes, prévisualisation en direct de la carte d'offre et
 * rappel de la politique de vérification en trois niveaux.
 *
 * Direction épurée : fond blanc, aucun aplat coloré, les rappels de
 * vérification sont rendus en encarts à filet gauche.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrganization } from "@/data/queries";
import { RECRUITER_ORG_ID } from "@/components/recruiter-data";
import { RecruiterJobForm } from "@/components/recruiter-job-form";
import { VerificationPolicyPanel } from "@/components/recruiter-ui";
import { Alert, Breadcrumb, PageHeader } from "@/components/ui";
import { IconShield } from "@/components/icons";
import { ORGANIZATION_CAPABILITIES, ORGANIZATION_TYPE_LABEL, VERIFICATION_STATUS_LABEL } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Publier une offre",
};

export default function NewJobPage() {
  const organization = getOrganization(RECRUITER_ORG_ID);
  if (!organization) notFound();

  const capabilities = ORGANIZATION_CAPABILITIES[organization.type];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Espace recruteur", href: "/recruteur" },
          { label: "Mes offres", href: "/recruteur/offres" },
          { label: "Publier une offre" },
        ]}
      />

      <PageHeader
        title="Publier une offre"
        description="Dix-huit champs, cinq étapes. Vous pouvez enregistrer un brouillon à tout moment et reprendre plus tard."
      />

      <Alert
        tone={organization.verificationStatus === "verifie" ? "success" : "warning"}
        icon={<IconShield size={15} />}
        title={`Organisation ${VERIFICATION_STATUS_LABEL[organization.verificationStatus].toLowerCase()}`}
      >
        <p>
          {organization.verificationStatus === "verifie"
            ? "Vos justificatifs ont été contrôlés : vos offres partent en ligne dès la publication, avec le badge vérifié, et restent soumises à la modération a posteriori."
            : "Tant que vos justificatifs ne sont pas contrôlés, la publication passe par la validation d'un administrateur, ou reste impossible."}
        </p>
        <p className="mt-1">
          Type d&apos;organisation : {ORGANIZATION_TYPE_LABEL[organization.type]}. Pièces attendues :{" "}
          {capabilities.documents}.
        </p>
      </Alert>

      <div className="mt-8 border-t border-[var(--color-border)] pt-8">
        <RecruiterJobForm
          mode="create"
          organization={organization}
          verificationStatus={organization.verificationStatus}
          policy={<VerificationPolicyPanel status={organization.verificationStatus} />}
        />
      </div>
    </>
  );
}
