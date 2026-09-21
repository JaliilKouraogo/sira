import { BLOCKING_CRITERIA_CAP, SCORE_WEIGHTS } from "@sira/shared";
import { computeScore, sameSkill, type ScoreCandidate, type ScoreJob } from "./score-engine";

const candidate = (overrides: Partial<ScoreCandidate> = {}): ScoreCandidate => ({
  hardSkills: [{ name: "Gestion de stock" }, { name: "Excel avancé" }, { name: "Planification" }],
  softSkills: [{ name: "Rigueur" }],
  targetJobs: ["Responsable logistique"],
  experienceYears: 5,
  educationLevel: "Licence (Bac+3)",
  city: "Ouagadougou",
  searchZones: ["Bobo-Dioulasso"],
  geographicMobility: false,
  languages: [
    { name: "Français", level: "Courant" },
    { name: "Anglais", level: "Scolaire" },
  ],
  availability: "Immédiate",
  opportunityTypes: ["emploi"],
  ...overrides,
});

const job = (overrides: Partial<ScoreJob> = {}): ScoreJob => ({
  requiredSkills: ["Gestion de stock", "Excel avancé", "Management d'équipe", "Planification"],
  niceToHaveSkills: ["SAP MM"],
  blockingCriteria: [],
  educationLevel: "Licence (Bac+3)",
  experienceYears: 4,
  languages: [
    { name: "Français", level: "Courant" },
    { name: "Anglais", level: "Professionnel" },
  ],
  city: "Bobo-Dioulasso",
  workMode: "presentiel",
  opportunityType: "emploi",
  ...overrides,
});

describe("computeScore", () => {
  it("applique les pondérations de la section 9.4 du plan", () => {
    const result = computeScore(candidate(), job());
    const expected = Math.round(
      (Object.keys(SCORE_WEIGHTS) as (keyof typeof SCORE_WEIGHTS)[]).reduce(
        (sum, key) => sum + SCORE_WEIGHTS[key] * result.breakdown[key].score,
        0,
      ),
    );
    expect(result.score).toBe(expected);
    expect(result.breakdown.competences.score).toBe(75);
    expect(result.breakdown.competences.missing).toEqual(["Management d'équipe"]);
    expect(result.breakdown.experience.score).toBe(100);
    expect(result.breakdown.localisation.score).toBe(90);
    expect(result.gaps).toEqual(["Management d'équipe", "Anglais (professionnel)"]);
  });

  it("donne le même résultat pour les mêmes données", () => {
    expect(computeScore(candidate(), job())).toEqual(computeScore(candidate(), job()));
  });

  it("plafonne le score quand un critère indispensable n'est pas rempli", () => {
    const result = computeScore(candidate(), job({ requiredSkills: [], blockingCriteria: ["Permis poids lourd"] }));
    expect(result.blockingCriteria).toEqual(["Permis poids lourd"]);
    expect(result.score).toBeLessThanOrEqual(BLOCKING_CRITERIA_CAP);
    expect(result.gaps[0]).toBe("Permis poids lourd");
  });

  it("considère un critère indispensable rempli s'il figure au profil", () => {
    const result = computeScore(candidate(), job({ blockingCriteria: ["Excel"] }));
    expect(result.blockingCriteria).toEqual([]);
  });

  it("proratise l'expérience manquante", () => {
    expect(computeScore(candidate({ experienceYears: 2 }), job()).breakdown.experience.score).toBe(50);
    expect(computeScore(candidate({ experienceYears: 0 }), job({ experienceYears: 0 })).breakdown.experience.score).toBe(100);
  });

  it("gradue le niveau d'études manquant", () => {
    const score = (level: string | null) =>
      computeScore(candidate({ educationLevel: level }), job({ educationLevel: "Master (Bac+5)" })).breakdown.formation.score;
    expect(score("Master (Bac+5)")).toBe(100);
    expect(score("Licence (Bac+3)")).toBe(60);
    expect(score("BTS / DUT (Bac+2)")).toBe(30);
    expect(score("Baccalauréat")).toBe(0);
    expect(score(null)).toBe(40);
  });

  it("tient compte du télétravail, des zones et de la mobilité", () => {
    const location = (c: Partial<ScoreCandidate>, j: Partial<ScoreJob> = {}) =>
      computeScore(candidate(c), job(j)).breakdown.localisation.score;
    expect(location({}, { workMode: "teletravail" })).toBe(100);
    expect(location({ city: "Bobo-Dioulasso" })).toBe(100);
    expect(location({ searchZones: [] , geographicMobility: true })).toBe(70);
    expect(location({ searchZones: [] })).toBe(20);
  });

  it("divise la disponibilité quand le type d'opportunité n'est pas recherché", () => {
    const result = computeScore(candidate({ opportunityTypes: ["stage"] }), job());
    expect(result.breakdown.disponibilite.score).toBe(50);
  });

  it("ne recommande de candidater que sans critère bloquant et à partir de 60", () => {
    const good = computeScore(candidate(), job());
    expect(good.recommendedActions.some((a) => a.type === "candidature")).toBe(true);
    const blocked = computeScore(candidate(), job({ blockingCriteria: ["Permis poids lourd"] }));
    expect(blocked.recommendedActions.some((a) => a.type === "candidature")).toBe(false);
  });
});

describe("sameSkill", () => {
  it.each([
    ["Excel", "Excel avancé", true],
    ["Gestion des stocks", "Gestion de stock", true],
    ["gestion de STOCK", "Gestion de stock", true],
    ["Comptabilité", "Comptabilite", true],
    ["Excel", "Word", false],
    ["Management d'équipe", "Gestion de stock", false],
  ])("« %s » et « %s » : %s", (a, b, expected) => {
    expect(sameSkill(a, b)).toBe(expected);
  });
});
