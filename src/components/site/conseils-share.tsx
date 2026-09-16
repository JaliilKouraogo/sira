"use client";

/**
 * Encadré de partage d'un article.
 *
 * L'adresse partagée est lue dans le navigateur au moment du clic : le site
 * est exporté en fichiers statiques et ne connaît pas son domaine à la
 * construction. WhatsApp figure en tête, c'est le canal le plus utilisé par
 * nos visiteurs sur le continent.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

type Network = {
  label: string;
  build: (url: string, title: string) => string;
  icon: ReactNode;
};

const NETWORKS: Network[] = [
  {
    label: "WhatsApp",
    build: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    icon: (
      <path
        d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.5 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5Zm5.4 13.3c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.4-3.9-4.6-4.1-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"
        fill="currentColor"
      />
    ),
  },
  {
    label: "LinkedIn",
    build: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
        <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Facebook",
    build: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8Z" fill="currentColor" />,
  },
  {
    label: "X",
    build: (url, title) =>
      `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: <path d="M4 4l16 16M20 4 4 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
];

function currentUrl(): string {
  return window.location.href.split("#")[0];
}

export function ConseilsShare({ title }: { title: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function share(network: Network) {
    window.open(network.build(currentUrl(), title), "_blank", "noopener,noreferrer");
  }

  async function copy() {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(currentUrl());
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    timer.current = window.setTimeout(() => setStatus("idle"), 4000);
  }

  return (
    <aside
      aria-labelledby="partage-titre"
      className="rounded-[1rem] border border-b-4 border-site-border bg-white p-6 md:p-8"
    >
      <div className="flex flex-col gap-5">
        <div>
          <h2 id="partage-titre" className="site-display text-[1.375rem] leading-tight text-site-navy md:text-[1.5rem]">
            Cet article peut aider quelqu&apos;un ?
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-site-muted">
            Transmettez-le à un proche qui cherche un emploi, un stage ou qui recrute.
          </p>
        </div>

        <ul className="flex flex-wrap items-center gap-2" aria-label="Partager l'article">
          {NETWORKS.map((n) => (
            <li key={n.label}>
              <button
                type="button"
                onClick={() => share(n)}
                aria-label={`Partager sur ${n.label} (nouvelle fenêtre)`}
                title={`Partager sur ${n.label}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-site-border bg-white text-site-navy transition-colors duration-300 hover:border-site-navy hover:bg-site-navy hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                  {n.icon}
                </svg>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-site-border bg-white px-4 text-[0.9375rem] font-medium text-site-navy transition-colors duration-300 hover:border-site-navy hover:bg-site-navy hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {status === "copied" ? (
                  <path d="m4 12 5 5L20 6" />
                ) : (
                  <>
                    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
                    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
                  </>
                )}
              </svg>
              {status === "copied" ? "Lien copié" : "Copier le lien"}
            </button>
          </li>
        </ul>
      </div>
      <p role="status" className="sr-only">
        {status === "copied"
          ? "Le lien de l'article a été copié."
          : status === "failed"
            ? "La copie a échoué : copiez l'adresse depuis la barre du navigateur."
            : ""}
      </p>
      {status === "failed" ? (
        <p className="mt-4 text-[0.875rem] text-site-muted" aria-hidden>
          La copie automatique n&apos;est pas disponible : copiez l&apos;adresse depuis la barre du navigateur.
        </p>
      ) : null}
    </aside>
  );
}
