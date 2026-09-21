import { randomBytes } from "node:crypto";

/** Minuscules, sans accents ni ponctuation : sert aux comparaisons tolérantes. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

/** « Responsable logistique » → « responsable-logistique ». */
export function slugify(value: string): string {
  return normalize(value).replace(/[+#]/g, "").trim().replace(/\s+/g, "-").slice(0, 60).replace(/-+$/, "");
}

/** Suffixe court et aléatoire, pour rendre une adresse unique. */
export function shortSuffix(): string {
  return randomBytes(4).toString("hex").slice(0, 6);
}
