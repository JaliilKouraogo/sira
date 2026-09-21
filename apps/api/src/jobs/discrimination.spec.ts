import { findDiscriminatoryCriteria } from "./discrimination";

describe("findDiscriminatoryCriteria", () => {
  it.each([
    ["Candidat âgé de moins de 35 ans", "âge"],
    ["Âge maximum : 40 ans", "âge"],
    ["Limite d’âge fixée par la direction", "âge"],
    ["Avoir moins de 30 ans", "âge"],
    ["Entre 25 et 35 ans", "âge"],
    ["Hommes uniquement", "sexe"],
    ["Femmes exclusivement pour ce poste", "sexe"],
    ["Sexe : masculin", "sexe"],
    ["Célibataire exigée", "situation familiale"],
    ["sans enfants de préférence", "situation familiale"],
    ["Religion : musulmane", "religion"],
    ["Ethnie : mossi", "origine"],
    ["Personnes handicapées s’abstenir", "handicap"],
  ])("signale « %s » (%s)", (text, criterion) => {
    expect(findDiscriminatoryCriteria([text]).map((f) => f.criterion)).toEqual([criterion]);
  });

  it.each([
    "Plus de 10 ans d’expérience en gestion",
    "Entre 10 et 15 ans d'expérience",
    "Moins de 5 ans d’expérience",
    "plus de 12 ans d'ancienneté",
    "ONG confessionnelle reconnue",
    "Poste ouvert aux femmes et aux hommes",
    "Accessible aux personnes en situation de handicap",
    "Budget de 180 millions sur 12 ans",
  ])("laisse passer « %s »", (text) => {
    expect(findDiscriminatoryCriteria([text])).toEqual([]);
  });

  it("renvoie l'extrait en cause pour que le recruteur reformule", () => {
    const [finding] = findDiscriminatoryCriteria(["Nous recrutons un profil âgé de moins de 35 ans, motivé."]);
    expect(finding.excerpt).toBe("âgé de moins de 35 ans");
  });

  it("ne signale chaque critère qu'une fois", () => {
    expect(findDiscriminatoryCriteria(["Hommes uniquement", "Sexe : masculin"])).toHaveLength(1);
  });
});
