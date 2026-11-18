/* ══════════════════════════════════════════════════════════════════════════
   Programme 2ème Bac Sciences Physiques (BIOF), découpé comme le cours :
   chaque partie pointe vers la simulation qui la couvre (ou n'en a pas
   encore). Les pages de leçon et la section « Programme » de la vitrine
   sont générées à partir de ces données : ajouter une simulation = remplir
   le champ `sim` de la partie concernée.
   ══════════════════════════════════════════════════════════════════════════ */

/** Numéro WhatsApp au format international sans « + » (= +212 6 09 64 88 11). */
export const WHATSAPP = "212609648811";

export type ProgPart = {
  title: string;
  detail?: string;
  formulas?: string[];
  sim?: { href: string; label: string };
};

export type ProgLesson = {
  slug: string;
  num: number;
  title: string;
  summary: string;
  parts: ProgPart[];
};

export type ProgUnit = { slug: string; title: string; lessons: ProgLesson[] };

const SIM = {
  cordeRessort: "Onde transversale et onde longitudinale",
  dimensions: "Dimension d'une onde : 1D, 2D, 3D",
  superposition: "Superposition et réflexion",
  celerite: "Célérité d'une onde et retard temporel",
  em: "Onde électromagnétique",
  sinus: "Onde progressive sinusoïdale",
  ultrasons: "Ultrasons et oscilloscope",
  cuve: "Diffraction dans une cuve à ondes",
  strobo: "Étude stroboscopique",
};

export const PROGRAMME: ProgUnit[] = [
  {
    slug: "ondes",
    title: "Les ondes",
    lessons: [
      {
        slug: "ondes-mecaniques-progressives",
        num: 1,
        title: "Ondes mécaniques progressives",
        summary:
          "Définition d'une onde mécanique, ondes transversales et longitudinales, dimension, superposition, réflexion, célérité et retard temporel.",
        parts: [
          {
            title: "Définition d'une onde mécanique",
            detail:
              "Propagation d'une perturbation dans un milieu matériel élastique, sans transport de matière mais avec transport d'énergie.",
            sim: { href: "/simulations/onde-corde-ressort", label: SIM.cordeRessort },
          },
          {
            title: "Onde transversale",
            detail: "Le déplacement u est perpendiculaire à la direction de propagation (corde, surface de l'eau).",
            formulas: ["u ⊥ v"],
            sim: { href: "/simulations/onde-corde-ressort?mode=corde", label: SIM.cordeRessort },
          },
          {
            title: "Onde longitudinale",
            detail: "Le déplacement u est parallèle à la direction de propagation (ressort, son).",
            formulas: ["u ∥ v"],
            sim: { href: "/simulations/onde-corde-ressort?mode=ressort", label: SIM.cordeRessort },
          },
          {
            title: "Dimension d'une onde",
            detail: "Une dimension (corde), deux dimensions (surface de l'eau), trois dimensions (son).",
            sim: { href: "/simulations/dimensions-onde", label: SIM.dimensions },
          },
          {
            title: "Superposition de deux ondes",
            detail: "Les élongations s'ajoutent algébriquement, puis les ondes s'éloignent sans être altérées.",
            formulas: ["y = y₁ + y₂"],
            sim: { href: "/simulations/superposition-reflexion?mode=superposition", label: SIM.superposition },
          },
          {
            title: "Réflexion",
            detail: "Arrivée à l'extrémité du milieu, l'onde se propage en sens inverse.",
            sim: { href: "/simulations/superposition-reflexion?mode=reflexion", label: SIM.superposition },
          },
          {
            title: "Célérité d'une onde",
            detail: "Elle ne dépend que du milieu (densité, température…), jamais de l'amplitude ni de la durée.",
            formulas: ["v = d / Δt"],
            sim: { href: "/simulations/celerite-retard", label: SIM.celerite },
          },
          {
            title: "Célérité le long d'une corde",
            formulas: ["v = √(F / μ)", "μ = m / ℓ"],
            sim: { href: "/simulations/celerite-retard", label: SIM.celerite },
          },
          {
            title: "Retard temporel",
            detail: "M' reproduit le mouvement de M avec un retard τ.",
            formulas: ["τ = MM' / v", "y_M'(t) = y_M(t − τ)"],
            sim: { href: "/simulations/celerite-retard", label: SIM.celerite },
          },
        ],
      },
      {
        slug: "ondes-mecaniques-progressives-periodiques",
        num: 2,
        title: "Ondes mécaniques progressives périodiques",
        summary:
          "Périodicités temporelle et spatiale, onde sinusoïdale, points en phase et en opposition de phase, oscilloscope, diffraction, stroboscope, milieu dispersif.",
        parts: [
          {
            title: "Onde progressive périodique",
            detail: "Périodicité temporelle (période T) et périodicité spatiale (longueur d'onde λ).",
            sim: { href: "/simulations/onde-sinusoidale", label: SIM.sinus },
          },
          {
            title: "Onde sinusoïdale : longueur d'onde et période",
            formulas: ["v = λ / T = λ·f", "d / λ = Δt / T = k"],
            sim: { href: "/simulations/onde-sinusoidale", label: SIM.sinus },
          },
          {
            title: "Points vibrant en phase ou en opposition de phase",
            formulas: ["en phase : d = k·λ", "opposition de phase : d = (2k + 1)·λ/2"],
            sim: { href: "/simulations/onde-sinusoidale", label: SIM.sinus },
          },
          {
            title: "Mesure du retard à l'oscilloscope (ultrasons)",
            formulas: ["τ = balayage × nombre de divisions"],
            sim: { href: "/simulations/ultrasons-oscilloscope", label: SIM.ultrasons },
          },
          {
            title: "Diffraction d'une onde mécanique",
            detail:
              "a > λ : onde diaphragmée ; a ≤ λ : onde diffractée, de même fréquence, même longueur d'onde et même célérité.",
            sim: { href: "/simulations/diffraction-cuve-ondes", label: SIM.cuve },
          },
          {
            title: "Étude stroboscopique",
            formulas: ["immobilité apparente : f = k·fₑ", "ralenti apparent : fₐ = f − fₑ"],
            sim: { href: "/simulations/stroboscope", label: SIM.strobo },
          },
          {
            title: "Milieu dispersif",
            detail:
              "La célérité dépend de la fréquence (surface de l'eau) ; l'air n'est pas dispersif pour les ondes sonores.",
            sim: { href: "/simulations/onde-sinusoidale?mode=eau", label: SIM.sinus },
          },
        ],
      },
      {
        slug: "propagation-ondes-lumineuses",
        num: 3,
        title: "Propagation des ondes lumineuses",
        summary:
          "Diffraction de la lumière, caractéristiques d'une onde lumineuse, écart angulaire, dispersion par un prisme.",
        parts: [
          {
            title: "Diffraction de la lumière",
            detail: "Un faisceau laser traversant une fente fine ou contournant un fil s'étale sur l'écran.",
          },
          {
            title: "La lumière est une onde",
            detail: "Onde électromagnétique : elle se propage dans le vide et dans les milieux transparents.",
            sim: { href: "/simulations/onde-electromagnetique", label: SIM.em },
          },
          {
            title: "Lumière monochromatique et polychromatique",
            detail: "Une radiation unique (laser) ou un mélange de radiations (lumière blanche).",
          },
          {
            title: "Célérité de la lumière",
            formulas: ["c = 3,00·10⁸ m/s (vide, air)"],
            sim: { href: "/simulations/onde-electromagnetique", label: SIM.em },
          },
          {
            title: "Indice de réfraction",
            formulas: ["n = c / v"],
            sim: { href: "/simulations/onde-electromagnetique", label: SIM.em },
          },
          {
            title: "Fréquence et longueur d'onde",
            formulas: ["λ₀ = c·T = c / ν", "λ = λ₀ / n"],
            sim: { href: "/simulations/onde-electromagnetique", label: SIM.em },
          },
          {
            title: "Domaine des radiations lumineuses",
            formulas: ["visible : 400 nm < λ₀ < 800 nm", "UV : λ₀ < 400 nm · IR : λ₀ > 800 nm"],
          },
          {
            title: "Diffraction d'une lumière monochromatique",
            detail: "Laser, fente de largeur a ou fil, écran à la distance D : tache centrale de largeur L.",
          },
          {
            title: "Écart angulaire",
            formulas: ["θ = λ / a", "L = 2·λ·D / a"],
          },
          {
            title: "Relations du prisme",
            formulas: ["sin i = n·sin r", "n·sin r' = sin i'", "A = r + r'", "D = i + i' − A"],
          },
          {
            title: "Dispersion de la lumière par un prisme",
            detail: "La lumière blanche est décomposée en un spectre continu.",
          },
          {
            title: "Interprétation de la dispersion",
            detail: "L'indice du verre dépend de la longueur d'onde : le verre est un milieu dispersif.",
            formulas: ["n = a + b / λ₀²"],
            sim: { href: "/simulations/onde-electromagnetique", label: SIM.em },
          },
        ],
      },
    ],
  },
];

export function coverage(lesson: ProgLesson) {
  const covered = lesson.parts.filter((p) => p.sim).length;
  return { covered, total: lesson.parts.length };
}

export function findLesson(slug: string) {
  for (const unit of PROGRAMME) {
    const i = unit.lessons.findIndex((l) => l.slug === slug);
    if (i >= 0) return { unit, lesson: unit.lessons[i], prev: unit.lessons[i - 1], next: unit.lessons[i + 1] };
  }
  return null;
}

export function waRequest(lesson: ProgLesson, part?: ProgPart) {
  const msg = part
    ? `Bonjour, je suis enseignant(e) de physique-chimie. Je souhaite une simulation pour la leçon « ${lesson.title} », partie « ${part.title} ».`
    : `Bonjour, je suis enseignant(e) de physique-chimie. Je souhaite une simulation pour la leçon « ${lesson.title} ».`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}
