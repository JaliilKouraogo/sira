import { PREPARATION_STATUSES, REVIEW_STATUSES } from "@sira/shared";
import { CANDIDATE_STATUS, PREPARATION_TRANSITIONS, REVIEW_TRANSITIONS, candidateView } from "./application-rules";

describe("règles des candidatures", () => {
  it("RM-06 : aucune transition de préparation ne mène à « envoyee »", () => {
    for (const from of PREPARATION_STATUSES) {
      expect(PREPARATION_TRANSITIONS[from]).not.toContain("envoyee");
    }
    expect(PREPARATION_TRANSITIONS.envoyee).toEqual([]);
  });

  it("chaque état de revue a ses transitions, sans boucle sur lui-même", () => {
    for (const status of REVIEW_STATUSES) {
      expect(REVIEW_TRANSITIONS[status]).toBeDefined();
      expect(REVIEW_TRANSITIONS[status]).not.toContain(status);
    }
  });

  it("le candidat ne voit jamais « shortlist »", () => {
    expect(CANDIDATE_STATUS.shortlist).toBe(CANDIDATE_STATUS.a_examiner);
    expect(candidateView("shortlist")).toEqual({ status: "en_examen", label: "En cours d'examen" });
    for (const status of REVIEW_STATUSES) {
      expect(JSON.stringify(candidateView(status))).not.toMatch(/shortlist/i);
    }
  });

  it("une candidature non envoyée n'a pas d'état de revue visible", () => {
    expect(candidateView(null)).toBeNull();
  });
});
