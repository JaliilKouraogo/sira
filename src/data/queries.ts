/**
 * Couche d'accès aux données.
 *
 * Tout écran passe par ces fonctions et jamais par les fixtures directement.
 * Le jour où l'API existe, seules ces fonctions changent : elles deviennent
 * des appels `fetch` vers les endpoints du catalogue (section 8 du plan),
 * dont le chemin est rappelé en commentaire au-dessus de chaque fonction.
 */

import {
  aiJobs,
  applications,
  auditLogs,
  campaigns,
  candidateProfile,
  consents,
  contactEvents,
  enrollments,
  jobs,
  matchScores,
  notifications,
  organizations,
  payments,
  reports,
  resumes,
  savedJobs,
  subscription,
  trainings,
  usageCounters,
  users,
} from "./fixtures";
import type { Application, Job, MatchScore, Organization, Training } from "@/lib/types";
import type { OpportunityType, WorkMode } from "@/lib/enums";

export const CANDIDATE_ID = "cnd_01";
export const CURRENT_USER_ID = "usr_cand_01";

// --------------------------------------------------------------------------
// Offres — GET /jobs
// --------------------------------------------------------------------------

export interface JobFilters {
  q?: string;
  type?: OpportunityType | "all";
  city?: string;
  domain?: string;
  workMode?: WorkMode | "all";
  contractType?: string;
  minSalary?: number;
  experienceMax?: number;
  organizationId?: string;
  sort?: "recent" | "score" | "deadline";
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Seules les offres publiées sont visibles — règle RM-10. */
export function getPublishedJobs(): Job[] {
  return jobs.filter((j) => j.status === "publiee");
}

export function searchJobs(filters: JobFilters = {}): Job[] {
  let result = getPublishedJobs();

  if (filters.q) {
    const q = norm(filters.q);
    result = result.filter((j) => {
      const org = organizations.find((o) => o.id === j.organizationId);
      const haystack = norm(
        [j.title, j.summary, j.description, j.requiredSkills.join(" "), org?.tradeName ?? org?.legalName ?? ""].join(" "),
      );
      return haystack.includes(q);
    });
  }
  if (filters.type && filters.type !== "all") {
    result = result.filter((j) => j.opportunityType === filters.type);
  }
  if (filters.city) {
    result = result.filter((j) => j.city === filters.city);
  }
  if (filters.domain) {
    result = result.filter((j) => {
      const org = organizations.find((o) => o.id === j.organizationId);
      return org?.sector === filters.domain;
    });
  }
  if (filters.workMode && filters.workMode !== "all") {
    result = result.filter((j) => j.workMode === filters.workMode);
  }
  if (filters.contractType) {
    result = result.filter((j) => j.contractType === filters.contractType);
  }
  if (filters.minSalary) {
    result = result.filter((j) => (j.salaryMax ?? j.salaryMin ?? 0) >= filters.minSalary!);
  }
  if (filters.experienceMax !== undefined) {
    result = result.filter((j) => j.experienceYears <= filters.experienceMax!);
  }
  if (filters.organizationId) {
    result = result.filter((j) => j.organizationId === filters.organizationId);
  }

  switch (filters.sort) {
    case "score":
      result = [...result].sort((a, b) => (getScore(b.id)?.score ?? 0) - (getScore(a.id)?.score ?? 0));
      break;
    case "deadline":
      result = [...result].sort((a, b) => a.deadline.localeCompare(b.deadline));
      break;
    default:
      result = [...result].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
  return result;
}

/** GET /jobs/:id */
export function getJobBySlug(slug: string): Job | undefined {
  return jobs.find((j) => j.slug === slug || j.id === slug);
}

export function getJobById(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
}

export function getOrganization(id: string): Organization | undefined {
  return organizations.find((o) => o.id === id);
}

export function getOrganizations(): Organization[] {
  return organizations;
}

export function getJobOrganization(job: Job): Organization | undefined {
  return getOrganization(job.organizationId);
}

/** Offres du recruteur de démonstration, tous statuts confondus. */
export function getRecruiterJobs(organizationId = "org_01"): Job[] {
  return jobs
    .filter((j) => j.organizationId === organizationId)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// --------------------------------------------------------------------------
// Scores — GET /ai/match-scores/:jobId
// --------------------------------------------------------------------------

export function getScore(jobId: string, candidateId = CANDIDATE_ID): MatchScore | undefined {
  return matchScores.find((m) => m.jobId === jobId && m.candidateId === candidateId);
}

export function getAllScores(candidateId = CANDIDATE_ID): MatchScore[] {
  return matchScores.filter((m) => m.candidateId === candidateId);
}

/** Offres recommandées, triées par score décroissant. */
export function getRecommendedJobs(limit = 5): { job: Job; score?: MatchScore }[] {
  return getPublishedJobs()
    .map((job) => ({ job, score: getScore(job.id) }))
    .filter((x) => x.score !== undefined)
    .sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0))
    .slice(0, limit);
}

/** Offres publiées depuis moins de 7 jours. */
export function getRecentJobs(limit = 6): Job[] {
  return getPublishedJobs().slice(0, limit);
}

// --------------------------------------------------------------------------
// Profil candidat — GET /candidates/me
// --------------------------------------------------------------------------

export function getCandidateProfile() {
  return candidateProfile;
}

export function getCurrentUser() {
  return users.find((u) => u.id === CURRENT_USER_ID)!;
}

export function getUserById(id: string) {
  return users.find((u) => u.id === id);
}

export function getResumes() {
  return resumes;
}

// --------------------------------------------------------------------------
// Candidatures — GET /applications
// --------------------------------------------------------------------------

export function getApplications(candidateId = CANDIDATE_ID): Application[] {
  return applications
    .filter((a) => a.candidateId === candidateId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getApplication(id: string): Application | undefined {
  return applications.find((a) => a.id === id);
}

/** Candidatures reçues par une organisation, vue recruteur. */
export function getRecruiterApplications(organizationId = "org_01") {
  const orgJobIds = new Set(jobs.filter((j) => j.organizationId === organizationId).map((j) => j.id));
  return applications
    .filter((a) => orgJobIds.has(a.jobId) && a.preparationStatus === "envoyee")
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
}

export function getSavedJobs(candidateId = CANDIDATE_ID) {
  return savedJobs
    .filter((s) => s.candidateId === candidateId)
    .map((s) => ({ saved: s, job: getJobById(s.jobId)! }))
    .filter((x) => x.job);
}

export function getAllDocuments(candidateId = CANDIDATE_ID) {
  return getApplications(candidateId).flatMap((a) =>
    a.documents.map((d) => ({ doc: d, application: a, job: getJobById(a.jobId) })),
  );
}

// --------------------------------------------------------------------------
// Formations — GET /trainings
// --------------------------------------------------------------------------

export interface TrainingFilters {
  q?: string;
  category?: string;
  access?: string;
  format?: string;
  level?: string;
}

export function searchTrainings(filters: TrainingFilters = {}): Training[] {
  let result = [...trainings];
  if (filters.q) {
    const q = norm(filters.q);
    result = result.filter((t) => norm(`${t.title} ${t.summary} ${t.skillsCovered.join(" ")}`).includes(q));
  }
  if (filters.category) result = result.filter((t) => t.category === filters.category);
  if (filters.access) result = result.filter((t) => t.access === filters.access);
  if (filters.format) result = result.filter((t) => t.format === filters.format);
  if (filters.level) result = result.filter((t) => t.level === filters.level);
  return result;
}

export function getTrainingBySlug(slug: string) {
  return trainings.find((t) => t.slug === slug || t.id === slug);
}

export function getTrainingById(id: string) {
  return trainings.find((t) => t.id === id);
}

export function getTrainings() {
  return trainings;
}

export function getEnrollments(candidateId = CANDIDATE_ID) {
  return enrollments
    .filter((e) => e.candidateId === candidateId)
    .map((e) => ({ enrollment: e, training: getTrainingById(e.trainingId)! }))
    .filter((x) => x.training);
}

/**
 * Formations recommandées à partir des lacunes détectées par les scores —
 * [T §8.2] : score faible, compétences manquantes, formations correspondantes.
 */
export function getRecommendedTrainings(candidateId = CANDIDATE_ID) {
  const gaps = new Set(getAllScores(candidateId).flatMap((s) => s.gaps));
  return trainings
    .map((t) => ({
      training: t,
      matchedGaps: t.skillsCovered.filter((s) => gaps.has(s)),
    }))
    .filter((x) => x.matchedGaps.length > 0)
    .sort((a, b) => b.matchedGaps.length - a.matchedGaps.length);
}

// --------------------------------------------------------------------------
// Notifications, consentements, abonnement
// --------------------------------------------------------------------------

export function getNotifications(userId = CURRENT_USER_ID) {
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadCount(userId = CURRENT_USER_ID) {
  return getNotifications(userId).filter((n) => !n.readAt).length;
}

export function getConsents(userId = CURRENT_USER_ID) {
  return consents.filter((c) => c.userId === userId);
}

export function getSubscription() {
  return subscription;
}

export function getUsageCounters() {
  return usageCounters;
}

export function getPayments() {
  return payments;
}

export function getAiJobs() {
  return aiJobs;
}

export function getReports() {
  return reports;
}

export function getContactEvents() {
  return contactEvents;
}

export function getCampaigns() {
  return campaigns;
}

export function getAuditLogs() {
  return auditLogs;
}

export function getAllUsers() {
  return users;
}

// --------------------------------------------------------------------------
// Agrégats de tableaux de bord
// --------------------------------------------------------------------------

/** GET /candidates/me/dashboard */
export function getCandidateDashboard() {
  const apps = getApplications();
  const recommended = getRecommendedJobs(3);
  return {
    profile: candidateProfile,
    user: getCurrentUser(),
    completion: candidateProfile.completionScore,
    newJobsCount: getPublishedJobs().filter((j) => j.publishedAt >= "2026-09-05").length,
    recommended,
    activeApplications: apps.filter((a) => a.preparationStatus !== "envoyee" || a.reviewStatus === "shortlist" || a.reviewStatus === "entretien"),
    applications: apps,
    recommendedTraining: getRecommendedTrainings()[0],
    whatsappLinked: candidateProfile.whatsappLinked,
    subscription,
    usage: usageCounters,
    unread: getUnreadCount(),
  };
}

/** GET /recruiters/me/dashboard */
export function getRecruiterDashboard(organizationId = "org_01") {
  const orgJobs = getRecruiterJobs(organizationId);
  const apps = getRecruiterApplications(organizationId);
  return {
    organization: getOrganization(organizationId)!,
    activeJobs: orgJobs.filter((j) => j.status === "publiee"),
    allJobs: orgJobs,
    applications: apps,
    newApplications: apps.filter((a) => a.reviewStatus === "recue" || a.reviewStatus === "a_examiner"),
    shortlisted: apps.filter((a) => a.isShortlisted),
    totalViews: orgJobs.reduce((sum, j) => sum + j.viewCount, 0),
    totalApplications: orgJobs.reduce((sum, j) => sum + j.applicationCount, 0),
  };
}

/** GET /admin/... */
export function getAdminDashboard() {
  return {
    users: users.length,
    candidates: users.filter((u) => u.role === "candidate").length,
    recruiters: users.filter((u) => u.role === "recruiter").length,
    organizations: organizations.length,
    pendingVerification: organizations.filter((o) => o.verificationStatus === "en_verification" || o.verificationStatus === "non_verifie"),
    publishedJobs: getPublishedJobs().length,
    jobsToValidate: jobs.filter((j) => j.status === "en_validation"),
    openReports: reports.filter((r) => r.status === "ouvert" || r.status === "en_cours"),
    aiCostUsd: aiJobs.reduce((s, j) => s + j.costUsd, 0),
    aiJobs,
    payments,
    auditLogs,
  };
}
