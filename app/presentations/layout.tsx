import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";

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
  // Offre distincte : on ne la référence pas dans le sitemap AcadPay.
  robots: { index: true, follow: true },
};

export default function PresentationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${display.variable} ${arabic.variable}`}>{children}</div>
  );
}
