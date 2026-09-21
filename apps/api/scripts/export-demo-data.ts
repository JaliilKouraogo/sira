/**
 * Régénère `prisma/demo-data.json` à partir des données de démonstration du
 * site (`apps/web/src/data/fixtures.ts`), pour que l'API et le site montrent
 * les mêmes organisations, offres et comptes.
 *
 *   npx tsx scripts/export-demo-data.ts
 *
 * Les dates restent celles du site ; le seed les décale pour que les offres
 * soient toujours ouvertes le jour où il est lancé.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { TODAY, candidateProfile, jobs, organizations, users } from "../../web/src/data/fixtures";

const data = {
  source: "apps/web/src/data/fixtures.ts",
  referenceDate: TODAY,
  users: users.map((u) => ({
    id: u.id,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    emailVerifiedAt: u.emailVerifiedAt ?? null,
    createdAt: u.createdAt,
  })),
  // Le site rattache son recruteur de démonstration à Sahel Agro (org_01).
  memberships: [{ userId: "usr_rec_01", organizationId: "org_01", role: "proprietaire", jobTitle: "Responsable du recrutement" }],
  organizations: organizations.map((o) => ({
    id: o.id,
    legalName: o.legalName,
    tradeName: o.tradeName ?? null,
    type: o.type,
    sector: o.sector,
    size: o.size ?? null,
    country: o.country,
    city: o.city,
    address: o.address ?? null,
    website: o.website ?? null,
    description: o.description,
    verificationStatus: o.verificationStatus,
    isPartner: o.isPartner,
    createdAt: o.createdAt,
  })),
  jobs: jobs.map((j) => ({
    id: j.id,
    slug: j.slug,
    organizationId: j.organizationId,
    title: j.title,
    opportunityType: j.opportunityType,
    contractType: j.contractType,
    department: j.department ?? null,
    country: j.country,
    city: j.city,
    workMode: j.workMode,
    summary: j.summary,
    description: j.description,
    missions: j.missions,
    responsibilities: j.responsibilities,
    requiredSkills: j.requiredSkills,
    niceToHaveSkills: j.niceToHaveSkills,
    blockingCriteria: j.blockingCriteria,
    educationLevel: j.educationLevel || null,
    experienceYears: j.experienceYears,
    languages: j.languages,
    salaryMin: j.salaryMin ?? null,
    salaryMax: j.salaryMax ?? null,
    deadline: j.deadline,
    requiredDocuments: j.requiredDocuments,
    applicationChannel: j.applicationChannel,
    applicationTarget: j.applicationTarget ?? null,
    contact: j.contact ?? null,
    visibility: j.visibility,
    origin: j.origin,
    sourceUrl: j.sourceUrl ?? null,
    status: j.status,
    publishedAt: j.publishedAt,
    viewCount: j.viewCount,
  })),
  candidateProfile: (({ id, userId, whatsappLinked, plan, completionScore, ...rest }) => ({ id, userId, ...rest }))(
    candidateProfile,
  ),
};

const target = path.join(__dirname, "..", "prisma", "demo-data.json");
writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `demo-data.json : ${data.users.length} comptes, ${data.organizations.length} organisations, ${data.jobs.length} offres.`,
);
