/**
 * Gabarit du site public.
 *
 * Polices du modèle de référence : Inter pour le texte, Instrument Sans pour
 * les titres. `next/font` les télécharge au moment du build et les sert
 * depuis le site : aucun appel à Google Fonts depuis le navigateur.
 */

import { Inter, Instrument_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site/footer";
import { SiteNavbar } from "@/components/site/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${instrument.variable} site-root min-h-screen`}>
      <SiteNavbar />
      <main id="contenu" className="pt-[5.75rem] md:pt-[6.25rem]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
