import { Body, Controller, Get, HttpCode, Module, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Public, Roles, type AuthUser } from "../common/auth";
import { ApiZodBody, ZodPipe } from "../common/zod";
import {
  CreateOrganizationSchema,
  SubmitVerificationSchema,
  UpdateOrganizationSchema,
  VerificationDecisionSchema,
  type CreateOrganizationInput,
  type SubmitVerificationInput,
  type UpdateOrganizationInput,
  type VerificationDecisionInput,
} from "./organizations.schemas";
import { OrganizationsService } from "./organizations.service";

@ApiTags("Organisations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  @Roles("recruiter", "trainer")
  @ApiOperation({ summary: "Créer une organisation (vous en devenez propriétaire)" })
  @ApiZodBody(CreateOrganizationSchema)
  create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(CreateOrganizationSchema)) body: CreateOrganizationInput) {
    return this.organizations.create(user, body);
  }

  @Get("mine")
  @Roles("recruiter", "trainer")
  @ApiOperation({ summary: "Mes organisations" })
  mine(@CurrentUser() user: AuthUser) {
    return this.organizations.mine(user);
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Fiche publique d'une organisation" })
  get(@Param("id") id: string) {
    return this.organizations.get(id);
  }

  @Patch(":id")
  @Roles("recruiter", "trainer", "admin")
  @ApiOperation({ summary: "Modifier une organisation (propriétaire)" })
  @ApiZodBody(UpdateOrganizationSchema)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(UpdateOrganizationSchema)) body: UpdateOrganizationInput,
  ) {
    return this.organizations.update(user, id, body);
  }

  @Post(":id/verification")
  @HttpCode(200)
  @Roles("recruiter", "trainer")
  @ApiOperation({ summary: "Déposer les justificatifs de vérification" })
  @ApiZodBody(SubmitVerificationSchema)
  submitVerification(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(SubmitVerificationSchema)) body: SubmitVerificationInput,
  ) {
    return this.organizations.submitVerification(user, id, body);
  }

  @Post(":id/verification/decision")
  @HttpCode(200)
  @Roles("admin")
  @ApiOperation({ summary: "Décider de la vérification (administration)" })
  @ApiZodBody(VerificationDecisionSchema)
  decide(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(VerificationDecisionSchema)) body: VerificationDecisionInput,
  ) {
    return this.organizations.decide(user, id, body);
  }
}

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
