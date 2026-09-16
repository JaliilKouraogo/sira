/**
 * Journal des contacts.
 *
 * Décision de conception assumée : pas de messagerie interne. SIRA relaie des
 * e-mails et des messages WhatsApp vers les outils que candidats et recruteurs
 * utilisent déjà, et garde la trace de chaque envoi.
 *
 * Direction épurée : le journal se lit comme une liste à filets, sans carte
 * ni pastille pleine ; la couleur ne sert qu'au canal et au statut de remise.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  MESSAGE_TEMPLATES,
  getContactJournal,
  getRecruiterPipeline,
} from "@/components/recruiter-data";
import { DeliveryBadge } from "@/components/recruiter-actions";
import {
  Alert,
  Avatar,
  Badge,
  EmptyState,
  PageHeader,
  Stat,
  formatDate,
  relativeDays,
} from "@/components/ui";
import { IconChat, IconMail, IconWhatsApp } from "@/components/icons";
import { IllustrationWhatsApp } from "@/components/illustrations";

export const metadata: Metadata = {
  title: "Messages et WhatsApp",
};

export default function RecruiterMessagesPage() {
  const journal = getContactJournal();
  const pipeline = getRecruiterPipeline();
  const applicants = new Set(pipeline.map((a) => a.talent.id));

  const emails = journal.filter((e) => e.event.channel === "email").length;
  const whatsapp = journal.filter((e) => e.event.channel === "whatsapp").length;
  const read = journal.filter((e) => e.event.status === "lu").length;
  const failed = journal.filter((e) => e.event.status === "echec").length;

  return (
    <>
      <PageHeader
        title="Messages et WhatsApp"
        description="Tous les envois faits aux candidats depuis votre organisation, avec leur modèle et leur statut de remise."
      />

      {/* ---- Décision de conception ---- */}
      <div className="mb-8">
        <Alert tone="info" icon={<IconChat size={15} />} title="Pourquoi il n'y a pas de messagerie interne">
          <p>
            Une messagerie interne suppose que les deux parties reviennent s&apos;y connecter. Au Burkina Faso, la
            conversation se tient sur WhatsApp et par e-mail, sur des téléphones à connexion intermittente. SIRA ne
            cherche pas à déplacer cette conversation : elle envoie le message par le canal que le candidat utilise
            déjà, à partir d&apos;un modèle, et conserve la trace de l&apos;envoi.
          </p>
          <p className="mt-1.5">
            Ce que vous perdez : le fil de discussion dans l&apos;application. Ce que vous gagnez : un taux de
            lecture réel, aucune obligation de reconnexion pour le candidat, et un journal vérifiable de ce qui a
            été envoyé, quand et à qui.
          </p>
        </Alert>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Envois au total" value={journal.length} tone="primary" />
        <Stat label="E-mails" value={emails} tone="info" icon={<IconMail size={17} />} />
        <Stat label="WhatsApp" value={whatsapp} tone="success" icon={<IconWhatsApp size={17} />} />
        <Stat label="Lus" value={read} hint={failed > 0 ? `${failed} échec de remise` : undefined} tone="accent" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---- Journal ---- */}
        <section aria-labelledby="journal" className="min-w-0 border-t border-[var(--color-border)] pt-7">
          <h2 id="journal" className="text-[17px] font-semibold text-[var(--color-text)]">
            Journal des contacts
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Du plus récent au plus ancien. Aucun message n&apos;est modifiable après envoi.
          </p>

          {journal.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Aucun envoi pour le moment"
                icon={<IllustrationWhatsApp size={170} accent="var(--color-zone-recruiter)" />}
                description="Les messages envoyés depuis une fiche candidature ou depuis la recherche de talents apparaîtront ici."
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {journal.map(({ event, talent, template }) => {
                const unlocked = talent ? applicants.has(talent.id) : false;
                const display = talent
                  ? unlocked
                    ? `${talent.firstName} ${talent.lastName}`
                    : talent.anonymousName
                  : "Candidat";
                return (
                  <li key={event.id} className="flex flex-wrap items-start gap-3 py-3.5">
                    <span
                      className={
                        event.channel === "whatsapp"
                          ? "mt-0.5 shrink-0 text-[var(--color-success)]"
                          : "mt-0.5 shrink-0 text-[var(--color-info)]"
                      }
                      aria-hidden
                    >
                      {event.channel === "whatsapp" ? <IconWhatsApp size={16} /> : <IconMail size={16} />}
                    </span>

                    {talent ? (
                      <Avatar initials={talent.avatarInitials} color={talent.color} size={32} rounded="full" />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13.5px] font-medium text-[var(--color-text)]">{display}</p>
                        <Badge tone="neutral">{template?.name ?? event.template}</Badge>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                        {event.channel === "whatsapp" ? "Message WhatsApp" : "E-mail"} envoyé le{" "}
                        {formatDate(event.sentAt)}, {relativeDays(event.sentAt)}
                      </p>
                      {template?.purpose ? (
                        <p className="mt-1 text-[12px] text-[var(--color-text-subtle)]">{template.purpose}</p>
                      ) : null}
                    </div>

                    <DeliveryBadge status={event.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---- Bibliothèque de modèles ---- */}
        <aside className="min-w-0">
          <section aria-labelledby="modeles" className="border-t border-[var(--color-border)] pt-7">
            <h2 id="modeles" className="text-[14px] font-semibold text-[var(--color-text)]">
              Bibliothèque de modèles
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              {MESSAGE_TEMPLATES.length} modèles prêts à l&apos;emploi, personnalisables avant envoi.
            </p>
            <ul className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {MESSAGE_TEMPLATES.map((template) => (
                <li key={template.id} className="py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-medium text-[var(--color-text)]">{template.name}</p>
                    <Badge
                      tone={
                        template.channel === "whatsapp"
                          ? "success"
                          : template.channel === "both"
                            ? "primary"
                            : "info"
                      }
                    >
                      {template.channel === "both"
                        ? "E-mail et WhatsApp"
                        : template.channel === "whatsapp"
                          ? "WhatsApp"
                          : "E-mail"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                    {template.purpose}
                  </p>
                  {template.subject ? (
                    <p className="mt-1.5 text-[12px] text-[var(--color-text-subtle)]">Objet : {template.subject}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Les variables entre doubles accolades sont remplacées à l&apos;envoi : prénom, poste, date, lieu et
              nom du recruteur.
            </p>
          </section>

          <section aria-labelledby="ou-envoyer" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 id="ou-envoyer" className="text-[14px] font-semibold text-[var(--color-text)]">
              Où envoyer un message
            </h2>
            <ul className="mt-3 space-y-3 text-[13px]">
              <li>
                <Link
                  href="/recruteur/candidatures"
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  Depuis une fiche candidature
                </Link>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                  Les coordonnées sont ouvertes : le candidat a postulé chez vous.
                </span>
              </li>
              <li>
                <Link
                  href="/recruteur/talents"
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  Depuis la recherche de talents
                </Link>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                  SIRA relaie le message sans vous communiquer les coordonnées, tant que le candidat n&apos;a pas
                  accepté la prise de contact.
                </span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
