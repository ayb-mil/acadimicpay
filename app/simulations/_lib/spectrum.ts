/* Couleurs des radiations lumineuses. Domaines comme dans le cours :
   visible 400 nm < λ₀ < 800 nm, ultraviolet en dessous, infrarouge au-dessus. */

export const VISIBLE_MIN = 400;
export const VISIBLE_MAX = 800;

/** Couleur approximative d'une radiation visible (approximation classique de Bruton). Noir hors du visible. */
export function wavelengthToRgb(nm: number): [number, number, number] {
  if (nm < VISIBLE_MIN || nm > VISIBLE_MAX) return [0, 0, 0];
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) {
    r = -(nm - 440) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = -(nm - 510) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / 65;
  } else {
    r = 1;
  }
  // Atténuation vers les bords du visible, où l'œil est peu sensible.
  const f = nm < 420 ? 0.35 + (0.65 * (nm - 400)) / 20 : nm > 700 ? 0.35 + (0.65 * (800 - nm)) / 100 : 1;
  const c = (v: number) => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8));
  return [c(r), c(g), c(b)];
}

export function rgbCss([r, g, b]: [number, number, number], alpha = 1) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function radiationName(nm: number) {
  if (nm < VISIBLE_MIN) return "ultraviolet (invisible)";
  if (nm > VISIBLE_MAX) return "infrarouge (invisible)";
  if (nm < 450) return "violet";
  if (nm < 495) return "bleu";
  if (nm < 570) return "vert";
  if (nm < 590) return "jaune";
  if (nm < 620) return "orange";
  return "rouge";
}

/** Dégradé CSS du spectre entre min et max (nm) ; UV et IR en gris rayé. */
export function spectrumGradient(min: number, max: number) {
  const pos = (nm: number) => ((nm - min) / (max - min)) * 100;
  const stops: string[] = [];
  if (min < VISIBLE_MIN) stops.push(`#2a2340 0%`, `#2a2340 ${pos(VISIBLE_MIN)}%`);
  for (let nm = Math.max(min, VISIBLE_MIN); nm <= Math.min(max, VISIBLE_MAX); nm += 20) {
    stops.push(`${rgbCss(wavelengthToRgb(nm))} ${pos(nm)}%`);
  }
  if (max > VISIBLE_MAX) stops.push(`#33201e ${pos(VISIBLE_MAX)}%`, `#33201e 100%`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** Indice d'un verre suivant la loi de Cauchy n = a + b/λ₀² (λ₀ en µm). */
export function cauchy(a: number, b: number, nm: number) {
  const um = nm / 1000;
  return a + b / (um * um);
}
