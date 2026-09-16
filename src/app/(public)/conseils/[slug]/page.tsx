/**
 * Rubrique Conseils : article.
 *
 * Structure reprise de la page Article du gabarit de référence :
 *   1. en-tête clair centré (thème, date, temps de lecture, titre, chapô)
 *      et grande image dévoilée par un rideau, en parallaxe
 *   2. corps de l'article dans une colonne de lecture d'environ 68 signes,
 *      encadré « ce que fait SIRA » et encadré de partage
 *   3. articles similaires
 *   4. appel à l'action
 *
 * Toutes les pages d'article sont générées à la construction.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InitialsAvatar, PostCard, formatPostDate } from "@/components/site/cards";
import { ConseilsShare } from "@/components/site/conseils-share";
import { CtaBlock } from "@/components/site/cta";
import { Heading, Hl, Inner, Lead, Panel, Section, SiteButtonLink, SiteIcon } from "@/components/site/kit";
import { ImageFrame, Parallax, Reveal } from "@/components/site/motion";
import { IMG, POSTS, getPost, type PostBlock } from "@/data/site-content";
import {
  CATEGORY_NOTE,
  CATEGORY_PARAM,
  categorySlug,
  readingLabel,
  relatedPosts,
} from "@/data/site-conseils";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article introuvable" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      section: post.category,
    },
  };
}

/** Un bloc du corps : intertitre marine, paragraphes, liste à puces or. */
function ArticleBlock({ block, intro }: { block: PostBlock; intro: boolean }) {
  return (
    <>
      {block.heading ? (
        <h2 className="site-display text-[1.625rem] leading-tight text-site-navy md:text-[1.875rem]">
          {block.heading}
        </h2>
      ) : null}
      {block.paragraphs?.map((text) => (
        <p
          key={text}
          className={
            intro
              ? "mt-5 text-[1.1875rem] leading-[1.7] text-site-ink first:mt-0 md:text-[1.25rem]"
              : "mt-5 leading-[1.8] text-site-ink/85 first:mt-0"
          }
        >
          {text}
        </p>
      ))}
      {block.list ? (
        <ul className="mt-6 space-y-3.5">
          {block.list.map((item) => (
            <li key={item} className="flex gap-4 leading-[1.7] text-site-ink/85">
              <span aria-hidden className="mt-[0.62em] h-2 w-2 shrink-0 rotate-45 rounded-[1px] bg-site-gold" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export default async function ConseilPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = relatedPosts(post, 3);
  const note = CATEGORY_NOTE[post.category];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    articleSection: post.category,
    inLanguage: "fr",
    author: { "@type": "Organization", name: "SIRA" },
    publisher: { "@type": "Organization", name: "SIRA" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
      {/* 1. En-tête ---------------------------------------------------------- */}
      <Section className="pt-0">
        <Panel tone="light" pad={false} className="px-8 pb-10 pt-16 md:px-16 md:pb-16 md:pt-24">
          <Inner>
            <Reveal dir="up" className="text-center">
              <Link
                href="/conseils"
                className="site-link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-site-navy"
              >
                <SiteIcon.Arrow size={16} className="rotate-180" />
                Tous les conseils
              </Link>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.9375rem] text-site-muted">
                <Link
                  href={`/conseils?${CATEGORY_PARAM}=${categorySlug(post.category)}`}
                  className="group inline-flex min-h-11 items-center"
                >
                  <span className="sr-only">Thème : </span>
                  <span className="rounded-[0.5rem] bg-site-soft px-3 py-1.5 text-[0.875rem] font-medium text-site-navy transition-colors duration-300 group-hover:bg-site-navy group-hover:text-white">
                    {post.category}
                  </span>
                </Link>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3.5" y="5" width="17" height="15" rx="2" />
                    <path d="M3.5 10h17M8 3v4M16 3v4" />
                  </svg>
                  <span className="sr-only">Publié le </span>
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <SiteIcon.Clock size={16} />
                  {readingLabel(post.readingMinutes)}
                </span>
              </div>

              <Heading as="h1" size="h1" align="center" className="mx-auto mt-6 max-w-[52rem]">
                {post.title}
              </Heading>

              <p className="mx-auto mt-6 max-w-[40rem] text-center text-[1.0625rem] leading-relaxed text-site-muted md:text-[1.125rem]">
                {post.excerpt}
              </p>

              <p className="mt-8 inline-flex items-center gap-3 text-left">
                <InitialsAvatar initials="S" size={40} />
                <span className="leading-tight">
                  <span className="block text-[0.9375rem] font-semibold text-site-ink">Rédaction SIRA</span>
                  <span className="block text-[0.8125rem] text-site-muted">Conseils emploi et recrutement</span>
                </span>
              </p>
            </Reveal>

            <ImageFrame
              to="left"
              curtain="var(--color-site-light)"
              className="mt-14 aspect-[4/3] rounded-[1.5rem] border border-site-border md:mt-16 md:aspect-[16/8]"
            >
              <Parallax strength={16}>
                <Image
                  src={post.image.src}
                  alt={post.image.alt}
                  fill
                  priority
                  sizes="(min-width: 1280px) 76rem, 100vw"
                  className="object-cover"
                />
              </Parallax>
            </ImageFrame>
          </Inner>
        </Panel>
      </Section>

      {/* 2. Corps de l'article ---------------------------------------------- */}
      <Section>
        <Panel tone="light" pad={false} className="px-6 py-16 xs:px-8 md:px-16 md:py-24">
          <div className="mx-auto max-w-[68ch] text-[1.0625rem]">
            {post.body.map((block, i) => (
              <Reveal key={block.heading ?? `bloc-${i}`} dir="up" className={i === 0 ? undefined : "mt-12"}>
                <ArticleBlock block={block} intro={i === 0 && !block.heading} />
              </Reveal>
            ))}

            <Reveal dir="up" className="mt-14">
              <aside
                aria-labelledby="note-titre"
                className="site-on-dark rounded-[1rem] border border-site-border bg-site-navy p-6 md:p-8"
              >
                <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-site-gold">
                  Ce que fait SIRA
                </p>
                <h2 id="note-titre" className="site-display mt-3 text-[1.375rem] leading-tight md:text-[1.5rem]">
                  {note.title}
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/85 md:text-[1rem]">{note.text}</p>
              </aside>
            </Reveal>

            <Reveal dir="up" className="mt-6">
              <ConseilsShare title={post.title} />
            </Reveal>
          </div>
        </Panel>
      </Section>
      </article>

      {/* 3. Articles similaires --------------------------------------------- */}
      {related.length > 0 ? (
        <Section>
          <Panel tone="light">
            <Inner>
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <Reveal dir="left">
                  <Heading size="h2" className="max-w-[32rem]">
                    À lire <Hl>ensuite</Hl>
                  </Heading>
                  <Lead tone="muted" className="mt-4">
                    D&apos;autres conseils pour avancer dans votre recherche ou votre recrutement.
                  </Lead>
                </Reveal>
                <Reveal dir="right">
                  <SiteButtonLink href="/conseils" variant="outline-dark" className="whitespace-nowrap">
                    Tous les conseils
                  </SiteButtonLink>
                </Reveal>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-2 tab:grid-cols-3">
                {related.map((p, i) => (
                  // Entre 768 et 991 px, deux colonnes : le troisième article est masqué.
                  <div key={p.slug} className={i === 2 ? "grid md:max-tab:hidden" : "grid"}>
                    <Reveal dir="up" delay={i * 100}>
                      <PostCard post={p} />
                    </Reveal>
                  </div>
                ))}
              </div>
            </Inner>
          </Panel>
        </Section>
      ) : null}

      {/* 4. Appel à l'action ------------------------------------------------- */}
      <CtaBlock
        title={
          <>
            Votre prochaine étape <Hl>commence ici</Hl>
          </>
        }
        text="Découvrez les offres publiées partout en Afrique, comprenez votre score de compatibilité et préparez une candidature que vous relisez et validez avant tout envoi."
        action={{ href: "/emplois", label: "Découvrir les offres" }}
        image={IMG.equipeOrdinateurs}
      />
    </>
  );
}
