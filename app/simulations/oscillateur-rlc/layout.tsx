import type { Metadata } from "next";
import type { ReactNode } from "react";

// La page est un composant client : son titre (onglet, Google, aperçu WhatsApp) est déclaré ici.
export const metadata: Metadata = {
  title: { absolute: "Oscillations libres dans un dipôle RLC — Simulation interactive" },
  description: "Simulation interactive « Oscillations libres dans un dipôle RLC » pour les cours de physique-chimie au lycée (2ème Bac, programme marocain). Fonctionne dans le navigateur, sans installation.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
