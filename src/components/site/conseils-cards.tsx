/**
 * Cartes propres à la rubrique Conseils.
 *
 * `PostRowCard` est la variante horizontale de `PostCard`, utilisée à côté de
 * l'article vedette comme dans la page Blog du gabarit : image à gauche,
 * texte à droite, image au-dessus sous 480 px. Même filet or, même bordure
 * basse de 4 px et même agrandissement de l'image au survol que `PostCard`.
 */

import Image from "next/image";
import Link from "next/link";
import { formatPostDate } from "./cards";
import { Pill, SiteIcon } from "./kit";
import type { Post } from "@/data/site-content";
import { readingLabel } from "@/data/site-conseils";

export function PostRowCard({ post }: { post: Post }) {
  return (
    <article className="group relative grid h-full overflow-hidden rounded-[1rem] border border-b-4 border-site-border bg-white transition-colors duration-[400ms] hover:border-site-navy xs:grid-cols-[0.85fr_1.15fr]">
      <div className="relative aspect-[16/10] overflow-hidden xs:aspect-auto xs:min-h-[13rem]">
        <Image
          src={post.image.src}
          alt={post.image.alt}
          fill
          sizes="(min-width: 992px) 20vw, (min-width: 480px) 40vw, 100vw"
          className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-110"
        />
      </div>
      <div className="flex flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.8125rem] text-site-muted">
          <Pill>{post.category}</Pill>
          <span>{formatPostDate(post.date)}</span>
        </div>
        <h3 className="site-display mt-3 text-[1.25rem] leading-snug text-site-ink transition-colors duration-[400ms] group-hover:text-site-navy md:text-[1.375rem]">
          <Link href={`/conseils/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-site-ink/75">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 text-[0.875rem]">
          <span className="inline-flex items-center gap-2 font-semibold text-site-navy">
            Lire l&apos;article
            <SiteIcon.Arrow size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          <span className="inline-flex items-center gap-1.5 text-site-muted">
            <SiteIcon.Clock size={15} />
            {readingLabel(post.readingMinutes)}
          </span>
        </div>
      </div>
    </article>
  );
}
