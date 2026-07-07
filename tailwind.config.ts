import type { Config } from "tailwindcss";

/**
 * Design system — palette académique sobre.
 *
 * 6 couleurs nommées, pensées pour vendre la CONFIANCE, pas l'effet :
 *   - encre   : texte principal (navy profond, plus doux que le noir pur)
 *   - bleu    : bleu académique primaire (sérieux, désaturé, sans violet)
 *   - ocre    : accent chaud UNIQUE (évoque le sceau / cachet officiel)
 *   - papier  : fond chaud type papier de qualité
 *   - ardoise : texte secondaire, neutre chaud
 *   - brume   : bordures et séparateurs discrets
 *
 * `bleu` et `ocre` sont déclinés en nuances pour les fonds/tints ;
 * ce ne sont pas de nouvelles teintes, juste des variations de luminosité.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        encre: "#16202e",
        papier: "#faf8f3",
        ardoise: "#5b6675",
        brume: "#e7e2d8",

        // Bleu académique primaire (échelle)
        bleu: {
          50: "#eef3f7",
          100: "#dbe6ee",
          200: "#b9cddd",
          300: "#8dabc4",
          400: "#5a82a4",
          500: "#366088",
          600: "#275074",
          700: "#1d3d5c",
          800: "#172f47",
          900: "#10202f",
        },

        // Accent chaud unique (échelle)
        ocre: {
          50: "#fbf6f0",
          100: "#f2e2d1",
          200: "#e6c6a5",
          300: "#d5a273",
          400: "#c2814a",
          500: "#b0703c",
          600: "#955d31",
          700: "#774a28",
        },

        // Alias rétro-compatible : l'ancien `brand-*` pointe désormais
        // sur le bleu académique, pour ne pas casser le code existant.
        brand: {
          50: "#eef3f7",
          100: "#dbe6ee",
          200: "#b9cddd",
          300: "#8dabc4",
          400: "#5a82a4",
          500: "#366088",
          600: "#275074",
          700: "#1d3d5c",
          800: "#172f47",
          900: "#10202f",
        },
      },
      fontFamily: {
        // Corps & UI
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Titres — serif académique, précis et mémorable
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      maxWidth: {
        content: "1120px",
      },
      boxShadow: {
        // Ombres douces et réalistes, teintées encre (pas de gris pur)
        card: "0 1px 2px rgba(16,32,47,0.04), 0 10px 24px -14px rgba(16,32,47,0.14)",
        "card-hover":
          "0 2px 6px rgba(16,32,47,0.07), 0 22px 44px -20px rgba(16,32,47,0.24)",
      },
      keyframes: {
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
