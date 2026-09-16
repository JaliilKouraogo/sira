"use client";

/**
 * Liste filtrable des articles de la rubrique Conseils.
 *
 * Le thème choisi vit dans l'adresse (`/conseils?categorie=cv`) pour que
 * chaque sélection soit partageable. Il est lu dans le navigateur avec
 * `useSearchParams`, ce qui reste compatible avec l'export statique : la page
 * rend `ConseilsFilter` sous `Suspense`, avec `ConseilsList` sans filtre
 * comme contenu de repli.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PostCard } from "./cards";
import { cn } from "./kit";
import { Reveal } from "./motion";
import {
  CATEGORY_PARAM,
  categoryFromSlug,
  postCategories,
  postsInCategory,
  type PostCategory,
} from "@/data/site-conseils";

function articlesLabel(n: number): string {
  return n === 0 ? "Aucun article" : n === 1 ? "1 article" : `${n} articles`;
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-[0.5rem] border px-4 text-[0.9375rem] font-medium transition-colors duration-300",
        active
          ? "border-site-navy bg-site-navy text-white"
          : "border-site-border bg-white text-site-navy hover:bg-site-soft",
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "inline-flex min-w-6 justify-center rounded-full px-1.5 text-[0.75rem] font-semibold leading-5",
          active ? "bg-site-gold text-site-navy" : "bg-site-soft text-site-muted",
        )}
      >
        {count}
      </span>
      <span className="sr-only">({articlesLabel(count)})</span>
    </Link>
  );
}

/** Pastilles de thème et grille d'articles pour un thème donné (ou tous). */
export function ConseilsList({ active }: { active: PostCategory | null }) {
  const categories = postCategories();
  const posts = postsInCategory(active);
  const total = postsInCategory(null).length;

  return (
    <>
      <nav aria-label="Thèmes des articles" className="mt-12">
        <ul className="flex flex-wrap justify-center gap-2.5">
          <li>
            <FilterChip href="/conseils" label="Tous" count={total} active={active === null} />
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <FilterChip
                href={`/conseils?${CATEGORY_PARAM}=${c.slug}`}
                label={c.label}
                count={c.count}
                active={active === c.label}
              />
            </li>
          ))}
        </ul>
      </nav>

      <p aria-live="polite" className="mt-8 text-center text-[0.9375rem] text-site-muted">
        {active ? (
          <>
            {articlesLabel(posts.length)} dans le thème <strong className="font-semibold text-site-navy">{active}</strong>
          </>
        ) : (
          <>
            {articlesLabel(posts.length)} {posts.length > 1 ? "publiés" : "publié"}
          </>
        )}
      </p>

      {/* Rangées centrées : un thème qui ne compte qu'un ou deux articles ne
          laisse pas de colonnes vides sur la droite. */}
      <div key={active ?? "tous"} className="mt-8 flex flex-wrap justify-center gap-6">
        {posts.map((post, i) => (
          <div
            key={post.slug}
            className="grid w-full md:w-[calc((100%-1.5rem)/2)] tab:w-[calc((100%-3rem)/3)]"
          >
            <Reveal dir="up" delay={(i % 3) * 100}>
              <PostCard post={post} />
            </Reveal>
          </div>
        ))}
      </div>

      {active ? (
        <div className="mt-12 flex justify-center">
          <Link
            href="/conseils"
            scroll={false}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.5rem] border border-site-navy px-6 py-3.5 text-[1rem] font-semibold text-site-navy transition-colors duration-[250ms] hover:bg-site-navy/5"
          >
            Voir tous les articles
          </Link>
        </div>
      ) : null}
    </>
  );
}

/** Version pilotée par l'adresse. À rendre sous `Suspense`. */
export function ConseilsFilter() {
  const params = useSearchParams();
  const active = categoryFromSlug(params.get(CATEGORY_PARAM));
  return <ConseilsList active={active} />;
}
