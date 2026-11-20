import type { Metadata } from "next";
import type { ReactNode } from "react";

// La page est un composant client : son titre (onglet, Google, aperçu WhatsApp) est déclaré ici.
export const metadata: Metadata = {
  title: { absolute: "Charge et décharge d'un condensateur — Simulation interactive" },
  description: "Simulation interactive « Charge et décharge d'un condensateur » pour les cours de physique-chimie au lycée (2ème Bac, programme marocain). Fonctionne dans le navigateur, sans installation.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
