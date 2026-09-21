import { Body, Controller, Delete, Get, HttpCode, Module, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { CandidatesModule, CandidatesService } from "../candidates/candidates.module";
import { CurrentUser, Public, Roles, type AuthUser } from "../common/auth";
import { ApiZodBody, ApiZodQuery, ZodPipe } from "../common/zod";
import { OrganizationsModule } from "../organizations/organizations.module";
import {
  CreateJobSchema,
  JobSearchQuery,
  MyJobsQuery,
  SaveJobSchema,
  UpdateJobSchema,
  type CreateJobInput,
  type JobSearchInput,
  type MyJobsInput,
  type UpdateJobInput,
} from "./jobs.schemas";
import { JobsService } from "./jobs.service";

@ApiTags("Offres")
@ApiBearerAuth()
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Rechercher parmi les offres publiées" })
  @ApiZodQuery(JobSearchQuery)
  search(@Query(new ZodPipe(JobSearchQuery)) query: JobSearchInput) {
    return this.jobs.search(query);
  }

  @Get("mine")
  @Roles("recruiter", "admin")
  @ApiOperation({ summary: "Offres de mes organisations, tous statuts confondus" })
  @ApiZodQuery(MyJobsQuery)
  mine(@CurrentUser() user: AuthUser, @Query(new ZodPipe(MyJobsQuery)) query: MyJobsInput) {
    return this.jobs.mine(user, query);
  }

  @Get(":idOrSlug")
  @Public()
  @ApiOperation({ summary: "Détail d'une offre, par identifiant ou adresse lisible" })
  detail(@Param("idOrSlug") idOrSlug: string, @CurrentUser() user?: AuthUser) {
    return this.jobs.detail(idOrSlug, user);
  }

  @Post()
  @Roles("recruiter", "admin")
  @ApiOperation({ summary: "Créer une offre (brouillon)" })
  @ApiZodBody(CreateJobSchema)
  create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(CreateJobSchema)) body: CreateJobInput) {
    return this.jobs.create(user, body);
  }

  @Patch(":id")
  @Roles("recruiter", "admin")
  @ApiOperation({ summary: "Modifier une offre" })
  @ApiZodBody(UpdateJobSchema)
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body(new ZodPipe(UpdateJobSchema)) body: UpdateJobInput) {
    return this.jobs.update(user, id, body);
  }

  @Post(":id/publish")
  @HttpCode(200)
  @Roles("recruiter", "admin")
  @ApiOperation({ summary: "Publier (organisation vérifiée, texte sans critère discriminatoire)" })
  publish(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.jobs.transition(user, id, "publish");
  }

  @Post(":id/suspend")
  @HttpCode(200)
  @Roles("recruiter", "admin")
  @ApiOperation({ summary: "Suspendre une offre publiée" })
  suspend(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.jobs.transition(user, id, "suspend");
  }

  @Post(":id/close")
  @HttpCode(200)
  @Roles("recruiter", "admin")
  @ApiOperation({ summary: "Clôturer une offre" })
  close(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.jobs.transition(user, id, "close");
  }
}

@ApiTags("Offres enregistrées")
@ApiBearerAuth()
@Controller("saved-jobs")
export class SavedJobsController {
  constructor(
    private readonly jobs: JobsService,
    private readonly candidates: CandidatesService,
  ) {}

  @Get()
  @Roles("candidate")
  @ApiOperation({ summary: "Mes offres enregistrées" })
  async list(@CurrentUser() user: AuthUser) {
    const profile = await this.candidates.profileOf(user.id);
    return this.jobs.saved(profile.id);
  }

  @Post()
  @HttpCode(200)
  @Roles("candidate")
  @ApiOperation({ summary: "Enregistrer une offre" })
  @ApiZodBody(SaveJobSchema)
  async save(@CurrentUser() user: AuthUser, @Body(new ZodPipe(SaveJobSchema)) body: z.output<typeof SaveJobSchema>) {
    const profile = await this.candidates.profileOf(user.id);
    return this.jobs.save(profile.id, body.jobId);
  }

  @Delete(":jobId")
  @HttpCode(204)
  @Roles("candidate")
  @ApiOperation({ summary: "Retirer une offre enregistrée" })
  async unsave(@CurrentUser() user: AuthUser, @Param("jobId") jobId: string): Promise<void> {
    const profile = await this.candidates.profileOf(user.id);
    await this.jobs.unsave(profile.id, jobId);
  }
}

@Module({
  imports: [OrganizationsModule, CandidatesModule],
  controllers: [JobsController, SavedJobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
