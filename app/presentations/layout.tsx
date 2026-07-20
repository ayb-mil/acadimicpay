import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

// Identifiant du projet Microsoft Clarity, propre à cette page (analyse
// scoping à /presentations uniquement, pas au reste d'AcadPay).
const CLARITY_PROJECT_ID = "xpdx5cy4pl";

// Display latin (FR/EN). Sans chaleureux, lisible sur mobile.
const display = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-display",
});

// Face arabe dédiée : évite tout repli sur une serif système en mode RTL.
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  // `absolute` : neutralise le template « %s — AcadPay » du layout racine,
  // pour que cette offre reste visuellement et éditorialement autonome.
  title: { absolute: "Présentations soignées — .pptx et PDF" },
  description:
    "Mise en forme et rédaction de présentations pour soutenances, exposés et supports de cours. Livrées en .pptx et PDF, en arabe, français ou anglais.",
  // Indexable et présente dans le sitemap, mais jamais liée depuis la
  // navigation AcadPay : les deux positionnements restent séparés.
  robots: { index: true, follow: true },
};

export default function PresentationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${display.variable} ${arabic.variable}`}>
      {children}

      {/*
        Microsoft Clarity — chargé après hydratation (afterInteractive) pour
        ne pas retarder le rendu initial. Scopé à /presentations : ce script
        vit dans ce layout, pas dans le layout racine d'AcadPay.
      */}
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `}
      </Script>
    </div>
  );
}
