"use client";

/**
 * Sommaire des pages légales.
 *
 * - Sur grand écran : liste collante, la section en cours de lecture est
 *   mise en évidence (`aria-current="location"`) au fil du défilement.
 * - Sous 992 px : sommaire repliable, refermé après le choix d'une section
 *   pour laisser la place au texte.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "./kit";

export interface LegalTocItem {
  id: string;
  title: string;
}

/**
 * Une section devient « en cours » quand son début passe au-dessus de cette
 * fraction de la hauteur de la fenêtre.
 */
const READING_LINE = 0.35;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function LegalToc({ items }: { items: LegalTocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const details = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const nodes = items.map((it) => document.getElementById(it.id)).filter((n): n is HTMLElement => Boolean(n));
      if (!nodes.length) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const line = window.innerHeight * READING_LINE;
      let current = nodes[0].id;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node.id;
      }
      // Arrivé en bas de page, la dernière section courte doit pouvoir
      // s'allumer même si son titre n'a pas atteint le haut de la fenêtre.
      if (atBottom) {
        const last = nodes[nodes.length - 1];
        if (last.getBoundingClientRect().top < window.innerHeight) current = last.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  const list = (compact: boolean) => (
    <ol className={cn("flex flex-col", compact ? "mt-2" : "mt-4 gap-0.5")}>
      {items.map((it, i) => {
        const selected = !compact && it.id === active;
        return (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={selected ? "location" : undefined}
              onClick={() => {
                if (compact && details.current) details.current.open = false;
              }}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-[0.6rem] px-3 py-2 text-[0.9375rem] leading-snug transition-colors duration-300",
                selected ? "bg-site-navy text-white" : "text-site-ink/80 hover:bg-site-soft hover:text-site-navy",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "site-display w-6 shrink-0 tabular-nums text-[0.875rem]",
                  selected ? "text-site-gold" : "text-site-muted",
                )}
              >
                {pad(i + 1)}
              </span>
              <span className="min-w-0">{it.title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Grand écran */}
      <nav
        aria-label="Sommaire"
        className="hidden rounded-[1rem] border border-b-4 border-site-border bg-white p-3 tab:block"
      >
        <p className="px-3 pt-2 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-site-muted">Sommaire</p>
        {list(false)}
      </nav>

      {/* Petit écran */}
      <details
        ref={details}
        className="group/toc rounded-[1rem] border border-b-4 border-site-border bg-white tab:hidden"
      >
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 text-[1rem] font-semibold text-site-navy [&::-webkit-details-marker]:hidden">
          <span>
            Sommaire
            <span className="ml-2 font-normal text-site-muted">{items.length} sections</span>
          </span>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-site-soft text-[1.25rem] leading-none transition-transform duration-200 group-open/toc:rotate-45"
          >
            +
          </span>
        </summary>
        <nav aria-label="Sommaire" className="px-2 pb-3">
          {list(true)}
        </nav>
      </details>
    </>
  );
}
