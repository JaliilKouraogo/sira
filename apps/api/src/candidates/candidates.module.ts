import { Body, Controller, Get, Injectable, Module, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { notFound } from "../common/app-error";
import { CurrentUser, Roles, type AuthUser } from "../common/auth";
import { ApiZodBody, ZodPipe } from "../common/zod";
import type { CandidateProfile } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateCandidateProfileSchema, type UpdateCandidateProfileInput } from "./candidates.schemas";
import { completion } from "./completion";

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Profil du candidat connecté ; créé à l'inscription, il existe toujours. */
  async profileOf(userId: string): Promise<CandidateProfile> {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) throw notFound("Profil candidat");
    return profile;
  }

  async me(userId: string) {
    return present(await this.profileOf(userId));
  }

  /**
   * Chaque modification incrémente la version du profil : les scores calculés
   * sur une version antérieure sont alors signalés comme à recalculer (RM-05).
   */
  async update(userId: string, input: UpdateCandidateProfileInput) {
    const current = await this.profileOf(userId);
    const merged = { ...current, ...input };
    const { score } = completion(merged);
    const updated = await this.prisma.candidateProfile.update({
      where: { id: current.id },
      data: { ...input, completionScore: score, version: { increment: 1 } },
    });
    return present(updated);
  }
}

function present(p: CandidateProfile) {
  const { missing } = completion(p);
  return {
    id: p.id,
    headline: p.headline,
    country: p.country,
    city: p.city,
    searchZones: p.searchZones,
    professionalSituation: p.professionalSituation,
    educationLevel: p.educationLevel,
    educations: p.educations,
    domain: p.domain,
    targetJobs: p.targetJobs,
    experienceYears: p.experienceYears,
    experiences: p.experiences,
    hardSkills: p.hardSkills,
    softSkills: p.softSkills,
    languages: p.languages,
    opportunityTypes: p.opportunityTypes,
    contractTypes: p.contractTypes,
    availability: p.availability,
    salaryExpectation: p.salaryExpectation,
    geographicMobility: p.geographicMobility,
    workModes: p.workModes,
    profileVisibility: p.profileVisibility,
    completion: { score: p.completionScore, missing },
    version: p.version,
    updatedAt: p.updatedAt,
  };
}

@ApiTags("Candidats")
@ApiBearerAuth()
@Controller("candidates")
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get("me")
  @Roles("candidate")
  @ApiOperation({ summary: "Mon profil candidat et sa complétude" })
  me(@CurrentUser() user: AuthUser) {
    return this.candidates.me(user.id);
  }

  @Patch("me")
  @Roles("candidate")
  @ApiOperation({ summary: "Modifier mon profil candidat" })
  @ApiZodBody(UpdateCandidateProfileSchema)
  update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(UpdateCandidateProfileSchema)) body: UpdateCandidateProfileInput,
  ) {
    return this.candidates.update(user.id, body);
  }
}

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
