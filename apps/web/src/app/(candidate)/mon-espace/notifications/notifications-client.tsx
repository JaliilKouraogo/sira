"use client";

/**
 * Onglets par type et notifications de service, groupées par date.
 *
 * Le filtre vit dans l'URL (`?type=`). Pour l'export statique, l'adresse est
 * lue dans le navigateur avec `useSearchParams()`. Les promotions ne passent
 * jamais par ce filtre : elles sont rendues à part par la page.
 */

import { useSearchParams } from "next/navigation";
import { TabLinks } from "@/components/account-shared";
import { IconShield } from "@/components/icons";
import { IllustrationNoNotifications } from "@/components/illustrations";
import { Badge, EmptyState } from "@/components/ui";
import { getNotifications } from "@/data/queries";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABEL } from "@/lib/enums";
import { NotificationRow } from "./notification-row";

const TODAY = "2026-09-12";

const GROUP_ORDER = ["Aujourd'hui", "Hier", "Cette semaine", "Ce mois-ci", "Plus ancien"] as const;

function groupOf(iso: string): (typeof GROUP_ORDER)[number] {
  const days = Math.round(
    (Date.parse(`${TODAY}T12:00:00Z`) - Date.parse(`${iso.slice(0, 10)}T12:00:00Z`)) / 86400000,
  );
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return "Cette semaine";
  if (days < 31) return "Ce mois-ci";
  return "Plus ancien";
}

export function ServiceNotifications() {
  const requested = useSearchParams().get("type") ?? "";
  const currentType = (NOTIFICATION_TYPES as readonly string[]).includes(requested) ? requested : "tous";

  const all = getNotifications();
  const service = all.filter((notification) => notification.type !== "promotion");

  const filtered = currentType === "tous" ? service : service.filter((n) => n.type === currentType);

  const groups = GROUP_ORDER.map((label) => ({
    label,
    items: filtered.filter((notification) => groupOf(notification.createdAt) === label),
  })).filter((group) => group.items.length > 0);

  const tabs = [
    { key: "tous", label: "Toutes", href: "/mon-espace/notifications", count: service.length },
    ...NOTIFICATION_TYPES.filter((type) => type !== "promotion")
      .map((type) => ({
        key: type,
        label: NOTIFICATION_TYPE_LABEL[type],
        href: `/mon-espace/notifications?type=${type}`,
        count: service.filter((notification) => notification.type === type).length,
      }))
      .filter((tab) => tab.count > 0),
  ];

  return (
    <>
      <TabLinks tabs={tabs} current={currentType} label="Filtrer les notifications par type" />

      {/* ---------------- Notifications de service ---------------- */}
      <section aria-labelledby="titre-service">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 id="titre-service" className="text-[17px] font-semibold text-[var(--color-text)]">
            Notifications de service
          </h2>
          <Badge tone="info" icon={<IconShield size={12} />}>
            Liées à votre compte et à vos démarches
          </Badge>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            icon={<IllustrationNoNotifications size={175} accent="var(--color-zone-candidate)" />}
            title="Aucune notification dans cette catégorie"
            description="Les alertes d'offres, l'avancement de vos candidatures et vos documents prêts apparaissent ici."
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  {group.label}
                </h3>
                <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                  {group.items.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
