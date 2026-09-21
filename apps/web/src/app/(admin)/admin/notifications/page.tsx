/**
 * Back-office — notifications et consentements [T §21.4], section 10 du plan.
 *
 * La matrice est la pièce maîtresse de l'écran : elle dit, pour chaque
 * événement et chaque canal, sur quelle base juridique l'envoi repose.
 * Correction assumée de [T §20] : la publicité dans l'application exige elle
 * aussi un consentement explicite.
 *
 * Direction épurée : les matrices sont des tableaux posés à même la page,
 * séparés par des filets, sans carte ni ombre.
 */

import type { Metadata } from "next";
import {
  BarChart,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
  fullName,
} from "@/components/admin-kit";
import { Alert, Badge, PageHeader, Stat, type Tone, formatDate, relativeDays } from "@/components/ui";
import { getContactEvents, getConsents, getNotifications, getUserById } from "@/data/queries";
import {
  CONSENT_BASIS_LABEL,
  CONSENT_MATRIX,
  CONSENT_TYPES,
  CONSENT_TYPE_LABEL,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABEL,
  type ConsentBasis,
  type ConsentType,
  type NotificationType,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Notifications | Administration SIRA",
};

/**
 * Rattachement d'un type d'événement à une famille de consentement.
 * Sans ce rattachement, la matrice de la section 10.2 ne serait pas
 * applicable aux sept types de notification réellement émis.
 */
const EVENT_CONSENT: Record<NotificationType, ConsentType> = {
  offre: "opportunites",
  candidature: "candidature",
  document: "service",
  formation: "opportunites",
  message: "candidature",
  promotion: "marketing",
  systeme: "service",
};

const BASIS_TONE: Record<ConsentBasis, Tone> = {
  service: "info",
  preference: "neutral",
  consentement: "accent",
};

/** Modèles d'envoi. Le libellé et les variables sont figés côté produit. */
const TEMPLATES: {
  code: string;
  type: NotificationType;
  channels: string[];
  object: string;
  variables: string;
}[] = [
  {
    code: "offre_compatible",
    type: "offre",
    channels: ["Dans l'application", "E-mail", "WhatsApp"],
    object: "Une offre correspond à votre profil à {score} %",
    variables: "{prenom} {intitule} {entreprise} {ville} {score}",
  },
  {
    code: "candidature_recue",
    type: "candidature",
    channels: ["Dans l'application", "E-mail"],
    object: "Votre candidature a bien été transmise",
    variables: "{prenom} {intitule} {entreprise}",
  },
  {
    code: "candidature_changement_etat",
    type: "candidature",
    channels: ["Dans l'application", "E-mail", "WhatsApp"],
    object: "Votre candidature a évolué",
    variables: "{prenom} {intitule} {etat_candidat}",
  },
  {
    code: "document_pret",
    type: "document",
    channels: ["Dans l'application"],
    object: "Vos documents de candidature sont prêts à relire",
    variables: "{prenom} {intitule} {nb_documents}",
  },
  {
    code: "formation_recommandee",
    type: "formation",
    channels: ["Dans l'application", "E-mail"],
    object: "Une formation comble une lacune détectée sur votre profil",
    variables: "{prenom} {formation} {competence}",
  },
  {
    code: "message_recruteur",
    type: "message",
    channels: ["Dans l'application", "E-mail", "WhatsApp"],
    object: "{entreprise} vous a écrit",
    variables: "{prenom} {entreprise} {extrait}",
  },
  {
    code: "campagne_promotionnelle",
    type: "promotion",
    channels: ["Dans l'application", "E-mail", "WhatsApp"],
    object: "{titre_campagne}",
    variables: "{prenom} {titre_campagne} {annonceur}",
  },
  {
    code: "securite_connexion",
    type: "systeme",
    channels: ["E-mail"],
    object: "Nouvelle connexion à votre compte SIRA",
    variables: "{prenom} {appareil} {date}",
  },
];

export default function AdminNotificationsPage() {
  const notifications = getNotifications();
  const contactEvents = getContactEvents();
  const consents = getConsents();

  const read = notifications.filter((n) => n.readAt);
  const marketingConsents = consents.filter((c) => c.consentType === "marketing");
  const grantedMarketing = marketingConsents.filter((c) => c.granted);

  const byChannel = NOTIFICATION_CHANNELS.map((channel) => ({
    label: NOTIFICATION_CHANNEL_LABEL[channel],
    value: notifications.filter((n) => n.channel === channel).length,
  })).filter((row) => row.value > 0);

  const byType = NOTIFICATION_TYPES.map((type) => ({
    label: NOTIFICATION_TYPE_LABEL[type],
    value: notifications.filter((n) => n.type === type).length,
  })).filter((row) => row.value > 0);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Modèles d'envoi, base juridique de chaque canal et journal des envois. Le canal push est hors du périmètre : trois canaux seulement, dans l'application, par e-mail et par WhatsApp."
      />

      <Alert tone="accent" title="La publicité exige un consentement explicite sur tous les canaux">
        Y compris dans l&apos;application. Une promotion ne s&apos;affiche donc pas dans le fil d&apos;un candidat qui
        n&apos;a rien accepté, quel que soit le canal. Un consentement se retire aussi facilement qu&apos;il se
        donne, et le retrait vaut immédiatement.
      </Alert>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Notifications envoyées" value={formatInt(notifications.length)} />
        <Stat
          label="Taux d'ouverture"
          value={formatPercent(notifications.length === 0 ? 0 : (read.length / notifications.length) * 100, 0)}
          hint={`${read.length} lues sur ${notifications.length}`}
        />
        <Stat
          label="Contacts recruteur"
          value={formatInt(contactEvents.length)}
          hint="E-mail et WhatsApp relayés par SIRA"
        />
        <Stat
          label="Consentements publicitaires"
          value={`${grantedMarketing.length} / ${marketingConsents.length}`}
          hint="Accordés sur canaux proposés"
        />
      </div>

      {/* ---- Matrice événement x canal x base juridique ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Matrice des envois</h2>
        <div className="mt-5">
          <h3 className="text-[14px] font-semibold text-[var(--color-text)]">
            Type d&apos;événement × canal × base juridique
          </h3>
          <p className="mt-0.5 mb-4 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Trois bases : nécessaire au service, préférence désactivable, consentement explicite
          </p>
          <Table
            head={[
              "Type d'événement",
              "Famille de consentement",
              ...NOTIFICATION_CHANNELS.map((c) => NOTIFICATION_CHANNEL_LABEL[c]),
            ]}
            minWidth={860}
          >
            {NOTIFICATION_TYPES.map((type) => {
              const family = EVENT_CONSENT[type];
              return (
                <Tr key={type}>
                  <Td className="font-medium">{NOTIFICATION_TYPE_LABEL[type]}</Td>
                  <TdMuted>{CONSENT_TYPE_LABEL[family]}</TdMuted>
                  {NOTIFICATION_CHANNELS.map((channel) => {
                    const basis = CONSENT_MATRIX[family][channel];
                    return (
                      <Td key={channel}>
                        <Badge tone={BASIS_TONE[basis]}>{CONSENT_BASIS_LABEL[basis]}</Badge>
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Table>
        </div>

        <div className="mt-8">
          <h3 className="text-[14px] font-semibold text-[var(--color-text)]">
            Matrice de référence par famille de consentement
          </h3>
          <p className="mt-0.5 mb-4 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Source : section 10.2 du plan, lue telle quelle depuis le référentiel
          </p>
          <Table
            head={["Famille", ...NOTIFICATION_CHANNELS.map((c) => NOTIFICATION_CHANNEL_LABEL[c])]}
            minWidth={640}
          >
            {CONSENT_TYPES.map((consentType) => (
              <Tr key={consentType}>
                <Td className="font-medium">{CONSENT_TYPE_LABEL[consentType]}</Td>
                {NOTIFICATION_CHANNELS.map((channel) => {
                  const basis = CONSENT_MATRIX[consentType][channel];
                  return (
                    <Td key={channel}>
                      <Badge tone={BASIS_TONE[basis]}>{CONSENT_BASIS_LABEL[basis]}</Badge>
                    </Td>
                  );
                })}
              </Tr>
            ))}
          </Table>
        </div>
      </section>

      {/* ---- Modèles ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Modèles de notification</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Un modèle par événement, décliné par canal. Les variables sont substituées à l&apos;envoi.
          </p>
        </div>
        <Table head={["Code", "Événement", "Canaux", "Objet", "Variables"]} minWidth={980}>
          {TEMPLATES.map((template) => (
            <Tr key={template.code}>
              <Td className="font-mono text-[12.5px]">{template.code}</Td>
              <Td>
                <Badge tone="neutral">{NOTIFICATION_TYPE_LABEL[template.type]}</Badge>
              </Td>
              <TdMuted>{template.channels.join(", ")}</TdMuted>
              <Td className="max-w-[280px] text-[13px]">{template.object}</Td>
              <Td className="font-mono text-[12px] text-[var(--color-text-muted)]">{template.variables}</Td>
            </Tr>
          ))}
        </Table>
      </section>

      {/* ---- Journal des envois ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Journal des envois</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Notifications émises par la plateforme
            </p>
          </div>
          <Table head={["Destinataire", "Événement", "Canal", "Titre", "Lue", "Envoyée"]} minWidth={920}>
            {notifications.map((notification) => {
              const user = getUserById(notification.userId);
              return (
                <Tr key={notification.id}>
                  <Td className="font-medium">{fullName(user)}</Td>
                  <Td>
                    <Badge tone="neutral">{NOTIFICATION_TYPE_LABEL[notification.type]}</Badge>
                  </Td>
                  <TdMuted>{NOTIFICATION_CHANNEL_LABEL[notification.channel]}</TdMuted>
                  <Td className="max-w-[280px] text-[13px]">{notification.title}</Td>
                  <Td>
                    <Badge tone={notification.readAt ? "success" : "neutral"}>
                      {notification.readAt ? "Lue" : "Non lue"}
                    </Badge>
                  </Td>
                  <TdMuted>{formatDate(notification.createdAt)}</TdMuted>
                </Tr>
              );
            })}
          </Table>
        </div>

        <div className="min-w-0 space-y-8">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par canal</h2>
            <div className="mt-4">
              <BarChart items={byChannel} />
            </div>
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par événement</h2>
            <div className="mt-4">
              <BarChart items={byType} tone="info" />
            </div>
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Contacts relayés</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Recruteur vers candidat</p>
            <ul className="mt-3 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {contactEvents.map((event) => (
                <li key={event.id} className="py-2.5">
                  <p className="text-[13px] font-medium text-[var(--color-text)]">{event.template}</p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {event.channel === "whatsapp" ? "WhatsApp" : "E-mail"} · {event.status} ·{" "}
                    {relativeDays(event.sentAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
