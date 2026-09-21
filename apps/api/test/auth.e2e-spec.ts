import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { API, createApp, register, uniqueEmail } from "./helpers";

describe("Authentification et droits", () => {
  let app: INestApplication;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it("répond sur /health avec l'état de la base et de l'IA", async () => {
    const res = await request(server()).get(`${API}/health`).expect(200);
    expect(res.body).toEqual({ status: "ok", database: "ok", ai: { provider: "offline" } });
  });

  it("inscrit un candidat : jeton d'accès, cookie de session protégé, profil créé", async () => {
    const email = uniqueEmail("Inscription");
    const res = await request(server())
      .post(`${API}/auth/register`)
      .send({ role: "candidate", email, password: "motdepasse-solide", firstName: "Awa", lastName: "Test", acceptTerms: true })
      .expect(201);
    expect(res.body.user).toMatchObject({ email: email.toLowerCase(), role: "candidate" });
    expect(res.body.expiresIn).toBe(900);
    const cookie = ([] as string[]).concat(res.headers["set-cookie"]).join(";");
    expect(cookie).toMatch(/sira_refresh=.+HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const me = await request(server()).get(`${API}/candidates/me`).set("Authorization", `Bearer ${res.body.accessToken}`).expect(200);
    expect(me.body.completion.score).toBe(0);
  });

  it("refuse l'espace formateur, encore fermé, avec des erreurs détaillées en français", async () => {
    const res = await request(server())
      .post(`${API}/auth/register`)
      .send({ role: "trainer", email: "pas-un-email", password: "court", acceptTerms: false })
      .expect(400);
    expect(res.body.error.code).toBe("validation_failed");
    const fields = (res.body.error.details as { field: string }[]).map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["role", "email", "password", "firstName", "lastName", "acceptTerms"]));
    expect(res.body.error.requestId).toEqual(expect.any(String));
  });

  it("refuse une adresse déjà utilisée", async () => {
    const email = uniqueEmail("doublon");
    await register(app, "candidate", { email });
    const res = await request(server())
      .post(`${API}/auth/register`)
      .send({ role: "candidate", email, password: "motdepasse-solide", firstName: "A", lastName: "B", acceptTerms: true })
      .expect(409);
    expect(res.body.error.code).toBe("email_taken");
  });

  it("ne dit pas si le compte existe quand la connexion échoue", async () => {
    const email = uniqueEmail("connexion");
    await register(app, "candidate", { email });
    const wrong = await request(server()).post(`${API}/auth/login`).send({ email, password: "mauvais-mot-de-passe" }).expect(401);
    const unknown = await request(server()).post(`${API}/auth/login`).send({ email: uniqueEmail("inconnu"), password: "x" }).expect(401);
    expect(wrong.body.error.code).toBe("invalid_credentials");
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });

  it("fait tourner le jeton de session et révoque tout en cas de réutilisation", async () => {
    const session = await register(app, "candidate");
    const first = await request(server()).post(`${API}/auth/refresh`).set("Cookie", session.cookie).expect(200);
    const next = ([] as string[]).concat(first.headers["set-cookie"]).find((c) => c.startsWith("sira_refresh="))!.split(";")[0];
    expect(next).not.toBe(session.cookie);

    // L'ancien jeton rejoué : vol présumé, toute la session tombe.
    const replay = await request(server()).post(`${API}/auth/refresh`).set("Cookie", session.cookie).expect(401);
    expect(replay.body.error.code).toBe("refresh_token_reused");
    await request(server()).post(`${API}/auth/refresh`).set("Cookie", next).expect(401);
  });

  it("déconnecte en révoquant la session", async () => {
    const session = await register(app, "candidate");
    await request(server()).post(`${API}/auth/logout`).set("Cookie", session.cookie).expect(204);
    await request(server()).post(`${API}/auth/refresh`).set("Cookie", session.cookie).expect(401);
  });

  it("exige une authentification hors des routes publiques", async () => {
    const res = await request(server()).get(`${API}/users/me`).expect(401);
    expect(res.body.error.code).toBe("authentication_required");
    const bad = await request(server()).get(`${API}/users/me`).set("Authorization", "Bearer jeton-invalide").expect(401);
    expect(bad.body.error.code).toBe("invalid_token");
  });

  it("applique les rôles de la matrice RBAC", async () => {
    const candidate = await register(app, "candidate");
    const recruiter = await register(app, "recruiter");
    await request(server()).post(`${API}/organizations`).set(candidate.auth).send({}).expect(403);
    await request(server()).post(`${API}/jobs`).set(candidate.auth).send({}).expect(403);
    await request(server()).get(`${API}/candidates/me`).set(recruiter.auth).expect(403);
    await request(server()).post(`${API}/ai/match`).set(recruiter.auth).send({ jobId: "x" }).expect(403);
  });

  it("renvoie un identifiant de requête dans chaque réponse", async () => {
    const res = await request(server()).get(`${API}/route-inexistante`).set("x-request-id", "trace-client-1234").expect(404);
    expect(res.headers["x-request-id"]).toBe("trace-client-1234");
    expect(res.body.error).toMatchObject({ code: "not_found", requestId: "trace-client-1234" });
  });
});
