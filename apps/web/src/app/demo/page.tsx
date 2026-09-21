/**
 * Plan du site de démonstration.
 *
 * Il n'y a pas encore d'authentification : cette page sert de point d'entrée
 * unique pour parcourir les cinq zones applicatives et vérifier chaque écran
 * du plan de conception.
 */

import Link from "next/link";
import { SiraLogo } from "@/components/icons";
import { Badge, Card, cx } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

interface Route {
  href: string;
  label: string;
  note?: string;
  plan?: string;
}

interface Zone {
  key: string;
  title: string;
  subtitle: string;
  color: string;
  routes: Route[];
}

const ZONES: Zone[] = [
  {
    key: "public",
    title: "Site public",
    subtitle: "Visiteur non authentifié",
    color: "var(--color-blue-800)",
    routes: [
      { href: "/", label: "Accueil", note: "Hero, recherche, 4 étapes, bloc IA, formations, partenaires" },
      { href: "/emplois", label: "Offres d'emploi", note: "Recherche et filtres" },
      { href: "/stages", label: "Offres de stage" },
      { href: "/offres/responsable-logistique-sahel-agro", label: "Détail d'une offre" },
      { href: "/formations", label: "Catalogue de formations" },
      { href: "/formations/initiation-sap-mm", label: "Détail d'une formation" },
      { href: "/recruteurs", label: "Page employeurs", note: "Vérification et tarifs" },
      { href: "/a-propos", label: "À propos", note: "Calcul du score et garde-fous" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/conditions", label: "Conditions d'utilisation" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
  {
    key: "auth",
    title: "Authentification",
    subtitle: "Inscription et connexion",
    color: "var(--color-blue-600)",
    routes: [
      { href: "/inscription", label: "Choix du type de compte" },
      { href: "/inscription/candidat", label: "Onboarding candidat", note: "Formulaire en 6 étapes" },
      { href: "/inscription/recruteur", label: "Inscription recruteur", note: "Compte puis organisation" },
      { href: "/connexion", label: "Connexion", note: "Mot de passe ou code OTP" },
      { href: "/verification", label: "Vérification e-mail et téléphone" },
      { href: "/mot-de-passe-oublie", label: "Mot de passe oublié" },
      { href: "/2fa", label: "Double authentification" },
    ],
  },
  {
    key: "candidate",
    title: "Espace candidat",
    subtitle: "Awa Sawadogo, plan Gratuit",
    color: "var(--color-success)",
    routes: [
      { href: "/mon-espace", label: "Tableau de bord" },
      { href: "/mon-espace/opportunites", label: "Opportunités", note: "10 filtres" },
      { href: "/mon-espace/opportunites/job_01", label: "Détail d'offre et préparation" },
      { href: "/mon-espace/opportunites/job_01/score", label: "Explication du score", note: "6 composantes" },
      { href: "/mon-espace/offres-enregistrees", label: "Offres enregistrées" },
      { href: "/mon-espace/candidatures", label: "Mes candidatures" },
      { href: "/mon-espace/candidatures/app_01", label: "Détail d'une candidature" },
      { href: "/mon-espace/documents", label: "CV et documents" },
      { href: "/mon-espace/assistant", label: "Assistant SIRA" },
      { href: "/mon-espace/formations", label: "Formations recommandées" },
      { href: "/mon-espace/notifications", label: "Notifications" },
      { href: "/mon-espace/abonnement", label: "Abonnement et quotas" },
      { href: "/mon-espace/profil", label: "Mon profil" },
      { href: "/mon-espace/parametres", label: "Paramètres", note: "Confidentialité et consentements" },
    ],
  },
  {
    key: "recruiter",
    title: "Espace recruteur",
    subtitle: "Sahel Agro, plan Pro offert au lancement",
    color: "var(--color-gold-700)",
    routes: [
      { href: "/recruteur", label: "Tableau de bord" },
      { href: "/recruteur/offres", label: "Mes offres" },
      { href: "/recruteur/offres/nouvelle", label: "Publier une offre", note: "18 champs" },
      { href: "/recruteur/offres/job_01", label: "Modifier une offre" },
      { href: "/recruteur/candidatures", label: "Candidatures reçues" },
      { href: "/recruteur/candidatures/app_02", label: "Fiche candidature" },
      { href: "/recruteur/talents", label: "Recherche de talents", plan: "Pro" },
      { href: "/recruteur/matching", label: "Matching IA", plan: "Pro" },
      { href: "/recruteur/entreprise", label: "Mon entreprise" },
      { href: "/recruteur/messages", label: "Messages et WhatsApp" },
      { href: "/recruteur/statistiques", label: "Statistiques", plan: "Pro" },
      { href: "/recruteur/abonnement", label: "Abonnement" },
      { href: "/recruteur/parametres", label: "Paramètres" },
    ],
  },
  {
    key: "trainer",
    title: "Espace formateur",
    subtitle: "Numerika Formation, derrière un drapeau",
    color: "var(--color-warning)",
    routes: [
      { href: "/formateur", label: "Tableau de bord" },
      { href: "/formateur/formations", label: "Mes formations" },
      { href: "/formateur/formations/nouvelle", label: "Créer une formation" },
      { href: "/formateur/campagnes", label: "Mes campagnes" },
      { href: "/formateur/audience", label: "Audience" },
      { href: "/formateur/paiements", label: "Paiements" },
      { href: "/formateur/statistiques", label: "Statistiques" },
      { href: "/formateur/profil", label: "Profil" },
      { href: "/formateur/parametres", label: "Paramètres" },
    ],
  },
  {
    key: "admin",
    title: "Administration",
    subtitle: "Boureima Traoré, back-office",
    color: "var(--color-blue-900)",
    routes: [
      { href: "/admin", label: "Tableau de bord" },
      { href: "/admin/utilisateurs", label: "Utilisateurs" },
      { href: "/admin/candidats", label: "Candidats" },
      { href: "/admin/recruteurs", label: "Recruteurs et vérification" },
      { href: "/admin/offres", label: "Offres à valider" },
      { href: "/admin/candidatures", label: "Candidatures" },
      { href: "/admin/formations", label: "Formations" },
      { href: "/admin/formateurs", label: "Formateurs" },
      { href: "/admin/campagnes", label: "Campagnes" },
      { href: "/admin/moderation", label: "Modération et signalements" },
      { href: "/admin/abonnements", label: "Abonnements" },
      { href: "/admin/paiements", label: "Paiements" },
      { href: "/admin/notifications", label: "Notifications et consentements" },
      { href: "/admin/ia", label: "IA, pondérations et coûts" },
      { href: "/admin/partenaires", label: "Partenaires" },
      { href: "/admin/rapports", label: "Indicateurs de performance" },
      { href: "/admin/parametres", label: "Paramètres et règles métier" },
    ],
  },
];

export const metadata = { title: "Plan du site de démonstration" };

export default function DemoPage() {
  const total = ZONES.reduce((sum, z) => sum + z.routes.length, 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="sira-container flex h-16 items-center gap-4">
          <Link href="/">
            <SiraLogo />
          </Link>
          <Badge tone="neutral">Démonstration</Badge>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="contenu" className="sira-container py-10">
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">
          Plan du site de démonstration
        </h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[var(--color-text-muted)]">
          {total} écrans répartis sur six zones. L&apos;authentification n&apos;étant pas encore branchée, chaque
          espace est accessible directement depuis cette page. Les données affichées proviennent d&apos;un jeu de
          démonstration ancré sur le contexte burkinabè.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {ZONES.map((zone) => (
            <Card key={zone.key} className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-4">
                <span
                  className="inline-block h-9 w-1.5 shrink-0 rounded-full"
                  style={{ background: zone.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-[var(--color-text)]">{zone.title}</h2>
                  <p className="truncate text-[12.5px] text-[var(--color-text-muted)]">{zone.subtitle}</p>
                </div>
                <Badge tone="neutral" className="ml-auto shrink-0">
                  {zone.routes.length} écrans
                </Badge>
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {zone.routes.map((route) => (
                  <li key={route.href}>
                    <Link
                      href={route.href}
                      className={cx(
                        "flex items-center gap-3 px-4 py-2.5 transition-colors",
                        "hover:bg-[var(--color-surface-2)]",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-[var(--color-text)]">
                          {route.label}
                        </span>
                        {route.note ? (
                          <span className="block truncate text-[12px] text-[var(--color-text-subtle)]">
                            {route.note}
                          </span>
                        ) : null}
                      </span>
                      {route.plan ? (
                        <span className="shrink-0 rounded bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">
                          {route.plan}
                        </span>
                      ) : null}
                      <code className="shrink-0 font-mono text-[11px] text-[var(--color-text-subtle)]">
                        {route.href}
                      </code>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
