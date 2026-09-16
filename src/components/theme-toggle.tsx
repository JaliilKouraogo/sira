"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./icons";

type Theme = "light" | "dark";

/**
 * Bascule clair / sombre exigée par [T §19].
 * Le choix est conservé dans le navigateur ; sans choix explicite, le thème
 * suit le réglage du système d'exploitation.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("sira-theme") as Theme | null;
    const system: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(stored ?? system);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("sira-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      }
      aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
      title={theme === "dark" ? "Thème clair" : "Thème sombre"}
    >
      {theme === "dark" ? <IconSun size={17} /> : <IconMoon size={17} />}
    </button>
  );
}

/**
 * Script appliqué avant le premier rendu pour éviter le flash de thème.
 * Injecté dans <head> par le layout racine.
 */
export const themeInitScript = `
(function(){
  // Signale que JavaScript tourne : les animations d'entrée peuvent masquer
  // le contenu avant de le révéler. Sans script, rien n'est jamais masqué.
  document.documentElement.classList.add('js');
  try {
    var stored = localStorage.getItem('sira-theme');
    var dark = stored ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
