"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconClose, IconMenu, SiraLogo } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { cx } from "./ui";

/**
 * Navigation publique — section 6.2 du plan.
 * Le doublon « Formations » de [T §3.1] est supprimé et l'entrée
 * « Recruteurs » pointe vers une page d'atterrissage employeurs.
 *
 * Direction épurée : fond blanc, filet de 1 pixel, onglet actif signalé par
 * la couleur du texte et un trait, sans pastille colorée.
 */
const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/emplois", label: "Emplois" },
  { href: "/stages", label: "Stages" },
  { href: "/formations", label: "Formations" },
  { href: "/recruteurs", label: "Recruteurs" },
  { href: "/a-propos", label: "À propos" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="sira-container flex h-14 items-center gap-6">
        <Link href="/" className="shrink-0" aria-label="SIRA, accueil">
          <SiraLogo size={24} />
        </Link>

        <nav className="hidden flex-1 items-center gap-5 lg:flex" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cx(
                "relative py-4 text-[13.5px] transition-colors",
                isActive(item.href)
                  ? "font-medium text-[var(--color-text)] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <ThemeToggle />
          <Link
            href="/connexion"
            className="hidden text-[13.5px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="inline-flex h-8 items-center rounded-md bg-[var(--color-primary)] px-3.5 text-[13px] font-medium text-[var(--color-primary-fg)] transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Créer un compte
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <IconClose size={17} /> : <IconMenu size={17} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-[var(--color-border)] lg:hidden" aria-label="Navigation mobile">
          <div className="sira-container flex flex-col py-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cx(
                  "border-b border-[var(--color-border)] py-2.5 text-[13.5px] last:border-b-0",
                  isActive(item.href) ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text-muted)]",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="py-2.5 text-[13.5px] text-[var(--color-text-muted)] sm:hidden"
            >
              Connexion
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
