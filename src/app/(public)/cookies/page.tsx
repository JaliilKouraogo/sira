/**
 * Politique de cookies. Peu de traceurs, expliqués un par un.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Hl } from "@/components/site/kit";
import { LegalLayout, LegalTable, type LegalSection } from "@/components/site/legal-layout";

export const metadata: Metadata = {
  title: "Politique de cookies",
  description:
    "Les cookies et traceurs utilisés par SIRA, leur finalité, leur durée de vie et la façon de les refuser ou de les supprimer.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "definition",
    title: "Ce qu'est un cookie",
    body: (
      <>
        <p>
          Un cookie est un petit fichier déposé par un site dans votre navigateur. Il permet de vous reconnaître
          d&apos;une page à l&apos;autre, de garder votre session ouverte, ou de mémoriser une préférence
          d&apos;affichage. Nous employons aussi le stockage local du navigateur, qui joue un rôle comparable.
        </p>
        <p>
          SIRA en utilise peu, et aucun à des fins publicitaires. Nous ne déposons aucun traceur de régie publicitaire,
          ni de réseau social.
        </p>
      </>
    ),
  },
  {
    id: "categories",
    title: "Les cookies que nous utilisons",
    body: (
      <>
        <LegalTable
          caption="Cookies et traceurs déposés par SIRA"
          head={["Nom", "Finalité", "Catégorie", "Durée"]}
          rows={[
            ["sira_session", "Maintenir votre session ouverte après connexion", "Nécessaire", "Session"],
            ["sira_csrf", "Protéger les formulaires contre les soumissions frauduleuses", "Nécessaire", "Session"],
            ["sira_theme", "Mémoriser votre choix de thème clair ou sombre", "Préférence", "12 mois"],
            ["sira_consent", "Conserver votre choix en matière de cookies", "Nécessaire", "6 mois"],
            [
              "sira_stats",
              "Mesure d'audience agrégée : pages vues, parcours, sans identification individuelle",
              "Mesure d'audience",
              "13 mois",
            ],
          ]}
        />
        <p>
          Les cookies nécessaires ne peuvent pas être désactivés : sans eux, la connexion et la sécurité des formulaires
          ne fonctionnent pas. Les autres sont facultatifs.
        </p>
      </>
    ),
  },
  {
    id: "consentement",
    title: "Votre choix",
    body: (
      <>
        <p>
          À votre première visite, un bandeau vous permet d&apos;accepter ou de refuser les cookies facultatifs. Le
          refus est aussi simple que l&apos;acceptation, et n&apos;empêche pas l&apos;usage du site.
        </p>
        <ul>
          <li>Votre choix est conservé six mois, puis la question vous est reposée.</li>
          <li>Vous pouvez le modifier à tout moment depuis les paramètres de votre compte.</li>
          <li>
            La mesure d&apos;audience n&apos;est activée qu&apos;avec votre accord, et les statistiques produites sont
            agrégées.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "navigateur",
    title: "Régler votre navigateur",
    body: (
      <>
        <p>
          Vous pouvez aussi bloquer ou supprimer les cookies depuis votre navigateur. Le réglage se trouve généralement
          dans les paramètres de confidentialité, à la rubrique cookies et données de sites.
        </p>
        <p>
          Bloquer tous les cookies empêche la connexion à votre espace : le cookie de session est indispensable au
          maintien de l&apos;authentification.
        </p>
      </>
    ),
  },
  {
    id: "tiers",
    title: "Services tiers",
    body: (
      <>
        <p>
          Certaines pages peuvent afficher un contenu hébergé par un tiers, par exemple le site d&apos;une organisation
          partenaire ouvert depuis une offre. Ces sites appliquent leur propre politique, sur laquelle nous n&apos;avons
          pas la main.
        </p>
        <p>
          Les notifications WhatsApp reposent sur un service tiers de messagerie. Elles ne déposent pas de cookie sur
          votre navigateur et dépendent d&apos;un consentement distinct, révocable dans vos préférences de
          notification.
        </p>
      </>
    ),
  },
  {
    id: "maj",
    title: "Mise à jour",
    body: (
      <p>
        Cette politique évolue avec le service et avec les règles applicables dans les pays où SIRA opère. Toute
        nouvelle catégorie de traceur donnera lieu à une nouvelle demande de consentement. La date de dernière mise à
        jour figure en tête de page.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      doc="cookies"
      title={
        <>
          Politique de <Hl>cookies</Hl>
        </>
      }
      updatedAt="2026-09-01"
      lead="SIRA utilise un nombre réduit de cookies : maintenir votre session, retenir vos préférences, et mesurer l'audience du site de façon anonyme. Aucun cookie publicitaire."
      sections={SECTIONS}
      footer={{
        title: "Pour aller plus loin",
        body: (
          <>
            Le détail des données traitées figure dans la{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>, et les règles d&apos;usage du service dans
            les <Link href="/conditions">conditions d&apos;utilisation</Link>.
          </>
        ),
      }}
    />
  );
}
