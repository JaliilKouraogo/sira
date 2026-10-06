"use client";

import { useEffect, useState } from "react";
import { IconDownload } from "@/components/icons";
import { cx } from "@/components/ui";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

function isStandalone(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function isAppleMobile(): boolean {
  const iosNavigator = navigator as Navigator & { userAgentData?: { platform?: string } };
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    iosNavigator.userAgentData?.platform === "iOS"
  );
}

export function InstallAppButton({
  variant = "app",
  compact = false,
}: {
  variant?: "app" | "public";
  compact?: boolean;
}) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [appleMobile, setAppleMobile] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setInstalled(isStandalone());
    setAppleMobile(isAppleMobile());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setMessage("Syvaa est installée sur cet appareil.");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    setMessage("");
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      setMessage(choice.outcome === "accepted" ? "Syvaa est en cours d’installation." : "Installation annulée.");
      return;
    }

    setMessage(
      appleMobile
        ? "Dans Safari, touchez Partager, puis « Sur l’écran d’accueil » pour installer Syvaa."
        : "Ouvrez le menu de votre navigateur et choisissez « Installer Syvaa » ou « Ajouter à l’écran d’accueil ».",
    );
  }

  if (installed && !message) return null;

  const publicVariant = variant === "public";
  return (
    <div className="relative">
      {!installed ? (
        <button
          type="button"
          onClick={() => void install()}
          aria-label="Installer Syvaa comme application"
          title="Installer Syvaa comme application"
          className={cx(
            "inline-flex shrink-0 items-center justify-center gap-1.5 font-medium transition-colors",
            compact ? "h-8 rounded-md px-2 text-[12px]" : "min-h-10 rounded-md px-3 text-[13px]",
            publicVariant
              ? "border border-site-navy/30 text-site-navy hover:bg-site-navy/5"
              : "border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
          )}
        >
          <IconDownload size={15} />
          <span>Installer</span>
        </button>
      ) : null}
      {message ? (
        <p
          role="status"
          className="absolute right-0 top-full z-[60] mt-2 w-64 max-w-[calc(100vw-2rem)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[12px] leading-relaxed text-[var(--color-text)] shadow-lg"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
