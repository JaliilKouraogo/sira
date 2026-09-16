/**
 * Politique de confidentialité : données collectées, finalités, durées de
 * conservation (section 10 du plan) et droits des personnes.
 *
 * Cadre panafricain : SIRA applique les lois de protection des données des
 * pays où elle opère, dont la loi burkinabè, pays de son siège.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Hl } from "@/components/site/kit";
import { LegalLayout, LegalTable, type LegalSection } from "@/components/site/legal-layout";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Données collectées par SIRA, finalités, durées de conservation, sous-traitants et exercice de vos droits d'accès, d'export et de suppression, partout en Afrique.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    title: "Qui traite vos données",
    body: (
      <>
        <p>
          SIRA est une plateforme panafricaine de mise en relation entre candidats, recruteurs et organismes de
          formation, dont le siège est établi à Ouagadougou, Burkina Faso. Elle est responsable du traitement des
          données décrites ci-dessous, quel que soit le pays depuis lequel vous utilisez le service.
        </p>
        <p>
          Pour toute question relative à vos données, écrivez à <a href="mailto:donnees@sira.bf">donnees@sira.bf</a>.
          Nous répondons à chaque demande, même lorsqu&apos;elle aboutit à un refus motivé.
        </p>
      </>
    ),
  },
  {
    id: "donnees",
    title: "Données que nous collectons",
    body: (
      <>
        <p>Nous ne collectons que ce dont le service a besoin pour fonctionner.</p>
        <ul>
          <li>
            <strong>Identification</strong> : nom, prénom, adresse e-mail, numéro de téléphone, mot de passe chiffré,
            langue d&apos;interface.
          </li>
          <li>
            <strong>Profil professionnel</strong> : titre, ville et zones de recherche, situation professionnelle,
            niveau d&apos;études, diplômes, expériences, compétences, langues, disponibilité, prétention salariale,
            mobilité, modes de travail acceptés.
          </li>
          <li>
            <strong>Documents</strong> : CV déposés, CV adaptés, lettres, e-mails et messages de candidature générés,
            pièces jointes demandées par une offre.
          </li>
          <li>
            <strong>Activité</strong> : offres consultées, offres enregistrées, candidatures préparées et envoyées,
            formations suivies, scores calculés.
          </li>
          <li>
            <strong>Organisation</strong>, pour les recruteurs : raison sociale, type, secteur, adresse, justificatifs
            de vérification, membres et rôles.
          </li>
          <li>
            <strong>Technique</strong> : journaux de connexion, adresse IP, type d&apos;appareil et de navigateur,
            strictement nécessaires à la sécurité et au diagnostic d&apos;incident.
          </li>
        </ul>
        <p>
          Nous ne collectons jamais de données relatives à l&apos;origine, l&apos;appartenance ethnique ou religieuse,
          les opinions politiques ou syndicales, la santé, la vie sexuelle ou le casier judiciaire. Si un CV déposé en
          contient, ces éléments ne sont ni extraits ni utilisés dans un calcul.
        </p>
      </>
    ),
  },
  {
    id: "finalites",
    title: "Pourquoi nous les traitons",
    body: (
      <ul>
        <li>
          <strong>Fournir le service</strong> : créer et tenir votre compte, publier et consulter des offres, déposer et
          suivre des candidatures. Base : exécution du contrat de service.
        </li>
        <li>
          <strong>Calculer le score de compatibilité</strong> et expliquer ce qui correspond ou manque, à partir de
          votre profil et de l&apos;offre consultée. Base : exécution du contrat de service.
        </li>
        <li>
          <strong>Générer les documents de candidature</strong> à votre demande, à partir des seules informations que
          vous avez fournies. Base : exécution du contrat de service.
        </li>
        <li>
          <strong>Vous notifier</strong> par e-mail, dans l&apos;application ou sur WhatsApp. La notification WhatsApp
          repose toujours sur un consentement explicite, révocable à tout moment.
        </li>
        <li>
          <strong>Assurer la sécurité</strong> et lutter contre les fausses offres et les fraudes. Base : intérêt
          légitime et obligations légales.
        </li>
        <li>
          <strong>Améliorer le service</strong> à partir de statistiques agrégées, qui ne permettent pas de vous
          identifier.
        </li>
      </ul>
    ),
  },
  {
    id: "partage",
    title: "Qui peut voir vos données",
    body: (
      <>
        <p>
          Votre profil n&apos;est pas public par défaut. Vous choisissez sa visibilité : invisible dans la recherche de
          talents, visible sans votre identité ni vos coordonnées, ou visible par les recruteurs vérifiés.
        </p>
        <ul>
          <li>
            <strong>Le recruteur d&apos;une offre</strong> reçoit votre candidature et les documents que vous avez
            validés, uniquement lorsque vous l&apos;envoyez.
          </li>
          <li>
            <strong>Nos sous-traitants techniques</strong> : hébergement, envoi d&apos;e-mails, messagerie WhatsApp,
            fournisseur de modèles d&apos;intelligence artificielle, service de paiement mobile. Ils agissent sur
            instruction et ne réutilisent pas vos données pour leur compte.
          </li>
          <li>
            <strong>Les autorités</strong>, sur réquisition légale uniquement.
          </li>
        </ul>
        <p>
          Nous ne vendons pas vos données et ne les cédons à aucun courtier. Certains sous-traitants étant situés hors
          de votre pays de résidence, voire hors du continent africain, les transferts sont encadrés contractuellement,
          conformes aux règles de transfert de chaque pays concerné et limités à ce qui est nécessaire au service.
        </p>
      </>
    ),
  },
  {
    id: "conservation",
    title: "Combien de temps nous les conservons",
    body: (
      <>
        <p>
          Chaque catégorie a une durée propre. Passé ce délai, la donnée est supprimée ou anonymisée de façon
          irréversible.
        </p>
        <LegalTable
          caption="Durées de conservation par catégorie de données"
          head={["Catégorie", "Durée de conservation", "Point de départ"]}
          rows={[
            ["Compte et profil", "Toute la vie du compte", "Suppression sur demande ou à la clôture"],
            ["CV déposés", "Vie du compte, puis 30 jours", "Clôture du compte"],
            [
              "Documents générés (CV adaptés, lettres, messages)",
              "12 mois",
              "Dernière activité sur le document ou la candidature",
            ],
            ["Candidatures envoyées", "Vie du compte", "Archivage possible à tout moment"],
            ["Journal d'audit", "24 mois", "Date de l'événement"],
            ["Consentements et leur révocation", "3 ans après révocation", "Date de révocation"],
            ["Journaux techniques de connexion", "12 mois", "Date de connexion"],
          ]}
        />
        <p>
          Les données de facturation obéissent aux durées légales de conservation comptable du pays concerné,
          indépendamment de la suppression de votre compte.
        </p>
      </>
    ),
  },
  {
    id: "droits",
    title: "Vos droits",
    body: (
      <>
        <p>
          SIRA respecte les lois de protection des données à caractère personnel de chaque pays où elle opère : au
          Burkina Faso, pays de son siège, la loi n° 010-2004/AN portant protection des données à caractère personnel et
          les décisions de la Commission de l&apos;informatique et des libertés (CIL) ; ailleurs, la loi nationale
          applicable et les décisions de l&apos;autorité de protection des données compétente. Où que vous résidiez,
          vous disposez au minimum des droits suivants.
        </p>
        <ul>
          <li>
            <strong>Accès</strong> : obtenir la liste des données que nous détenons sur vous et connaître leur origine.
          </li>
          <li>
            <strong>Rectification</strong> : corriger une information inexacte, directement depuis votre profil dans la
            plupart des cas.
          </li>
          <li>
            <strong>Export</strong> : récupérer votre profil, vos documents et vos candidatures dans un format lisible,
            depuis les paramètres de votre compte.
          </li>
          <li>
            <strong>Suppression</strong> : demander l&apos;effacement de votre compte et des données associées. La
            suppression est effective sous 30 jours, sauf obligation légale de conservation.
          </li>
          <li>
            <strong>Opposition et retrait du consentement</strong> : refuser les notifications WhatsApp ou les
            communications commerciales, sans que cela n&apos;affecte l&apos;usage du service. Refuser le marketing
            n&apos;entraîne aucune restriction.
          </li>
          <li>
            <strong>Réclamation</strong> : saisir l&apos;autorité de protection des données de votre pays, la CIL au
            Burkina Faso, si vous estimez que vos droits ne sont pas respectés.
          </li>
        </ul>
        <p>
          Ces demandes s&apos;exercent depuis vos paramètres, ou par écrit à{" "}
          <a href="mailto:donnees@sira.bf">donnees@sira.bf</a>. Nous répondons sous 30 jours.
        </p>
      </>
    ),
  },
  {
    id: "ia",
    title: "Intelligence artificielle et décisions",
    body: (
      <>
        <p>
          SIRA utilise des modèles d&apos;intelligence artificielle pour analyser un CV, calculer un score de
          compatibilité, résumer un profil et rédiger des documents de candidature. Trois règles encadrent cet usage.
        </p>
        <ul>
          <li>Aucun fait n&apos;est inventé : les documents produits ne contiennent que ce que vous avez déclaré.</li>
          <li>Rien n&apos;est envoyé sans votre relecture et votre validation explicite.</li>
          <li>
            Aucune décision de recrutement n&apos;est automatisée : le score classe et explique, il n&apos;écarte
            personne. Le recruteur voit toutes les candidatures reçues.
          </li>
        </ul>
        <p>
          Le score reste une estimation algorithmique qui ne garantit pas le recrutement. Le détail du calcul,
          composante par composante, est publié sur la page <Link href="/a-propos#ia">À propos</Link>.
        </p>
      </>
    ),
  },
  {
    id: "securite",
    title: "Sécurité",
    body: (
      <>
        <p>
          Les mots de passe sont stockés sous forme de condensats, les échanges sont chiffrés en transit, et
          l&apos;accès aux données de production est restreint et journalisé. L&apos;authentification à deux facteurs
          est disponible sur tous les comptes et recommandée pour les comptes recruteurs.
        </p>
        <p>
          En cas de violation de données susceptible de vous porter préjudice, nous vous informons ainsi que
          l&apos;autorité compétente, dans les meilleurs délais.
        </p>
      </>
    ),
  },
  {
    id: "modifications",
    title: "Modifications de cette politique",
    body: (
      <p>
        Toute modification substantielle vous est signalée dans l&apos;application et par e-mail au moins quinze jours
        avant son entrée en vigueur. La date de dernière mise à jour figure en tête de cette page.
      </p>
    ),
  },
];

export default function ConfidentialitePage() {
  return (
    <LegalLayout
      doc="confidentialite"
      title={
        <>
          Politique de <Hl>confidentialité</Hl>
        </>
      }
      updatedAt="2026-09-01"
      lead="Cette page décrit les données que SIRA collecte, pourquoi elle les traite, combien de temps elle les conserve, et comment exercer vos droits. Elle est écrite pour être lue, pas pour être subie."
      sections={SECTIONS}
      footer={{
        title: "Une question sur vos données ?",
        body: (
          <>
            Écrivez à <a href="mailto:donnees@sira.bf">donnees@sira.bf</a>. Vous pouvez aussi consulter les{" "}
            <Link href="/conditions">conditions d&apos;utilisation</Link> et la{" "}
            <Link href="/cookies">politique de cookies</Link>.
          </>
        ),
      }}
    />
  );
}
