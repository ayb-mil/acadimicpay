import type { CSSProperties } from "react";

/**
 * Thème visuel partagé par toutes les simulations interactives (les vraies
 * pages-outils sous app/simulations/<sujet>/) et par la vitrine /simulations.
 *
 * Direction « Cinematic Physics » : fond nuit profond, accents néon
 * turquoise / violet / vert scientifique, traits lumineux. Toute nouvelle
 * simulation doit réutiliser ces mêmes tokens plutôt que définir ses propres
 * couleurs. Texte posé sur un accent néon : toujours `onAccent` (sombre),
 * jamais du blanc, pour garder le contraste.
 */
export const SIM_COLORS = {
  page: "#05080F",
  panel: "#0E1830",
  panelAlt: "#0A1226",
  border: "#1C2A4A",
  canvasBg: "#081124",
  grid: "#16223D",
  ground: "#4A6194",
  textPrimary: "#E8EEFA",
  textMuted: "#8C9CC0",
  accent: "#22E4D9",
  accentStrong: "#22E4D9",
  accentSoft: "#0F2E3A",
  onAccent: "#04121A",
  vectorX: "#FFB547",
  vectorY: "#9B7BFF",
  vectorResult: "#4ADE80",
} as const;

/** "#RRGGBB" → [r, g, b], pour les interpolations de couleur sur canvas. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Variables CSS à poser sur le conteneur racine d'une simulation. */
export function simThemeVars(): CSSProperties {
  return {
    colorScheme: "dark",
    "--sim-page": SIM_COLORS.page,
    "--sim-panel": SIM_COLORS.panel,
    "--sim-panel-alt": SIM_COLORS.panelAlt,
    "--sim-border": SIM_COLORS.border,
    "--sim-text": SIM_COLORS.textPrimary,
    "--sim-text-muted": SIM_COLORS.textMuted,
    "--sim-accent": SIM_COLORS.accent,
    "--sim-accent-strong": SIM_COLORS.accentStrong,
    "--sim-accent-soft": SIM_COLORS.accentSoft,
    "--sim-on-accent": SIM_COLORS.onAccent,
  } as CSSProperties;
}

/** Classes Tailwind partagées (mêmes tokens, à réutiliser telles quelles). */
export const SIM_CLASSES = {
  card: "min-w-0 rounded-3xl border border-[var(--sim-border)] bg-[var(--sim-panel)] shadow-[0_0_0_1px_rgba(34,228,217,0.03),0_20px_60px_-30px_rgba(34,228,217,0.25)]",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sim-accent-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--sim-on-accent)] shadow-[0_0_24px_-6px_rgba(34,228,217,0.7)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sim-accent-strong)]",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--sim-border)] bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--sim-text-muted)] transition hover:text-[var(--sim-text)] hover:border-[var(--sim-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sim-accent)]",
} as const;
