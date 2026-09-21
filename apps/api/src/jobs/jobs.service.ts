import { Injectable, Logger } from "@nestjs/common";
import { ORGANIZATION_CAPABILITIES } from "@sira/shared";
import { AppError, conflict, notFound } from "../common/app-error";
import type { AuthUser } from "../common/auth";
import { cursorArgs, toPage } from "../common/pagination";
import { normalize, shortSuffix, slugify } from "../common/text";
import { AuditService } from "../audit/audit.service";
import { Prisma, type Job, type Organization } from "../generated/prisma/client";
import { OrganizationsService } from "../organizations/organizations.service";
import { PrismaService } from "../prisma/prisma.service";
import { findDiscriminatoryCriteria } from "./discrimination";
import { EDITABLE_STATUSES, JOB_TRANSITIONS, SCORED_FIELDS, acceptsApplications, type JobTransition } from "./job-rules";
import type { CreateJobInput, JobSearchInput, MyJobsInput, UpdateJobInput } from "./jobs.schemas";

type JobWithOrganization = Job & { organization: Organization };

/** Rôles qui voient toutes les offres, quel que soit leur statut (matrice RBAC). */
const STAFF_ROLES = new Set(["admin", "moderator"]);

@Injectable()
export class JobsService {
  private readonly logger = new Logger("Offres");

  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly audit: AuditService,
  ) {}

  // -------------------------------------------------------------------------
  // Lecture publique
  // -------------------------------------------------------------------------

  /**
   * Recherche publique : seules les offres publiées et listées apparaissent
   * (RM-10). Le texte libre est comparé sans accents ni casse, mot par mot.
   */
  async search(query: JobSearchInput) {
    const where: Prisma.JobWhereInput = {
      status: "publiee",
      visibility: { not: "non_listee" },
      ...(query.city && { city: { equals: query.city, mode: "insensitive" } }),
      ...(query.country && { country: { equals: query.country, mode: "insensitive" } }),
      ...(query.domain && { domain: query.domain }),
      ...(query.opportunityType && { opportunityType: query.opportunityType }),
      ...(query.contractType && { contractType: query.contractType }),
      ...(query.workMode && { workMode: query.workMode }),
      ...(query.maxExperience !== undefined && { experienceYears: { lte: query.maxExperience } }),
      ...(query.minSalary !== undefined && { salaryMax: { gte: query.minSalary } }),
      ...(query.organizationId && { organizationId: query.organizationId }),
      ...(query.publishedWithinDays && {
        publishedAt: { gte: new Date(Date.now() - query.publishedWithinDays * 86_400_000) },
      }),
    };
    if (query.q) where.id = { in: await this.matchText(query.q) };

    const rows = await this.prisma.job.findMany({
      where,
      include: { organization: true },
      orderBy: orderFor(query.sort),
      ...cursorArgs(query.limit, query.cursor),
    });
    const page = toPage(rows, query.limit);
    return { ...page, data: page.data.map((job) => presentSummary(job)) };
  }

  /**
   * Détail d'une offre, par identifiant ou par adresse lisible. Une offre non
   * publiée n'existe, pour les autres, que pour les membres de son organisation
   * et l'équipe SIRA.
   */
  async detail(idOrSlug: string, user?: AuthUser) {
    const job = await this.prisma.job.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { organization: true },
    });
    if (!job) throw notFound("Offre");
    const owner = user ? await this.canManage(user, job.organizationId) : false;
    if (job.status !== "publiee" && !owner && !(user && STAFF_ROLES.has(user.role))) throw notFound("Offre");

    if (job.status === "publiee" && !owner) {
      // Compteur de vues, sans ralentir la réponse.
      this.prisma.job
        .update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } })
        .catch((error: unknown) => this.logger.warn(`Compteur de vues non mis à jour : ${String(error)}`));
    }
    return presentDetail(job, owner);
  }

  // -------------------------------------------------------------------------
  // Espace recruteur
  // -------------------------------------------------------------------------

  async mine(user: AuthUser, query: MyJobsInput) {
    const organizationIds = await this.organizations.memberOrganizationIds(user.id);
    const rows = await this.prisma.job.findMany({
      where: {
        organizationId: query.organizationId
          ? { in: organizationIds.filter((id) => id === query.organizationId) }
          : { in: organizationIds },
        ...(query.status && { status: query.status }),
      },
      include: {
        organization: true,
        _count: { select: { applications: { where: { preparationStatus: "envoyee" } } } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      ...cursorArgs(query.limit, query.cursor),
    });
    const page = toPage(rows, query.limit);
    return {
      ...page,
      data: page.data.map((job) => ({ ...presentDetail(job, true), applicationCount: job._count.applications })),
    };
  }

  async create(user: AuthUser, input: CreateJobInput) {
    const { organization } = await this.organizations.assertMember(user, input.organizationId);
    if (!ORGANIZATION_CAPABILITIES[organization.type].jobs) {
      throw new AppError(
        422,
        "organization_cannot_publish_jobs",
        "Ce type d'organisation ne publie pas d'offres d'emploi. Il peut proposer des formations.",
      );
    }
    const { organizationId, ...fields } = input;
    const job = await this.prisma.job.create({
      data: {
        ...fields,
        slug: `${slugify(`${fields.title} ${organization.tradeName ?? organization.legalName}`)}-${shortSuffix()}`,
        organization: { connect: { id: organizationId } },
        createdBy: { connect: { id: user.id } },
      },
      include: { organization: true },
    });
    await this.audit.log({ actorId: user.id, action: "job.created", objectType: "job", objectId: job.id });
    return presentDetail(job, true);
  }

  async update(user: AuthUser, id: string, input: UpdateJobInput) {
    const job = await this.findManageable(user, id);
    if (!EDITABLE_STATUSES.includes(job.status)) {
      throw conflict("job_not_editable", "Une offre clôturée, expirée ou rejetée ne peut plus être modifiée.");
    }
    const merged = { ...job, ...input };
    assertConsistent(merged);
    // Une offre en ligne est recontrôlée à chaque modification.
    if (job.status === "publiee") assertNonDiscriminatory(merged);

    const scoredChange = SCORED_FIELDS.some((field) => field in input);
    const updated = await this.prisma.job.update({
      where: { id },
      data: { ...input, ...(scoredChange && { version: { increment: 1 } }) },
      include: { organization: true },
    });
    return presentDetail(updated, true);
  }

  async transition(user: AuthUser, id: string, action: JobTransition) {
    const job = await this.findManageable(user, id);
    const rule = JOB_TRANSITIONS[action];
    if (!(rule.from as readonly string[]).includes(job.status)) {
      throw conflict("invalid_transition", `Impossible de ${ACTION_LABEL[action]} une offre au statut « ${job.status} ».`);
    }

    if (action === "publish") {
      // RM-11 : une organisation non vérifiée ne publie pas.
      if (job.organization.verificationStatus !== "verifie") {
        throw new AppError(
          403,
          "organization_not_verified",
          "Votre organisation doit être vérifiée avant de publier. Déposez vos justificatifs depuis votre espace.",
        );
      }
      assertNonDiscriminatory(job);
      if (job.deadline && job.deadline.getTime() <= Date.now()) {
        throw new AppError(422, "deadline_passed", "La date limite de candidature est déjà passée.");
      }
    }

    const now = new Date();
    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        status: rule.to,
        ...(action === "publish" && !job.publishedAt && { publishedAt: now }),
        ...(action === "close" && { closedAt: now }),
      },
      include: { organization: true },
    });
    await this.audit.log({
      actorId: user.id,
      action: `job.${action}`,
      objectType: "job",
      objectId: id,
      before: { status: job.status },
      after: { status: rule.to },
    });
    return presentDetail(updated, true);
  }

  // -------------------------------------------------------------------------
  // Offres enregistrées (candidat)
  // -------------------------------------------------------------------------

  async save(candidateId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, status: "publiee" } });
    if (!job) throw notFound("Offre");
    await this.prisma.savedJob.upsert({
      where: { candidateId_jobId: { candidateId, jobId } },
      create: { candidateId, jobId },
      update: {},
    });
    return { jobId, saved: true };
  }

  async unsave(candidateId: string, jobId: string) {
    await this.prisma.savedJob.deleteMany({ where: { candidateId, jobId } });
  }

  async saved(candidateId: string) {
    const rows = await this.prisma.savedJob.findMany({
      where: { candidateId },
      include: { job: { include: { organization: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({ savedAt: row.createdAt, job: presentSummary(row.job) }));
  }

  // -------------------------------------------------------------------------

  private async findManageable(user: AuthUser, id: string): Promise<JobWithOrganization> {
    const job = await this.prisma.job.findUnique({ where: { id }, include: { organization: true } });
    if (!job) throw notFound("Offre");
    await this.organizations.assertMember(user, job.organizationId);
    return job;
  }

  private async canManage(user: AuthUser, organizationId: string): Promise<boolean> {
    if (user.role === "admin") return true;
    if (user.role !== "recruiter") return false;
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
    });
    return membership !== null;
  }

  /**
   * Offres publiées et encore ouvertes qui se rapportent à un message libre.
   * Sert à l'assistant : il ne cite que des offres réelles.
   *
   * Chaque mot est cherché en début de mot (« ouaga » trouve « Ouagadougou »,
   * mais « air » ne trouve pas « solaire »). Seules les offres qui retrouvent
   * presque autant de mots que la meilleure sont gardées, et au moins deux
   * quand la question en compte plusieurs : une offre qui ne partage que la
   * ville n'est pas une réponse.
   */
  async related(text: string, limit = 4) {
    const words = normalize(text)
      .split(" ")
      .filter((w) => w.length >= 4 && !CHAT_STOP_WORDS.has(w))
      .slice(0, 8);
    if (words.length === 0) return [];
    // Racine grossière : les 60 % premiers caractères, 4 au moins. « logisticien »
    // rejoint « logistique », « comptable » rejoint « comptabilité ».
    const stem = (w: string) => w.slice(0, Math.max(4, Math.ceil(w.length * 0.6)));
    const patterns = words.map((w) => `\\m${stem(w).replace(/\+/g, "\\+")}`);
    const rows = await this.prisma.$queryRaw<{ id: string; hits: number }[]>`
      SELECT id, hits FROM (
        SELECT id, published_at, (SELECT count(*) FROM unnest(${patterns}::text[]) AS p WHERE doc ~ p)::int AS hits
        FROM (
          SELECT id, published_at, ${SEARCH_DOCUMENT} AS doc
          FROM jobs
          WHERE status = 'publiee' AND visibility <> 'non_listee' AND (deadline IS NULL OR deadline > now())
        ) j
      ) scored
      WHERE hits > 0
      ORDER BY hits DESC, published_at DESC
      LIMIT ${limit * 3}
    `;
    const best = rows[0]?.hits ?? 0;
    const floor = Math.max(Math.min(2, words.length), best - 1);
    const ids = rows.filter((r) => r.hits >= floor).slice(0, limit).map((r) => r.id);
    const jobs = await this.prisma.job.findMany({ where: { id: { in: ids } }, include: { organization: true } });
    return ids.flatMap((id) => {
      const job = jobs.find((j) => j.id === id);
      return job ? [presentSummary(job)] : [];
    });
  }

  /**
   * Identifiants des offres publiées dont le texte contient tous les mots de
   * la recherche, sans tenir compte des accents ni de la casse.
   */
  private async matchText(q: string): Promise<string[]> {
    const words = normalize(q).split(" ").filter((w) => w.length > 1).slice(0, 6);
    if (words.length === 0) return [];
    const patterns = words.map((w) => `%${w}%`);
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM jobs
      WHERE status = 'publiee' AND ${SEARCH_DOCUMENT} LIKE ALL (${patterns}::text[])
    `;
    return rows.map((r) => r.id);
  }
}

/**
 * Texte d'une offre sur lequel porte la recherche, sans accents ni
 * majuscules. Le type d'opportunité et le contrat y figurent : « stage » ou
 * « cdi » trouvent les offres correspondantes.
 */
const SEARCH_DOCUMENT = Prisma.sql`unaccent(lower(
  title || ' ' || summary || ' ' || coalesce(department, '') || ' ' || coalesce(domain, '') || ' ' ||
  city || ' ' || opportunity_type::text || ' ' || contract_type::text || ' ' ||
  array_to_string(required_skills, ' ') || ' ' || array_to_string(nice_to_have_skills, ' ')
))`;

/** Mots trop généraux pour orienter une recherche à partir d'une question. */
const CHAT_STOP_WORDS = new Set([
  "les", "des", "une", "est", "pour", "dans", "avec", "sur", "par", "pas", "que", "qui", "quoi", "quel", "quelle",
  "quels", "quelles", "comment", "combien", "vous", "nous", "mon", "mes", "ton", "tes", "son", "ses", "votre",
  "vos", "cherche", "recherche", "chercher", "trouver", "veux", "voudrais", "aimerais", "besoin", "faire", "avoir",
  "etre", "suis", "bonjour", "bonsoir", "merci", "salut", "offre", "offres", "emploi", "emplois", "poste",
  "postes", "travail", "job", "jobs", "sira", "aide", "aider", "peux", "pouvez", "est-ce", "moi", "ici", "encore",
]);

const ACTION_LABEL: Record<JobTransition, string> = { publish: "publier", suspend: "suspendre", close: "clôturer" };

function orderFor(sort: JobSearchInput["sort"]): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "published_at":
      return [{ publishedAt: "asc" }, { id: "asc" }];
    case "deadline":
      return [{ deadline: { sort: "asc", nulls: "last" } }, { id: "asc" }];
    case "-salary_max":
      return [{ salaryMax: { sort: "desc", nulls: "last" } }, { id: "desc" }];
    default:
      return [{ publishedAt: "desc" }, { id: "desc" }];
  }
}

function assertNonDiscriminatory(job: Pick<Job, "title" | "summary" | "description" | "missions" | "responsibilities" | "requiredSkills" | "blockingCriteria">) {
  const findings = findDiscriminatoryCriteria([
    job.title,
    job.summary,
    job.description,
    ...job.missions,
    ...job.responsibilities,
    ...job.requiredSkills,
    ...job.blockingCriteria,
  ]);
  if (findings.length > 0) {
    throw new AppError(
      422,
      "discriminatory_criteria",
      "L'offre contient un critère de sélection interdit. Reformulez les passages signalés.",
      findings,
    );
  }
}

/** Contrôles croisés sur l'offre complète, après fusion d'une modification partielle. */
function assertConsistent(job: Pick<Job, "salaryMin" | "salaryMax" | "applicationChannel" | "applicationTarget">) {
  if (job.salaryMin !== null && job.salaryMax !== null && job.salaryMin > job.salaryMax) {
    throw new AppError(400, "validation_failed", "Certaines données sont invalides.", [
      { field: "salaryMax", message: "Le salaire maximum doit être supérieur au minimum.", code: "custom" },
    ]);
  }
  if (job.applicationChannel !== "sira" && !job.applicationTarget) {
    throw new AppError(400, "validation_failed", "Certaines données sont invalides.", [
      { field: "applicationTarget", message: "Indiquez où envoyer les candidatures.", code: "custom" },
    ]);
  }
}

/** Organisation affichée, sauf pour une offre anonymisée vue de l'extérieur. */
function presentOrganization(job: JobWithOrganization, owner: boolean) {
  if (job.visibility === "anonymisee" && !owner) return null;
  const o = job.organization;
  return { id: o.id, name: o.tradeName ?? o.legalName, city: o.city, logoUrl: o.logoUrl, verified: o.verificationStatus === "verifie" };
}

/** Vue compacte des listes : les champs longs restent sur la page de détail (réseau contraint). */
export function presentSummary(job: JobWithOrganization) {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    opportunityType: job.opportunityType,
    contractType: job.contractType,
    city: job.city,
    country: job.country,
    workMode: job.workMode,
    summary: job.summary,
    requiredSkills: job.requiredSkills,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    deadline: job.deadline,
    publishedAt: job.publishedAt,
    acceptsApplications: acceptsApplications(job),
    organization: presentOrganization(job, false),
  };
}

export function presentDetail(job: JobWithOrganization, owner: boolean) {
  const anonymous = job.visibility === "anonymisee" && !owner;
  return {
    ...presentSummary(job),
    organization: presentOrganization(job, owner),
    department: job.department,
    domain: job.domain,
    description: job.description,
    missions: job.missions,
    responsibilities: job.responsibilities,
    niceToHaveSkills: job.niceToHaveSkills,
    blockingCriteria: job.blockingCriteria,
    educationLevel: job.educationLevel,
    experienceYears: job.experienceYears,
    languages: job.languages,
    requiredDocuments: job.requiredDocuments,
    applicationChannel: job.applicationChannel,
    applicationTarget: anonymous ? null : job.applicationTarget,
    contact: anonymous ? null : job.contact,
    visibility: job.visibility,
    origin: job.origin,
    sourceUrl: job.sourceUrl,
    status: job.status,
    ...(owner && {
      version: job.version,
      viewCount: job.viewCount,
      closedAt: job.closedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }),
  };
}
