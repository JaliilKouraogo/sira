/**
 * Mise en page du parcours d'authentification — section 6 du plan.
 *
 * Volontairement sans la navigation publique : une page d'inscription ou de
 * connexion ne doit offrir qu'une seule sortie, le retour à l'accueil.
 * À gauche, un panneau de marque (masqué sous `lg` pour laisser toute la
 * largeur au formulaire sur mobile) ; à droite, le formulaire centré.
 *
 * Direction épurée : fond blanc des deux côtés, un filet vertical de 1 pixel
 * pour séparer les deux colonnes, aucune forme décorative, aucun aplat coloré.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { IconArrowRight, SiraLogo } from "@/components/icons";
import { Backdrop } from "@/components/backdrop";
import { IllustrationPath } from "@/components/illustrations";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const ARGUMENTS: { title: string; text: string }[] = [
  {
    title: "Un score de compatibilité expliqué",
    text: "Chaque offre indique ce qui correspond à votre profil, et ce qui manque.",
  },
  {
    title: "Une candidature prête en quelques minutes",
    text: "CV adapté, lettre et message : vous relisez, vous validez, vous envoyez.",
  },
  {
    title: "Des recruteurs vérifiés",
    text: "Les organisations sont contrôlées avant de pouvoir publier une offre.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ---- Panneau de marque, masqué sous lg ---- */}
      <aside className="relative isolate hidden w-[38%] shrink-0 flex-col justify-between overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-bg)] px-10 py-12 lg:flex xl:w-[40%]">
        <Backdrop />
        <Link href="/" className="inline-flex items-center gap-2.5 self-start rounded-md">
          <SiraLogo size={30} withText={false} />
          <span className="text-[17px] font-semibold tracking-tight text-[var(--color-text)]">SIRA</span>
        </Link>

        <div className="max-w-sm">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
            Plateforme burkinabè de l&apos;emploi
          </p>
          <h2 className="mt-3 text-[20px] font-semibold leading-snug text-[var(--color-text)]">
            Le chemin vers l&apos;opportunité
          </h2>

          {/* Le motif de marque : la courbe qui monte d'étape en étape. */}
          <div className="mt-6 text-[var(--color-text-subtle)]">
            <IllustrationPath size={280} />
          </div>

          <ul className="mt-8 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {ARGUMENTS.map((argument) => (
              <li key={argument.title} className="py-3.5">
                <p className="text-[13.5px] font-semibold text-[var(--color-text)]">{argument.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                  {argument.text}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12px] text-[var(--color-text-subtle)]">
          Vos données restent les vôtres : vous choisissez ce que les recruteurs voient.
        </p>
      </aside>

      {/* ---- Colonne formulaire ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="rounded-md lg:hidden" aria-label="Accueil SIRA">
              <SiraLogo size={26} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md text-[12.5px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              <span aria-hidden className="rotate-180">
                <IconArrowRight size={14} />
              </span>
              <span className="truncate">Retour à l&apos;accueil</span>
            </Link>
          </div>
          <ThemeToggle />
        </header>

        <main id="contenu" className="flex flex-1 justify-center px-4 pb-16 sm:px-6">
          <div className="w-full max-w-2xl py-8 sm:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
