/**
 * Contrôle automatisé du texte des offres (section 9.5 du plan) : l'âge, le
 * sexe, la situation familiale, l'origine, la religion et le handicap ne
 * peuvent pas être des critères de sélection.
 *
 * Les motifs sont volontairement étroits : ils visent des formulations de
 * critère (« moins de 35 ans », « hommes uniquement »), pas les mots
 * eux-mêmes. « 10 ans d'expérience » ou une ONG « confessionnelle » ne
 * déclenchent rien. Un blocage renvoie l'extrait en cause, pour que le
 * recruteur puisse reformuler.
 *
 * Chaque motif commence par une assertion Unicode (pas de lettre ni de
 * chiffre juste avant) plutôt que par la borne de mot classique, qui ignore
 * les lettres accentuées : « âge » ne serait jamais reconnu.
 */
const START = String.raw`(?<![\p{L}\p{N}])`;
const APOS = String.raw`['’]`;
/** « ans » suivi de « d'expérience » ou « d'ancienneté » : ce n'est pas un âge. */
const NOT_EXPERIENCE = String.raw`(?!\s+d${APOS}\s*(?:exp|anc))`;

const rule = (criterion: string, body: string) => ({ criterion, pattern: new RegExp(START + body, "iu") });

const RULES: { criterion: string; pattern: RegExp }[] = [
  rule(
    "âge",
    String.raw`(?:âg[ée]e?s?\s+de\s+(?:moins\s+de\s+|plus\s+de\s+)?\d{2}\s+ans` +
      String.raw`|(?:moins|plus)\s+de\s+\d{2}\s+ans(?![\p{L}])${NOT_EXPERIENCE}` +
      String.raw`|entre\s+\d{2}\s+et\s+\d{2}\s+ans(?![\p{L}])${NOT_EXPERIENCE}` +
      String.raw`|âge\s+(?:maximum|minimum|limite|requis)|limite\s+d${APOS}âge)`,
  ),
  rule(
    "sexe",
    String.raw`(?:(?:hommes?|femmes?|masculin|féminin)\s+(?:uniquement|exclusivement|seulement)` +
      String.raw`|(?:uniquement|exclusivement|seulement)\s+(?:des\s+)?(?:hommes|femmes)` +
      String.raw`|sexe\s*(?::|requis|masculin|féminin))`,
  ),
  rule(
    "situation familiale",
    String.raw`(?:célibataires?\s+(?:uniquement|exigée?|requise?)|sans\s+enfants?|non\s+mariée?s?` +
      String.raw`|situation\s+(?:familiale|matrimoniale)\s*:)`,
  ),
  rule(
    "religion",
    String.raw`(?:religion\s*:|de\s+(?:confession|religion)\s+(?:musulmane|chrétienne|catholique|protestante|animiste))`,
  ),
  rule("origine", String.raw`(?:ethnie\s*:|origine\s+ethnique|appartenance\s+ethnique|race\s*:)`),
  rule(
    "handicap",
    String.raw`(?:sans\s+handicap|pas\s+de\s+handicap|aucun\s+handicap|personnes?\s+handicapées?\s+s${APOS}abstenir)`,
  ),
];

export interface DiscriminationFinding {
  criterion: string;
  excerpt: string;
}

export function findDiscriminatoryCriteria(texts: (string | null | undefined)[]): DiscriminationFinding[] {
  const findings: DiscriminationFinding[] = [];
  for (const text of texts) {
    if (!text) continue;
    for (const { criterion, pattern } of RULES) {
      const match = pattern.exec(text);
      if (match && !findings.some((f) => f.criterion === criterion)) {
        findings.push({ criterion, excerpt: match[0] });
      }
    }
  }
  return findings;
}
