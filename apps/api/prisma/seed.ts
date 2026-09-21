/**
 * Données de démonstration : les comptes, organisations et offres du site,
 * issus de `demo-data.json` (voir scripts/export-demo-data.ts).
 *
 *   npm run db:seed
 *
 * Le script peut être relancé sans risque : chaque ligne est mise à jour si
 * elle existe déjà. Il refuse de tourner en production.
 */
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync } from "node:fs";
import path from "node:path";
import { completion } from "../src/candidates/completion";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import demo from "./demo-data.json";

const envFile = path.join(__dirname, "..", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

if (process.env.NODE_ENV === "production") {
  throw new Error("Les données de démonstration ne sont jamais chargées en production.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est obligatoire.");

/** Mot de passe commun aux comptes de démonstration, pour le développement local. */
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo-SIRA-2026";

/**
 * Les dates du site sont fixées au 12 septembre 2026. Elles sont décalées
 * d'autant de jours que nécessaire pour que les offres ouvertes le restent
 * aujourd'hui, et que l'offre expirée le reste aussi.
 */
const today = new Date();
today.setUTCHours(12, 0, 0, 0);
const shiftMs = today.getTime() - Date.parse(`${demo.referenceDate}T12:00:00Z`);
const shifted = (value: string | null): Date | null =>
  value ? new Date(Date.parse(value.length === 10 ? `${value}T12:00:00Z` : value) + shiftMs) : null;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main(): Promise<void> {
  const passwordHash = await hash(DEMO_PASSWORD, { memoryCost: 19_456, timeCost: 2, parallelism: 1 });

  for (const u of demo.users) {
    const data = {
      email: u.email,
      phone: u.phone ? u.phone.replace(/[^\d+]/g, "") : null,
      role: u.role as Prisma.UserCreateInput["role"],
      firstName: u.firstName,
      lastName: u.lastName,
      passwordHash,
      emailVerifiedAt: shifted(u.emailVerifiedAt),
    };
    await prisma.user.upsert({ where: { id: u.id }, create: { id: u.id, ...data, createdAt: shifted(u.createdAt) ?? today }, update: data });
  }

  const { id: profileId, userId, ...profile } = demo.candidateProfile;
  const profileData = {
    ...profile,
    opportunityTypes: profile.opportunityTypes as Prisma.CandidateProfileCreateInput["opportunityTypes"],
    contractTypes: profile.contractTypes as Prisma.CandidateProfileCreateInput["contractTypes"],
    workModes: profile.workModes as Prisma.CandidateProfileCreateInput["workModes"],
    profileVisibility: profile.profileVisibility as Prisma.CandidateProfileCreateInput["profileVisibility"],
    completionScore: completion(profile).score,
  };
  await prisma.candidateProfile.upsert({
    where: { userId },
    create: { id: profileId, user: { connect: { id: userId } }, ...profileData },
    update: profileData,
  });

  for (const o of demo.organizations) {
    const data = {
      ...o,
      type: o.type as Prisma.OrganizationCreateInput["type"],
      verificationStatus: o.verificationStatus as Prisma.OrganizationCreateInput["verificationStatus"],
      verifiedAt: o.verificationStatus === "verifie" ? shifted(o.createdAt) : null,
      createdAt: shifted(o.createdAt) ?? today,
    };
    await prisma.organization.upsert({ where: { id: o.id }, create: data, update: data });
  }

  for (const m of demo.memberships) {
    const role = m.role as Prisma.MembershipCreateInput["role"];
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: m.userId, organizationId: m.organizationId } },
      create: { ...m, role },
      update: { role, jobTitle: m.jobTitle },
    });
  }

  // Les offres d'une organisation sans compte de démonstration sont rattachées
  // à l'administration, qui les a saisies pour la démonstration.
  const creatorOf = new Map(demo.memberships.map((m) => [m.organizationId, m.userId]));
  const adminId = demo.users.find((u) => u.role === "admin")?.id;
  if (!adminId) throw new Error("demo-data.json doit contenir un compte administrateur.");

  for (const j of demo.jobs) {
    const data = {
      ...j,
      opportunityType: j.opportunityType as Prisma.JobCreateInput["opportunityType"],
      contractType: j.contractType as Prisma.JobCreateInput["contractType"],
      workMode: j.workMode as Prisma.JobCreateInput["workMode"],
      applicationChannel: j.applicationChannel as Prisma.JobCreateInput["applicationChannel"],
      visibility: j.visibility as Prisma.JobCreateInput["visibility"],
      origin: j.origin as Prisma.JobCreateInput["origin"],
      status: j.status as Prisma.JobCreateInput["status"],
      deadline: shifted(j.deadline),
      publishedAt: j.status === "en_validation" ? null : shifted(j.publishedAt),
      createdById: creatorOf.get(j.organizationId) ?? adminId,
    };
    await prisma.job.upsert({ where: { id: j.id }, create: data, update: data });
  }

  const open = await prisma.job.count({ where: { status: "publiee", deadline: { gt: new Date() } } });
  console.log(`Démonstration chargée : ${demo.users.length} comptes, ${demo.organizations.length} organisations, ${demo.jobs.length} offres dont ${open} ouvertes.`);
  console.log(`Comptes (mot de passe commun « ${DEMO_PASSWORD} ») :`);
  for (const u of demo.users) console.log(`  ${u.role.padEnd(10)} ${u.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
