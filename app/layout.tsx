import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteContent } from "@/lib/content";

// Corps & interface : sans humaniste, très lisible.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Titres : serif « old-style », précis et académique.
// Poids limités volontairement pour rester sobre (pas d'effet éditorial mode).
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const site = getSiteContent();

// Domaine de production canonique (www). Override possible via env pour les
// previews Vercel. L'apex acadpay.me redirige vers www côté Vercel.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.acadpay.me";
const TITLE = `${site.siteName} — ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s — ${site.siteName}`,
  },
  description: site.shortPitch,
  applicationName: site.siteName,
  keywords: [
    "paiement APC",
    "frais de publication",
    "revue prédatrice",
    "IEEE ACM abonnement",
    "TOEFL IELTS paiement",
    "dotation e-commerce Maroc",
    "chercheur doctorant",
  ],
  authors: [{ name: site.founder.name }],
  alternates: { canonical: "/" },
  // Open Graph : bon rendu du lien partagé sur WhatsApp / réseaux sociaux.
  // L'image est générée automatiquement par app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: site.siteName,
    title: TITLE,
    description: site.shortPitch,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: site.shortPitch,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col bg-papier font-sans text-encre antialiased">
        {/*
          Layout racine volontairement minimal : le header/footer AcadPay vivent
          dans app/(site)/layout.tsx, ce qui permet aux offres autonomes
          (ex. /presentations) d'avoir leur propre identité visuelle.
        */}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
