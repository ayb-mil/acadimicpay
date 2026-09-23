import type { CSSProperties } from "react";

/**
 * Thème visuel partagé par toutes les simulations interactives (les vraies
 * pages-outils sous app/simulations/<sujet>/, pas la page vitrine /simulations).
 *
 * Choix volontairement calme et peu stimulant : couleurs douces et peu
 * saturées, contrastes mesurés (jamais noir/blanc pur), aucune lueur ni
 * clignotement, formes arrondies. Pensé pour rester confortable à l'usage
 * pour un jeune enfant, y compris autiste. Toute nouvelle simulation doit
 * réutiliser ces mêmes tokens plutôt que définir ses propres couleurs.
 */
export const SIM_COLORS = {
  page: "#E7EEF4",
  panel: "#FFFFFF",
  panelAlt: "#F3F7FA",
  border: "#D9E2EA",
  canvasBg: "#EFF4F1",
  grid: "#DEE7E1",
  ground: "#C3CFC7",
  textPrimary: "#3A3833",
  textMuted: "#857F72",
  accent: "#6EA89F",
  accentStrong: "#3F6F68",
  accentSoft: "#E4EFEC",
  vectorX: "#D9A488",
  vectorY: "#A79CC4",
  vectorResult: "#3F6F68",
} as const;

/** Variables CSS à poser sur le conteneur racine d'une simulation. */
export function simThemeVars(): CSSProperties {
  return {
    "--sim-page": SIM_COLORS.page,
    "--sim-panel": SIM_COLORS.panel,
    "--sim-panel-alt": SIM_COLORS.panelAlt,
    "--sim-border": SIM_COLORS.border,
    "--sim-text": SIM_COLORS.textPrimary,
    "--sim-text-muted": SIM_COLORS.textMuted,
    "--sim-accent": SIM_COLORS.accent,
    "--sim-accent-strong": SIM_COLORS.accentStrong,
    "--sim-accent-soft": SIM_COLORS.accentSoft,
  } as CSSProperties;
}

/** Classes Tailwind partagées (mêmes tokens, à réutiliser telles quelles). */
export const SIM_CLASSES = {
  card: "rounded-3xl border border-[var(--sim-border)] bg-[var(--sim-panel)]",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sim-accent-strong)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sim-accent-strong)]",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--sim-border)] bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--sim-text-muted)] transition hover:text-[var(--sim-text)] hover:border-[var(--sim-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sim-accent)]",
} as const;
