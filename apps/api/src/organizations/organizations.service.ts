import { Injectable } from "@nestjs/common";
import type { MembershipRole } from "@sira/shared";
import { AppError, conflict, forbidden, notFound } from "../common/app-error";
import type { AuthUser } from "../common/auth";
import { AuditService } from "../audit/audit.service";
import type { Organization } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CreateOrganizationInput,
  SubmitVerificationInput,
  UpdateOrganizationInput,
  VerificationDecisionInput,
} from "./organizations.schemas";

/** Rôles de membre qui peuvent créer et modifier des offres. */
export const EDITOR_ROLES: MembershipRole[] = ["proprietaire", "recruteur"];

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, input: CreateOrganizationInput) {
    const organization = await this.prisma.organization.create({
      data: { ...input, memberships: { create: { userId: user.id, role: "proprietaire" } } },
    });
    await this.audit.log({ actorId: user.id, action: "organization.created", objectType: "organization", objectId: organization.id });
    return present(organization);
  }

  async mine(user: AuthUser) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({ ...present(m.organization), membershipRole: m.role }));
  }

  async get(id: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) throw notFound("Organisation");
    return present(organization);
  }

  async update(user: AuthUser, id: string, input: UpdateOrganizationInput) {
    await this.assertMember(user, id, ["proprietaire"]);
    const organization = await this.prisma.organization.update({ where: { id }, data: input });
    return present(organization);
  }

  /** Dépôt des justificatifs : l'organisation passe en vérification. */
  async submitVerification(user: AuthUser, id: string, input: SubmitVerificationInput) {
    const { organization } = await this.assertMember(user, id, ["proprietaire"]);
    if (organization.verificationStatus !== "non_verifie" && organization.verificationStatus !== "refuse") {
      throw conflict("verification_not_allowed", "Cette organisation est déjà vérifiée ou en cours de vérification.");
    }
    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        verificationStatus: "en_verification",
        verificationDocuments: input.documents.map((d) => ({ ...d, submittedAt: new Date().toISOString() })),
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: "organization.verification_submitted",
      objectType: "organization",
      objectId: id,
      after: { documents: input.documents.length },
    });
    return present(updated);
  }

  /** Décision de l'administration (matrice RBAC : le modérateur instruit, l'admin décide). */
  async decide(admin: AuthUser, id: string, input: VerificationDecisionInput) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) throw notFound("Organisation");
    const from = organization.verificationStatus;
    const allowed =
      input.decision === "suspendu" ? from === "verifie" : from === "en_verification" || from === "non_verifie";
    if (!allowed) {
      throw conflict("invalid_transition", `Impossible de passer de « ${from} » à « ${input.decision} ».`);
    }
    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        verificationStatus: input.decision,
        verifiedAt: input.decision === "verifie" ? new Date() : organization.verifiedAt,
      },
    });
    await this.audit.log({
      actorId: admin.id,
      action: `organization.${input.decision}`,
      objectType: "organization",
      objectId: id,
      before: { verificationStatus: from },
      after: { verificationStatus: input.decision, reason: input.reason ?? null },
    });
    return present(updated);
  }

  /**
   * Vérifie que l'utilisateur est membre avec l'un des rôles demandés. Un
   * administrateur passe partout (matrice RBAC, section 11.2).
   */
  async assertMember(user: AuthUser, organizationId: string, roles: MembershipRole[] = EDITOR_ROLES) {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw notFound("Organisation");
    if (user.role === "admin") return { organization, membership: null };
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
    });
    if (!membership) throw forbidden("Vous n'êtes pas membre de cette organisation.");
    if (!roles.includes(membership.role)) {
      throw new AppError(403, "insufficient_membership", "Votre rôle dans cette organisation ne permet pas cette action.");
    }
    return { organization, membership };
  }

  /** Organisations dont l'utilisateur est membre, quel que soit son rôle. */
  async memberOrganizationIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.membership.findMany({ where: { userId }, select: { organizationId: true } });
    return rows.map((r) => r.organizationId);
  }
}

/** Vue publique : les justificatifs ne sont jamais renvoyés. */
export function present(o: Organization) {
  return {
    id: o.id,
    legalName: o.legalName,
    tradeName: o.tradeName,
    name: o.tradeName ?? o.legalName,
    type: o.type,
    sector: o.sector,
    size: o.size,
    country: o.country,
    city: o.city,
    address: o.address,
    website: o.website,
    description: o.description,
    logoUrl: o.logoUrl,
    verificationStatus: o.verificationStatus,
    verifiedAt: o.verifiedAt,
    isPartner: o.isPartner,
    createdAt: o.createdAt,
  };
}

