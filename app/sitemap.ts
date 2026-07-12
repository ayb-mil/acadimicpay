import type { MetadataRoute } from "next";
import { getServices } from "@/lib/content";

// Domaine de référence = URL canonique (www). Aligné sur NEXT_PUBLIC_SITE_URL
// pour rester cohérent avec les balises canonical/OG. L'apex acadpay.me
// redirige (308) vers www ; le sitemap ne liste donc que des URL finales.
const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.acadpay.me").replace(/\/$/, "");

/**
 * Sitemap généré automatiquement (accessible sur /sitemap.xml).
 * Les pages de service sont dérivées du contenu (getServices) pour rester
 * synchronisées : ajouter un service dans services.json l'ajoute au sitemap.
 * La page /temoignages a été retirée du site : elle n'y figure pas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Priorités indicatives : accueil > pages de conversion > pages secondaires.
  const staticEntries: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/services", priority: 0.9 },
    { path: "/comment-ca-marche", priority: 0.8 },
    { path: "/tarifs", priority: 0.8 },
    { path: "/confiance", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/verification/comment-reconnaitre-une-revue-predatrice", priority: 0.7 },
    { path: "/faq", priority: 0.6 },
    { path: "/mentions-legales", priority: 0.3 },
  ];

  const serviceEntries = getServices().map((service) => ({
    path: `/services/${service.slug}`,
    priority: 0.7,
  }));

  return [...staticEntries, ...serviceEntries].map(({ path, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
