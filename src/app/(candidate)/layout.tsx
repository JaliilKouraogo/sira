import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  IconBell,
  IconBookmark,
  IconBriefcase,
  IconChat,
  IconCreditCard,
  IconFile,
  IconGraduation,
  IconLayout,
  IconSettings,
  IconTarget,
  IconUser,
} from "@/components/icons";
import { getCurrentUser, getUnreadCount } from "@/data/queries";

/** Espace candidat — arborescence de [T §3.2]. */
export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  const unread = getUnreadCount();

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/mon-espace", label: "Tableau de bord", icon: <IconLayout size={17} />, exact: true },
        { href: "/mon-espace/opportunites", label: "Opportunités", icon: <IconBriefcase size={17} /> },
        { href: "/mon-espace/offres-enregistrees", label: "Offres enregistrées", icon: <IconBookmark size={17} /> },
        { href: "/mon-espace/candidatures", label: "Mes candidatures", icon: <IconTarget size={17} /> },
        { href: "/mon-espace/documents", label: "Mon CV et documents", icon: <IconFile size={17} /> },
      ],
    },
    {
      title: "Progresser",
      items: [
        { href: "/mon-espace/assistant", label: "Assistant SIRA", icon: <IconChat size={17} /> },
        { href: "/mon-espace/formations", label: "Formations", icon: <IconGraduation size={17} /> },
      ],
    },
    {
      title: "Mon compte",
      items: [
        {
          href: "/mon-espace/notifications",
          label: "Notifications",
          icon: <IconBell size={17} />,
          badge: unread > 0 ? unread : undefined,
        },
        { href: "/mon-espace/abonnement", label: "Abonnement", icon: <IconCreditCard size={17} /> },
        { href: "/mon-espace/profil", label: "Mon profil", icon: <IconUser size={17} /> },
        { href: "/mon-espace/parametres", label: "Paramètres", icon: <IconSettings size={17} /> },
      ],
    },
  ];

  return (
    <AppShell
      zone="candidate"
      groups={groups}
      zoneLabel="Espace candidat"
      zoneHref="/mon-espace"
      user={{
        name: `${user.firstName} ${user.lastName}`,
        subtitle: "Plan Gratuit",
        initials: `${user.firstName[0]}${user.lastName[0]}`,
      }}
    >
      {children}
    </AppShell>
  );
}
