import { Body, Controller, Get, Headers, HttpCode, Module, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { AiModule } from "../ai/ai.module";
import { CandidatesModule } from "../candidates/candidates.module";
import { CurrentUser, Roles, type AuthUser } from "../common/auth";
import { ApiZodBody, ApiZodQuery, ZodPipe } from "../common/zod";
import { OrganizationsModule } from "../organizations/organizations.module";
import {
  ApplicationsQuery,
  CreateApplicationSchema,
  NoteSchema,
  PreparationSchema,
  ReviewSchema,
  type ApplicationsQueryInput,
  type CreateApplicationInput,
  type NoteInput,
  type PreparationInput,
  type ReviewInput,
} from "./applications.schemas";
import { ApplicationsService } from "./applications.service";

@ApiTags("Candidatures")
@ApiBearerAuth()
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @Roles("candidate", "recruiter", "admin", "moderator")
  @ApiOperation({ summary: "Mes candidatures, ou celles reçues sur mes offres" })
  @ApiZodQuery(ApplicationsQuery)
  list(@CurrentUser() user: AuthUser, @Query(new ZodPipe(ApplicationsQuery)) query: ApplicationsQueryInput) {
    return this.applications.list(user, query);
  }

  /** 201 à la création, 200 quand la même clé rejoue une candidature existante. */
  @Post()
  @Roles("candidate")
  @ApiOperation({ summary: "Créer une candidature (brouillon)" })
  @ApiHeader({ name: "Idempotency-Key", required: true, description: "Identifiant unique de la tentative, un UUID par exemple." })
  @ApiZodBody(CreateApplicationSchema)
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(CreateApplicationSchema)) body: CreateApplicationInput,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { application, replayed } = await this.applications.create(user, body.jobId, idempotencyKey);
    res.status(replayed ? 200 : 201);
    return application;
  }

  @Get(":id")
  @Roles("candidate", "recruiter", "admin", "moderator")
  @ApiOperation({ summary: "Détail d'une candidature" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.applications.get(user, id);
  }

  @Patch(":id/preparation")
  @Roles("candidate")
  @ApiOperation({ summary: "Faire avancer la préparation (brouillon, à vérifier, validée…)" })
  @ApiZodBody(PreparationSchema)
  prepare(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body(new ZodPipe(PreparationSchema)) body: PreparationInput) {
    return this.applications.prepare(user, id, body.status);
  }

  @Post(":id/submit")
  @HttpCode(200)
  @Roles("candidate")
  @ApiOperation({ summary: "Envoyer la candidature (elle doit être validée)" })
  submit(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.applications.submit(user, id);
  }

  @Patch(":id/review")
  @Roles("recruiter")
  @ApiOperation({ summary: "Changer l'état de revue (décision du recruteur)" })
  @ApiZodBody(ReviewSchema)
  review(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body(new ZodPipe(ReviewSchema)) body: ReviewInput) {
    return this.applications.review(user, id, body.status);
  }

  @Post(":id/notes")
  @Roles("recruiter")
  @ApiOperation({ summary: "Ajouter une note interne, jamais visible du candidat" })
  @ApiZodBody(NoteSchema)
  addNote(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body(new ZodPipe(NoteSchema)) body: NoteInput) {
    return this.applications.addNote(user, id, body.text);
  }
}

@Module({
  imports: [CandidatesModule, OrganizationsModule, AiModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
