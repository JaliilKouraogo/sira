import type { INestApplication } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { API, createAdmin, createApp, createVerifiedOrganization, jobPayload, register, type Session } from "./helpers";

/**
 * Parcours complet : un recruteur fait vérifier son organisation et publie,
 * un candidat calcule son score, postule, valide puis envoie ; le recruteur
 * examine. Chaque étape vérifie aussi ce qui doit être refusé.
 */
describe("Recrutement de bout en bout", () => {
  let app: INestApplication;
  let admin: Session;
  let recruiter: Session;
  let candidate: Session;
  let organizationId: string;
  let jobId: string;
  let jobSlug: string;
  let applicationId: string;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    app = await createApp();
    admin = await createAdmin(app);
    recruiter = await register(app, "recruiter");
    candidate = await register(app, "candidate");
  });
  afterAll(async () => {
    await app.close();
  });

  describe("Organisation et offres", () => {
    it("RM-11 : une organisation non vérifiée ne publie pas", async () => {
      const org = await request(server())
        .post(`${API}/organizations`)
        .set(recruiter.auth)
        .send({ legalName: "Non Vérifiée SA", type: "entreprise", city: "Koudougou" })
        .expect(201);
      const job = await request(server()).post(`${API}/jobs`).set(recruiter.auth).send(jobPayload(org.body.id)).expect(201);
      expect(job.body.status).toBe("brouillon");
      const res = await request(server()).post(`${API}/jobs/${job.body.id}/publish`).set(recruiter.auth).expect(403);
      expect(res.body.error.code).toBe("organization_not_verified");
    });

    it("seule l'administration décide de la vérification", async () => {
      const org = await request(server())
        .post(`${API}/organizations`)
        .set(recruiter.auth)
        .send({ legalName: "Autre SA", type: "entreprise", city: "Kaya" })
        .expect(201);
      await request(server())
        .post(`${API}/organizations/${org.body.id}/verification/decision`)
        .set(recruiter.auth)
        .send({ decision: "verifie" })
        .expect(403);
    });

    it("publie une offre d'une organisation vérifiée", async () => {
      organizationId = await createVerifiedOrganization(app, recruiter, admin);
      const created = await request(server()).post(`${API}/jobs`).set(recruiter.auth).send(jobPayload(organizationId)).expect(201);
      jobId = created.body.id;
      jobSlug = created.body.slug;
      expect(jobSlug).toMatch(/^gestionnaire-de-stock-faso-test-sarl-[0-9a-f]{6}$/);

      // Un brouillon n'existe pas pour le public.
      await request(server()).get(`${API}/jobs/${jobId}`).expect(404);

      const published = await request(server()).post(`${API}/jobs/${jobId}/publish`).set(recruiter.auth).expect(200);
      expect(published.body).toMatchObject({ status: "publiee", acceptsApplications: true });
      expect(published.body.publishedAt).toEqual(expect.any(String));
    });

    it("bloque la publication d'une offre discriminatoire et cite l'extrait", async () => {
      const job = await request(server())
        .post(`${API}/jobs`)
        .set(recruiter.auth)
        .send(jobPayload(organizationId, { summary: "Magasinier âgé de moins de 35 ans, rigoureux et disponible." }))
        .expect(201);
      const res = await request(server()).post(`${API}/jobs/${job.body.id}/publish`).set(recruiter.auth).expect(422);
      expect(res.body.error.code).toBe("discriminatory_criteria");
      expect(res.body.error.details).toEqual([{ criterion: "âge", excerpt: "âgé de moins de 35 ans" }]);
    });

    it("refuse qu'un recruteur d'une autre organisation modifie l'offre", async () => {
      const other = await register(app, "recruiter");
      await request(server()).patch(`${API}/jobs/${jobId}`).set(other.auth).send({ title: "Détournée" }).expect(403);
    });

    it("trouve l'offre publiée sans tenir compte des accents", async () => {
      const res = await request(server()).get(`${API}/jobs`).query({ q: "GESTIONNAIRE stock", city: "ouagadougou" }).expect(200);
      expect(res.body.data.map((j: { id: string }) => j.id)).toContain(jobId);
      const detail = await request(server()).get(`${API}/jobs/${jobSlug}`).expect(200);
      expect(detail.body.organization).toMatchObject({ name: "Faso Test SARL", verified: true });
      expect(detail.body).not.toHaveProperty("viewCount");
    });

    it("rejette un filtre invalide avec un message clair", async () => {
      const res = await request(server()).get(`${API}/jobs`).query({ opportunityType: "cdi-a-vie", limit: 500 }).expect(400);
      expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(["limit", "opportunityType"].sort());
    });
  });

  describe("Score de compatibilité", () => {
    it("calcule un score déterministe, avec la mention obligatoire, même sans IA", async () => {
      await request(server())
        .patch(`${API}/candidates/me`)
        .set(candidate.auth)
        .send({
          city: "Ouagadougou",
          educationLevel: "Licence (Bac+3)",
          experienceYears: 3,
          hardSkills: [{ name: "Gestion des stocks" }, { name: "Excel avancé" }],
          availability: "Immédiate",
        })
        .expect(200);

      const res = await request(server()).post(`${API}/ai/match`).set(candidate.auth).send({ jobId: jobSlug }).expect(200);
      expect(res.body).toMatchObject({
        score: 100,
        explanationSource: "regles",
        model: "regles-v1",
        disclaimer: "Estimation algorithmique fondée sur les informations disponibles. Ne garantit pas le recrutement.",
        stale: false,
      });
      expect(Object.keys(res.body.breakdown)).toEqual([
        "competences",
        "experience",
        "formation",
        "localisation",
        "langues",
        "disponibilite",
      ]);
    });

    it("RM-05 : signale le score comme périmé quand le profil change", async () => {
      await request(server()).patch(`${API}/candidates/me`).set(candidate.auth).send({ experienceYears: 1 }).expect(200);
      const res = await request(server()).get(`${API}/ai/match-scores/${jobId}`).set(candidate.auth).expect(200);
      expect(res.body.stale).toBe(true);
    });
  });

  describe("Candidature", () => {
    it("exige une clé d'idempotence", async () => {
      const res = await request(server()).post(`${API}/applications`).set(candidate.auth).send({ jobId }).expect(400);
      expect(res.body.error.code).toBe("idempotency_key_required");
    });

    it("crée la candidature une seule fois, même si la requête est rejouée", async () => {
      const key = randomUUID();
      const first = await request(server())
        .post(`${API}/applications`)
        .set(candidate.auth)
        .set("Idempotency-Key", key)
        .send({ jobId })
        .expect(201);
      applicationId = first.body.id;
      expect(first.body).toMatchObject({ preparationStatus: "brouillon", review: null, score: expect.any(Number) });

      const replay = await request(server())
        .post(`${API}/applications`)
        .set(candidate.auth)
        .set("Idempotency-Key", key)
        .send({ jobId })
        .expect(200);
      expect(replay.body.id).toBe(applicationId);

      const again = await request(server())
        .post(`${API}/applications`)
        .set(candidate.auth)
        .set("Idempotency-Key", randomUUID())
        .send({ jobId })
        .expect(409);
      expect(again.body.error).toMatchObject({ code: "already_applied", details: { applicationId } });
    });

    it("RM-06 : rien ne part sans validation du candidat", async () => {
      const res = await request(server()).post(`${API}/applications/${applicationId}/submit`).set(candidate.auth).expect(409);
      expect(res.body.error.code).toBe("preparation_not_validated");
      // « envoyee » ne s'atteint pas par la préparation.
      await request(server())
        .patch(`${API}/applications/${applicationId}/preparation`)
        .set(candidate.auth)
        .send({ status: "envoyee" })
        .expect(400);
    });

    it("ne montre pas au recruteur une candidature non envoyée", async () => {
      await request(server()).get(`${API}/applications/${applicationId}`).set(recruiter.auth).expect(404);
      const list = await request(server()).get(`${API}/applications`).set(recruiter.auth).expect(200);
      expect(list.body.data).toEqual([]);
    });

    it("envoie la candidature une fois validée", async () => {
      await request(server())
        .patch(`${API}/applications/${applicationId}/preparation`)
        .set(candidate.auth)
        .send({ status: "a_verifier" })
        .expect(200);
      await request(server())
        .patch(`${API}/applications/${applicationId}/preparation`)
        .set(candidate.auth)
        .send({ status: "validee" })
        .expect(200);
      const res = await request(server()).post(`${API}/applications/${applicationId}/submit`).set(candidate.auth).expect(200);
      expect(res.body).toMatchObject({
        preparationStatus: "envoyee",
        review: { status: "envoyee", label: "Envoyée" },
        delivery: { channel: "sira", mode: "deposee" },
      });
    });
  });

  describe("Revue par le recruteur", () => {
    it("révèle les coordonnées du candidat après candidature", async () => {
      const list = await request(server()).get(`${API}/applications`).set(recruiter.auth).expect(200);
      expect(list.body.data).toHaveLength(1);
      const detail = await request(server()).get(`${API}/applications/${applicationId}`).set(recruiter.auth).expect(200);
      expect(detail.body.candidate.email).toMatch(/@test\.sira\.bf$/);
      expect(detail.body.scoreDetail.disclaimer).toEqual(expect.any(String));
    });

    it("n'ouvre pas le dossier à un recruteur d'une autre organisation", async () => {
      const other = await register(app, "recruiter");
      await request(server()).get(`${API}/applications/${applicationId}`).set(other.auth).expect(404);
    });

    it("garde la décision au recruteur : l'administration lit mais ne décide pas", async () => {
      await request(server()).get(`${API}/applications/${applicationId}`).set(admin.auth).expect(200);
      await request(server())
        .patch(`${API}/applications/${applicationId}/review`)
        .set(admin.auth)
        .send({ status: "refusee" })
        .expect(403);
    });

    it("le candidat ne voit jamais l'état interne ni les notes du recruteur", async () => {
      await request(server())
        .patch(`${API}/applications/${applicationId}/review`)
        .set(recruiter.auth)
        .send({ status: "a_examiner" })
        .expect(200);
      await request(server())
        .patch(`${API}/applications/${applicationId}/review`)
        .set(recruiter.auth)
        .send({ status: "shortlist" })
        .expect(200);
      await request(server())
        .post(`${API}/applications/${applicationId}/notes`)
        .set(recruiter.auth)
        .send({ text: "Profil solide, à appeler cette semaine." })
        .expect(201);

      const seen = await request(server()).get(`${API}/applications/${applicationId}`).set(candidate.auth).expect(200);
      expect(seen.body.review).toEqual({ status: "en_examen", label: "En cours d'examen" });
      const raw = JSON.stringify(seen.body);
      expect(raw).not.toMatch(/shortlist/i);
      expect(raw).not.toContain("à appeler cette semaine");
      // « À examiner » puis « shortlist » : une seule ligne « En cours d'examen ».
      const labels = (seen.body.history as { label: string }[]).map((h) => h.label);
      expect(labels.filter((l) => l === "En cours d'examen")).toHaveLength(1);
    });

    it("refuse une transition de revue incohérente", async () => {
      const res = await request(server())
        .patch(`${API}/applications/${applicationId}/review`)
        .set(recruiter.auth)
        .send({ status: "recue" })
        .expect(409);
      expect(res.body.error.code).toBe("invalid_transition");
    });

    it("RM-02 : une offre clôturée n'accepte plus de candidature", async () => {
      await request(server()).post(`${API}/jobs/${jobId}/close`).set(recruiter.auth).expect(200);
      const late = await register(app, "candidate");
      const res = await request(server())
        .post(`${API}/applications`)
        .set(late.auth)
        .set("Idempotency-Key", randomUUID())
        .send({ jobId })
        .expect(409);
      expect(res.body.error.code).toBe("job_closed");
    });
  });
});
