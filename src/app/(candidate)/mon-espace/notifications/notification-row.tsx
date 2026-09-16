/**
 * Ligne de notification, partagée par la liste de service (rendue dans le
 * navigateur, filtrée par l'adresse) et la liste des promotions (rendue par
 * la page). Distinction visuelle lu / non lu, canal de réception indiqué.
 */

import Link from "next/link";
import { NotificationChannelIcon } from "@/components/account-shared";
import { IconArrowRight } from "@/components/icons";
import { Badge, cx, formatDate, relativeDays } from "@/components/ui";
import { NOTIFICATION_CHANNEL_LABEL, NOTIFICATION_TYPE_LABEL, type NotificationType } from "@/lib/enums";
import type { Notification } from "@/lib/types";

const TYPE_TONE: Record<NotificationType, "neutral" | "primary" | "accent" | "success" | "warning" | "info"> = {
  offre: "primary",
  candidature: "success",
  document: "info",
  formation: "accent",
  message: "info",
  promotion: "warning",
  systeme: "neutral",
};

export function NotificationRow({ notification }: { notification: Notification }) {
  const isUnread = !notification.readAt;
  const body = (
    <>
      <span
        className={cx(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)]",
          isUnread ? "text-[var(--color-primary)]" : "text-[var(--color-text-subtle)]",
        )}
        aria-hidden
      >
        <NotificationChannelIcon channel={notification.channel} size={15} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cx(
              "text-[14px] leading-snug",
              isUnread ? "font-semibold text-[var(--color-text)]" : "font-medium text-[var(--color-text-muted)]",
            )}
          >
            {notification.title}
          </span>
          <Badge tone={TYPE_TONE[notification.type]}>{NOTIFICATION_TYPE_LABEL[notification.type]}</Badge>
          {isUnread ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--color-primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
              Non lue
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          {notification.body}
        </span>
        <span className="mt-1.5 block text-[12px] text-[var(--color-text-subtle)]">
          {formatDate(notification.createdAt)} · {relativeDays(notification.createdAt)} · reçue par{" "}
          {NOTIFICATION_CHANNEL_LABEL[notification.channel]}
          {notification.readAt ? ` · lue le ${formatDate(notification.readAt)}` : ""}
        </span>
      </span>

      {notification.href ? (
        <span className="mt-1 shrink-0 self-center text-[var(--color-text-subtle)]" aria-hidden>
          <IconArrowRight size={16} />
        </span>
      ) : null}
    </>
  );

  return (
    <li
      className={cx(
        "border-l-2 transition-colors",
        isUnread ? "border-l-[var(--color-primary)]" : "border-l-transparent",
      )}
    >
      {notification.href ? (
        <Link href={notification.href} className="flex gap-3 py-3.5 pl-3.5 pr-2 hover:bg-[var(--color-surface-2)]">
          {body}
        </Link>
      ) : (
        <div className="flex gap-3 py-3.5 pl-3.5 pr-2">{body}</div>
      )}
    </li>
  );
}
