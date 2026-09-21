"use client";

/**
 * Actions du recruteur : changement d'état, shortlist, notes internes,
 * prise de contact. Aucune écriture réelle : les actions sont simulées côté
 * client et affichent la trace qu'elles produiraient.
 *
 * Le recruteur ne pilote que `reviewStatus`. L'axe `preparationStatus` du
 * candidat n'est jamais touché ici.
 */

import { useId, useState } from "react";
import {
  REVIEW_STATUSES,
  REVIEW_STATUS_CANDIDATE_LABEL,
  REVIEW_STATUS_LABEL,
  type ReviewStatus,
} from "@/lib/enums";
import type { MessageTemplate } from "./recruiter-data";
import { Badge, Button, Field, Select, Textarea, cx, formatDate } from "./ui";
import { IconBookmark, IconCheck, IconMail, IconSparkles, IconWhatsApp } from "./icons";

// --------------------------------------------------------------------------
// Changement d'état d'une candidature
// --------------------------------------------------------------------------

export function ReviewStatusControl({
  applicationId,
  candidateName,
  current,
  shortlisted,
  compact = false,
}: {
  applicationId: string;
  candidateName: string;
  current: ReviewStatus;
  shortlisted: boolean;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<ReviewStatus>(current);
  const [inShortlist, setInShortlist] = useState(shortlisted);
  const [trace, setTrace] = useState<string | null>(null);
  const selectId = useId();

  function changeStatus(next: ReviewStatus) {
    setStatus(next);
    if (next === "shortlist") setInShortlist(true);
    setTrace(
      `État passé à « ${REVIEW_STATUS_LABEL[next]} » par Idrissa Compaoré. Le candidat verra « ${REVIEW_STATUS_CANDIDATE_LABEL[next]} ».`,
    );
  }

  return (
    <div className={compact ? "" : "space-y-3"}>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${selectId}-${applicationId}`} className="sr-only">
          État de la candidature de {candidateName}
        </label>
        <Select
          id={`${selectId}-${applicationId}`}
          value={status}
          onChange={(e) => changeStatus(e.target.value as ReviewStatus)}
          className={compact ? "h-8 w-auto min-w-[9.5rem] text-[13px]" : "w-auto min-w-[11rem]"}
        >
          {REVIEW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REVIEW_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>

        <button
          type="button"
          onClick={() => {
            setInShortlist((v) => !v);
            setTrace(
              inShortlist
                ? `${candidateName} retiré de la shortlist.`
                : `${candidateName} ajouté à la shortlist. Décision prise par Idrissa Compaoré.`,
            );
          }}
          aria-pressed={inShortlist}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors",
            compact ? "h-8" : "h-9 px-3",
            inShortlist
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]"
              : "border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
          )}
        >
          <IconBookmark size={14} />
          {inShortlist ? "Dans la shortlist" : "Ajouter à la shortlist"}
        </button>
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

/** Boutons d'action rapides, utilisés en tête de fiche candidature. */
export function WorkflowButtons({ candidateName, current }: { candidateName: string; current: ReviewStatus }) {
  const [status, setStatus] = useState<ReviewStatus>(current);
  const [trace, setTrace] = useState<string | null>(null);

  const actions: { label: string; next: ReviewStatus; variant: "primary" | "accent" | "outline" | "danger" }[] = [
    { label: "Marquer à examiner", next: "a_examiner", variant: "outline" },
    { label: "Mettre en shortlist", next: "shortlist", variant: "accent" },
    { label: "Convoquer en entretien", next: "entretien", variant: "primary" },
    { label: "Retenir la candidature", next: "retenue", variant: "outline" },
    { label: "Écarter, avec motif", next: "refusee", variant: "danger" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.next}
            size="sm"
            variant={status === a.next ? "primary" : a.variant}
            onClick={() => {
              setStatus(a.next);
              setTrace(
                a.next === "refusee"
                  ? `Décision humaine enregistrée : ${candidateName} écarté par Idrissa Compaoré. Un motif est demandé avant l'envoi de la réponse.`
                  : `État passé à « ${REVIEW_STATUS_LABEL[a.next]} » par Idrissa Compaoré.`,
              );
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)]">
        État actuel : <strong className="font-semibold text-[var(--color-text)]">{REVIEW_STATUS_LABEL[status]}</strong>.
        Aucun de ces boutons n&apos;est déclenché par l&apos;IA : chaque changement d&apos;état est un geste humain,
        tracé au nom de son auteur.
      </p>
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
// Notes internes partagées
// --------------------------------------------------------------------------

export function InternalNotes({
  notes,
}: {
  notes: { author: string; at: string; text: string }[];
}) {
  const [items, setItems] = useState(notes);
  const [draft, setDraft] = useState("");
  const fieldId = useId();

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Aucune note pour l&apos;instant. Les notes sont visibles par tous les membres de Sahel Agro, jamais par
          le candidat.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {items.map((n, i) => (
            <li key={`${n.author}-${i}`} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--color-text)]">{n.author}</span>
                <span className="text-[12px] text-[var(--color-text-subtle)]">{formatDate(n.at)}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-muted)]">{n.text}</p>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setItems((prev) => [
            ...prev,
            { author: "Idrissa Compaoré", at: new Date().toISOString().slice(0, 10), text: draft.trim() },
          ]);
          setDraft("");
        }}
        className="space-y-2"
      >
        <Field
          label="Ajouter une note interne"
          htmlFor={fieldId}
          hint="Partagée avec les membres de l'organisation. Le candidat n'y a jamais accès."
        >
          <Textarea
            id={fieldId}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ce que vous retenez de l'échange, les points à vérifier…"
          />
        </Field>
        <Button type="submit" size="sm" disabled={!draft.trim()}>
          Enregistrer la note
        </Button>
      </form>
    </div>
  );
}

// --------------------------------------------------------------------------
// Prise de contact : e-mail ou WhatsApp, à partir d'un modèle
// --------------------------------------------------------------------------

export function ContactPanel({
  displayName,
  templates,
  unlocked,
  buttonLabel = "Contacter",
  size = "md",
}: {
  displayName: string;
  templates: MessageTemplate[];
  unlocked: boolean;
  buttonLabel?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [sent, setSent] = useState(false);
  const panelId = useId();

  const available = templates.filter((t) => t.channel === channel || t.channel === "both");
  const selected = available.find((t) => t.id === templateId) ?? available[0];

  return (
    <div className="w-full">
      <Button
        size={size}
        variant="outline"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <IconMail size={14} />
        {buttonLabel}
      </Button>

      {open ? (
        <div id={panelId} className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Contacter {displayName}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            {unlocked
              ? "Les coordonnées de ce candidat sont accessibles : il a postulé à une de vos offres."
              : "Les coordonnées restent masquées. SIRA relaie votre message ; elles ne vous seront communiquées que si le candidat accepte la prise de contact."}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2" role="group" aria-label="Canal de contact">
            {(["email", "whatsapp"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setChannel(c);
                  setSent(false);
                }}
                aria-pressed={channel === c}
                className={cx(
                  "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition-colors",
                  channel === c
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
                )}
              >
                {c === "email" ? <IconMail size={14} /> : <IconWhatsApp size={14} />}
                {c === "email" ? "E-mail" : "WhatsApp"}
              </button>
            ))}
          </div>

          <div className="mt-3.5 space-y-3">
            <Field label="Modèle de message" htmlFor={`${panelId}-tpl`}>
              <Select
                id={`${panelId}-tpl`}
                value={selected?.id ?? ""}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  setSent(false);
                }}
              >
                {available.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>

            {selected ? (
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                <p className="text-[12px] text-[var(--color-text-muted)]">{selected.purpose}</p>
                {selected.subject && channel === "email" ? (
                  <p className="mt-2 text-[13px] font-semibold text-[var(--color-text)]">
                    Objet : {selected.subject}
                  </p>
                ) : null}
                <pre className="mt-2 whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-[var(--color-text)]">
                  {selected.body}
                </pre>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => setSent(true)}
                variant={channel === "whatsapp" ? "accent" : "primary"}
              >
                {channel === "whatsapp" ? <IconWhatsApp size={14} /> : <IconMail size={14} />}
                Envoyer via SIRA
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>

            {sent ? (
              <p className="flex items-start gap-1.5 text-[12px] text-[var(--color-success)]">
                <IconCheck size={13} className="mt-0.5 shrink-0" />
                <span>
                  Message simulé : envoi {channel === "whatsapp" ? "WhatsApp" : "e-mail"} au modèle «{" "}
                  {selected?.name} ». Il apparaîtra dans le journal des contacts avec son statut de remise.
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// Shortlist depuis l'écran de matching
// --------------------------------------------------------------------------

export function ShortlistButton({ candidateName, initial }: { candidateName: string; initial: boolean }) {
  const [added, setAdded] = useState(initial);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={added ? "outline" : "accent"}
        onClick={() => setAdded((v) => !v)}
        aria-pressed={added}
      >
        <IconBookmark size={14} />
        {added ? "Retirer de la shortlist" : "Ajouter à la shortlist"}
      </Button>
      {added ? (
        <span className="text-[12px] text-[var(--color-text-muted)]">
          {candidateName} est dans la shortlist, sur décision humaine.
        </span>
      ) : null}
    </div>
  );
}

/** Démonstration : le classement IA se recalcule, sans jamais écarter personne. */
export function MatchingRecomputeNotice() {
  const [computing, setComputing] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setComputing(true);
          setDone(false);
          window.setTimeout(() => {
            setComputing(false);
            setDone(true);
          }, 700);
        }}
        disabled={computing}
      >
        <IconSparkles size={14} />
        {computing ? "Recalcul en cours…" : "Recalculer le classement"}
      </Button>
      {done ? (
        <span className="text-[12px] text-[var(--color-success)]">
          Classement recalculé. Tous les candidats restent dans la liste.
        </span>
      ) : null}
    </div>
  );
}

/** Petite étiquette d'état de remise pour le journal des contacts. */
export function DeliveryBadge({ status }: { status: "envoye" | "delivre" | "lu" | "echec" }) {
  const map = {
    envoye: { label: "Envoyé", tone: "neutral" as const },
    delivre: { label: "Remis", tone: "info" as const },
    lu: { label: "Lu", tone: "success" as const },
    echec: { label: "Échec de remise", tone: "danger" as const },
  };
  return <Badge tone={map[status].tone}>{map[status].label}</Badge>;
}
