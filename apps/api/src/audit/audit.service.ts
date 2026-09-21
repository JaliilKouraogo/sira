import { Global, Injectable, Logger, Module } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  objectType: string;
  objectId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string | null;
}

/**
 * Journal d'audit des actions importantes (section 11.1 du plan). Une
 * écriture qui échoue est signalée dans les journaux mais ne fait pas
 * échouer l'action métier qu'elle décrit.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger("Audit");

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          objectType: entry.objectType,
          objectId: entry.objectId,
          before: entry.before,
          after: entry.after,
          ip: entry.ip ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Écriture impossible pour ${entry.action} sur ${entry.objectType}/${entry.objectId}`, error);
    }
  }
}

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
