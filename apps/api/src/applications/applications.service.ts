import { Injectable } from "@nestjs/common";
import { REVIEW_STATUS_LABEL, SCORE_DISCLAIMER, type PreparationStatus, type ReviewStatus } from "@sira/shared";
import { MatchService, inPlanOrder } from "../ai/match.service";
import { AuditService } from "../audit/audit.service";
import { CandidatesService } from "../candidates/candidates.module";
import { AppError, conflict, forbidden, notFound } from "../common/app-error";
import type { AuthUser } from "../common/auth";
import { cursorArgs, toPage } from "../common/pagination";
import type { Prisma } from "../generated/prisma/client";
import { acceptsApplications } from "../jobs/job-rules";
import { presentSummary } from "../jobs/jobs.service";
import { EDITOR_ROLES, OrganizationsService } from "../organizations/organizations.service";
import { PrismaService } from "../prisma/prisma.service";
import { PREPARATION_TRANSITIONS, REVIEW_TRANSITIONS, candidateView } from "./application-rules";
import { IDEMPOTENCY_KEY, type ApplicationsQueryInput } from "./applications.schemas";

const CANDIDATE_INCLUDE = {
  job: { include: { organization: true } },
  matchScore: { select: { score: true } },
  events: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.ApplicationInclude;

const RECRUITER_INCLUDE = {
  job: { select: { id: true, slug: true, title: true, organizationId: true } },
  candidate: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
  matchScore: true,
  notes: { include: { author: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } },
  events: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.ApplicationInclude;

type CandidateApplication = Prisma.ApplicationGetPayload<{ include: typeof CANDIDATE_INCLUDE }>;
type RecruiterApplication = Prisma.ApplicationGetPayload<{ include: typeof RECRUITER_INCLUDE }>;

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidates: CandidatesService,
    private readonly organizations: OrganizationsService,
    private readonly match: MatchService,
    private readonly audit: AuditService,
  ) {}

  // -------------------------------------------------------------------------
  // Candidat
  // -------------------------------------------------------------------------

  /**
   * Dépôt d'une candidature. L'en-tête `Idempotency-Key` est obligatoire
   * (section 4.3 du plan) : une requête rejouée après une coupure réseau
   * renvoie la candidature déjà créée au lieu d'en créer une seconde.
   */
  async create(user: AuthUser, jobRef: string, idempotencyKey: string | undefined) {
    if (!idempotencyKey || !IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new AppError(
        400,
        "idempotency_key_required",
        "L'en-tête Idempotency-Key est obligatoire : 8 à 128 caractères, un UUID par exemple.",
      );
    }
    const profile = await this.candidates.profileOf(user.id);

    const replay = await this.prisma.application.findUnique({
      where: { candidateId_idempotencyKey: { candidateId: profile.id, idempotencyKey } },
      include: CANDIDATE_INCLUDE,
    });
    if (replay) {
      if (replay.jobId !== jobRef && replay.job.slug !== jobRef) {
        throw conflict("idempotency_key_reused", "Cette clé d'idempotence a déjà servi pour une autre candidature.");
      }
      return { application: presentForCandidate(replay), replayed: true };
    }

    const job = await this.prisma.job.findFirst({ where: { OR: [{ id: jobRef }, { slug: jobRef }], status: { not: "brouillon" } } });
    if (!job || job.status === "en_validation" || job.status === "rejetee") throw notFound("Offre");
    // RM-02 : offre clôturée, suspendue ou expirée.
    if (!acceptsApplications(job)) {
      throw conflict("job_closed", "Cette offre n'accepte plus de candidature.");
    }
    const existing = await this.prisma.application.findUnique({
      where: { candidateId_jobId: { candidateId: profile.id, jobId: job.id } },
      select: { id: true },
    });
    if (existing) {
      throw conflict("already_applied", "Vous avez déjà une candidature pour cette offre.", { applicationId: existing.id });
    }

    // RM-05 : la candidature garde le score du moment où elle est créée.
    const score = await this.match.freeze(profile, job);
    const application = await this.prisma.application.create({
      data: {
        candidateId: profile.id,
        jobId: job.id,
        matchScoreId: score.id,
        channelUsed: job.applicationChannel,
        idempotencyKey,
        events: {
          create: { actorId: user.id, actorRole: "candidat", kind: "creation", toStatus: "brouillon", label: "Candidature créée" },
        },
      },
      include: CANDIDATE_INCLUDE,
    });
    return { application: presentForCandidate(application), replayed: false };
  }

  async prepare(user: AuthUser, id: string, to: PreparationStatus) {
    const application = await this.ownApplication(user, id);
    const from = application.preparationStatus;
    if (from === "envoyee") throw conflict("already_submitted", "Cette candidature a déjà été envoyée.");
    if (!PREPARATION_TRANSITIONS[from].includes(to)) {
      throw conflict("invalid_transition", `Impossible de passer de « ${from} » à « ${to} ».`);
    }
    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        preparationStatus: to,
        events: {
          create: { actorId: user.id, actorRole: "candidat", kind: "preparation", fromStatus: from, toStatus: to, label: PREPARATION_LABEL[to] },
        },
      },
      include: CANDIDATE_INCLUDE,
    });
    return presentForCandidate(updated);
  }

  /**
   * Envoi effectif. RM-06 : il faut une candidature validée par le candidat.
   * Sur SIRA, le dossier est déposé ; pour un canal externe ou un e-mail, la
   * réponse indique où l'envoyer (l'envoi relayé arrivera avec le module
   * de notifications).
   */
  async submit(user: AuthUser, id: string) {
    const application = await this.ownApplication(user, id);
    if (application.preparationStatus === "envoyee") throw conflict("already_submitted", "Cette candidature a déjà été envoyée.");
    if (application.preparationStatus !== "validee") {
      throw conflict(
        "preparation_not_validated",
        "Validez votre candidature avant de l'envoyer : rien ne part sans votre accord.",
      );
    }
    if (!acceptsApplications(application.job)) {
      throw conflict("job_closed", "Cette offre n'accepte plus de candidature.");
    }

    const now = new Date();
    const external = application.channelUsed !== "sira";
    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        preparationStatus: "envoyee",
        reviewStatus: "recue",
        submittedAt: now,
        ...(external && { externalMarkedAt: now }),
        events: {
          create: {
            actorId: user.id,
            actorRole: "candidat",
            kind: "soumission",
            fromStatus: "validee",
            toStatus: "envoyee",
            label: external ? "Candidature marquée comme envoyée par le canal du recruteur" : "Candidature envoyée au recruteur",
          },
        },
      },
      include: CANDIDATE_INCLUDE,
    });
    return {
      ...presentForCandidate(updated),
      delivery: external
        ? { channel: updated.channelUsed, target: updated.job.applicationTarget, mode: "a_envoyer_par_le_candidat" as const }
        : { channel: "sira" as const, target: null, mode: "deposee" as const },
    };
  }

  // -------------------------------------------------------------------------
  // Recruteur
  // -------------------------------------------------------------------------

  /** RM-09 : chaque changement de revue est une action du recruteur, tracée. */
  async review(user: AuthUser, id: string, to: ReviewStatus) {
    const application = await this.recruiterApplication(user, id, EDITOR_ROLES);
    const from = application.reviewStatus;
    if (!from) throw conflict("not_submitted", "Cette candidature n'a pas encore été envoyée.");
    if (!REVIEW_TRANSITIONS[from].includes(to)) {
      throw conflict("invalid_transition", `Impossible de passer de « ${REVIEW_STATUS_LABEL[from]} » à « ${REVIEW_STATUS_LABEL[to]} ».`);
    }
    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        reviewStatus: to,
        events: {
          create: { actorId: user.id, actorRole: "recruteur", kind: "revue", fromStatus: from, toStatus: to, label: REVIEW_STATUS_LABEL[to] },
        },
      },
      include: RECRUITER_INCLUDE,
    });
    await this.audit.log({
      actorId: user.id,
      action: "application.review_changed",
      objectType: "application",
      objectId: id,
      before: { reviewStatus: from },
      after: { reviewStatus: to },
    });
    return presentForRecruiter(updated);
  }

  async addNote(user: AuthUser, id: string, text: string) {
    await this.recruiterApplication(user, id, EDITOR_ROLES);
    const note = await this.prisma.applicationNote.create({
      data: { applicationId: id, authorId: user.id, text },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    return { id: note.id, author: `${note.author.firstName} ${note.author.lastName}`, text: note.text, createdAt: note.createdAt };
  }

  // -------------------------------------------------------------------------
  // Lecture, selon le rôle (matrice RBAC, section 11.2)
  // -------------------------------------------------------------------------

  async list(user: AuthUser, query: ApplicationsQueryInput) {
    const filters: Prisma.ApplicationWhereInput = {
      ...(query.jobId && { jobId: query.jobId }),
      ...(query.reviewStatus && { reviewStatus: query.reviewStatus }),
      ...(query.archived !== undefined && { isArchived: query.archived }),
    };

    if (user.role === "candidate") {
      const profile = await this.candidates.profileOf(user.id);
      const rows = await this.prisma.application.findMany({
        where: { ...filters, candidateId: profile.id, ...(query.preparationStatus && { preparationStatus: query.preparationStatus }) },
        include: CANDIDATE_INCLUDE,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        ...cursorArgs(query.limit, query.cursor),
      });
      const page = toPage(rows, query.limit);
      return { ...page, data: page.data.map(presentForCandidate) };
    }

    // Recruteur : seulement les candidatures envoyées, sur les offres de ses organisations.
    const scope: Prisma.ApplicationWhereInput =
      user.role === "recruiter"
        ? { job: { organizationId: { in: await this.organizations.memberOrganizationIds(user.id) } } }
        : {};
    const rows = await this.prisma.application.findMany({
      where: { ...filters, ...scope, preparationStatus: "envoyee" },
      include: RECRUITER_INCLUDE,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      ...cursorArgs(query.limit, query.cursor),
    });
    const page = toPage(rows, query.limit);
    return { ...page, data: page.data.map((a) => presentForRecruiter(a, { summary: true })) };
  }

  async get(user: AuthUser, id: string) {
    if (user.role === "candidate") return presentForCandidate(await this.ownApplication(user, id));
    const application = await this.recruiterApplication(user, id);
    // Tout accès à un dossier de candidature est journalisé (section 11.1).
    await this.audit.log({ actorId: user.id, action: "application.viewed", objectType: "application", objectId: id });
    return presentForRecruiter(application);
  }

  // -------------------------------------------------------------------------

  private async ownApplication(user: AuthUser, id: string): Promise<CandidateApplication> {
    const profile = await this.candidates.profileOf(user.id);
    const application = await this.prisma.application.findUnique({ where: { id }, include: CANDIDATE_INCLUDE });
    if (!application || application.candidateId !== profile.id) throw notFound("Candidature");
    return application;
  }

  /**
   * Candidature vue par un recruteur : elle doit être envoyée et porter sur
   * une offre de son organisation. L'administration et la modération lisent
   * tout, sans pouvoir décider à la place du recruteur.
   */
  private async recruiterApplication(user: AuthUser, id: string, roles?: typeof EDITOR_ROLES): Promise<RecruiterApplication> {
    const application = await this.prisma.application.findUnique({ where: { id }, include: RECRUITER_INCLUDE });
    if (!application || application.preparationStatus !== "envoyee") throw notFound("Candidature");
    if (user.role === "admin" || user.role === "moderator") {
      if (roles) throw forbidden("La décision sur une candidature appartient au recruteur.");
      return application;
    }
    if (user.role !== "recruiter") throw notFound("Candidature");
    const organizationIds = await this.organizations.memberOrganizationIds(user.id);
    if (!organizationIds.includes(application.job.organizationId)) throw notFound("Candidature");
    if (roles) await this.organizations.assertMember(user, application.job.organizationId, roles);
    return application;
  }
}

const PREPARATION_LABEL: Record<PreparationStatus, string> = {
  brouillon: "Retour au brouillon",
  generee: "Documents générés",
  a_verifier: "Candidature à vérifier",
  validee: "Candidature validée par le candidat",
  envoyee: "Candidature envoyée",
};

// ---------------------------------------------------------------------------
// Présentation
// ---------------------------------------------------------------------------

/**
 * Vue candidat : jamais l'état interne du recruteur ni ses notes. Deux étapes
 * de revue successives qui se projettent sur le même libellé (« en cours
 * d'examen ») n'apparaissent qu'une fois dans l'historique.
 */
function presentForCandidate(a: CandidateApplication) {
  const history: { at: Date; label: string; actor: string }[] = [];
  let lastReviewLabel: string | null = null;
  for (const event of a.events) {
    if (event.kind === "revue") {
      const view = candidateView(event.toStatus as ReviewStatus);
      if (!view || view.label === lastReviewLabel) continue;
      lastReviewLabel = view.label;
      history.push({ at: event.createdAt, label: view.label, actor: "recruteur" });
    } else {
      history.push({ at: event.createdAt, label: event.label, actor: event.actorRole });
    }
  }
  return {
    id: a.id,
    job: presentSummary(a.job),
    preparationStatus: a.preparationStatus,
    review: candidateView(a.reviewStatus),
    channelUsed: a.channelUsed,
    score: a.matchScore?.score ?? null,
    isArchived: a.isArchived,
    submittedAt: a.submittedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    history,
  };
}

function presentForRecruiter(a: RecruiterApplication, options: { summary?: boolean } = {}) {
  const user = a.candidate.user;
  const base = {
    id: a.id,
    job: { id: a.job.id, slug: a.job.slug, title: a.job.title },
    candidate: {
      id: a.candidate.id,
      firstName: user.firstName,
      lastName: user.lastName,
      headline: a.candidate.headline,
      city: a.candidate.city,
      experienceYears: a.candidate.experienceYears,
    },
    reviewStatus: a.reviewStatus,
    channelUsed: a.channelUsed,
    score: a.matchScore?.score ?? null,
    submittedAt: a.submittedAt,
    noteCount: a.notes.length,
  };
  if (options.summary) return base;
  return {
    ...base,
    // Coordonnées révélées parce que le candidat a postulé (matrice RBAC).
    candidate: {
      ...base.candidate,
      email: user.email,
      phone: user.phone,
      educationLevel: a.candidate.educationLevel,
      hardSkills: a.candidate.hardSkills,
      languages: a.candidate.languages,
      experiences: a.candidate.experiences,
    },
    scoreDetail: a.matchScore
      ? {
          score: a.matchScore.score,
          breakdown: inPlanOrder(a.matchScore.breakdown),
          gaps: a.matchScore.gaps,
          blockingCriteria: a.matchScore.blockingCriteria,
          computedAt: a.matchScore.computedAt,
          disclaimer: SCORE_DISCLAIMER,
        }
      : null,
    notes: a.notes.map((n) => ({
      id: n.id,
      author: `${n.author.firstName} ${n.author.lastName}`,
      text: n.text,
      createdAt: n.createdAt,
    })),
    history: a.events.map((e) => ({ at: e.createdAt, label: e.label, actor: e.actorRole })),
  };
}
