import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { ENV, type Env } from "../src/config/env";
import { PrismaService } from "../src/prisma/prisma.service";

export const API = "/api/v1";

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app, app.get<Env>(ENV));
  await app.init();
  return app;
}

/** Adresse unique par appel : les tests partagent la même base. */
export const uniqueEmail = (prefix: string) => `${prefix}.${randomUUID().slice(0, 8)}@test.sira.bf`;

export interface Session {
  token: string;
  userId: string;
  cookie: string;
  auth: { Authorization: string };
}

export async function register(
  app: INestApplication,
  role: "candidate" | "recruiter",
  overrides: Record<string, unknown> = {},
): Promise<Session> {
  const res = await request(app.getHttpServer())
    .post(`${API}/auth/register`)
    .send({
      role,
      email: uniqueEmail(role),
      password: "motdepasse-solide",
      firstName: role === "candidate" ? "Awa" : "Issa",
      lastName: "Test",
      acceptTerms: true,
      ...overrides,
    })
    .expect(201);
  return toSession(res);
}

/** Compte administrateur créé directement en base : aucune inscription publique ne le permet. */
export async function createAdmin(app: INestApplication): Promise<Session> {
  const email = uniqueEmail("admin");
  const candidate = await register(app, "candidate", { email });
  await app.get(PrismaService).user.update({ where: { id: candidate.userId }, data: { role: "admin" } });
  const res = await request(app.getHttpServer())
    .post(`${API}/auth/login`)
    .send({ email, password: "motdepasse-solide" })
    .expect(200);
  return toSession(res);
}

function toSession(res: request.Response): Session {
  const body = res.body as { accessToken: string; user: { id: string } };
  const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
  const cookie = cookies.find((c) => c.startsWith("sira_refresh="))?.split(";")[0] ?? "";
  return { token: body.accessToken, userId: body.user.id, cookie, auth: { Authorization: `Bearer ${body.accessToken}` } };
}

/** Organisation créée par un recruteur puis vérifiée par l'administration. */
export async function createVerifiedOrganization(app: INestApplication, recruiter: Session, admin: Session): Promise<string> {
  const server = app.getHttpServer();
  const org = await request(server)
    .post(`${API}/organizations`)
    .set(recruiter.auth)
    .send({ legalName: "Faso Test SARL", type: "entreprise", city: "Ouagadougou" })
    .expect(201);
  await request(server)
    .post(`${API}/organizations/${org.body.id}/verification`)
    .set(recruiter.auth)
    .send({ documents: [{ kind: "RCCM", reference: "BF-OUA-2026-B-1234" }] })
    .expect(200);
  await request(server)
    .post(`${API}/organizations/${org.body.id}/verification/decision`)
    .set(admin.auth)
    .send({ decision: "verifie" })
    .expect(200);
  return org.body.id as string;
}

export const jobPayload = (organizationId: string, overrides: Record<string, unknown> = {}) => ({
  organizationId,
  title: "Gestionnaire de stock",
  opportunityType: "emploi",
  contractType: "cdi",
  city: "Ouagadougou",
  summary: "Suivre les stocks d'un entrepôt de distribution et fiabiliser les inventaires.",
  description:
    "Rattaché au responsable des opérations, vous pilotez les entrées et sorties de marchandises, les inventaires tournants et la préparation des commandes.",
  requiredSkills: ["Gestion de stock", "Excel"],
  experienceYears: 2,
  educationLevel: "BTS / DUT (Bac+2)",
  deadline: new Date(Date.now() + 20 * 86_400_000).toISOString(),
  ...overrides,
});
