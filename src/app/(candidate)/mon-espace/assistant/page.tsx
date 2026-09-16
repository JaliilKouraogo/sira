"use client";

/**
 * Assistant SIRA — [T §6.7].
 *
 * Fil de conversation, zone de saisie et 8 raccourcis de commande. Les
 * commandes réservées au plan Premium restent visibles et portent une
 * étiquette : elles n'ouvrent pas la fonction, elles expliquent ce qu'elle
 * ferait et invitent à passer Premium.
 *
 * `"use client"` est nécessaire : l'envoi d'un message ajoute une réponse
 * simulée au fil, sans aucun aller-retour serveur.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { PremiumTag } from "@/components/account-shared";
import {
  IconArrowRight,
  IconBriefcase,
  IconChart,
  IconChat,
  IconFile,
  IconGraduation,
  IconMail,
  IconSparkles,
  IconTarget,
  IconUser,
} from "@/components/icons";
import { Badge, Button, Card, PageHeader, Progress, Textarea, cx } from "@/components/ui";
import { getAllDocuments, getUsageCounters } from "@/data/queries";
import { DOCUMENT_TYPE_LABEL } from "@/lib/enums";
import type { ChatMessage } from "@/lib/types";

const TODAY = "2026-09-12";

interface Command {
  key: string;
  label: string;
  icon: React.ReactNode;
  premium?: boolean;
  prompt: string;
  reply: string;
}

/** Les 8 raccourcis de commande de l'assistant. */
const COMMANDS: Command[] = [
  {
    key: "analyser-cv",
    label: "Analyser mon CV",
    icon: <IconFile size={15} />,
    prompt: "Analyse mon CV.",
    reply:
      "Votre CV de septembre 2026 est lisible et bien structuré. Trois remarques : vos résultats chiffrés (‑22 % de ruptures) méritent d'être remontés en tête d'expérience ; la ligne « Excel avancé » gagnerait à préciser les fonctions maîtrisées (TCD, RECHERCHEX) ; aucune expérience d'encadrement n'apparaît alors que vous coordonnez trois magasiniers, c'est une perte sèche sur les offres de responsable. Votre quota d'analyse approfondie du mois est déjà consommé : cette relecture est une lecture rapide.",
  },
  {
    key: "trouver-offres",
    label: "Trouver des offres",
    icon: <IconBriefcase size={15} />,
    prompt: "Trouve-moi des offres qui me correspondent.",
    reply:
      "Trois offres se détachent cette semaine : Magasinier chez Sahel Agro (88 %), Responsable logistique à Bobo-Dioulasso (62 %) et Chef de projet digital à la BRF (47 %). Vous avez utilisé 3 de vos 5 recommandations IA de la semaine avec le plan Gratuit.",
  },
  {
    key: "preparer-candidature",
    label: "Préparer candidature",
    icon: <IconTarget size={15} />,
    prompt: "Prépare ma candidature pour l'offre de Responsable logistique.",
    reply:
      "Je peux produire le CV adapté, la lettre de motivation et la checklist des pièces exigées (CV, lettre, copie des diplômes). Rien ne part avant votre relecture et votre validation. Il vous reste 1 préparation de candidature sur 2 ce mois-ci.",
  },
  {
    key: "adapter-cv",
    label: "Adapter CV",
    icon: <IconSparkles size={15} />,
    prompt: "Adapte mon CV à l'offre de Responsable logistique.",
    reply:
      "Version adaptée prête : j'ai remonté la gestion d'entrepôt et les inventaires tournants en tête, reformulé votre accroche autour de l'agro-industrie, et déplacé la partie commerciale en fin de document. Le fichier est déposé dans vos documents, en version 2.",
  },
  {
    key: "lettre",
    label: "Faire une lettre",
    icon: <IconMail size={15} />,
    prompt: "Écris une lettre de motivation pour cette offre.",
    reply:
      "La lettre est rédigée en trois paragraphes : votre résultat chiffré en ouverture, le lien explicite avec l'unité de conditionnement de Bobo-Dioulasso, puis votre disponibilité sous un mois. Relisez-la : devant le recruteur, c'est votre texte, pas le mien.",
  },
  {
    key: "entretien",
    label: "Préparer entretien",
    icon: <IconChat size={15} />,
    premium: true,
    prompt: "Prépare-moi à l'entretien.",
    reply:
      "La préparation à l'entretien fait partie du plan Premium : questions probables sur le poste, réponses travaillées sur vos points faibles (SAP, anglais), simulation d'entretien et retour détaillé. Avec le plan Gratuit, je peux déjà vous donner les trois questions les plus fréquentes sur les postes de responsable logistique.",
  },
  {
    key: "formation",
    label: "Trouver formation",
    icon: <IconGraduation size={15} />,
    prompt: "Quelle formation comblerait mes lacunes ?",
    reply:
      "Deux formations visent directement vos lacunes : « Initiation à SAP MM » (28 h, présentiel, démarre dans 21 jours) pour la compétence SAP MM, et « Anglais professionnel pour la logistique » (40 h, incluse avec Premium) pour le niveau d'anglais attendu. Toutes deux figurent dans l'onglet « Pour améliorer mon score ».",
  },
  {
    key: "historique",
    label: "Historique",
    icon: <IconChart size={15} />,
    prompt: "Montre-moi l'historique de mes échanges.",
    reply:
      "Vos conversations sont conservées dans le panneau de droite, avec les documents produits à chaque fois. Vous pouvez reprendre n'importe quel échange, ou demander la suppression de l'historique depuis vos paramètres.",
  },
];

/** Conversation d'ouverture : la question que pose vraiment une candidate. */
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg_01",
    role: "assistant",
    content:
      "Bonjour Awa. Je peux analyser votre CV, chercher des offres, préparer un dossier de candidature ou vous orienter vers une formation. Que souhaitez-vous faire ?",
    createdAt: TODAY,
  },
  {
    id: "msg_02",
    role: "user",
    content: "Pourquoi mon score n'est que de 62 % sur l'offre de Responsable logistique ?",
    createdAt: TODAY,
  },
  {
    id: "msg_03",
    role: "assistant",
    content:
      "Votre score de 62 % vient de six composantes pondérées.\n\n• Compétences (poids 35 %) : 55 %. Trois compétences requises sur quatre sont présentes — gestion de stock, Excel avancé, planification. Il manque « Management d'équipe » et « SAP MM ». C'est la composante la plus lourde, et celle qui vous coûte le plus.\n• Expérience (20 %) : 80 %. L'offre demande 4 ans, votre profil en affiche 5.\n• Formation (15 %) : 100 %. Votre licence professionnelle en logistique atteint le niveau attendu.\n• Localisation (15 %) : 60 %. Le poste est à Bobo-Dioulasso, vous résidez à Ouagadougou, avec une mobilité déclarée.\n• Langues (10 %) : 50 %. L'anglais professionnel est demandé, votre niveau déclaré est scolaire.\n• Disponibilité (5 %) : 100 %. Disponible sous un mois, en CDI : cela correspond.\n\nAucun critère indispensable n'est bloquant sur cette offre, votre score n'est donc pas plafonné. Estimation algorithmique fondée sur les informations disponibles : elle ne garantit pas le recrutement.",
    createdAt: TODAY,
  },
  {
    id: "msg_04",
    role: "user",
    content: "Comment je peux le faire monter ?",
    createdAt: TODAY,
  },
  {
    id: "msg_05",
    role: "assistant",
    content:
      "Trois leviers, du plus rentable au moins rentable.\n\n1. Détaillez votre encadrement d'équipe dans votre profil : vous coordonnez trois magasiniers chez Faso Distribution, mais cela n'apparaît nulle part. Gain estimé : +6 points, sans rien apprendre de nouveau.\n2. Suivez « Initiation à SAP MM » (28 h). SAP MM est explicitement demandé et vous manque. Gain estimé : +9 points.\n3. Passez votre anglais de scolaire à professionnel. La formation « Anglais professionnel pour la logistique » est incluse avec Premium. Gain estimé : +4 points.\n\nLe premier levier est gratuit et immédiat, je vous conseille de commencer par là.",
    createdAt: TODAY,
    attachments: [
      { label: "Voir les formations recommandées", href: "/mon-espace/formations?onglet=score" },
      { label: "Compléter mon profil", href: "/mon-espace/profil" },
    ],
  },
];

const CONVERSATIONS = [
  { id: "cnv_01", title: "Mon score sur Responsable logistique", date: "Aujourd'hui", active: true },
  { id: "cnv_02", title: "Lettre de motivation Sahel Agro", date: "Hier" },
  { id: "cnv_03", title: "Quelles offres à Bobo-Dioulasso ?", date: "Il y a 4 jours" },
  { id: "cnv_04", title: "Relecture de mon CV", date: "Il y a 2 semaines" },
];

/** Réponse simulée à une saisie libre, choisie sur quelques mots-clés. */
function simulateReply(input: string): string {
  const text = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  const matched = COMMANDS.find((command) =>
    command.key
      .split("-")
      .some((fragment) => fragment.length > 3 && text.includes(fragment)),
  );
  if (matched) return matched.reply;

  if (text.includes("score") || text.includes("pourcent")) {
    return "Votre score se décompose en six composantes pondérées : compétences (35 %), expérience (20 %), formation (15 %), localisation (15 %), langues (10 %) et disponibilité (5 %). Dites-moi sur quelle offre vous voulez le détail, je vous donne le calcul ligne à ligne. Cette estimation ne garantit pas le recrutement.";
  }
  if (text.includes("salaire") || text.includes("remuneration")) {
    return "Vos attentes sont fixées à 500 000 FCFA. Sur les offres de logistique publiées ce mois-ci à Ouagadougou et Bobo-Dioulasso, la fourchette observée va de 350 000 à 650 000 FCFA. Vous êtes dans la moitié haute, ce qui est cohérent avec vos cinq ans d'expérience.";
  }
  if (text.includes("entretien")) {
    return "La préparation complète à l'entretien relève du plan Premium. Je peux néanmoins vous donner gratuitement les trois questions qui reviennent le plus sur les postes de responsable logistique, et la structure de réponse attendue.";
  }
  return "C'est noté. Pour vous répondre précisément, indiquez-moi l'offre concernée ou utilisez l'un des raccourcis ci-dessous : je peux analyser votre CV, chercher des offres, préparer un dossier, adapter votre CV, rédiger une lettre ou vous orienter vers une formation.";
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  const documents = useMemo(() => getAllDocuments().slice(0, 6), []);
  const quota = getUsageCounters().find((counter) => counter.feature === "recommendations");

  function append(prompt: string, reply: string) {
    setMessages((previous) => {
      const base = previous.length;
      return [
        ...previous,
        { id: `msg_local_${base + 1}`, role: "user", content: prompt, createdAt: TODAY },
        { id: `msg_local_${base + 2}`, role: "assistant", content: reply, createdAt: TODAY },
      ];
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    append(value, simulateReply(value));
    setDraft("");
  }

  return (
    <>
      <PageHeader
        title="Assistant SIRA"
        description="Posez vos questions sur vos scores, vos offres et vos candidatures. L'assistant propose, vous décidez."
      />

      <div className="grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_290px]">
        {/* ---------------- Fil de conversation ---------------- */}
        <div className="min-w-0">
          <Card className="flex min-h-[60vh] flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Ma conversation</h2>
                <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                  Les réponses sont des propositions : vérifiez-les avant d&apos;agir.
                </p>
              </div>
              <Badge tone="neutral">Plan Gratuit</Badge>
            </div>

            <div
              className="scrollbar-slim flex-1 space-y-4 overflow-y-auto p-4"
              role="log"
              aria-live="polite"
              aria-label="Fil de conversation avec l'assistant"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cx("flex gap-2.5", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "assistant" ? (
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]"
                      aria-hidden
                    >
                      <IconSparkles size={14} />
                    </span>
                  ) : null}

                  <div className={cx("min-w-0 max-w-[85%]", message.role === "user" ? "text-right" : undefined)}>
                    <p className="mb-1 text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)]">
                      {message.role === "assistant" ? "Assistant SIRA" : "Vous"}
                    </p>
                    <div
                      className={cx(
                        "inline-block whitespace-pre-wrap rounded-md border border-[var(--color-border)] px-3.5 py-2.5 text-left text-[13.5px] leading-relaxed text-[var(--color-text)]",
                        message.role === "user" ? "bg-[var(--color-surface-2)]" : "bg-[var(--color-bg)]",
                      )}
                    >
                      {message.content}
                    </div>

                    {message.attachments && message.attachments.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.attachments.map((attachment) => (
                          <Link
                            key={attachment.href}
                            href={attachment.href}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                          >
                            {attachment.label}
                            <IconArrowRight size={13} />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {message.role === "user" ? (
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-subtle)]"
                      aria-hidden
                    >
                      <IconUser size={14} />
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Zone de saisie */}
            <form onSubmit={handleSubmit} className="border-t border-[var(--color-border)] p-3">
              <label htmlFor="assistant-input" className="sr-only">
                Votre message à l&apos;assistant
              </label>
              <div className="flex items-end gap-2">
                <Textarea
                  id="assistant-input"
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Posez votre question : « Pourquoi ce score ? », « Adapte mon CV à cette offre »…"
                  className="min-h-[52px] flex-1 resize-none"
                />
                <Button type="submit" variant="primary" size="md" disabled={draft.trim().length === 0}>
                  Envoyer
                </Button>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-text-subtle)]">
                Démonstration : les réponses sont simulées côté navigateur. L&apos;assistant ne transmet jamais un
                document à un recruteur sans votre validation explicite.
              </p>
            </form>
          </Card>

          {/* Raccourcis de commande */}
          <section className="mt-8 border-t border-[var(--color-border)] pt-7">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Raccourcis</h2>
            <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
              Huit commandes pour aller droit au but.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COMMANDS.map((command) => (
                <button
                  key={command.key}
                  type="button"
                  onClick={() => append(command.prompt, command.reply)}
                  className="flex items-center gap-2.5 rounded-md border border-[var(--color-border)] px-3 py-2.5 text-left text-[13.5px] font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
                >
                  <span className="shrink-0 text-[var(--color-primary)]" aria-hidden>
                    {command.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{command.label}</span>
                  {command.premium ? <PremiumTag /> : null}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              La préparation aux entretiens et le coach carrière appartiennent au plan Premium. Les commandes restent
              accessibles : l&apos;assistant vous explique ce qu&apos;elles feraient et ce que le plan Gratuit permet
              déjà.{" "}
              <Link href="/mon-espace/abonnement" className="font-medium text-[var(--color-primary)] hover:underline">
                Comparer les formules
              </Link>
            </p>
          </section>
        </div>

        {/* ---------------- Panneau latéral ---------------- */}
        <aside className="mt-8 lg:mt-0 lg:border-l lg:border-[var(--color-border)] lg:pl-8">
          <section className="border-b border-[var(--color-border)] pb-6">
            <h2 className="mb-2 text-[14px] font-semibold text-[var(--color-text)]">Mes conversations</h2>
            <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {CONVERSATIONS.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className={cx(
                      "w-full px-2 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-2)]",
                      conversation.active ? "bg-[var(--color-surface-2)]" : undefined,
                    )}
                    aria-current={conversation.active ? "true" : undefined}
                  >
                    <p
                      className={cx(
                        "truncate text-[13px]",
                        conversation.active
                          ? "font-semibold text-[var(--color-text)]"
                          : "font-medium text-[var(--color-text)]",
                      )}
                    >
                      {conversation.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--color-text-subtle)]">{conversation.date}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-b border-[var(--color-border)] py-6">
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Documents produits</h2>
            <p className="mb-2 mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Issus de vos échanges avec l&apos;assistant.
            </p>
            {documents.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Aucun document pour le moment.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {documents.map((entry) => (
                  <li key={entry.doc.id}>
                    <Link
                      href={`/mon-espace/candidatures/${entry.application.id}`}
                      className="flex items-start gap-2.5 px-2 py-2.5 hover:bg-[var(--color-surface-2)]"
                    >
                      <span className="mt-0.5 shrink-0 text-[var(--color-text-subtle)]" aria-hidden>
                        <IconFile size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-[var(--color-text)]">
                          {DOCUMENT_TYPE_LABEL[entry.doc.documentType]}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-muted)]">
                          {entry.job?.title ?? "Candidature"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link
                href="/mon-espace/documents"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                Tous mes documents
                <IconArrowRight size={13} />
              </Link>
            </div>
          </section>

          {quota ? (
            <section className="py-6">
              <p className="text-[13px] font-medium text-[var(--color-text)]">{quota.label}</p>
              <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
                {quota.consumed} sur {quota.limit ?? "illimité"} · {quota.period.toLowerCase()}
              </p>
              <Progress
                className="mt-2"
                value={quota.limit ? (quota.consumed / quota.limit) * 100 : 0}
                tone="primary"
                label={quota.label}
              />
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                Plan Gratuit : 5 recommandations IA par semaine. Le compteur repart chaque lundi.
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
