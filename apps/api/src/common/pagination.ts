import { z } from "zod";

/** Pagination par curseur (section 4.3 du plan) : `?limit=20&cursor=...`. */
export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(64).optional(),
});

export interface Page<T> {
  data: T[];
  pagination: { nextCursor: string | null; hasMore: boolean };
}

/**
 * Découpe un résultat lu avec `take: limit + 1` : l'élément en trop indique
 * qu'une page suivante existe, sans requête de comptage.
 */
export function toPage<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  return { data, pagination: { nextCursor: hasMore ? data[data.length - 1].id : null, hasMore } };
}

/** Arguments Prisma correspondants : l'élément du curseur est exclu. */
export function cursorArgs(limit: number, cursor?: string): { take: number; skip?: number; cursor?: { id: string } } {
  return cursor ? { take: limit + 1, cursor: { id: cursor }, skip: 1 } : { take: limit + 1 };
}
