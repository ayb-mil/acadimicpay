"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** Halo radial blanc (teinté ensuite par la couleur du matériau). */
export function useGlowTexture() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.5)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* Courbe lumineuse : un trait fin net + un halo de points additifs, les deux
   partageant le même buffer de positions (mis à jour en place, sans allocation). */
export function useGlowCurve(color: string, glowTex: THREE.Texture, points: number, glowSize = 0.34) {
  const curve = useMemo(() => {
    const attr = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", attr);
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, toneMapped: false })
    );
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute("position", attr);
    const glow = new THREE.Points(
      glowGeo,
      new THREE.PointsMaterial({
        color,
        size: glowSize,
        map: glowTex,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    );
    line.frustumCulled = false;
    glow.frustumCulled = false;
    return { attr, line, glow };
  }, [color, glowTex, points, glowSize]);

  useEffect(
    () => () => {
      curve.line.geometry.dispose();
      (curve.line.material as THREE.Material).dispose();
      curve.glow.geometry.dispose();
      (curve.glow.material as THREE.Material).dispose();
    },
    [curve]
  );
  return curve;
}
