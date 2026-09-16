"use client";

/**
 * Barre de navigation flottante du site public.
 *
 * Reprend le gabarit : barre claire arrondie (24 px), fixée à 1 % du haut et
 * des bords, 72 px de haut. Sous 992 px, les liens passent dans un menu plein
 * écran (100dvh) ouvert par un burger qui se transforme en croix : la ligne du
 * haut descend de 8 px et pivote de −45°, celle du bas remonte et pivote de
 * 45°, celle du milieu se rétracte, en 0,4 à 0,6 s sur une courbe inOutQuint.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SiraLogo } from "@/components/icons";
import { cn } from "./kit";

export const SITE_NAV = [
  { href: "/emplois", label: "Emplois" },
  { href: "/formations", label: "Formations" },
  { href: "/recruteurs", label: "Recruteurs" },
  { href: "/conseils", label: "Conseils" },
  { href: "/a-propos", label: "À propos" },
];

/** Liens supplémentaires du menu mobile, qui a la place de tout montrer. */
const MOBILE_EXTRA = [
  { href: "/stages", label: "Stages" },
  { href: "/contact", label: "Contact" },
];

const EASE = "cubic-bezier(0.83, 0, 0.17, 1)";

export function SiteNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Fermer le menu à chaque changement de page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquer le défilement de la page derrière le menu, et fermer sur Échap.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Repasser en mode bureau referme le menu.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 62rem)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 mx-[3%] mt-[3%] xs:mx-[2%] xs:mt-[1%] tab:mx-[1%]",
      )}
    >
      <div className="relative flex min-h-16 items-center justify-between rounded-[1.5rem] border border-site-border bg-site-light px-6 text-site-ink md:min-h-[4.5rem] md:px-12">
        <Link href="/" aria-label="SIRA, retour à l'accueil" className="shrink-0">
          <SiraLogo size={30} />
        </Link>

        {/* Bureau */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-9 tab:flex">
          <ul className="flex items-center gap-8">
            {SITE_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "site-link py-2 text-[0.9375rem] font-medium transition-colors",
                    isActive(item.href) ? "text-site-navy" : "text-site-ink/80 hover:text-site-navy",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-5">
            <Link href="/connexion" className="site-link text-[0.9375rem] font-medium text-site-ink/80 hover:text-site-navy">
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="inline-flex min-h-11 items-center rounded-[0.5rem] bg-site-navy px-5 text-[0.9375rem] font-semibold text-white transition-colors duration-[250ms] hover:bg-site-navy-deep"
            >
              Créer un compte
            </Link>
          </div>
        </nav>

        {/* Burger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="relative -mr-2 inline-flex h-12 w-12 items-center justify-center tab:hidden"
        >
          <span className="relative block h-[18px] w-6" aria-hidden>
            <span
              className="absolute left-0 top-0 h-0.5 w-6 rounded-full bg-site-navy"
              style={{
                transform: open ? "translateY(8px) rotate(-45deg)" : "none",
                transition: `transform ${open ? 400 : 600}ms ${EASE}`,
              }}
            />
            <span
              className="absolute left-0 top-2 h-0.5 rounded-full bg-site-navy"
              style={{
                width: open ? 0 : 24,
                transition: `width 200ms ${EASE}`,
              }}
            />
            <span
              className="absolute bottom-0 left-0 h-0.5 w-6 rounded-full bg-site-navy"
              style={{
                transform: open ? "translateY(-8px) rotate(45deg)" : "none",
                transition: `transform ${open ? 400 : 600}ms ${EASE}`,
              }}
            />
          </span>
        </button>
      </div>

      {/* Menu mobile plein écran, posé sur le fond or comme dans le modèle */}
      <div
        id="menu-mobile"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-0 -z-10 overflow-y-auto bg-site-canvas px-[5%] pb-24 pt-28 tab:hidden"
      >
        <nav aria-label="Navigation mobile">
          <ul className="flex flex-col">
            {[...SITE_NAV, ...MOBILE_EXTRA].map((item, i) => (
              <li
                key={item.href}
                className="border-b border-site-navy/15"
                style={{
                  animation: open ? `site-menu-in 500ms ${EASE} ${60 + i * 45}ms both` : undefined,
                }}
              >
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "site-display flex min-h-16 items-center justify-between text-[1.75rem] text-site-navy",
                    isActive(item.href) && "underline decoration-2 underline-offset-8",
                  )}
                >
                  {item.label}
                  <span aria-hidden className="text-[1.25rem] opacity-60">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3">
            <Link
              href="/inscription"
              className="inline-flex min-h-14 items-center justify-center rounded-[0.5rem] bg-site-navy px-6 text-[1.0625rem] font-semibold text-white"
            >
              Créer un compte
            </Link>
            <Link
              href="/connexion"
              className="inline-flex min-h-14 items-center justify-center rounded-[0.5rem] border border-site-navy px-6 text-[1.0625rem] font-semibold text-site-navy"
            >
              Connexion
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
