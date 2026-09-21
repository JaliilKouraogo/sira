/**
 * Centre de notifications — [T §6.9].
 *
 * Groupement par date, filtre par type, distinction visuelle lu / non lu, et
 * surtout une séparation nette entre les notifications de service et les
 * promotions : les deux ne relèvent pas de la même base juridique, elles ne
 * partagent donc pas la même liste.
 *
 * Le site étant exporté en fichiers statiques, le filtre par type est lu dans
 * le navigateur par `ServiceNotifications`. L'en-tête, les promotions et la
 * mention des canaux sont rendus ici.
 */

import Link from "next/link";
import { Suspense } from "react";
import { SimulatedButton } from "@/components/account-actions";
import { IconMegaphone } from "@/components/icons";
import { IllustrationNoNotifications } from "@/components/illustrations";
import { Alert, Badge, EmptyState, PageHeader } from "@/components/ui";
import { getConsents, getNotifications, getUnreadCount } from "@/data/queries";
import { NOTIFICATION_CHANNEL_LABEL } from "@/lib/enums";
import { TabbedListSkeleton } from "../list-skeleton";
import { NotificationRow } from "./notification-row";
import { ServiceNotifications } from "./notifications-client";

export const metadata = {
  title: "Notifications — SIRA",
};

export default function NotificationsPage() {
  const all = getNotifications();
  const unread = getUnreadCount();

  const service = all.filter((notification) => notification.type !== "promotion");
  const promotions = all.filter((notification) => notification.type === "promotion");

  const marketingConsents = getConsents().filter((consent) => consent.consentType === "marketing");
  const marketingGranted = marketingConsents.some((consent) => consent.granted);

  return (
    <>
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""} sur ${all.length}.`
            : "Vous êtes à jour."
        }
        action={
          <SimulatedButton
            label="Tout marquer comme lu"
            variant="outline"
            size="md"
            message="Toutes vos notifications passeraient en « lu ». Elles restent consultables, seul le compteur est remis à zéro."
            disabled={unread === 0}
            disabledReason={unread === 0 ? "vous n'avez aucune notification non lue." : undefined}
          />
        }
      />

      <Suspense
        fallback={
          <TabbedListSkeleton label="Chargement de vos notifications…" tabs={4} rows={Math.min(service.length, 6) || 3} />
        }
      >
        <ServiceNotifications />
      </Suspense>

      {/* ---------------- Promotions, strictement séparées ---------------- */}
      <section aria-labelledby="titre-promotions" className="mt-10">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 id="titre-promotions" className="text-[17px] font-semibold text-[var(--color-text)]">
            Promotions et communications commerciales
          </h2>
          <Badge tone="warning" icon={<IconMegaphone size={12} />}>
            Soumises à votre consentement
          </Badge>
        </div>

        <Alert tone="neutral" title="Pourquoi cette liste est séparée">
          Les messages commerciaux ne vous sont adressés que si vous y avez consenti, et ce consentement est
          révocable à tout moment. Le refuser ne restreint aucune fonction essentielle de SIRA.{" "}
          <Link href="/mon-espace/parametres#notifications" className="font-medium underline">
            Gérer mes consentements
          </Link>
        </Alert>

        <div className="mt-3">
          {promotions.length === 0 ? (
            <EmptyState
              icon={<IllustrationNoNotifications size={165} accent="var(--color-zone-candidate)" />}
              title={
                marketingGranted
                  ? "Aucune communication commerciale pour le moment"
                  : "Vous ne recevez aucune communication commerciale"
              }
              description={
                marketingGranted
                  ? "Vous avez accepté de recevoir ces messages, mais aucun ne vous a été adressé récemment."
                  : "Votre consentement marketing n'est pas accordé : SIRA ne vous adresse ni promotion ni message publicitaire, sur aucun canal."
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {promotions.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="mt-8 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
        Chaque notification indique le canal par lequel elle vous est parvenue :{" "}
        {NOTIFICATION_CHANNEL_LABEL.in_app.toLowerCase()}, {NOTIFICATION_CHANNEL_LABEL.email.toLowerCase()} ou{" "}
        {NOTIFICATION_CHANNEL_LABEL.whatsapp}. Le plan Gratuit autorise 5 notifications WhatsApp par semaine.
      </p>
    </>
  );
}
