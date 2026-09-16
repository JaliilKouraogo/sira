"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Animations d'entrée des pages de présentation.
 *
 * Le mouvement se déclenche à l'entrée dans le champ de vision, une seule
 * fois, et reste discret : quatorze pixels de translation et une transition
 * douce. Le réglage système « mouvement réduit » est respecté deux fois, par
 * la feuille de style et par le test ci-dessous, de sorte que le contenu
 * s'affiche immédiatement sans aucun déplacement.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Révèle son contenu quand il entre dans le champ de vision. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  /** Décalage en millisecondes, pour échelonner plusieurs blocs. */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`sira-reveal ${className ?? ""}`}
      data-visible={visible ? "true" : "false"}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Compteur qui monte jusqu'à sa valeur quand il devient visible.
 * La valeur finale est rendue côté serveur, donc elle reste correcte sans
 * JavaScript et pour l'indexation.
 */
export function Counter({
  value,
  duration = 1100,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || started.current) continue;
          started.current = true;
          observer.disconnect();

          const t0 = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - t0) / duration);
            // Décélération douce, pour éviter l'effet mécanique.
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(value * eased));
            if (p < 1) requestAnimationFrame(step);
          };
          setDisplay(0);
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
