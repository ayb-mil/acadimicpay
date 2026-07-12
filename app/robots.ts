import type { MetadataRoute } from "next";

// Même domaine de référence que le sitemap (URL canonique www).
const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.acadpay.me").replace(/\/$/, "");

/**
 * robots.txt généré automatiquement (accessible sur /robots.txt).
 * Autorise toute l'exploration sauf l'API interne, et pointe vers le sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
