import type { Metadata } from "next";
import type { ReactNode } from "react";

// La page est un composant client : son titre (onglet, Google, aperçu WhatsApp) est déclaré ici.
export const metadata: Metadata = {
  title: { absolute: "Mouvement d'un projectile — Simulation interactive" },
  description: "Simulation interactive « Mouvement d'un projectile » pour les cours de physique-chimie au lycée (2ème Bac, programme marocain). Fonctionne dans le navigateur, sans installation.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
