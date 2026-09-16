/**
 * Espace formateur — paramètres [T §3.4].
 *
 * Compte, équipe, notifications et fin de relation. Les préférences de
 * notification affichent leur base juridique : certaines se désactivent,
 * d'autres non, et le formateur doit savoir laquelle est laquelle.
 *
 * Direction épurée : réglages posés à même la page, sections séparées par un
 * filet de 1 pixel, et la fermeture de compte signalée par un filet rouge.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import { Table, Td, Tr } from "@/components/admin-kit";
import { Alert, Badge, Checkbox, DataList, PageHeader, formatDate } from "@/components/ui";
import {
  CONSENT_BASIS_LABEL,
  CONSENT_MATRIX,
  CONSENT_TYPES,
  CONSENT_TYPE_LABEL,
  MEMBERSHIP_ROLE_LABEL,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABEL,
} from "@/lib/enums";
import { getTrainerOrganization, getTrainerUser } from "../../trainer-context";

export const metadata: Metadata = {
  title: "Paramètres | Espace formateur SIRA",
};

/** Membres du compte organisme, simulés. */
const TEAM = [
  { name: "Fatoumata Ouédraogo", email: "contact@numerika.bf", role: "proprietaire" as const, jobTitle: "Directrice" },
  { name: "Salif Kaboré", email: "pedagogie@numerika.bf", role: "recruteur" as const, jobTitle: "Responsable pédagogique" },
  { name: "Aminata Zongo", email: "compta@numerika.bf", role: "lecteur" as const, jobTitle: "Comptabilité" },
];

export default function TrainerSettingsPage() {
  const organization = getTrainerOrganization();
  const user = getTrainerUser();

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Compte, équipe, notifications et conditions d'utilisation de l'espace formateur."
      />

      <Alert tone="warning" title="Espace derrière un drapeau de fonctionnalité">
        L&apos;espace formateur n&apos;est pas encore ouvert en libre-service. Les réglages ci-dessous sont
        fonctionnels dans la démonstration mais ne sont pas enregistrés : aucun backend n&apos;est branché.
      </Alert>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Compte</h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                Identifiants du responsable de l&apos;organisme
              </p>
            </div>
            <AdminActions subject="le compte" actions={[{ label: "Modifier", variant: "outline" }]} />
          </div>
          <div className="mt-3 border-t border-[var(--color-border)]">
            <DataList
              rows={[
                { label: "Organisme", value: organization?.legalName ?? "—" },
                { label: "Responsable", value: user ? `${user.firstName} ${user.lastName}` : "—" },
                { label: "Adresse e-mail", value: user?.email ?? "—" },
                { label: "Téléphone", value: user?.phone ?? "Non renseigné" },
                { label: "Langue de l'interface", value: "Français" },
                { label: "Fuseau horaire", value: "UTC (heure du Burkina Faso)" },
                { label: "Compte créé le", value: user ? formatDate(user.createdAt) : "—" },
              ]}
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Sécurité</h2>
              <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                Protection de l&apos;accès à l&apos;espace
              </p>
            </div>
            <AdminActions
              subject="les réglages de sécurité"
              actions={[{ label: "Changer le mot de passe", variant: "outline" }]}
            />
          </div>
          <div className="mt-4 space-y-3">
            <Checkbox
              label="Double authentification par code SMS"
              description="Recommandée : votre compte porte les fiches publiques de l'organisme."
              defaultChecked={user?.twoFactorEnabled ?? false}
            />
            <Checkbox
              label="Alerte à chaque nouvelle connexion"
              description="Un e-mail est envoyé dès qu'un appareil inconnu se connecte."
              defaultChecked
            />
            <Checkbox
              label="Déconnexion automatique après 30 minutes d'inactivité"
              defaultChecked={false}
            />
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Notifications</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Préférences par famille et par canal. Une notification nécessaire au service ne se désactive pas : elle
            vous informe d&apos;un fait, pas d&apos;une offre.
          </p>
        </div>
        <Table
            head={["Famille", ...NOTIFICATION_CHANNELS.map((c) => NOTIFICATION_CHANNEL_LABEL[c])]}
            minWidth={720}
          >
            {CONSENT_TYPES.map((consentType) => (
              <Tr key={consentType}>
                <Td className="font-medium">{CONSENT_TYPE_LABEL[consentType]}</Td>
                {NOTIFICATION_CHANNELS.map((channel) => {
                  const basis = CONSENT_MATRIX[consentType][channel];
                  const locked = basis === "service";
                  return (
                    <Td key={channel}>
                      <Checkbox
                        label={CONSENT_BASIS_LABEL[basis]}
                        defaultChecked={basis !== "consentement"}
                        disabled={locked}
                      />
                    </Td>
                  );
                })}
              </Tr>
            ))}
        </Table>
        <div className="mt-5">
          <Alert tone="accent" title="Communications commerciales">
            Les messages promotionnels que SIRA vous adresse exigent votre consentement explicite sur chaque canal,
            y compris dans l&apos;application. La même règle s&apos;applique aux candidats que vous ciblez avec vos
            campagnes.
          </Alert>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Équipe</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Membres du compte organisme, en trois rôles : propriétaire, contributeur, lecteur
            </p>
          </div>
          <AdminActions subject="l'équipe" actions={[{ label: "Inviter un membre", variant: "primary" }]} />
        </div>
        <Table head={["Membre", "Fonction", "Rôle", "Actions"]} minWidth={720}>
            {TEAM.map((member) => (
              <Tr key={member.email}>
                <Td>
                  <p className="text-[13.5px] font-medium">{member.name}</p>
                  <p className="text-[12.5px] text-[var(--color-text-muted)]">{member.email}</p>
                </Td>
                <Td className="text-[13px] text-[var(--color-text-muted)]">{member.jobTitle}</Td>
                <Td>
                  <Badge tone={member.role === "proprietaire" ? "primary" : "neutral"}>
                    {MEMBERSHIP_ROLE_LABEL[member.role]}
                  </Badge>
                </Td>
                <Td>
                  <AdminActions
                    subject={member.name}
                    actions={[
                      { label: "Changer le rôle", variant: "outline" },
                      { label: "Retirer", variant: "danger" },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
        </Table>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Fin de relation</h2>
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] border-l-2 border-l-[var(--color-danger)] px-4 py-4">
          <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Fermer le compte organisme</h3>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Les fiches sont dépubliées, les campagnes en cours s&apos;arrêtent, les données sont effacées après
            30 jours
          </p>
          <div className="mt-4 space-y-3">
            <Alert tone="danger" title="Ce qui se passe à la fermeture">
              Vos formations sortent du catalogue le jour même. Les candidats déjà inscrits chez vous ne sont pas
              affectés : SIRA n&apos;a jamais été partie à leur inscription. Les campagnes non diffusées sont
              remboursées au prorata du budget non consommé.
            </Alert>
            <AdminActions
              subject="le compte organisme"
              actions={[
                { label: "Exporter mes données", variant: "outline" },
                { label: "Fermer le compte", variant: "danger" },
              ]}
            />
          </div>
        </div>
      </section>
    </>
  );
}
