import type { Metadata, Viewport } from "next";
import { themeInitScript } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SIRA — Le chemin vers l'opportunité",
    template: "%s · SIRA",
  },
  description:
    "SIRA rapproche les talents et les recruteurs partout en Afrique : offres d'emploi et de stage, score de compatibilité expliqué, préparation de candidature assistée et formations pour combler vos lacunes.",
  applicationName: "SIRA",
  keywords: ["emploi", "stage", "Afrique", "recrutement", "formation", "talents"],
  openGraph: {
    title: "SIRA — Le chemin vers l'opportunité",
    description:
      "Plateforme de mise en relation entre talents, opportunités et recruteurs en Afrique.",
    locale: "fr_BF",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Évite le flash de thème au premier rendu */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-[var(--color-primary-fg)]"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
