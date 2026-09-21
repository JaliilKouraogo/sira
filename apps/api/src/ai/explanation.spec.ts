import { checkExplanation, inPlanOrder, templateExplanation } from "./match.service";
import { computeScore } from "./scoring/score-engine";

const SOURCE = JSON.stringify({ poste: "Responsable logistique", score_sur_100: 88, detail: "4 ans requis, 5 ans déclarés." });

describe("contrôle des explications rédigées par le modèle", () => {
  it("accepte un texte fidèle aux données", () => {
    const text = "Votre profil correspond bien au poste, avec 5 ans d'expérience. Il manque le management d'équipe.";
    expect(checkExplanation(text, SOURCE)).toBe(text);
  });

  it("écarte un chiffre absent des données", () => {
    expect(checkExplanation("Votre score est de 92 sur 100.", SOURCE)).toBeNull();
    expect(checkExplanation("Vous avez 7 ans d'expérience.", SOURCE)).toBeNull();
  });

  it("écarte une promesse d'embauche", () => {
    expect(checkExplanation("Vous êtes assuré d'être recruté pour ce poste.", SOURCE)).toBeNull();
  });

  it("écarte le tutoiement et les mots répétés", () => {
    expect(checkExplanation("Tu corresponds bien au poste de Responsable logistique.", SOURCE)).toBeNull();
    expect(checkExplanation("Votre profil correspond correspond bien au poste.", SOURCE)).toBeNull();
  });

  it("ne confond pas « ta » avec un mot qui le contient", () => {
    expect(checkExplanation("Votre candidature est complète et votre talent est visible.", SOURCE)).not.toBeNull();
  });
});

describe("explication construite à partir du calcul", () => {
  it("cite le score, les points forts et les manques", () => {
    const result = computeScore(
      {
        hardSkills: [{ name: "Excel" }],
        softSkills: [],
        targetJobs: [],
        experienceYears: 5,
        educationLevel: "Licence (Bac+3)",
        city: "Ouagadougou",
        searchZones: [],
        geographicMobility: false,
        languages: [],
        availability: "Immédiate",
        opportunityTypes: [],
      },
      {
        requiredSkills: ["Excel", "SAP"],
        niceToHaveSkills: [],
        blockingCriteria: [],
        educationLevel: null,
        experienceYears: 2,
        languages: [],
        city: "Ouagadougou",
        workMode: "presentiel",
        opportunityType: "emploi",
      },
    );
    const text = templateExplanation(result);
    expect(text).toContain(`${result.score} sur 100`);
    expect(text).toContain("SAP");
    expect(text).toMatch(/Points forts : .*expérience/);
  });
});

describe("ordre des composantes", () => {
  it("rétablit l'ordre du plan, que PostgreSQL ne conserve pas", () => {
    const stored = { langues: 1, formation: 2, experience: 3, competences: 4, localisation: 5, disponibilite: 6 };
    expect(Object.keys(inPlanOrder(stored) as object)).toEqual([
      "competences",
      "experience",
      "formation",
      "localisation",
      "langues",
      "disponibilite",
    ]);
  });
});
