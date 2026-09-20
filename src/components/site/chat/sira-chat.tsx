"use client";

/**
 * Assistant SIRA, en bulle sur toutes les pages du site public.
 *
 * Aucune requête réseau : les réponses viennent de `chat-answers.ts`, choisies
 * par mots-clés à partir des offres et des formations publiées. Le site étant
 * exporté en fichiers statiques, tout se passe dans le navigateur.
 *
 * Accessibilité : la bulle est une boîte de dialogue non modale, annoncée par
 * son titre, avec une zone de messages en `aria-live`. La touche Échap ferme
 * la bulle et rend le focus au bouton. Les suggestions sont de vrais boutons,
 * les liens de vrais liens, et chaque cible tactile fait au moins 44 px.
 *
 * Mouvement réduit : plus de délai de frappe ni de défilement animé.
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SiraMark } from "@/components/icons";
import type { ChatData } from "@/data/site-chat";
import { cn } from "../kit";
import { lockBodyScroll } from "../scroll-lock";
import { answerFor, openingAnswer, type ChatAnswer } from "./chat-answers";

interface ChatMessage extends ChatAnswer {
  id: number;
  role: "user" | "bot";
}

/** La version fait partie de la clé : un ancien format n'est jamais relu. */
const STORAGE_KEY = "sira-chat-v1";
/**
 * Enveloppe du contenu de page posée par le gabarit public. Quand la bulle
 * occupe l'écran d'un téléphone, ce contenu est rendu inerte : il sort du
 * parcours au clavier et des lecteurs d'écran.
 */
const PAGE_CONTENT_ID = "site-contenu";
/** Messages conservés d'une page à l'autre, pour ne pas gonfler le stockage. */
const STORED_MESSAGES = 30;

/**
 * Message relu depuis le stockage. Tout ce qui ne correspond pas exactement
 * est écarté : un contenu abîmé ou écrit par un ancien format ne doit pas
 * faire tomber la page entière au rendu.
 */
function isStoredMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Partial<ChatMessage>;
  const textOk = Array.isArray(m.text) && m.text.every((t) => typeof t === "string");
  const linksOk =
    m.links === undefined ||
    (Array.isArray(m.links) && m.links.every((l) => l && typeof l.label === "string" && typeof l.href === "string"));
  const chipsOk = m.chips === undefined || (Array.isArray(m.chips) && m.chips.every((c) => typeof c === "string"));
  return (
    typeof m.id === "number" && Number.isFinite(m.id) && (m.role === "user" || m.role === "bot") && textOk && linksOk && chipsOk
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SiraChat({ data }: { data: ChatData }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [restored, setRestored] = useState(false);
  /** Vrai quand la bulle occupe l'écran : elle devient alors une vraie modale. */
  const [modal, setModal] = useState(false);

  const nextId = useRef(1);
  const returnFocus = useRef(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();
  const titleId = `${panelId}-titre`;

  // --- Reprise de la conversation d'une page à l'autre ---------------------
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        const bag = (typeof saved === "object" && saved !== null ? saved : {}) as Record<string, unknown>;
        const list = Array.isArray(bag.messages) ? bag.messages.filter(isStoredMessage) : [];
        // Une seule entrée abîmée suffit à jeter la conversation entière :
        // mieux vaut repartir à zéro qu'afficher une conversation trouée.
        const intact = Array.isArray(bag.messages) && list.length === bag.messages.length;
        if (intact && list.length > 0) {
          setMessages(list);
          nextId.current = Math.max(...list.map((m) => m.id)) + 1;
          if (bag.open === true) setOpen(true);
        } else if (!intact) {
          window.sessionStorage.removeItem(STORAGE_KEY);
        } else if (bag.open === true) {
          setOpen(true);
        }
      }
    } catch {
      // Stockage indisponible ou illisible : la conversation repart de zéro.
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Rien à faire de plus.
      }
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ open, messages: messages.slice(-STORED_MESSAGES) }),
      );
    } catch {
      // Stockage indisponible : la conversation reste en mémoire.
    }
  }, [open, messages, restored]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // L'identifiant est calculé avant l'appel : la fonction de mise à jour de
  // l'état doit rester pure, sous peine de doublons en rendu concurrent.
  const push = useCallback((message: Omit<ChatMessage, "id">) => {
    const id = nextId.current++;
    setMessages((current) => [...current, { ...message, id }]);
  }, []);

  // Premier message, posé à la première ouverture seulement.
  useEffect(() => {
    if (open && restored && messages.length === 0) {
      push({ role: "bot", ...openingAnswer(data) });
    }
  }, [open, restored, messages.length, push, data]);

  // Défilement vers le dernier message.
  useEffect(() => {
    const log = logRef.current;
    if (!log || !open) return;
    log.scrollTo({ top: log.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, pending, open]);

  // Ouverture : focus dans le champ. Fermeture demandée depuis la bulle :
  // retour au bouton, mais seulement une fois qu'il est de nouveau affiché
  // (sur téléphone, il est masqué tant que la bulle est ouverte).
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      launcherRef.current?.focus();
    }
  }, [open]);

  const close = useCallback(() => {
    returnFocus.current = true;
    setOpen(false);
  }, []);

  // Échap ferme la bulle, à condition que le focus s'y trouve : sinon, un
  // visiteur qui appuie sur Échap en remplissant un formulaire perdrait sa
  // place dans la page.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as Node | null;
      const inside = target ? panelRef.current?.contains(target) || launcherRef.current?.contains(target) : false;
      if (inside) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Sur téléphone, la bulle occupe l'écran : la page ne défile plus derrière,
  // et son contenu sort du parcours au clavier. Le verrou est partagé avec le
  // menu de navigation, qui peut être ouvert en même temps. Le tout suit les
  // changements de largeur, rotation de l'écran comprise.
  useEffect(() => {
    if (!open) return;
    const narrow = window.matchMedia("(max-width: 47.99rem)");
    let unlock: (() => void) | null = null;
    const apply = () => {
      const page = document.getElementById(PAGE_CONTENT_ID);
      if (narrow.matches && !unlock) {
        unlock = lockBodyScroll();
        page?.setAttribute("inert", "");
      } else if (!narrow.matches && unlock) {
        unlock();
        unlock = null;
        page?.removeAttribute("inert");
      }
      setModal(narrow.matches);
    };
    apply();
    narrow.addEventListener("change", apply);
    return () => {
      narrow.removeEventListener("change", apply);
      unlock?.();
      document.getElementById(PAGE_CONTENT_ID)?.removeAttribute("inert");
      setModal(false);
    };
  }, [open]);

  const ask = useCallback(
    (text: string) => {
      const question = text.trim();
      if (!question || pending) return;
      push({ role: "user", text: [question] });
      setDraft("");
      setPending(true);
      // Les suggestions disparaissent pendant l'attente : sans cela, le focus
      // retomberait sur la page quand on a cliqué sur l'une d'elles.
      inputRef.current?.focus();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(
        () => {
          push({ role: "bot", ...answerFor(question, data) });
          setPending(false);
          inputRef.current?.focus();
        },
        prefersReducedMotion() ? 0 : 480,
      );
    },
    [data, pending, push],
  );

  // Vider la liste suffit : l'effet d'ouverture repose le message d'accueil.
  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPending(false);
    setMessages([]);
    inputRef.current?.focus();
  }, []);

  const last = messages[messages.length - 1];
  const chips = !pending && last?.role === "bot" ? (last.chips ?? []) : [];

  return (
    <>
      {/* Bouton d'ouverture ------------------------------------------------ */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Fermer l'assistant SIRA" : "Ouvrir l'assistant SIRA"}
        className={cn(
          "fixed bottom-4 right-4 z-40 inline-flex h-14 items-center gap-2.5 rounded-full border border-site-border bg-site-navy px-4 text-white shadow-[0_10px_30px_rgba(17,17,73,0.28)] transition-colors duration-300 hover:bg-site-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-navy md:bottom-6 md:right-6",
          open && "max-md:hidden",
        )}
      >
        <SiraMark height={22} color="var(--color-site-gold)" />
        <span className="hidden text-[0.9375rem] font-semibold md:inline">
          {open ? "Fermer" : "Assistant SIRA"}
        </span>
      </button>

      {/* Bulle ------------------------------------------------------------- */}
      <div
        id={panelId}
        ref={panelRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-modal={modal || undefined}
        className={cn(
          "fixed inset-x-3 bottom-3 top-[5.5rem] z-40 flex flex-col overflow-hidden rounded-[1.25rem] border border-site-border bg-site-canvas shadow-[0_24px_60px_rgba(17,17,73,0.22)] motion-safe:animate-[site-menu-in_0.25s_ease-out] md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(34rem,calc(100vh-11rem))] md:w-[23.5rem]",
          !open && "hidden",
        )}
      >
        {/* En-tête */}
        <div className="flex items-start gap-3 border-b border-site-line bg-site-navy px-4 py-3.5 text-white">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-site-gold/50 bg-white/10"
          >
            <SiraMark height={18} color="var(--color-site-gold)" />
          </span>
          <div className="min-w-0 flex-1">
            <p id={titleId} className="site-display text-[1.0625rem] leading-tight">
              Assistant SIRA
            </p>
            <p className="mt-0.5 text-[0.75rem] leading-snug text-white/75">
              Réponses préparées, sans IA connectée
            </p>
          </div>
          {messages.length > 1 ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center rounded-full px-2.5 text-[0.8125rem] font-medium text-white/80 transition-colors hover:text-site-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-gold"
            >
              Effacer
            </button>
          ) : null}
          <button
            type="button"
            onClick={close}
            aria-label="Fermer l'assistant"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-gold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M5 5l14 14M19 5 5 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={logRef}
          className="site-on-light flex flex-1 flex-col overflow-y-auto overscroll-contain bg-site-light px-3.5 py-4"
        >
          {/* `mt-auto` colle les messages au bas de la zone sans couper le
              début de la conversation quand elle devient longue. */}
          <div role="log" aria-live="polite" aria-atomic="false" className="mt-auto space-y-3">
            {messages.map((message) => (
              <Bubble key={message.id} message={message} onNavigate={() => setOpen(false)} />
            ))}
            {pending ? <Typing /> : null}
          </div>
        </div>

        {/* Suggestions */}
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-site-line bg-site-canvas px-3.5 py-2.5">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => ask(chip)}
                className="inline-flex min-h-11 items-center rounded-full border border-site-border bg-white px-3.5 text-[0.8125rem] font-medium text-site-navy transition-colors hover:bg-site-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-navy"
              >
                {chip}
              </button>
            ))}
          </div>
        ) : null}

        {/* Saisie */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(draft);
          }}
          className="flex items-center gap-2 border-t border-site-line bg-site-canvas px-3 py-3"
        >
          <label htmlFor={`${panelId}-champ`} className="sr-only">
            Votre question pour l&apos;assistant SIRA
          </label>
          <input
            ref={inputRef}
            id={`${panelId}-champ`}
            name="question"
            type="text"
            autoComplete="off"
            maxLength={300}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Posez votre question…"
            className="h-11 min-w-0 flex-1 rounded-full border border-site-line bg-white px-4 text-[0.9375rem] text-site-ink outline-none placeholder:text-site-muted focus:border-site-navy"
          />
          <button
            type="submit"
            disabled={!draft.trim() || pending}
            aria-label="Envoyer la question"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-site-border bg-site-navy text-white transition-colors hover:bg-site-navy-deep disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-navy"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M4 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <p className="border-t border-site-line bg-site-canvas px-4 pb-3 pt-2 text-[0.75rem] leading-snug text-site-muted">
          Démonstration : les réponses sont préparées à l&apos;avance. Rien n&apos;est envoyé à un recruteur depuis
          cette fenêtre.
        </p>
      </div>
    </>
  );
}

/** Une bulle de message, côté visiteur ou côté assistant. */
function Bubble({ message, onNavigate }: { message: ChatMessage; onNavigate: () => void }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          // `break-words` évite qu'un mot très long (adresse collée, suite de
          // caractères) ne pousse la bulle hors de l'écran.
          "max-w-[85%] break-words rounded-[1rem] px-3.5 py-2.5 text-[0.875rem] leading-relaxed",
          isUser
            ? "bg-site-navy text-white"
            : "border border-site-border bg-white text-site-ink",
        )}
      >
        <p className="sr-only">{isUser ? "Vous" : "Assistant SIRA"} :</p>
        {message.text.map((paragraph, i) => (
          <p key={i} className={i > 0 ? "mt-2" : undefined}>
            {paragraph}
          </p>
        ))}
        {message.links && message.links.length > 0 ? (
          <ul className="mt-2.5 space-y-1.5 border-t border-site-line pt-2.5">
            {message.links.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-semibold text-site-navy"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="shrink-0 text-site-gold">
                    <path
                      d="M5 12h12M12 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="site-link">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/** Points d'attente pendant que la réponse se prépare. */
function Typing() {
  return (
    <div className="flex justify-start">
      <p className="inline-flex items-center gap-1.5 rounded-[1rem] border border-site-border bg-white px-3.5 py-3">
        <span className="sr-only">L&apos;assistant rédige une réponse…</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            style={{ animationDelay: `${i * 160}ms` }}
            className="inline-block h-1.5 w-1.5 rounded-full bg-site-navy/50 motion-safe:animate-pulse"
          />
        ))}
      </p>
    </div>
  );
}
