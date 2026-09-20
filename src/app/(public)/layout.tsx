/**
 * Gabarit du site public.
 *
 * Polices du modèle de référence : Inter pour le texte, Instrument Sans pour
 * les titres. `next/font` les télécharge au moment du build et les sert
 * depuis le site : aucun appel à Google Fonts depuis le navigateur.
 *
 * Le gabarit pose aussi l'assistant SIRA en bulle, commun à toutes les pages
 * du site public.
 */

import { Inter, Instrument_Sans } from "next/font/google";
import { SiraChat } from "@/components/site/chat/sira-chat";
import { SiteFooter } from "@/components/site/footer";
import { SiteNavbar } from "@/components/site/navbar";
import { buildChatData } from "@/data/site-chat";

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
      {/* L'assistant rend ce bloc inerte quand il occupe l'écran d'un
          téléphone : le contenu derrière sort alors du parcours au clavier. */}
      <div id="site-contenu">
        <SiteNavbar />
        <main id="contenu" className="pt-[5.75rem] md:pt-[6.25rem]">
          {children}
        </main>
        <SiteFooter />
      </div>
      {/* Assistant en bulle, présent sur toutes les pages du site. Les données
          sont réduites côté serveur : le navigateur ne reçoit que le
          nécessaire. */}
      <SiraChat data={buildChatData()} />
    </div>
  );
}
