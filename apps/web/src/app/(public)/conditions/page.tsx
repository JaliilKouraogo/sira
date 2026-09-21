/**
 * Conditions générales d'utilisation.
 * Ton sobre : ce que le service fait, ce qu'il ne fait pas, et ce que
 * chacune des parties s'engage à respecter, partout en Afrique.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Hl } from "@/components/site/kit";
import { LegalLayout, type LegalSection } from "@/components/site/legal-layout";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Règles d'utilisation de SIRA : comptes, publication d'offres, vérification des recruteurs, usage de l'intelligence artificielle, abonnements et responsabilités.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "objet",
    title: "Objet",
    body: (
      <>
        <p>
          SIRA est une plateforme panafricaine de mise en relation entre des candidats à la recherche d&apos;une
          opportunité professionnelle, des organisations qui recrutent, et des organismes qui dispensent des formations.
          Les présentes conditions régissent l&apos;accès au site et l&apos;usage de ses fonctionnalités, quel que soit
          le pays depuis lequel vous y accédez.
        </p>
        <p>
          Créer un compte ou utiliser le service vaut acceptation de ces conditions. Si vous les refusez, vous devez
          cesser d&apos;utiliser la plateforme.
        </p>
      </>
    ),
  },
  {
    id: "compte",
    title: "Compte et éligibilité",
    body: (
      <ul>
        <li>
          Vous devez avoir au moins 16 ans pour créer un compte candidat, ou l&apos;âge supérieur exigé par la loi de
          votre pays de résidence.
        </li>
        <li>
          Les informations que vous déclarez doivent être exactes. Un profil délibérément faux peut être suspendu.
        </li>
        <li>
          Vous êtes responsable de la confidentialité de votre mot de passe et des actions réalisées depuis votre
          compte. L&apos;authentification à deux facteurs est disponible et recommandée.
        </li>
        <li>
          Un compte recruteur engage l&apos;organisation qu&apos;il représente. Son propriétaire garantit disposer du
          pouvoir de la représenter.
        </li>
      </ul>
    ),
  },
  {
    id: "offres",
    title: "Publication d'offres",
    body: (
      <>
        <p>Une offre publiée sur SIRA doit correspondre à un poste réel, ouvert et localisé. Sont interdits :</p>
        <ul>
          <li>toute demande d&apos;argent au candidat, à quelque titre que ce soit, frais de dossier compris ;</li>
          <li>
            les offres discriminatoires, notamment fondées sur l&apos;âge, le sexe, l&apos;origine, la religion,
            l&apos;état de santé, la situation familiale ou les opinions politiques ou syndicales ;
          </li>
          <li>
            les offres trompeuses sur la rémunération, la nature du contrat ou l&apos;identité de l&apos;employeur ;
          </li>
          <li>la collecte de données personnelles sans rapport avec le poste ;</li>
          <li>les contenus illicites, injurieux ou portant atteinte aux droits d&apos;un tiers.</li>
        </ul>
        <p>
          Une offre qui contrevient à ces règles est suspendue, et le compte qui l&apos;a publiée peut l&apos;être
          également. Tout visiteur peut signaler une offre depuis sa page.
        </p>
      </>
    ),
  },
  {
    id: "verification",
    title: "Vérification des recruteurs",
    body: (
      <>
        <p>
          Trois niveaux de vérification existent. Un compte non vérifié ne peut qu&apos;enregistrer des brouillons. Une
          vérification légère permet la publication après validation par un administrateur. Une vérification avec
          justificatifs permet la publication immédiate et donne droit au badge affiché sur les offres.
        </p>
        <p>
          SIRA contrôle la cohérence des pièces fournies, sans garantir l&apos;exactitude permanente des informations
          déclarées par une organisation. Le badge atteste d&apos;un contrôle documentaire, pas d&apos;un agrément. Le
          détail figure sur la page <Link href="/recruteurs#verification">recruteurs</Link>.
        </p>
      </>
    ),
  },
  {
    id: "candidatures",
    title: "Candidatures",
    body: (
      <>
        <p>
          SIRA transmet votre candidature selon le canal indiqué par l&apos;offre : dépôt sur la plateforme, e-mail
          relayé, ou canal externe propre au recruteur. Une candidature n&apos;est envoyée qu&apos;après votre
          validation explicite.
        </p>
        <p>
          SIRA ne garantit ni réponse du recruteur, ni entretien, ni recrutement. Le suivi affiché reflète ce que le
          recruteur renseigne ; l&apos;absence de mise à jour n&apos;est pas un refus.
        </p>
      </>
    ),
  },
  {
    id: "ia",
    title: "Usage de l'intelligence artificielle",
    body: (
      <>
        <p>
          Le score de compatibilité est une estimation algorithmique. Il ne garantit pas le recrutement et ne constitue
          pas une évaluation professionnelle. Il peut se tromper, notamment quand un profil est incomplet ou quand une
          offre est rédigée de façon imprécise.
        </p>
        <ul>
          <li>Les documents générés ne contiennent aucun fait que vous n&apos;avez pas déclaré.</li>
          <li>Vous restez l&apos;auteur et le responsable de ce que vous envoyez : relisez avant de valider.</li>
          <li>
            Aucune décision de recrutement n&apos;est prise automatiquement. Le classement proposé à un recruteur est
            une suggestion motivée, jamais un filtre éliminatoire.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "abonnements",
    title: "Abonnements et paiements",
    body: (
      <>
        <p>
          Les fonctionnalités de base sont gratuites pour les candidats. L&apos;espace recruteur est gratuit pendant la
          phase de lancement ; toute évolution tarifaire est annoncée au moins trente jours à l&apos;avance.
        </p>
        <ul>
          <li>Les paiements s&apos;effectuent par mobile money, carte bancaire ou virement.</li>
          <li>
            Un abonnement se renouvelle à échéance, sauf annulation avant la date de renouvellement. Vous conservez
            l&apos;accès jusqu&apos;au terme de la période payée.
          </li>
          <li>
            En cas d&apos;échec de paiement, une période de grâce précède la suspension des fonctions payantes. Vos
            données restent accessibles.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "propriete",
    title: "Propriété intellectuelle",
    body: (
      <>
        <p>
          La plateforme, sa marque, son interface et son code restent la propriété de SIRA. Vous conservez la propriété
          des contenus que vous déposez, notamment vos CV, et nous accordez la licence strictement nécessaire pour les
          héberger, les afficher dans votre espace et les transmettre aux recruteurs auxquels vous candidatez.
        </p>
        <p>
          Les offres publiées restent la propriété de l&apos;organisation qui les publie. L&apos;extraction automatisée
          massive du contenu du site est interdite.
        </p>
      </>
    ),
  },
  {
    id: "responsabilite",
    title: "Responsabilité",
    body: (
      <>
        <p>
          SIRA fournit un service de mise en relation. Elle n&apos;est ni l&apos;employeur, ni le mandataire des
          organisations qui publient des offres, et n&apos;intervient pas dans la relation contractuelle qui peut en
          naître.
        </p>
        <p>
          Nous mettons en œuvre les moyens raisonnables pour assurer la disponibilité et l&apos;exactitude du service,
          sans garantir une disponibilité ininterrompue. Notre responsabilité ne saurait être engagée pour un préjudice
          indirect, notamment une perte de chance liée à un recrutement non obtenu.
        </p>
      </>
    ),
  },
  {
    id: "suspension",
    title: "Suspension et résiliation",
    body: (
      <p>
        Vous pouvez supprimer votre compte à tout moment depuis vos paramètres. Nous pouvons suspendre ou fermer un
        compte en cas de manquement aux présentes conditions, de fraude, ou d&apos;atteinte à la sécurité du service.
        Sauf urgence ou obligation légale, la suspension est motivée et notifiée.
      </p>
    ),
  },
  {
    id: "droit",
    title: "Droit applicable",
    body: (
      <>
        <p>
          SIRA ayant son siège à Ouagadougou, les présentes conditions sont régies par le droit burkinabè, sous réserve
          des dispositions impératives du pays de résidence de l&apos;utilisateur qui lui seraient plus favorables.
        </p>
        <p>
          Le traitement des données personnelles obéit aux lois de protection des données des pays où SIRA opère,
          notamment, au Burkina Faso, la loi n° 010-2004/AN portant protection des données à caractère personnel. Le
          détail figure dans la <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
        <p>
          Tout litige fait d&apos;abord l&apos;objet d&apos;une tentative de règlement amiable ; à défaut, les
          juridictions compétentes de Ouagadougou sont saisies, sauf règle de compétence impérative contraire.
        </p>
      </>
    ),
  },
];

export default function ConditionsPage() {
  return (
    <LegalLayout
      doc="conditions"
      title={
        <>
          Conditions <Hl>d&apos;utilisation</Hl>
        </>
      }
      updatedAt="2026-09-01"
      lead="Ces conditions décrivent ce que SIRA s'engage à faire, ce qu'elle ne fait pas, et les règles que candidats, recruteurs et formateurs acceptent en utilisant la plateforme."
      sections={SECTIONS}
      footer={{
        title: "Documents liés",
        body: (
          <>
            Consultez également la <Link href="/confidentialite">politique de confidentialité</Link> et la{" "}
            <Link href="/cookies">politique de cookies</Link>.
          </>
        ),
      }}
    />
  );
}
