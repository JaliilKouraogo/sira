/**
 * Back-office — paramètres généraux, règles métier et journaux [T §21.5].
 *
 * Les onze règles métier RM-01 à RM-11 sont écrites ici en toutes lettres :
 * elles sont la référence commune du produit, du développement et du support.
 *
 * Direction épurée : réglages, règles et journaux posés à même la page,
 * séparés par des filets de 1 pixel.
 */

import type { Metadata } from "next";
import { AdminActions } from "@/components/admin-actions";
import { Table, Td, TdMuted, Tr, formatInt } from "@/components/admin-kit";
import { Alert, Badge, DataList, PageHeader, Stat, Tag, formatDate, relativeDays } from "@/components/ui";
import { getAuditLogs } from "@/data/queries";
import { BLOCKING_CRITERIA_CAP, CURRENCY } from "@/lib/enums";

export const metadata: Metadata = {
  title: "Paramètres | Administration SIRA",
};

/** Les onze règles métier du produit. Énoncé normatif, écran d'application. */
const BUSINESS_RULES: { code: string; statement: string; applies: string }[] = [
  {
    code: "RM-01",
    statement:
      "Une organisation non vérifiée ne publie pas. Elle rédige ses offres, qui restent des brouillons tant qu'aucun justificatif n'est contrôlé.",
    applies: "Recruteurs, Offres",
  },
  {
    code: "RM-02",
    statement:
      "Une offre n'accepte de candidature que si son statut est « publiée ». Tout autre statut ferme le dépôt, y compris par lien direct.",
    applies: "Offres, Candidatures",
  },
  {
    code: "RM-03",
    statement:
      "Une organisation en vérification légère voit chacune de ses offres passer en file de validation : publication après contrôle a priori par un administrateur.",
    applies: "Modération des offres",
  },
  {
    code: "RM-04",
    statement:
      "Une organisation vérifiée publie immédiatement, avec le badge « Vérifié », et relève d'une modération a posteriori sur signalement.",
    applies: "Recruteurs, Modération",
  },
  {
    code: "RM-05",
    statement: `Un critère indispensable non satisfait plafonne le score de compatibilité à ${BLOCKING_CRITERIA_CAP} sur 100, quelles que soient les autres composantes.`,
    applies: "IA et matching",
  },
  {
    code: "RM-06",
    statement:
      "Le score affiché sur une candidature est gelé au moment de l'envoi. Un recalcul ultérieur du modèle ne modifie pas une candidature déjà partie.",
    applies: "Candidatures",
  },
  {
    code: "RM-07",
    statement:
      "Tout contenu produit par l'IA est un brouillon. Il est présenté comme tel, relu et validé par une personne avant tout envoi à un recruteur.",
    applies: "Documents, Candidatures",
  },
  {
    code: "RM-08",
    statement:
      "Une communication commerciale exige un consentement explicite sur chaque canal, y compris dans l'application. Le retrait du consentement vaut immédiatement.",
    applies: "Notifications, Campagnes",
  },
  {
    code: "RM-09",
    statement:
      "Tout envoi WhatsApp exige un consentement explicite, quel que soit le type d'événement, même lorsqu'il s'agit du service.",
    applies: "Notifications",
  },
  {
    code: "RM-10",
    statement:
      "Une offre n'est visible dans la recherche, dans les flux et pour les moteurs de recherche que si elle est publiée. Une offre retirée sort de l'index.",
    applies: "Offres, Site public",
  },
  {
    code: "RM-11",
    statement:
      "Une campagne suit l'ordre création, modération, paiement, diffusion. Aucune étape ne se saute : pas de paiement avant validation, pas de diffusion avant paiement.",
    applies: "Campagnes",
  },
];

const GENERAL_SETTINGS: { label: string; value: string }[] = [
  { label: "Nom de la plateforme", value: "SIRA — Le chemin vers l'opportunité" },
  { label: "Pays de référence", value: "Burkina Faso" },
  { label: "Fuseau horaire", value: "UTC (heure du Burkina Faso)" },
  { label: "Langue par défaut", value: "Français" },
  { label: "Devise d'affichage", value: CURRENCY },
  { label: "Durée de vie d'une offre", value: "60 jours, puis expiration automatique" },
  { label: "Délai cible de validation d'une offre", value: "24 heures ouvrées" },
  { label: "Délai cible d'instruction d'un signalement", value: "48 heures" },
  { label: "Taille maximale d'un CV déposé", value: "5 Mo, formats PDF, DOC et DOCX" },
  { label: "Conservation des journaux d'audit", value: "36 mois" },
  { label: "Conservation d'un compte supprimé", value: "30 jours, puis effacement définitif" },
];

/** Journal d'erreurs applicatives, simulé. */
const ERROR_LOG: { id: string; level: "Erreur" | "Alerte" | "Information"; message: string; scope: string; at: string; count: number }[] = [
  {
    id: "err_01",
    level: "Alerte",
    message: "Latence du modèle au-dessus de 10 secondes sur l'adaptation de CV",
    scope: "Service IA",
    at: "2026-09-11",
    count: 3,
  },
  {
    id: "err_02",
    level: "Erreur",
    message: "Échec de notification WhatsApp : numéro non enregistré au service",
    scope: "Notifications",
    at: "2026-09-10",
    count: 1,
  },
  {
    id: "err_03",
    level: "Erreur",
    message: "Paiement refusé par l'opérateur : solde insuffisant",
    scope: "Paiements",
    at: "2026-08-20",
    count: 1,
  },
  {
    id: "err_04",
    level: "Information",
    message: "Expiration automatique d'offres arrivées à échéance",
    scope: "Offres",
    at: "2026-09-09",
    count: 1,
  },
];

const LEVEL_TONE = {
  Erreur: "danger",
  Alerte: "warning",
  Information: "neutral",
} as const;

export default function AdminSettingsPage() {
  const auditLogs = [...getAuditLogs()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const errors = ERROR_LOG.filter((e) => e.level === "Erreur");

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Réglages généraux de la plateforme, énoncé des règles métier et accès aux journaux. Toute modification est tracée au journal d'audit, avec son auteur."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Règles métier" value={formatInt(BUSINESS_RULES.length)} />
        <Stat label="Paramètres généraux" value={formatInt(GENERAL_SETTINGS.length)} />
        <Stat label="Erreurs ouvertes" value={formatInt(errors.length)} hint="Sur les 30 derniers jours" />
      </div>

      {/* ---- Paramètres généraux ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Paramètres généraux</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Configuration de la plateforme, appliquée à l&apos;ensemble des espaces
            </p>
          </div>
          <AdminActions actions={[{ label: "Modifier", variant: "outline" }]} subject="la configuration" />
        </div>
        <div className="border-t border-[var(--color-border)]">
          <DataList rows={GENERAL_SETTINGS.map((s) => ({ label: s.label, value: s.value }))} />
        </div>
      </section>

      {/* ---- Règles métier ---- */}
      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="mb-4 text-[17px] font-semibold text-[var(--color-text)]">Règles métier</h2>
        <Alert tone="info" title="Onze règles, opposables à tous les écrans">
          Ces règles ne se négocient pas écran par écran. Une interface qui les contredit est en défaut, pas la
          règle. Elles sont rappelées ici pour que le support, le produit et le développement citent le même texte.
        </Alert>
        <div className="mt-5">
          <Table head={["Code", "Énoncé", "Écrans concernés"]} minWidth={820}>
            {BUSINESS_RULES.map((rule) => (
              <Tr key={rule.code}>
                <Td className="align-top">
                  <Badge tone="primary">{rule.code}</Badge>
                </Td>
                <Td className="text-[13px] leading-relaxed">{rule.statement}</Td>
                <Td className="align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {rule.applies.split(", ").map((screen) => (
                      <Tag key={screen}>{screen}</Tag>
                    ))}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </section>

      {/* ---- Journaux ---- */}
      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Journal d&apos;audit</h2>
          <p className="mt-0.5 mb-4 text-[12.5px] text-[var(--color-text-muted)]">
            Actions d&apos;administration, conservées 36 mois
          </p>
          <Table head={["Action", "Auteur", "Objet", "Quand"]} minWidth={560}>
            {auditLogs.map((log) => (
              <Tr key={log.id}>
                <Td className="font-medium">{log.action}</Td>
                <TdMuted>{log.actor}</TdMuted>
                <TdMuted>
                  {log.objectType} {log.objectId}
                </TdMuted>
                <TdMuted>{relativeDays(log.createdAt)}</TdMuted>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Journal d&apos;erreurs</h2>
          <p className="mt-0.5 mb-4 text-[12.5px] text-[var(--color-text-muted)]">
            Incidents applicatifs regroupés par empreinte
          </p>
          <Table head={["Niveau", "Message", "Périmètre", "Occurrences", "Dernière"]} minWidth={620}>
            {ERROR_LOG.map((entry) => (
              <Tr key={entry.id}>
                <Td>
                  <Badge tone={LEVEL_TONE[entry.level]}>{entry.level}</Badge>
                </Td>
                <Td className="max-w-[260px] text-[13px]">{entry.message}</Td>
                <TdMuted>{entry.scope}</TdMuted>
                <TdMuted>{entry.count}</TdMuted>
                <TdMuted>{formatDate(entry.at)}</TdMuted>
              </Tr>
            ))}
          </Table>
        </div>
      </section>
    </>
  );
}
