import * as THREE from "three";

/** Les 7 vraies réalisations, réutilisées comme textures dans les scènes 3D. */
export const PORTFOLIO_TEXTURES = [
  "/portfolio/01.jpg",
  "/portfolio/02.jpg",
  "/portfolio/03.jpg",
  "/portfolio/04.jpg",
  "/portfolio/05.jpg",
  "/portfolio/06.jpg",
  "/portfolio/07.jpg",
];

export const PALETTE = {
  navy: "#0A1B3D",
  navyDeep: "#060E21",
  teal: "#2DD4CF",
  violet: "#8B7CF6",
  white: "#FFFFFF",
};

/**
 * Recadre une texture en mode « cover » pour un plan d'un ratio donné,
 * sans la déformer (équivalent 3D de `object-fit: cover`).
 */
export function coverTexture(source: THREE.Texture, planeAspect: number) {
  const tex = source.clone();
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = tex.image as { width: number; height: number } | undefined;
  if (!img?.width || !img?.height) return tex;
  const imageAspect = img.width / img.height;
  if (imageAspect > planeAspect) {
    const repeatX = planeAspect / imageAspect;
    tex.repeat.set(repeatX, 1);
    tex.offset.set((1 - repeatX) / 2, 0);
  } else {
    const repeatY = imageAspect / planeAspect;
    tex.repeat.set(1, repeatY);
    tex.offset.set(0, (1 - repeatY) / 2);
  }
  return tex;
}

/** Ratio natif d'une texture (largeur / hauteur), avec repli 16:9. */
export function textureAspect(tex: THREE.Texture) {
  const img = tex.image as { width: number; height: number } | undefined;
  return img?.width && img?.height ? img.width / img.height : 16 / 9;
}

/** Vrai si l'utilisateur a demandé moins d'animations au niveau du système. */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
