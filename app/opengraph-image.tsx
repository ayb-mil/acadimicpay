import { ImageResponse } from "next/og";

/**
 * Image de couverture Open Graph (1200×630) générée automatiquement.
 * Utilisée pour l'aperçu du lien sur WhatsApp / réseaux sociaux.
 * Sobre : fond papier, filet ocre, marque + accroche.
 *
 * Runtime `edge` : évite un bug de prerender de @vercel/og sous Windows et
 * fonctionne nativement sur Vercel. En contrepartie, pas d'accès `fs` ici —
 * la marque et l'accroche sont donc figées dans ce fichier (contenu stable ;
 * si le tagline de site.json change, mettre à jour la constante ci-dessous).
 */
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AcadPay — paiements académiques internationaux";

const SITE_NAME = "AcadPay";
const TAGLINE =
  "Un accompagnement fiable et transparent pour vos paiements académiques internationaux";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#faf8f3",
          padding: "80px 90px",
          position: "relative",
        }}
      >
        {/* Filet supérieur bleu → ocre. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: "linear-gradient(90deg, #275074 0%, #5a82a4 55%, #b0703c 100%)",
          }}
        />

        {/* Badge marque. */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "#1d3d5c",
              color: "#ffffff",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            AP
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#1d3d5c" }}>{SITE_NAME}</div>
        </div>

        {/* Accroche. */}
        <div
          style={{
            marginTop: 44,
            fontSize: 58,
            fontWeight: 600,
            lineHeight: 1.1,
            color: "#16202e",
            maxWidth: 960,
          }}
        >
          {TAGLINE}
        </div>

        {/* Sous-titre. */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            color: "#5b6675",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#b0703c" }} />
          Paiements académiques internationaux · acadpay.me
        </div>
      </div>
    ),
    { ...size }
  );
}
