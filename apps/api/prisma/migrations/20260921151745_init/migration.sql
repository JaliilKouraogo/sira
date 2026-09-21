-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('candidate', 'recruiter', 'trainer', 'admin', 'moderator');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('entreprise', 'ong_association', 'cabinet_recrutement', 'institution_publique', 'etablissement_enseignement', 'centre_formation', 'particulier');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('non_verifie', 'en_verification', 'verifie', 'refuse', 'suspendu');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('proprietaire', 'recruteur', 'lecteur');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('brouillon', 'en_validation', 'publiee', 'suspendue', 'expiree', 'cloturee', 'rejetee');

-- CreateEnum
CREATE TYPE "JobOrigin" AS ENUM ('native', 'partenaire', 'importee');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('emploi', 'stage', 'alternance', 'mission_freelance', 'volontariat');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('cdi', 'cdd', 'convention_stage', 'contrat_apprentissage', 'prestation', 'benevolat', 'autre');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('presentiel', 'hybride', 'teletravail');

-- CreateEnum
CREATE TYPE "JobVisibility" AS ENUM ('publique', 'non_listee', 'anonymisee');

-- CreateEnum
CREATE TYPE "ApplicationChannel" AS ENUM ('sira', 'email', 'externe');

-- CreateEnum
CREATE TYPE "PreparationStatus" AS ENUM ('brouillon', 'generee', 'a_verifier', 'validee', 'envoyee');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('recue', 'a_examiner', 'shortlist', 'entretien', 'retenue', 'refusee');

-- CreateEnum
CREATE TYPE "ApplicationEventKind" AS ENUM ('creation', 'preparation', 'soumission', 'revue');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('invisible', 'anonyme', 'complet');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('service', 'opportunites', 'candidature', 'marketing');

-- CreateEnum
CREATE TYPE "ConsentBasis" AS ENUM ('service', 'preference', 'consentement');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'whatsapp');

-- CreateEnum
CREATE TYPE "AiJobType" AS ENUM ('cv_parsing', 'classification', 'match_score', 'cv_adaptation', 'lettre', 'email', 'message_whatsapp', 'resume_candidat', 'recommandation_formation', 'chat', 'preparation_entretien');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "email_verified_at" TIMESTAMP(3),
    "phone_verified_at" TIMESTAMP(3),
    "two_factor_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by" TEXT,
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "basis" "ConsentBasis" NOT NULL,
    "source" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "type" "OrganizationType" NOT NULL,
    "sector" TEXT,
    "size" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Burkina Faso',
    "city" TEXT NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'non_verifie',
    "verification_documents" JSONB NOT NULL DEFAULT '[]',
    "verified_at" TIMESTAMP(3),
    "is_partner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "job_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "headline" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Burkina Faso',
    "city" TEXT,
    "search_zones" TEXT[],
    "professional_situation" TEXT,
    "education_level" TEXT,
    "educations" JSONB NOT NULL DEFAULT '[]',
    "domain" TEXT,
    "target_jobs" TEXT[],
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "experiences" JSONB NOT NULL DEFAULT '[]',
    "hard_skills" JSONB NOT NULL DEFAULT '[]',
    "soft_skills" JSONB NOT NULL DEFAULT '[]',
    "languages" JSONB NOT NULL DEFAULT '[]',
    "opportunity_types" "OpportunityType"[],
    "contract_types" "ContractType"[],
    "availability" TEXT,
    "salary_expectation" INTEGER,
    "geographic_mobility" BOOLEAN NOT NULL DEFAULT false,
    "work_modes" "WorkMode"[],
    "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'anonyme',
    "completion_score" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "opportunity_type" "OpportunityType" NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "department" TEXT,
    "domain" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Burkina Faso',
    "city" TEXT NOT NULL,
    "work_mode" "WorkMode" NOT NULL DEFAULT 'presentiel',
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "missions" TEXT[],
    "responsibilities" TEXT[],
    "required_skills" TEXT[],
    "nice_to_have_skills" TEXT[],
    "blocking_criteria" TEXT[],
    "education_level" TEXT,
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "languages" JSONB NOT NULL DEFAULT '[]',
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_currency" TEXT NOT NULL DEFAULT 'XOF',
    "deadline" TIMESTAMP(3),
    "required_documents" TEXT[],
    "application_channel" "ApplicationChannel" NOT NULL DEFAULT 'sira',
    "application_target" TEXT,
    "contact" TEXT,
    "visibility" "JobVisibility" NOT NULL DEFAULT 'publique',
    "origin" "JobOrigin" NOT NULL DEFAULT 'native',
    "source_url" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'brouillon',
    "published_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "match_score_id" TEXT,
    "preparation_status" "PreparationStatus" NOT NULL DEFAULT 'brouillon',
    "review_status" "ReviewStatus",
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "channel_used" "ApplicationChannel" NOT NULL,
    "idempotency_key" TEXT,
    "submitted_at" TIMESTAMP(3),
    "external_marked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT NOT NULL,
    "kind" "ApplicationEventKind" NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_scores" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "blocking_criteria" TEXT[],
    "gaps" TEXT[],
    "recommended_actions" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "profile_version" INTEGER NOT NULL,
    "job_version" INTEGER NOT NULL,
    "weights_version" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "ai_job_id" TEXT,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "AiJobType" NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'queued',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_ref" TEXT,
    "output_ref" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "consents_user_id_consent_type_channel_created_at_idx" ON "consents"("user_id", "consent_type", "channel", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_user_id_key" ON "candidate_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");

-- CreateIndex
CREATE INDEX "jobs_status_published_at_idx" ON "jobs"("status", "published_at");

-- CreateIndex
CREATE INDEX "jobs_organization_id_idx" ON "jobs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_candidate_id_job_id_key" ON "saved_jobs"("candidate_id", "job_id");

-- CreateIndex
CREATE INDEX "applications_job_id_review_status_idx" ON "applications"("job_id", "review_status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_candidate_id_job_id_key" ON "applications"("candidate_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_candidate_id_idempotency_key_key" ON "applications"("candidate_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "application_events_application_id_created_at_idx" ON "application_events"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "application_notes_application_id_created_at_idx" ON "application_notes"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "match_scores_candidate_id_job_id_computed_at_idx" ON "match_scores"("candidate_id", "job_id", "computed_at");

-- CreateIndex
CREATE INDEX "ai_jobs_user_id_created_at_idx" ON "ai_jobs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_jobs_type_created_at_idx" ON "ai_jobs"("type", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_object_type_object_id_idx" ON "audit_logs"("object_type", "object_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_match_score_id_fkey" FOREIGN KEY ("match_score_id") REFERENCES "match_scores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
