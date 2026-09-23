import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";

// Display latin (FR/EN). Même choix que /presentations, pour une cohérence
// visuelle entre les offres autonomes du site.
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
  title: { absolute: "Simulations physique-chimie interactives — lycée" },
  description:
    "Simulations HTML interactives sur mesure pour les cours de physique-chimie au lycée (programme marocain). Fichier autonome, sans installation, utilisable en classe.",
  // Indexable et présente dans le sitemap, mais jamais liée depuis la
  // navigation AcadPay : les deux positionnements restent séparés.
  robots: { index: true, follow: true },
};

export default function SimulationsLayout({ children }: { children: ReactNode }) {
  return <div className={`${display.variable} ${arabic.variable}`}>{children}</div>;
}
