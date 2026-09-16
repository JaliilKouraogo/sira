/**
 * Types du domaine SIRA — section 7.3 du plan de conception.
 * Les 15 entités de [T §14] plus les 13 entités ajoutées parce qu'un écran
 * ou une règle les exige.
 */

import type {
  AiJobStatus,
  AiJobType,
  ApplicationChannel,
  CampaignStatus,
  ConsentBasis,
  ConsentType,
  ContractType,
  DocumentType,
  JobOrigin,
  JobStatus,
  JobVisibility,
  MembershipRole,
  NotificationChannel,
  NotificationType,
  OpportunityType,
  OrganizationType,
  PaymentProvider,
  PaymentStatus,
  PlanCode,
  PreparationStatus,
  ProfileVisibility,
  ReviewStatus,
  ScoreComponent,
  SubscriptionStatus,
  TrainingAccess,
  TrainingFormat,
  UserRole,
  VerificationStatus,
  WorkMode,
} from "./enums";

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  locale: "fr" | "en";
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  legalName: string;
  tradeName?: string;
  type: OrganizationType;
  sector: string;
  size?: string;
  country: string;
  city: string;
  address?: string;
  website?: string;
  logoInitials: string;
  logoColor: string;
  description: string;
  verificationStatus: VerificationStatus;
  isPartner: boolean;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  jobTitle: string;
}

export interface Skill {
  name: string;
  level?: "debutant" | "intermediaire" | "avance" | "expert";
}

export interface Language {
  name: string;
  level: string;
}

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Education {
  degree: string;
  school: string;
  year: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  headline: string;
  photoUrl?: string;
  country: string;
  city: string;
  searchZones: string[];
  professionalSituation: string;
  educationLevel: string;
  educations: Education[];
  domain: string;
  targetJobs: string[];
  experienceYears: number;
  experiences: Experience[];
  hardSkills: Skill[];
  softSkills: Skill[];
  languages: Language[];
  opportunityTypes: OpportunityType[];
  contractTypes: ContractType[];
  availability: string;
  salaryExpectation?: number;
  geographicMobility: boolean;
  workModes: WorkMode[];
  profileVisibility: ProfileVisibility;
  completionScore: number;
  whatsappLinked: boolean;
  plan: PlanCode;
}

export interface Resume {
  id: string;
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeKb: number;
  isOriginal: boolean;
  language: "fr" | "en";
  version: number;
  parsedAt?: string;
  parsedData?: {
    experiences: Experience[];
    educations: Education[];
    skills: string[];
    languages: Language[];
  };
  createdAt: string;
}

export interface Job {
  id: string;
  slug: string;
  organizationId: string;
  title: string;
  opportunityType: OpportunityType;
  contractType: ContractType;
  department?: string;
  country: string;
  city: string;
  workMode: WorkMode;
  summary: string;
  description: string;
  missions: string[];
  responsibilities: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  blockingCriteria: string[];
  educationLevel: string;
  experienceYears: number;
  languages: Language[];
  salaryMin?: number;
  salaryMax?: number;
  deadline: string;
  requiredDocuments: string[];
  applicationChannel: ApplicationChannel;
  applicationTarget?: string;
  contact?: string;
  visibility: JobVisibility;
  origin: JobOrigin;
  sourceUrl?: string;
  status: JobStatus;
  publishedAt: string;
  viewCount: number;
  applicationCount: number;
}

export interface ScoreBreakdownItem {
  weight: number;
  score: number;
  detail: string;
  matched?: string[];
  missing?: string[];
}

export interface MatchScore {
  id: string;
  candidateId: string;
  jobId: string;
  score: number;
  breakdown: Record<ScoreComponent, ScoreBreakdownItem>;
  blockingCriteria: string[];
  gaps: string[];
  recommendedActions: { type: "formation" | "profil" | "candidature"; label: string; trainingId?: string }[];
  model: string;
  computedAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  version: number;
  fileName: string;
  content?: string;
  editedByHuman: boolean;
  aiJobId?: string;
  createdAt: string;
}

export interface ApplicationEvent {
  at: string;
  label: string;
  actor: "candidat" | "recruteur" | "systeme";
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  matchScoreId?: string;
  frozenScore?: number;
  preparationStatus: PreparationStatus;
  reviewStatus?: ReviewStatus;
  isArchived: boolean;
  channelUsed: ApplicationChannel;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  documents: ApplicationDocument[];
  history: ApplicationEvent[];
  recruiterNotes?: { author: string; at: string; text: string }[];
  isShortlisted?: boolean;
}

export interface SavedJob {
  id: string;
  candidateId: string;
  jobId: string;
  savedAt: string;
}

export interface Training {
  id: string;
  slug: string;
  organizationId: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  objectives: string[];
  prerequisites: string[];
  durationHours: number;
  format: TrainingFormat;
  access: TrainingAccess;
  price?: number;
  startDate?: string;
  seats?: number;
  seatsTaken?: number;
  certificate: boolean;
  skillsCovered: string[];
  level: "Débutant" | "Intermédiaire" | "Avancé";
  rating?: number;
}

export interface TrainingEnrollment {
  id: string;
  trainingId: string;
  candidateId: string;
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  subjectType: "formation" | "evenement" | "service";
  subjectId?: string;
  title: string;
  message: string;
  targetDomains: string[];
  targetCities: string[];
  budget: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  impressions: number;
  clicks: number;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanCode;
  status: SubscriptionStatus;
  startedAt: string;
  renewsAt?: string;
  isLaunchOffer?: boolean;
}

export interface UsageCounter {
  feature: string;
  label: string;
  consumed: number;
  limit: number | null;
  period: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  reference: string;
  status: PaymentStatus;
  createdAt: string;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  href?: string;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreference {
  type: NotificationType;
  channels: Record<NotificationChannel, boolean>;
  basis: Record<NotificationChannel, ConsentBasis>;
}

export interface Consent {
  id: string;
  userId: string;
  consentType: ConsentType;
  channel: NotificationChannel;
  granted: boolean;
  basis: ConsentBasis;
  source: string;
  createdAt: string;
}

export interface AiJob {
  id: string;
  userId: string;
  type: AiJobType;
  status: AiJobStatus;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUsd: number;
  latencyMs: number;
  createdAt: string;
  error?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  objectType: "job" | "organization" | "document" | "training";
  objectId: string;
  reason: string;
  detail?: string;
  status: "ouvert" | "en_cours" | "traite" | "rejete";
  createdAt: string;
}

export interface ContactEvent {
  id: string;
  organizationId: string;
  candidateId: string;
  channel: "email" | "whatsapp";
  template: string;
  sentAt: string;
  status: "envoye" | "delivre" | "lu" | "echec";
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  objectType: string;
  objectId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachments?: { label: string; href: string }[];
}
