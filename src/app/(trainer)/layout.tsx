import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  IconChart,
  IconCreditCard,
  IconGraduation,
  IconLayout,
  IconMegaphone,
  IconPlus,
  IconSettings,
  IconUser,
  IconUsers,
} from "@/components/icons";
import { getTrainerCampaigns } from "./trainer-context";

/**
 * Espace formateur — [T §3.4].
 *
 * L'espace est derrière un drapeau de fonctionnalité jusqu'au lot 7 : il est
 * construit et navigable, mais n'est pas encore ouvert en libre-service aux
 * organismes. Organisation de démonstration : Numerika Formation (org_07).
 */
export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pendingCampaigns = getTrainerCampaigns().filter(
    (c) => c.status === "en_moderation" || c.status === "en_attente_paiement",
  );

  const groups: NavGroup[] = [
    {
      items: [{ href: "/formateur", label: "Tableau de bord", icon: <IconLayout size={17} />, exact: true }],
    },
    {
      title: "Catalogue",
      items: [
        { href: "/formateur/formations", label: "Mes formations", icon: <IconGraduation size={17} />, exact: true },
        { href: "/formateur/formations/nouvelle", label: "Créer une formation", icon: <IconPlus size={17} /> },
      ],
    },
    {
      title: "Promotion",
      items: [
        {
          href: "/formateur/campagnes",
          label: "Mes campagnes",
          icon: <IconMegaphone size={17} />,
          badge: pendingCampaigns.length > 0 ? pendingCampaigns.length : undefined,
        },
        { href: "/formateur/audience", label: "Audience", icon: <IconUsers size={17} /> },
      ],
    },
    {
      title: "Suivi",
      items: [
        { href: "/formateur/paiements", label: "Paiements", icon: <IconCreditCard size={17} /> },
        { href: "/formateur/statistiques", label: "Statistiques", icon: <IconChart size={17} /> },
      ],
    },
    {
      title: "Organisme",
      items: [
        { href: "/formateur/profil", label: "Profil", icon: <IconUser size={17} /> },
        { href: "/formateur/parametres", label: "Paramètres", icon: <IconSettings size={17} /> },
      ],
    },
  ];

  return (
    <AppShell
      zone="trainer"
      groups={groups}
      zoneLabel="Espace formateur"
      zoneHref="/formateur"
      user={{
        name: "Fatoumata Ouédraogo",
        subtitle: "Numerika Formation",
        initials: "FO",
        // L'avatar porte des initiales blanches : jamais sur un fond or.
        color: "var(--color-blue-700)",
      }}
    >
      {children}
    </AppShell>
  );
}
