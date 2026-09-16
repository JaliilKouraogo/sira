"use client";

/**
 * Réglages du recruteur : invitation de membres, préférences de notification,
 * alertes WhatsApp et sécurité. Toutes les actions sont simulées.
 *
 * Les bases légales viennent de CONSENT_MATRIX : une notification « service »
 * ne se désactive pas, une notification WhatsApp exige un consentement.
 */

import { useState } from "react";
import {
  CONSENT_BASIS_LABEL,
  CONSENT_MATRIX,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_ROLE_LABEL,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_TYPE_LABEL,
  type ConsentType,
  type MembershipRole,
  type NotificationChannel,
  type NotificationType,
} from "@/lib/enums";
import { Alert, Badge, Button, Checkbox, Field, Input, Select, cx } from "./ui";
import { IconCheck, IconMail, IconShield, IconWhatsApp } from "./icons";

// --------------------------------------------------------------------------
// Invitation d'un membre
// --------------------------------------------------------------------------

export function InviteMemberPanel() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("recruteur");
  const [sent, setSent] = useState<string | null>(null);

  return (
    <div>
      <Button size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Inviter un membre
      </Button>

      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            setSent(
              `Invitation envoyée à ${email.trim()} avec le rôle « ${MEMBERSHIP_ROLE_LABEL[role]} ». Elle expire dans 7 jours.`,
            );
            setEmail("");
          }}
          className="mt-3 space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3.5"
        >
          <Field label="Adresse e-mail professionnelle" htmlFor="invite-email" required>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@sahelagro.bf"
            />
          </Field>
          <Field
            label="Rôle dans l'organisation"
            htmlFor="invite-role"
            hint="Propriétaire : gestion complète, y compris la facturation. Recruteur : offres et candidatures. Lecteur : consultation seule."
          >
            <Select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
            >
              {MEMBERSHIP_ROLES.map((r) => (
                <option key={r} value={r}>
                  {MEMBERSHIP_ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!email.trim()}>
              Envoyer l&apos;invitation
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
          {sent ? (
            <p className="flex items-start gap-1.5 text-[12px] text-[var(--color-success)]">
              <IconCheck size={13} className="mt-0.5 shrink-0" />
              <span>{sent}</span>
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

/** Changement du rôle d'un membre existant. */
export function MemberRoleControl({ name, role }: { name: string; role: MembershipRole }) {
  const [current, setCurrent] = useState<MembershipRole>(role);
  const [trace, setTrace] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Select
        aria-label={`Rôle de ${name}`}
        value={current}
        onChange={(e) => {
          const next = e.target.value as MembershipRole;
          setCurrent(next);
          setTrace(`${name} est désormais ${MEMBERSHIP_ROLE_LABEL[next].toLowerCase()}.`);
        }}
        className="h-8 w-auto min-w-[8.5rem] text-[13px]"
      >
        {MEMBERSHIP_ROLES.map((r) => (
          <option key={r} value={r}>
            {MEMBERSHIP_ROLE_LABEL[r]}
          </option>
        ))}
      </Select>
      {trace ? <span className="text-[11.5px] text-[var(--color-success)]">{trace}</span> : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// Préférences de notification
// --------------------------------------------------------------------------

const RECRUITER_NOTIFICATIONS: { type: NotificationType; consent: ConsentType; description: string }[] = [
  {
    type: "candidature",
    consent: "candidature",
    description: "Nouvelle candidature reçue, dossier complété, relance d'un candidat.",
  },
  {
    type: "offre",
    consent: "opportunites",
    description: "Offre bientôt expirée, offre validée par la modération, offre suspendue.",
  },
  {
    type: "message",
    consent: "service",
    description: "Réponse d'un candidat à une prise de contact.",
  },
  {
    type: "systeme",
    consent: "service",
    description: "Vérification de l'organisation, abonnement, sécurité du compte.",
  },
  {
    type: "promotion",
    consent: "marketing",
    description: "Nouveautés SIRA et offres commerciales.",
  },
];

const DEFAULTS: Record<string, boolean> = {
  "candidature:in_app": true,
  "candidature:email": true,
  "candidature:whatsapp": true,
  "offre:in_app": true,
  "offre:email": true,
  "offre:whatsapp": false,
  "message:in_app": true,
  "message:email": true,
  "message:whatsapp": true,
  "systeme:in_app": true,
  "systeme:email": true,
  "systeme:whatsapp": false,
  "promotion:in_app": false,
  "promotion:email": false,
  "promotion:whatsapp": false,
};

export function NotificationPreferencesForm() {
  const [state, setState] = useState<Record<string, boolean>>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-left">
          <caption className="sr-only">Préférences de notification par type et par canal</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th
                scope="col"
                className="py-2 pr-4 text-[11.5px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]"
              >
                Type
              </th>
              {NOTIFICATION_CHANNELS.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="px-3 py-2 text-center text-[11.5px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]"
                >
                  {NOTIFICATION_CHANNEL_LABEL[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {RECRUITER_NOTIFICATIONS.map((row) => (
              <tr key={row.type}>
                <th scope="row" className="py-3 pr-4 font-normal">
                  <span className="block text-[13.5px] font-medium text-[var(--color-text)]">
                    {NOTIFICATION_TYPE_LABEL[row.type]}
                  </span>
                  <span className="mt-0.5 block max-w-xs text-[12px] text-[var(--color-text-muted)]">
                    {row.description}
                  </span>
                </th>
                {NOTIFICATION_CHANNELS.map((channel: NotificationChannel) => {
                  const basis = CONSENT_MATRIX[row.consent][channel];
                  const key = `${row.type}:${channel}`;
                  const locked = basis === "service";
                  return (
                    <td key={channel} className="px-3 py-3 text-center">
                      <label className="inline-flex cursor-pointer flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          checked={locked ? true : state[key]}
                          disabled={locked}
                          onChange={() => toggle(key)}
                          aria-label={`${NOTIFICATION_TYPE_LABEL[row.type]} par ${NOTIFICATION_CHANNEL_LABEL[channel]}`}
                          className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-primary)] disabled:opacity-60"
                        />
                        <span
                          className={cx(
                            "text-[10.5px]",
                            locked ? "text-[var(--color-text-subtle)]" : "text-[var(--color-text-muted)]",
                          )}
                        >
                          {CONSENT_BASIS_LABEL[basis]}
                        </span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Alert tone="neutral" icon={<IconShield size={15} />}>
        Les notifications marquées « Nécessaire au service » ne se désactivent pas : elles portent le
        fonctionnement du compte. Le canal WhatsApp exige toujours un consentement explicite, retirable à tout
        moment.
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setSaved(true)}>
          Enregistrer les préférences
        </Button>
        {saved ? (
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-success)]">
            <IconCheck size={13} />
            Préférences enregistrées.
          </span>
        ) : null}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Alertes WhatsApp
// --------------------------------------------------------------------------

export function WhatsAppAlertsPanel({ phone }: { phone: string }) {
  const [linked, setLinked] = useState(true);
  const [digest, setDigest] = useState<"immediat" | "quotidien" | "hebdomadaire">("quotidien");
  const [events, setEvents] = useState({
    newApplication: true,
    strongMatch: true,
    deadline: true,
    candidateReply: false,
  });
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3.5">
        <span className="shrink-0 text-[var(--color-success)]">
          <IconWhatsApp size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-[var(--color-text)]">
            Numéro WhatsApp {linked ? "relié" : "non relié"}
          </p>
          <p className="text-[12.5px] text-[var(--color-text-muted)]">{phone}</p>
        </div>
        <Badge tone={linked ? "success" : "neutral"}>{linked ? "Consentement actif" : "Consentement retiré"}</Badge>
        <Button
          size="sm"
          variant={linked ? "outline" : "primary"}
          onClick={() => {
            setLinked((v) => !v);
            setSaved(false);
          }}
        >
          {linked ? "Retirer le consentement" : "Relier le numéro"}
        </Button>
      </div>

      <fieldset disabled={!linked} className={cx("space-y-3", !linked && "opacity-55")}>
        <legend className="mb-1 text-[13px] font-medium text-[var(--color-text)]">
          Ce qui déclenche une alerte WhatsApp
        </legend>
        <Checkbox
          label="Nouvelle candidature reçue"
          checked={events.newApplication}
          onChange={() => setEvents((e) => ({ ...e, newApplication: !e.newApplication }))}
        />
        <Checkbox
          label="Candidature à 75 % de compatibilité ou plus"
          description="Signal de lecture prioritaire. Aucun tri automatique n'est effectué."
          checked={events.strongMatch}
          onChange={() => setEvents((e) => ({ ...e, strongMatch: !e.strongMatch }))}
        />
        <Checkbox
          label="Offre dont la date limite approche"
          checked={events.deadline}
          onChange={() => setEvents((e) => ({ ...e, deadline: !e.deadline }))}
        />
        <Checkbox
          label="Réponse d'un candidat à une prise de contact"
          checked={events.candidateReply}
          onChange={() => setEvents((e) => ({ ...e, candidateReply: !e.candidateReply }))}
        />

        <Field label="Fréquence d'envoi" htmlFor="wa-digest">
          <Select
            id="wa-digest"
            value={digest}
            onChange={(e) => setDigest(e.target.value as typeof digest)}
            className="w-auto min-w-[14rem]"
          >
            <option value="immediat">À chaque événement</option>
            <option value="quotidien">Résumé quotidien, 18 h</option>
            <option value="hebdomadaire">Résumé hebdomadaire, lundi matin</option>
          </Select>
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setSaved(true)}>
          Enregistrer les alertes
        </Button>
        {saved ? (
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-success)]">
            <IconCheck size={13} />
            Alertes enregistrées.
          </span>
        ) : null}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sécurité
// --------------------------------------------------------------------------

export function SecurityPanel({ email }: { email: string }) {
  const [twoFactor, setTwoFactor] = useState(true);
  const [trace, setTrace] = useState<string | null>(null);

  const sessions = [
    { device: "Chrome sur Windows, Bobo-Dioulasso", last: "Session en cours", current: true },
    { device: "Application mobile, Android", last: "Hier, 19 h 42", current: false },
    { device: "Firefox sur Windows, Ouagadougou", last: "Il y a 6 jours", current: false },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Field label="Adresse e-mail de connexion" htmlFor="sec-email">
          <Input id="sec-email" type="email" defaultValue={email} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nouveau mot de passe" htmlFor="sec-pwd" hint="12 caractères minimum.">
            <Input id="sec-pwd" type="password" placeholder="••••••••••••" />
          </Field>
          <Field label="Confirmation" htmlFor="sec-pwd2">
            <Input id="sec-pwd2" type="password" placeholder="••••••••••••" />
          </Field>
        </div>
        <Button size="sm" variant="outline" onClick={() => setTrace("Mot de passe mis à jour.")}>
          Mettre à jour le mot de passe
        </Button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="shrink-0 text-[var(--color-primary)]">
            <IconShield size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium text-[var(--color-text)]">
              Double authentification {twoFactor ? "activée" : "désactivée"}
            </p>
            <p className="text-[12.5px] text-[var(--color-text-muted)]">
              Code envoyé par e-mail à chaque connexion depuis un nouvel appareil.
            </p>
          </div>
          <Button
            size="sm"
            variant={twoFactor ? "outline" : "primary"}
            onClick={() => {
              setTwoFactor((v) => !v);
              setTrace(
                twoFactor
                  ? "Double authentification désactivée. Votre compte gère des données de candidats : nous vous recommandons de la réactiver."
                  : "Double authentification activée.",
              );
            }}
          >
            {twoFactor ? "Désactiver" : "Activer"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold text-[var(--color-text)]">Sessions actives</h3>
        <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {sessions.map((s) => (
            <li key={s.device} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[var(--color-text)]">{s.device}</p>
                <p className="text-[12px] text-[var(--color-text-subtle)]">{s.last}</p>
              </div>
              {s.current ? (
                <Badge tone="success">Appareil actuel</Badge>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setTrace(`Session fermée : ${s.device}.`)}>
                  Fermer
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setTrace("Un export de vos données vous sera envoyé par e-mail sous 48 heures.")}>
          <IconMail size={14} />
          Demander un export de mes données
        </Button>
      </div>

      {trace ? (
        <p className="flex items-start gap-1.5 text-[12px] text-[var(--color-success)]">
          <IconCheck size={13} className="mt-0.5 shrink-0" />
          <span>{trace}</span>
        </p>
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// Abonnement
// --------------------------------------------------------------------------

export function PlanActions() {
  const [trace, setTrace] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() =>
            setTrace(
              "Demande enregistrée. À la fin de l'offre de lancement, le plan Pro passera à 25 000 FCFA par mois, payables par Orange Money ou Moov Money.",
            )
          }
        >
          Conserver Pro après le lancement
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTrace("Un conseiller SIRA vous rappelle sous 48 heures pour le plan Enterprise.")}
        >
          Être rappelé pour Enterprise
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setTrace(
              "Le passage au plan Gratuit prendra effet à la fin de la période en cours. Vos offres publiées restent en ligne jusqu'à leur date limite.",
            )
          }
        >
          Revenir au plan Gratuit
        </Button>
      </div>
      {trace ? (
        <p className="flex items-start gap-1.5 text-[12px] text-[var(--color-text-muted)]">
          <IconCheck size={13} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
          <span>{trace}</span>
        </p>
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// Bouton d'enregistrement générique, action simulée
// --------------------------------------------------------------------------

export function SaveButton({ label, message }: { label: string; message: string }) {
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => setDone(true)}>
        {label}
      </Button>
      {done ? (
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-success)]">
          <IconCheck size={13} />
          {message}
        </span>
      ) : null}
    </div>
  );
}
