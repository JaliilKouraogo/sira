"use client";

/**
 * Composants interactifs du site public.
 *
 * - `FeatureTabs` : onglets en accordéon du gabarit. L'onglet actif est net
 *   et coloré, les autres atténués à 40 %. Le texte de l'onglet actif se
 *   déplie (0,5 s) et l'image change, dévoilée par un rideau.
 * - `Faq` : questions fréquentes. À gauche, un panneau marine liste les
 *   thèmes ; à droite, un accordéon dont le symbole « + » pivote de 45°.
 *
 * Tous deux suivent le motif ARIA correspondant et se pilotent au clavier.
 */

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { SiteImage } from "@/data/site-content";
import { ImageFrame } from "./motion";
import { cn } from "./kit";

// ---------------------------------------------------------------------------
// Onglets
// ---------------------------------------------------------------------------

export function FeatureTabs({
  items,
  tone = "dark",
  imageSide = "left",
  footer,
  heading,
}: {
  items: { title: string; text: string; image: SiteImage }[];
  /** Fond du bloc qui accueille les onglets. */
  tone?: "dark" | "light";
  imageSide?: "left" | "right";
  /** Contenu affiché sous la liste, par exemple un bouton. */
  footer?: ReactNode;
  heading?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = items.length - 1;
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? i === last ? 0 : i + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? i === 0 ? last : i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const dark = tone === "dark";
  const current = items[active];

  const image = (
    <ImageFrame
      key={active}
      to={imageSide === "left" ? "left" : "right"}
      curtain={dark ? "var(--color-site-navy)" : "var(--color-site-light)"}
      className="aspect-[4/5] w-full rounded-[1.5rem] md:aspect-[5/6] tab:mx-auto tab:w-[85%]"
    >
      <Image
        src={current.image.src}
        alt={current.image.alt}
        fill
        sizes="(min-width: 992px) 40vw, 100vw"
        className="object-cover"
      />
    </ImageFrame>
  );

  return (
    <div className="grid items-center gap-12 tab:grid-cols-2 tab:gap-16">
      <div className={cn(imageSide === "right" && "tab:order-2")}>{image}</div>

      <div>
        {heading}
        <div role="tablist" aria-orientation="vertical" aria-label="Fonctionnalités" className="mt-8">
          {items.map((it, i) => {
            const selected = i === active;
            return (
              <div key={it.title} className={cn("border-b", dark ? "border-white/20" : "border-site-line")}>
                <button
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  id={`${base}-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`${base}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={cn(
                    "site-display flex min-h-14 w-full items-center py-4 text-left text-[1.4rem] transition-opacity duration-300 md:text-[1.75rem]",
                    selected ? "opacity-100" : "opacity-40 hover:opacity-70",
                    dark
                      ? selected
                        ? "text-site-gold"
                        : "text-white"
                      : selected
                        ? "text-site-navy"
                        : "text-site-ink",
                  )}
                >
                  {it.title}
                </button>
                <div
                  id={`${base}-panel-${i}`}
                  role="tabpanel"
                  aria-labelledby={`${base}-tab-${i}`}
                  className="site-collapse"
                  data-open={selected}
                >
                  <div>
                    <p
                      className={cn(
                        "max-w-[34rem] pb-5 text-[0.9375rem] leading-relaxed",
                        dark ? "text-white/85" : "text-site-muted",
                      )}
                    >
                      {it.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Questions fréquentes
// ---------------------------------------------------------------------------

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q} className="rounded-[0.75rem] border border-site-border/60 bg-white">
            <h3>
              <button
                type="button"
                id={`${base}-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-[1rem] font-semibold text-site-navy"
              >
                {it.q}
                <span
                  aria-hidden
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-site-soft text-[1.25rem] leading-none transition-transform duration-200 ease-out"
                  style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                >
                  +
                </span>
              </button>
            </h3>
            <div id={`${base}-a-${i}`} role="region" aria-labelledby={`${base}-q-${i}`} className="site-collapse" data-open={isOpen}>
              <div>
                <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-site-ink/80">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Faq({
  groups,
  icons,
}: {
  groups: { category: string; items: { q: string; a: string }[] }[];
  /** Une icône par thème, dans le même ordre que `groups`. */
  icons?: ReactNode[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-6 tab:grid-cols-[0.8fr_1.2fr] tab:gap-10">
      <div className="h-fit rounded-[1rem] bg-site-navy p-3" role="group" aria-label="Thèmes des questions">
        {groups.map((g, i) => {
          const selected = i === active;
          return (
            <button
              key={g.category}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(i)}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-[0.6rem] px-4 text-left text-[1rem] font-medium transition-colors duration-300",
                selected ? "bg-white text-site-navy" : "text-white/85 hover:bg-white/10",
              )}
            >
              {icons?.[i] ? <span className="shrink-0">{icons[i]}</span> : null}
              {g.category}
            </button>
          );
        })}
      </div>
      <Accordion key={active} items={groups[active].items} />
    </div>
  );
}
