import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AiModule } from "./ai/ai.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuditModule } from "./audit/audit.service";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard, RolesGuard } from "./auth/auth.guards";
import { CandidatesModule } from "./candidates/candidates.module";
import { ConfigModule } from "./config/config.module";
import { HealthModule } from "./health/health.module";
import { JobsModule } from "./jobs/jobs.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
    // Limite générale par adresse IP ; l'authentification et l'IA ont des
    // limites plus strictes, déclarées sur leurs routes. Coupée en test.
    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ttl: 60_000, limit: 120 }],
      skipIf: () => process.env.NODE_ENV === "test",
    }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    CandidatesModule,
    JobsModule,
    ApplicationsModule,
    AiModule,
    HealthModule,
  ],
  providers: [
    // Ordre d'exécution : débit, puis authentification, puis rôle.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
})
export class AppModule {}
