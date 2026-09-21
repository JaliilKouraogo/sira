/**
 * Référentiel des énumérations SIRA — section 5 du plan de conception.
 *
 * Ces valeurs sont NORMATIVES. Le code technique est en anglais snake_case,
 * le libellé affiché est en français. Toute nouvelle valeur se déclare ici
 * et nulle part ailleurs : écrans, filtres et back-office lisent cette source.
 */

// --------------------------------------------------------------------------
// Rôles et organisations
// --------------------------------------------------------------------------

export const USER_ROLES = ["candidate", "recruiter", "trainer", "admin", "moderator"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  candidate: "Candidat",
  recruiter: "Recruteur",
  trainer: "Formateur",
  admin: "Administrateur",
  moderator: "Modérateur",
};

export const ORGANIZATION_TYPES = [
  "entreprise",
  "ong_association",
  "cabinet_recrutement",
  "institution_publique",
  "etablissement_enseignement",
  "centre_formation",
  "particulier",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_TYPE_LABEL: Record<OrganizationType, string> = {
  entreprise: "Entreprise",
  ong_association: "ONG / Association",
  cabinet_recrutement: "Cabinet de recrutement",
  institution_publique: "Institution publique",
  etablissement_enseignement: "Établissement d'enseignement",
  centre_formation: "Centre de formation",
  particulier: "Particulier",
};

/** Capacités par type d'organisation — section 2.2 du plan. */
export const ORGANIZATION_CAPABILITIES: Record<
  OrganizationType,
  { jobs: boolean; trainings: boolean; campaigns: boolean; documents: string }
> = {
  entreprise: { jobs: true, trainings: false, campaigns: false, documents: "RCCM, IFU" },
  ong_association: { jobs: true, trainings: true, campaigns: true, documents: "Récépissé, statuts" },
  cabinet_recrutement: { jobs: true, trainings: false, campaigns: false, documents: "RCCM, agrément" },
  institution_publique: { jobs: true, trainings: true, campaigns: true, documents: "Acte administratif" },
  etablissement_enseignement: { jobs: true, trainings: true, campaigns: true, documents: "Arrêté d'ouverture" },
  centre_formation: { jobs: false, trainings: true, campaigns: true, documents: "Agrément, RCCM" },
  particulier: { jobs: true, trainings: false, campaigns: false, documents: "Pièce d'identité" },
};

export const VERIFICATION_STATUSES = [
  "non_verifie",
  "en_verification",
  "verifie",
  "refuse",
  "suspendu",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  non_verifie: "Non vérifié",
  en_verification: "En vérification",
  verifie: "Vérifié",
  refuse: "Refusé",
  suspendu: "Suspendu",
};

export const MEMBERSHIP_ROLES = ["proprietaire", "recruteur", "lecteur"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_ROLE_LABEL: Record<MembershipRole, string> = {
  proprietaire: "Propriétaire",
  recruteur: "Recruteur",
  lecteur: "Lecteur",
};

// --------------------------------------------------------------------------
// Offres
// --------------------------------------------------------------------------

export const JOB_STATUSES = [
  "brouillon",
  "en_validation",
  "publiee",
  "suspendue",
  "expiree",
  "cloturee",
  "rejetee",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  brouillon: "Brouillon",
  en_validation: "En validation",
  publiee: "Publiée",
  suspendue: "Suspendue",
  expiree: "Expirée",
  cloturee: "Clôturée",
  rejetee: "Rejetée",
};

/** RM-02 et RM-10 : seule une offre publiée est visible, indexée et ouverte. */
export const JOB_STATUS_ACCEPTS_APPLICATIONS: Record<JobStatus, boolean> = {
  brouillon: false,
  en_validation: false,
  publiee: true,
  suspendue: false,
  expiree: false,
  cloturee: false,
  rejetee: false,
};

export const JOB_ORIGINS = ["native", "partenaire", "importee"] as const;
export type JobOrigin = (typeof JOB_ORIGINS)[number];

export const JOB_ORIGIN_LABEL: Record<JobOrigin, string> = {
  native: "Publiée sur SIRA",
  partenaire: "Offre partenaire",
  importee: "Offre importée",
};

export const OPPORTUNITY_TYPES = [
  "emploi",
  "stage",
  "alternance",
  "mission_freelance",
  "volontariat",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_TYPE_LABEL: Record<OpportunityType, string> = {
  emploi: "Emploi",
  stage: "Stage",
  alternance: "Alternance",
  mission_freelance: "Mission / Freelance",
  volontariat: "Volontariat",
};

export const CONTRACT_TYPES = [
  "cdi",
  "cdd",
  "convention_stage",
  "contrat_apprentissage",
  "prestation",
  "benevolat",
  "autre",
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  convention_stage: "Convention de stage",
  contrat_apprentissage: "Contrat d'apprentissage",
  prestation: "Prestation",
  benevolat: "Bénévolat",
  autre: "Autre",
};

export const WORK_MODES = ["presentiel", "hybride", "teletravail"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  presentiel: "Présentiel",
  hybride: "Hybride",
  teletravail: "Télétravail",
};

export const JOB_VISIBILITIES = ["publique", "non_listee", "anonymisee"] as const;
export type JobVisibility = (typeof JOB_VISIBILITIES)[number];

export const JOB_VISIBILITY_LABEL: Record<JobVisibility, string> = {
  publique: "Publique",
  non_listee: "Non listée (accessible par lien)",
  anonymisee: "Anonymisée (entreprise masquée)",
};

export const APPLICATION_CHANNELS = ["sira", "email", "externe"] as const;
export type ApplicationChannel = (typeof APPLICATION_CHANNELS)[number];

export const APPLICATION_CHANNEL_LABEL: Record<ApplicationChannel, string> = {
  sira: "Dépôt sur SIRA",
  email: "Envoi par e-mail relayé par SIRA",
  externe: "Canal externe",
};

// --------------------------------------------------------------------------
// Candidature — arbitrage C1 : deux axes d'états, pas un champ unique
// --------------------------------------------------------------------------

export const PREPARATION_STATUSES = [
  "brouillon",
  "generee",
  "a_verifier",
  "validee",
  "envoyee",
] as const;
export type PreparationStatus = (typeof PREPARATION_STATUSES)[number];

export const PREPARATION_STATUS_LABEL: Record<PreparationStatus, string> = {
  brouillon: "Brouillon",
  generee: "Générée",
  a_verifier: "À vérifier",
  validee: "Validée",
  envoyee: "Envoyée",
};

export const REVIEW_STATUSES = [
  "recue",
  "a_examiner",
  "shortlist",
  "entretien",
  "retenue",
  "refusee",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  recue: "Reçue",
  a_examiner: "À examiner",
  shortlist: "Shortlist",
  entretien: "Entretien",
  retenue: "Retenue",
  refusee: "Refusée",
};

/**
 * Table de projection — section 5 du plan.
 * Le candidat ne voit jamais l'état interne du recruteur : « shortlist »
 * lui est présenté comme « En cours d'examen ».
 */
export const REVIEW_STATUS_CANDIDATE_LABEL: Record<ReviewStatus, string> = {
  recue: "Envoyée",
  a_examiner: "En cours d'examen",
  shortlist: "En cours d'examen",
  entretien: "Entretien",
  retenue: "Acceptée",
  refusee: "Refusée",
};

// --------------------------------------------------------------------------
// Documents
// --------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  "cv_original",
  "cv_adapte",
  "lettre_motivation",
  "demande",
  "email_candidature",
  "message_whatsapp",
  "piece_jointe",
  "checklist",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  cv_original: "CV original",
  cv_adapte: "CV adapté",
  lettre_motivation: "Lettre de motivation",
  demande: "Demande d'emploi",
  email_candidature: "E-mail de candidature",
  message_whatsapp: "Message WhatsApp",
  piece_jointe: "Pièce jointe",
  checklist: "Checklist des pièces",
};

// --------------------------------------------------------------------------
// Abonnements et paiements
// --------------------------------------------------------------------------

export const PLAN_CODES = [
  "candidat_gratuit",
  "candidat_premium",
  "recruteur_gratuit",
  "recruteur_pro",
  "recruteur_enterprise",
] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const PLAN_LABEL: Record<PlanCode, string> = {
  candidat_gratuit: "Gratuit",
  candidat_premium: "Premium",
  recruteur_gratuit: "Gratuit",
  recruteur_pro: "Pro",
  recruteur_enterprise: "Enterprise",
};

export const SUBSCRIPTION_STATUSES = [
  "active",
  "en_attente_paiement",
  "grace",
  "expiree",
  "annulee",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Active",
  en_attente_paiement: "En attente de paiement",
  grace: "Période de grâce",
  expiree: "Expirée",
  annulee: "Annulée",
};

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "cancelled", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

export const PAYMENT_PROVIDERS = [
  "mobile_money_orange",
  "mobile_money_moov",
  "carte",
  "virement",
] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_PROVIDER_LABEL: Record<PaymentProvider, string> = {
  mobile_money_orange: "Orange Money",
  mobile_money_moov: "Moov Money",
  carte: "Carte bancaire",
  virement: "Virement",
};

// --------------------------------------------------------------------------
// Consentements et notifications
// --------------------------------------------------------------------------

export const CONSENT_TYPES = ["service", "opportunites", "candidature", "marketing"] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_TYPE_LABEL: Record<ConsentType, string> = {
  service: "Service",
  opportunites: "Opportunités",
  candidature: "Candidature",
  marketing: "Communications commerciales",
};

export const CONSENT_BASES = ["service", "preference", "consentement"] as const;
export type ConsentBasis = (typeof CONSENT_BASES)[number];

export const CONSENT_BASIS_LABEL: Record<ConsentBasis, string> = {
  service: "Nécessaire au service",
  preference: "Préférence, désactivable",
  consentement: "Consentement explicite",
};

/** Canal push retiré du MVP — arbitrage D2, section 10.4 du plan. */
export const NOTIFICATION_CHANNELS = ["in_app", "email", "whatsapp"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: "Dans l'application",
  email: "E-mail",
  whatsapp: "WhatsApp",
};

export const NOTIFICATION_TYPES = [
  "offre",
  "candidature",
  "document",
  "formation",
  "message",
  "promotion",
  "systeme",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  offre: "Offres",
  candidature: "Candidatures",
  document: "Documents",
  formation: "Formations",
  message: "Messages",
  promotion: "Promotions",
  systeme: "Système",
};

/**
 * Matrice consentement — section 10.2 du plan.
 * Corrige [T §20], qui autorisait la publicité in-app sans condition.
 */
export const CONSENT_MATRIX: Record<
  ConsentType,
  Record<NotificationChannel, ConsentBasis>
> = {
  service: { in_app: "service", email: "service", whatsapp: "consentement" },
  opportunites: { in_app: "preference", email: "preference", whatsapp: "consentement" },
  candidature: { in_app: "service", email: "service", whatsapp: "consentement" },
  marketing: { in_app: "consentement", email: "consentement", whatsapp: "consentement" },
};

// --------------------------------------------------------------------------
// IA
// --------------------------------------------------------------------------

export const AI_JOB_TYPES = [
  "cv_parsing",
  "classification",
  "match_score",
  "cv_adaptation",
  "lettre",
  "email",
  "message_whatsapp",
  "resume_candidat",
  "recommandation_formation",
  "chat",
  "preparation_entretien",
] as const;
export type AiJobType = (typeof AI_JOB_TYPES)[number];

export const AI_JOB_TYPE_LABEL: Record<AiJobType, string> = {
  cv_parsing: "Analyse de CV",
  classification: "Classification métier",
  match_score: "Score de compatibilité",
  cv_adaptation: "Adaptation du CV",
  lettre: "Lettre de motivation",
  email: "E-mail de candidature",
  message_whatsapp: "Message WhatsApp",
  resume_candidat: "Résumé de candidat",
  recommandation_formation: "Recommandation de formation",
  chat: "Assistant conversationnel",
  preparation_entretien: "Préparation à l'entretien",
};

export const AI_JOB_STATUSES = ["queued", "running", "succeeded", "failed", "cancelled"] as const;
export type AiJobStatus = (typeof AI_JOB_STATUSES)[number];

export const AI_JOB_STATUS_LABEL: Record<AiJobStatus, string> = {
  queued: "En file",
  running: "En cours",
  succeeded: "Terminé",
  failed: "Échoué",
  cancelled: "Annulé",
};

/** Pondérations du score — section 9.4 du plan, modifiables en back-office. */
export const SCORE_WEIGHTS = {
  competences: 0.35,
  experience: 0.2,
  formation: 0.15,
  localisation: 0.15,
  langues: 0.1,
  disponibilite: 0.05,
} as const;

export type ScoreComponent = keyof typeof SCORE_WEIGHTS;

export const SCORE_COMPONENT_LABEL: Record<ScoreComponent, string> = {
  competences: "Compétences",
  experience: "Expérience",
  formation: "Formation",
  localisation: "Localisation",
  langues: "Langues",
  disponibilite: "Disponibilité",
};

/** Mention obligatoire imposée par [T §6.4]. Jamais désactivable. */
export const SCORE_DISCLAIMER =
  "Estimation algorithmique fondée sur les informations disponibles. Ne garantit pas le recrutement.";

/** Un critère indispensable non satisfait plafonne le score — section 9.4. */
export const BLOCKING_CRITERIA_CAP = 40;

// --------------------------------------------------------------------------
// Formations et campagnes
// --------------------------------------------------------------------------

export const TRAINING_ACCESS = ["public_gratuit", "inclus_premium", "payant"] as const;
export type TrainingAccess = (typeof TRAINING_ACCESS)[number];

export const TRAINING_ACCESS_LABEL: Record<TrainingAccess, string> = {
  public_gratuit: "Gratuite",
  inclus_premium: "Incluse avec Premium",
  payant: "Payante",
};

export const TRAINING_FORMATS = ["presentiel", "en_ligne", "hybride"] as const;
export type TrainingFormat = (typeof TRAINING_FORMATS)[number];

export const TRAINING_FORMAT_LABEL: Record<TrainingFormat, string> = {
  presentiel: "Présentiel",
  en_ligne: "En ligne",
  hybride: "Hybride",
};

export const CAMPAIGN_STATUSES = [
  "brouillon",
  "en_moderation",
  "validee",
  "en_attente_paiement",
  "diffusion",
  "terminee",
  "rejetee",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  brouillon: "Brouillon",
  en_moderation: "En modération",
  validee: "Validée",
  en_attente_paiement: "En attente de paiement",
  diffusion: "En diffusion",
  terminee: "Terminée",
  rejetee: "Rejetée",
};

// --------------------------------------------------------------------------
// Confidentialité — arbitrage C7
// --------------------------------------------------------------------------

export const PROFILE_VISIBILITIES = ["invisible", "anonyme", "complet"] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

export const PROFILE_VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  invisible: "Invisible dans la recherche de talents",
  anonyme: "Visible sans mon identité ni mes coordonnées",
  complet: "Profil visible par les recruteurs vérifiés",
};

// --------------------------------------------------------------------------
// Référentiels métier — contexte Burkina Faso
// --------------------------------------------------------------------------

export const DOMAINS = [
  "Administration & Secrétariat",
  "Agriculture & Agroalimentaire",
  "Banque, Finance & Assurance",
  "BTP & Génie civil",
  "Commerce & Vente",
  "Communication & Marketing",
  "Éducation & Formation",
  "Énergie & Environnement",
  "Informatique & Numérique",
  "Ingénierie & Industrie",
  "Juridique",
  "Logistique & Transport",
  "Ressources humaines",
  "Santé & Social",
  "Sécurité",
  "Tourisme & Hôtellerie",
] as const;

export const CITIES = [
  "Ouagadougou",
  "Bobo-Dioulasso",
  "Koudougou",
  "Ouahigouya",
  "Banfora",
  "Kaya",
  "Tenkodogo",
  "Fada N'Gourma",
  "Dédougou",
  "Gaoua",
] as const;

export const EDUCATION_LEVELS = [
  "Sans diplôme",
  "CEP",
  "BEPC",
  "CAP / BEP",
  "Baccalauréat",
  "BTS / DUT (Bac+2)",
  "Licence (Bac+3)",
  "Master (Bac+5)",
  "Doctorat",
] as const;

export const LANGUAGE_LEVELS = ["Notions", "Scolaire", "Professionnel", "Courant", "Langue maternelle"] as const;

export const AVAILABILITIES = [
  "Immédiate",
  "Sous 1 mois",
  "Sous 3 mois",
  "À convenir",
] as const;

export const EXPERIENCE_BUCKETS = [
  { value: "0", label: "Débutant, moins de 1 an" },
  { value: "1", label: "1 à 2 ans" },
  { value: "3", label: "3 à 5 ans" },
  { value: "6", label: "6 à 10 ans" },
  { value: "11", label: "Plus de 10 ans" },
] as const;

export const CURRENCY = "FCFA";

/** Formate un montant en franc CFA, sans décimale. */
export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return "Non précisé";
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${CURRENCY}`;
}

export function formatSalaryRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Salaire non précisé";
  if (min && max) return `${new Intl.NumberFormat("fr-FR").format(min)} – ${formatMoney(max)}`;
  return formatMoney(min ?? max);
}
