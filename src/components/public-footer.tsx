import Link from "next/link";
import { SiraLogo } from "./icons";

/**
 * Pied de page — [T §4] : contacts, confidentialité, conditions, cookies, réseaux.
 * Direction épurée : fond identique à la page, séparé par un simple filet.
 */
export function PublicFooter() {
  const columns = [
    {
      title: "Candidats",
      links: [
        { href: "/emplois", label: "Offres d'emploi" },
        { href: "/stages", label: "Offres de stage" },
        { href: "/formations", label: "Formations" },
        { href: "/inscription/candidat", label: "Créer mon profil" },
      ],
    },
    {
      title: "Recruteurs",
      links: [
        { href: "/recruteurs", label: "Publier une offre" },
        { href: "/recruteurs#verification", label: "Vérification" },
        { href: "/recruteurs#tarifs", label: "Offres et tarifs" },
        { href: "/inscription/recruteur", label: "Créer un compte entreprise" },
      ],
    },
    {
      title: "SIRA",
      links: [
        { href: "/a-propos", label: "À propos" },
        { href: "/a-propos#partenaires", label: "Partenaires" },
        { href: "/a-propos#contact", label: "Contact" },
      ],
    },
    {
      title: "Informations légales",
      links: [
        { href: "/confidentialite", label: "Confidentialité" },
        { href: "/conditions", label: "Conditions d'utilisation" },
        { href: "/cookies", label: "Cookies" },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-[var(--color-border)]">
      <div className="sira-container py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <SiraLogo size={26} withTagline />
            <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              Mise en relation entre talents, opportunités et recruteurs, au Burkina Faso.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-text-subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SIRA. Ouagadougou, Burkina Faso.</p>
          <p>Les scores affichés sont des estimations algorithmiques et ne garantissent aucun recrutement.</p>
        </div>
      </div>
    </footer>
  );
}
