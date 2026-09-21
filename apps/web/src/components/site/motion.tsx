"use client";

/**
 * Primitives d'animation du site public.
 *
 * Elles reproduisent les interactions du gabarit de référence :
 * - `Reveal` : entrée au défilement, 100 px et 1 s, dans quatre directions ;
 * - `ImageFrame` : rideau coloré qui glisse pour dévoiler une image ;
 * - `Parallax` : image qui se décale verticalement pendant le défilement.
 *
 * Les états visuels vivent dans globals.css (classes `site-*`). Ce fichier
 * ne fait que poser l'attribut `data-in` au bon moment et calculer le
 * décalage de parallaxe. Le réglage système « mouvement réduit » est
 * respecté : tout est visible d'emblée et rien ne bouge.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Passe à `true` une seule fois, quand l'élément entre dans le champ. */
function useInView<T extends Element>(rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reducedMotion() || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    // Ce qui est déjà visible au chargement s'anime aussitôt, sans attendre
    // la première notification de l'observateur.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

type Direction = "up" | "down" | "left" | "right";

/** Entrée au défilement. `dir="up"` fait monter l'élément depuis le bas. */
export function Reveal({
  children,
  dir = "up",
  delay = 0,
  as: Tag = "div",
  className,
  style,
}: {
  children: ReactNode;
  dir?: Direction;
  /** Décalage en millisecondes, pour échelonner une série d'éléments. */
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  // On observe une enveloppe immobile et on anime son contenu. Observer
  // l'élément déplacé lui-même échouerait dès qu'un parent masque ce qui
  // dépasse : décalé de 100 px, il resterait invisible pour l'observateur.
  return (
    <Tag ref={ref}>
      <div
        data-dir={dir}
        data-in={inView ? "true" : "false"}
        className={`site-reveal h-full ${className ?? ""}`}
        style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}
      >
        {children}
      </div>
    </Tag>
  );
}

/**
 * Cadre d'image avec rideau. Le rideau prend la couleur du fond sur lequel
 * l'image est posée, puis glisse pour la dévoiler quand elle devient visible.
 */
export function ImageFrame({
  children,
  curtain = "var(--color-site-canvas)",
  to = "left",
  className,
  style,
}: {
  children: ReactNode;
  /** Couleur du rideau : celle du fond environnant. */
  curtain?: string;
  /** Direction dans laquelle le rideau s'en va. */
  to?: "left" | "right" | "down";
  className?: string;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLDivElement>("0px 0px -5% 0px");
  return (
    <div
      ref={ref}
      data-in={inView ? "true" : "false"}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={style}
    >
      {children}
      <span
        aria-hidden
        className="site-curtain"
        data-to={to}
        style={{ "--curtain": curtain } as CSSProperties}
      />
    </div>
  );
}

/**
 * Parallaxe verticale. L'enfant (en général une image en `fill`) est agrandi
 * de `strength` % en haut et en bas, puis décalé selon la progression du
 * cadre dans la fenêtre, de sorte qu'aucun vide n'apparaisse jamais.
 */
export function Parallax({
  children,
  strength = 18,
  className,
}: {
  children: ReactNode;
  /** Amplitude maximale, en pourcentage de la hauteur du cadre. */
  strength?: number;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement | null>(null);
  const layer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const f = frame.current;
    const l = layer.current;
    if (!f || !l || reducedMotion()) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = f.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 quand le cadre entre par le bas, 1 quand il sort par le haut.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const offset = (progress * 2 - 1) * (strength / 100) * rect.height;
      l.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
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
  }, [strength]);

  return (
    <div ref={frame} className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <div
        ref={layer}
        data-parallax
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `-${strength}%`, bottom: `-${strength}%` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Progression de défilement exposée en variable CSS `--p` (de 0 à 1) sur
 * l'élément, pour les animations pilotées par le scroll, comme l'image qui
 * s'agrandit dans l'en-tête de la page À propos.
 *
 * `start` et `end` sont exprimés en fraction de la hauteur totale parcourue.
 */
export function ScrollProgress({
  children,
  start = 0,
  end = 1,
  className,
  style,
}: {
  children: ReactNode;
  start?: number;
  end?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reducedMotion()) {
      node.style.setProperty("--p", "0");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      const p = Math.min(1, Math.max(0, (raw - start) / Math.max(0.0001, end - start)));
      node.style.setProperty("--p", p.toFixed(4));
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
  }, [start, end]);

  return (
    <div ref={ref} className={className} style={{ "--p": 0, ...style } as CSSProperties}>
      {children}
    </div>
  );
}
