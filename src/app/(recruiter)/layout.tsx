import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  IconBriefcase,
  IconBuilding,
  IconChart,
  IconChat,
  IconCreditCard,
  IconLayout,
  IconPlus,
  IconSettings,
  IconSparkles,
  IconTarget,
  IconUsers,
} from "@/components/icons";
import { getRecruiterDashboard } from "@/data/queries";

/** Espace recruteur — arborescence de [T §3.3]. */
export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { organization, newApplications } = getRecruiterDashboard();

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/recruteur", label: "Tableau de bord", icon: <IconLayout size={17} />, exact: true },
        { href: "/recruteur/offres", label: "Mes offres", icon: <IconBriefcase size={17} /> },
        { href: "/recruteur/offres/nouvelle", label: "Publier une offre", icon: <IconPlus size={17} /> },
        {
          href: "/recruteur/candidatures",
          label: "Candidatures",
          icon: <IconTarget size={17} />,
          badge: newApplications.length > 0 ? newApplications.length : undefined,
        },
      ],
    },
    {
      title: "Sourcing",
      items: [
        { href: "/recruteur/talents", label: "Rechercher des talents", icon: <IconUsers size={17} />, plan: "Pro" },
        { href: "/recruteur/matching", label: "Matching IA", icon: <IconSparkles size={17} />, plan: "Pro" },
      ],
    },
    {
      title: "Organisation",
      items: [
        { href: "/recruteur/entreprise", label: "Mon entreprise", icon: <IconBuilding size={17} /> },
        { href: "/recruteur/messages", label: "Messages et WhatsApp", icon: <IconChat size={17} /> },
        { href: "/recruteur/statistiques", label: "Statistiques", icon: <IconChart size={17} />, plan: "Pro" },
        { href: "/recruteur/abonnement", label: "Abonnement", icon: <IconCreditCard size={17} /> },
        { href: "/recruteur/parametres", label: "Paramètres", icon: <IconSettings size={17} /> },
      ],
    },
  ];

  return (
    <AppShell
      zone="recruiter"
      groups={groups}
      zoneLabel="Espace recruteur"
      zoneHref="/recruteur"
      user={{
        name: "Idrissa Compaoré",
        subtitle: organization.tradeName ?? organization.legalName,
        initials: organization.logoInitials,
        color: organization.logoColor,
      }}
    >
      {children}
    </AppShell>
  );
}
