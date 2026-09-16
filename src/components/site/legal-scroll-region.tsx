"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Conteneur à défilement horizontal pour les tableaux des pages légales.
 *
 * Il ne devient focalisable que lorsque son contenu déborde : on peut alors
 * le faire défiler au clavier, sans ajouter d'arrêt de tabulation inutile sur
 * grand écran, où le tableau tient en entier.
 */
export function LegalScrollRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={overflowing ? 0 : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
