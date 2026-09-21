/**
 * Paramètres du compte recruteur.
 * Préférences de notification, gestion des membres, alertes WhatsApp,
 * sécurité du compte.
 *
 * Direction épurée : chaque réglage est une section posée sur fond blanc et
 * séparée de la suivante par un filet de 1 pixel.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  ORG_MEMBERS,
  RECRUITER_EMAIL,
  RECRUITER_NAME,
  RECRUITER_PHONE,
} from "@/components/recruiter-data";
import {
  InviteMemberPanel,
  MemberRoleControl,
  NotificationPreferencesForm,
  SecurityPanel,
  WhatsAppAlertsPanel,
} from "@/components/recruiter-settings";
import {
  Alert,
  Avatar,
  Badge,
  PageHeader,
  formatDate,
} from "@/components/ui";
import { IconBell, IconShield, IconUsers, IconWhatsApp } from "@/components/icons";
import { MEMBERSHIP_ROLE_LABEL } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Paramètres",
};

const SECTIONS = [
  { id: "notifications", label: "Notifications" },
  { id: "membres", label: "Membres" },
  { id: "whatsapp", label: "Alertes WhatsApp" },
  { id: "securite", label: "Sécurité" },
];

const BLOCK = "mt-10 border-t border-[var(--color-border)] pt-8";
const H2 = "text-[17px] font-semibold text-[var(--color-text)]";
const SUB = "mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]";

export default function RecruiterSettingsPage() {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description={`Compte de ${RECRUITER_NAME}, propriétaire de l'organisation Sahel Agro.`}
      />

      <nav aria-label="Sections des paramètres">
        <ul className="flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                href={`#${s.id}`}
                className="inline-flex items-center rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---- Notifications ---- */}
      <section id="notifications" aria-labelledby="t-notifications" className={BLOCK}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="t-notifications" className={H2}>
              Préférences de notification
            </h2>
            <p className={SUB}>
              Par type d&apos;événement et par canal. La base légale de chaque case est indiquée sous la case.
            </p>
          </div>
          <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
            <IconBell size={18} />
          </span>
        </div>
        <div className="mt-5">
          <NotificationPreferencesForm />
        </div>
      </section>

      {/* ---- Membres ---- */}
      <section id="membres" aria-labelledby="t-membres" className={BLOCK}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="t-membres" className={H2}>
              Membres de l&apos;organisation
            </h2>
            <p className={SUB}>{ORG_MEMBERS.length} membres. Le plan Pro en autorise 10.</p>
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
                <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{member.email}</p>
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

        <div className="mt-4">
          <Alert tone="neutral" icon={<IconUsers size={15} />}>
            Un <strong className="font-semibold">propriétaire</strong> gère l&apos;abonnement, les justificatifs
            et les membres. Un <strong className="font-semibold">recruteur</strong> publie des offres et traite
            les candidatures. Un <strong className="font-semibold">lecteur</strong> consulte les dossiers sans
            pouvoir changer d&apos;état ni écrire de note.
          </Alert>
        </div>
      </section>

      {/* ---- WhatsApp ---- */}
      <section id="whatsapp" aria-labelledby="t-whatsapp" className={BLOCK}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="t-whatsapp" className={H2}>
              Alertes WhatsApp
            </h2>
            <p className={SUB}>Le canal le plus lu au Burkina Faso, soumis à consentement explicite.</p>
          </div>
          <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
            <IconWhatsApp size={18} />
          </span>
        </div>
        <div className="mt-5">
          <WhatsAppAlertsPanel phone={RECRUITER_PHONE} />
        </div>
      </section>

      {/* ---- Sécurité ---- */}
      <section id="securite" aria-labelledby="t-securite" className={BLOCK}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="t-securite" className={H2}>
              Sécurité du compte
            </h2>
            <p className={SUB}>Vous manipulez des données personnelles de candidats : protégez cet accès.</p>
          </div>
          <span className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
            <IconShield size={18} />
          </span>
        </div>
        <div className="mt-5">
          <SecurityPanel email={RECRUITER_EMAIL} />
        </div>
      </section>

      {/* ---- Données et confidentialité ---- */}
      <section aria-labelledby="t-donnees" className={BLOCK}>
        <h2 id="t-donnees" className="text-[14px] font-semibold text-[var(--color-text)]">
          Données et confidentialité
        </h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          Les dossiers de candidature restent accessibles pendant vingt-quatre mois après la clôture de
          l&apos;offre, puis sont anonymisés. Les notes internes suivent la même durée. Un candidat qui demande
          la suppression de ses données voit son dossier retiré de votre file, y compris de la shortlist.
        </p>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          Les coordonnées d&apos;un candidat trouvé dans la recherche de talents ne vous sont jamais
          communiquées sans son accord, et ne peuvent pas être exportées.
        </p>
      </section>
    </>
  );
}
