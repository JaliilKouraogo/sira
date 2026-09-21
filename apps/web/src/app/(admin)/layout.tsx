import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  IconAlert,
  IconBell,
  IconBriefcase,
  IconBuilding,
  IconChart,
  IconCreditCard,
  IconGraduation,
  IconLayout,
  IconMegaphone,
  IconSettings,
  IconShield,
  IconSparkles,
  IconTarget,
  IconUser,
  IconUsers,
} from "@/components/icons";
import { getAdminDashboard } from "@/data/queries";

/**
 * Back-office — [T §3.5] et [T §21].
 * Les trois listes divergentes des sources ([F §20], [T §3.5], [T §21]) sont
 * fusionnées ici sans perte : les coûts IA et WhatsApp et les journaux
 * d'erreurs, absents du menu de [T §3.5], sont rattachés à IA et Paramètres.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { jobsToValidate, openReports, pendingVerification } = getAdminDashboard();

  const groups: NavGroup[] = [
    {
      items: [{ href: "/admin", label: "Tableau de bord", icon: <IconLayout size={17} />, exact: true }],
    },
    {
      title: "Communauté",
      items: [
        { href: "/admin/utilisateurs", label: "Utilisateurs", icon: <IconUsers size={17} /> },
        { href: "/admin/candidats", label: "Candidats", icon: <IconUser size={17} /> },
        {
          href: "/admin/recruteurs",
          label: "Recruteurs",
          icon: <IconBuilding size={17} />,
          badge: pendingVerification.length > 0 ? pendingVerification.length : undefined,
        },
      ],
    },
    {
      title: "Contenus",
      items: [
        {
          href: "/admin/offres",
          label: "Offres",
          icon: <IconBriefcase size={17} />,
          badge: jobsToValidate.length > 0 ? jobsToValidate.length : undefined,
        },
        { href: "/admin/candidatures", label: "Candidatures", icon: <IconTarget size={17} /> },
        { href: "/admin/formations", label: "Formations", icon: <IconGraduation size={17} /> },
        { href: "/admin/formateurs", label: "Formateurs", icon: <IconUser size={17} /> },
        { href: "/admin/campagnes", label: "Campagnes", icon: <IconMegaphone size={17} /> },
        {
          href: "/admin/moderation",
          label: "Modération",
          icon: <IconAlert size={17} />,
          badge: openReports.length > 0 ? openReports.length : undefined,
        },
      ],
    },
    {
      title: "Exploitation",
      items: [
        { href: "/admin/abonnements", label: "Abonnements", icon: <IconCreditCard size={17} /> },
        { href: "/admin/paiements", label: "Paiements", icon: <IconCreditCard size={17} /> },
        { href: "/admin/notifications", label: "Notifications", icon: <IconBell size={17} /> },
        { href: "/admin/ia", label: "IA et matching", icon: <IconSparkles size={17} /> },
        { href: "/admin/partenaires", label: "Partenaires", icon: <IconShield size={17} /> },
        { href: "/admin/rapports", label: "Rapports", icon: <IconChart size={17} /> },
        { href: "/admin/parametres", label: "Paramètres", icon: <IconSettings size={17} /> },
      ],
    },
  ];

  return (
    <AppShell
      zone="admin"
      groups={groups}
      zoneLabel="Administration"
      zoneHref="/admin"
      user={{ name: "Boureima Traoré", subtitle: "Administrateur", initials: "BT", color: "var(--color-blue-900)" }}
    >
      {children}
    </AppShell>
  );
}
