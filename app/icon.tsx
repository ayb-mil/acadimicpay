import { ImageResponse } from "next/og";

// Favicon généré : initiales « AP » sur fond bleu académique, point ocre.
// Runtime `edge` : évite un bug de prerender de @vercel/og sous Windows.
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d3d5c",
          color: "#ffffff",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: -1,
          borderRadius: 6,
          position: "relative",
        }}
      >
        AP
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 5,
            height: 5,
            borderRadius: 999,
            background: "#b0703c",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
