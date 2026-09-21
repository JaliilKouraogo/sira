"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconClose, IconLogout, IconMenu, SiraLogo } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { ZoneMark, type ZoneKey } from "./illustrations";
import { cx } from "./ui";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number | string;
  exact?: boolean;
  plan?: "Pro" | "Premium";
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

/**
 * Coquille des espaces authentifiés : barre latérale à gauche sur grand écran,
 * tiroir sur mobile. Utilisée par les espaces candidat, recruteur, formateur
 * et le back-office, avec une navigation propre à chaque zone.
 *
 * Direction épurée : barre latérale sur le même fond que la page, séparée par
 * un filet. L'entrée active se signale par le poids du texte et un fond très
 * pâle, jamais par une pastille colorée.
 */
export function AppShell({
  groups,
  zone,
  zoneLabel,
  zoneHref,
  user,
  children,
}: {
  groups: NavGroup[];
  /** Espace applicatif, qui détermine la teinte et le glyphe d'identité. */
  zone: ZoneKey;
  zoneLabel: string;
  zoneHref: string;
  user: { name: string; subtitle: string; initials: string; color?: string };
  children: ReactNode;
  /** Conservé pour compatibilité ; la couleur d'accent n'est plus utilisée. */
  accent?: string;
}) {
  // En export statique, les adresses finissent par une barre oblique.
  const rawPathname = usePathname();
  const pathname = rawPathname.length > 1 && rawPathname.endsWith("/") ? rawPathname.slice(0, -1) : rawPathname;
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-[var(--color-border)] px-4">
        <Link href="/" aria-label="SIRA, accueil">
          <SiraLogo size={22} withText={false} />
        </Link>
        <div className="min-w-0">
          <Link href={zoneHref} className="block truncate text-[13px] font-semibold text-[var(--color-text)]">
            SIRA
          </Link>
          <p className="flex items-center gap-1 truncate text-[11px] leading-tight text-[var(--color-text-subtle)]">
            <ZoneMark zone={zone} size={12} />
            {zoneLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] lg:hidden"
          aria-label="Fermer le menu"
        >
          <IconClose size={17} />
        </button>
      </div>

      <nav className="scrollbar-slim flex-1 overflow-y-auto px-2.5 py-4" aria-label={zoneLabel}>
        {groups.map((group, gi) => (
          <div key={group.title ?? gi} className={gi > 0 ? "mt-6" : undefined}>
            {group.title ? (
              <p className="mb-1.5 px-2.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                {group.title}
              </p>
            ) : null}
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-text)]"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                      )}
                      style={
                        active
                          ? { boxShadow: `inset 2px 0 0 0 var(--color-zone-${zone})` }
                          : undefined
                      }
                    >
                      <span className={cx("shrink-0", active ? "" : "text-[var(--color-text-subtle)]")}>
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.plan ? (
                        <span className="shrink-0 rounded-sm bg-[var(--color-accent-soft)] px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">
                          {item.plan}
                        </span>
                      ) : null}
                      {item.badge ? (
                        <span className="shrink-0 tabular-nums text-[11px] font-medium text-[var(--color-text-subtle)]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[var(--color-border)] p-2.5">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[10.5px] font-semibold text-[var(--color-text-muted)]"
            aria-hidden
          >
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-[var(--color-text)]">{user.name}</p>
            <p className="truncate text-[11px] text-[var(--color-text-subtle)]">{user.subtitle}</p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded p-1 text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <IconLogout size={15} />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Barre latérale fixe, grand écran */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[var(--color-border)] lg:block">
        {sidebar}
      </aside>

      {/* Tiroir mobile */}
      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
          <aside className="fixed inset-y-0 left-0 z-50 w-68 border-r border-[var(--color-border)] bg-[var(--color-bg)] lg:hidden">
            {sidebar}
          </aside>
        </>
      ) : null}

      <div className="lg:pl-60">
        {/* Barre supérieure mobile */}
        <header className="sticky top-0 z-20 flex h-13 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            aria-label="Ouvrir le menu"
          >
            <IconMenu size={17} />
          </button>
          <SiraLogo size={22} />
          <span className="ml-auto flex items-center gap-1.5 text-[12px] text-[var(--color-text-subtle)]">
            <ZoneMark zone={zone} size={13} />
            {zoneLabel}
          </span>
          <ThemeToggle className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]" />
        </header>

        {/* Barre supérieure grand écran */}
        <div className="sticky top-0 z-20 hidden h-13 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-6 py-2.5 backdrop-blur lg:flex">
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-subtle)]">
            <ZoneMark zone={zone} size={13} />
            {zoneLabel}
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="text-[12.5px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              Voir le site public
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <main id="contenu" className="px-4 py-7 md:px-6 lg:px-8 lg:py-9">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
