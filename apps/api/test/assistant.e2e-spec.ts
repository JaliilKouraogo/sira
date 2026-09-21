import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { API, createAdmin, createApp, createVerifiedOrganization, jobPayload, register } from "./helpers";

/** L'IA est coupée en test : l'assistant doit répondre quand même, sans rien inventer. */
describe("Assistant sans IA disponible", () => {
  let app: INestApplication;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    app = await createApp();
    const admin = await createAdmin(app);
    const recruiter = await register(app, "recruiter");
    const organizationId = await createVerifiedOrganization(app, recruiter, admin);
    const job = await request(server())
      .post(`${API}/jobs`)
      .set(recruiter.auth)
      .send(jobPayload(organizationId, { title: "Technicien photovoltaïque", requiredSkills: ["Installation solaire"] }))
      .expect(201);
    await request(server()).post(`${API}/jobs/${job.body.id}/publish`).set(recruiter.auth).expect(200);
  });
  afterAll(async () => {
    await app.close();
  });

  it("répond aux visiteurs avec les offres réelles qui correspondent", async () => {
    const res = await request(server())
      .post(`${API}/ai/chat`)
      .send({ messages: [{ role: "user", content: "Je cherche un poste de technicien photovoltaïque" }] })
      .expect(200);
    expect(res.body.source).toBe("repli");
    expect(res.body.jobs.map((j: { title: string }) => j.title)).toContain("Technicien photovoltaïque");
    expect(res.body.disclaimer).toEqual(expect.any(String));
  });

  it("n'invente aucune offre quand rien ne correspond", async () => {
    const res = await request(server())
      .post(`${API}/ai/chat`)
      .send({ messages: [{ role: "user", content: "Bonjour, qui êtes-vous ?" }] })
      .expect(200);
    expect(res.body.jobs).toEqual([]);
    expect(res.body.reply).toContain("contact@sira.bf");
  });

  it("borne la conversation : le dernier message vient de l'utilisateur", async () => {
    const res = await request(server())
      .post(`${API}/ai/chat`)
      .send({ messages: [{ role: "assistant", content: "Bonjour" }] })
      .expect(400);
    expect(res.body.error.code).toBe("validation_failed");
  });
});
