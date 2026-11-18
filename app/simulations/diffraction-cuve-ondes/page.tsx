"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import { Notes, PlayButton, SimCanvas, SimShell, Slider, SIM_FONT, fmt, prepareCanvas, useSimClock } from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Diffraction d'une onde plane à la surface de l'eau (cuve à ondes, vue de
   dessus). À gauche : onde plane cos(k·x − ω·t). Après la fente de largeur a,
   principe de Huygens : chaque point de la fente est une source secondaire.
   Champ 2D (approximation de champ lointain de la fonction de Green) :
     u(M) = Σ Δy·√(k/(2πr))·e^{i(kr − π/4)}
   ce qui redonne l'onde plane pour une fente très large. La phase et
   l'amplitude complexes sont précalculées sur une grille ; l'animation ne
   fait que tourner la phase (e^{−iωt}). Longueur d'onde et fréquence sont
   les mêmes avant et après la fente.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 460;
const PX_CM = 40;
const XB = 280;
const CELL = 4;
const GW = Math.ceil(W / CELL);
const GH = Math.ceil(H / CELL);

function color(v: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (v + 1) / 2));
  return [Math.round(6 + t * 110), Math.round(14 + t * 220), Math.round(30 + t * 205)];
}

export default function DiffractionCuvePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<HTMLCanvasElement | null>(null);
  const [lambdaCm, setLambdaCm] = useState(1.5);
  const [aCm, setACm] = useState(1);
  const [running, setRunning] = useState(true);
  const [t] = useSimClock(running, 1);

  const k = (2 * Math.PI) / (lambdaCm * PX_CM);
  const aPx = aCm * PX_CM;

  // Amplitude et phase complexes de chaque cellule à droite de la fente.
  const field = useMemo(() => {
    const re = new Float32Array(GW * GH);
    const im = new Float32Array(GW * GH);
    const n = Math.max(12, Math.min(90, Math.round((aPx / (lambdaCm * PX_CM)) * 10)));
    const dy = aPx / n;
    const cy = H / 2;
    let maxAmp = 0;
    for (let j = 0; j < GH; j++) {
      for (let i = 0; i < GW; i++) {
        const x = i * CELL + CELL / 2;
        if (x <= XB) continue;
        const y = j * CELL + CELL / 2;
        let sr = 0;
        let si = 0;
        for (let s = 0; s < n; s++) {
          const ys = cy - aPx / 2 + (s + 0.5) * dy;
          const r = Math.max(CELL, Math.hypot(x - XB, y - ys));
          const amp = dy * Math.sqrt(k / (2 * Math.PI * r));
          const ph = k * r - Math.PI / 4;
          sr += amp * Math.cos(ph);
          si += amp * Math.sin(ph);
        }
        re[j * GW + i] = sr;
        im[j * GW + i] = si;
        const m = Math.hypot(sr, si);
        if (x > XB + 2 * lambdaCm * PX_CM && m > maxAmp) maxAmp = m;
      }
    }
    // Gain d'affichage : l'onde diffractée par une fente étroite est faible, on la rend visible.
    const gain = 1 / Math.max(0.15, Math.min(1, maxAmp));
    return { re, im, gain };
  }, [aPx, k, lambdaCm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    if (!bufRef.current) {
      bufRef.current = document.createElement("canvas");
      bufRef.current.width = GW;
      bufRef.current.height = GH;
    }
    const buf = bufRef.current;
    const bctx = buf.getContext("2d")!;
    const img = bctx.createImageData(GW, GH);
    const wt = 2 * Math.PI * 0.8 * t;
    const c = Math.cos(wt);
    const s = Math.sin(wt);
    for (let j = 0; j < GH; j++) {
      for (let i = 0; i < GW; i++) {
        const x = i * CELL + CELL / 2;
        let v: number;
        if (x <= XB) v = Math.cos(k * (x - XB) - wt);
        else {
          const idx = j * GW + i;
          // Re[(re + i·im)·e^{−iωt}] = re·cos ωt + im·sin ωt
          v = (field.re[idx] * c + field.im[idx] * s) * field.gain;
        }
        const [r, g, b] = color(v);
        const p = (j * GW + i) * 4;
        img.data[p] = r;
        img.data[p + 1] = g;
        img.data[p + 2] = b;
        img.data[p + 3] = 255;
      }
    }
    bctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buf, 0, 0, GW * CELL, GH * CELL);

    // Paroi avec la fente.
    const gapTop = H / 2 - aPx / 2;
    const gapBot = H / 2 + aPx / 2;
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.fillRect(XB - 5, 0, 10, Math.max(0, gapTop));
    ctx.fillRect(XB - 5, gapBot, 10, H - gapBot);
    ctx.strokeRect(XB - 5, -1, 10, Math.max(0, gapTop) + 1);
    ctx.strokeRect(XB - 5, gapBot, 10, H - gapBot + 1);

    // Repères λ avant et après la fente.
    const lpx = lambdaCm * PX_CM;
    const mark = (x0: number, y: number) => {
      ctx.strokeStyle = SIM_COLORS.vectorX;
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + lpx, y);
      ctx.moveTo(x0, y - 7);
      ctx.lineTo(x0, y + 7);
      ctx.moveTo(x0 + lpx, y - 7);
      ctx.lineTo(x0 + lpx, y + 7);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.font = "italic 600 15px ui-serif, Georgia, serif";
      ctx.fillText("λ", x0 + lpx / 2 - 4, y - 10);
    };
    mark(XB - 40 - lpx, H - 40);
    mark(XB + 60, H / 2 + Math.max(60, aPx / 2 + 40));

    // Cote a.
    ctx.strokeStyle = SIM_COLORS.vectorResult;
    ctx.fillStyle = SIM_COLORS.vectorResult;
    ctx.beginPath();
    ctx.moveTo(XB - 22, gapTop);
    ctx.lineTo(XB - 22, gapBot);
    ctx.stroke();
    ctx.font = "italic 600 15px ui-serif, Georgia, serif";
    ctx.fillText("a", XB - 40, H / 2 + 5);

    ctx.fillStyle = "rgba(5, 8, 15, 0.7)";
    ctx.fillRect(16, 14, 430, 58);
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    ctx.fillText(aCm > lambdaCm ? "a > λ : onde diaphragmée" : "a ≤ λ : onde diffractée", 28, 40);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(`a = ${fmt(aCm, 1)} cm · λ = ${fmt(lambdaCm, 1)} cm · a/λ = ${fmt(aCm / lambdaCm, 2)}`, 28, 62);
  });

  return (
    <SimShell
      title="Diffraction dans une cuve à ondes"
      intro="Une onde plane arrive sur une fente de largeur a. Si a > λ, l'onde traverse en gardant sa forme : elle est diaphragmée. Si a ≤ λ, elle devient circulaire : elle est diffractée, en gardant la même fréquence, la même longueur d'onde et la même célérité."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={<PlayButton running={running} onToggle={() => setRunning((r) => !r)} />}
      readouts={[
        { label: "Largeur de la fente a", value: `${fmt(aCm, 1)} cm` },
        { label: "Longueur d'onde λ", value: `${fmt(lambdaCm, 1)} cm` },
        { label: "Rapport a/λ", value: fmt(aCm / lambdaCm, 2) },
        { label: "Phénomène", value: aCm > lambdaCm ? "onde diaphragmée" : "diffraction" },
      ]}
      side={
        <>
          <Slider label="Largeur de la fente a" value={aCm} unit="cm" min={0.3} max={8} step={0.1} digits={1} onChange={setACm} />
          <Slider label="Longueur d'onde λ" value={lambdaCm} unit="cm" min={0.6} max={3} step={0.1} digits={1} onChange={setLambdaCm} />
          <Notes>
            <p>a &gt; λ : seule une partie de l&apos;onde passe, sans changer de forme (onde diaphragmée).</p>
            <p>a ≤ λ : l&apos;onde devient circulaire, centrée sur la fente (onde diffractée).</p>
            <p>Comparez les deux repères λ : la longueur d&apos;onde est la même avant et après la fente. La diffraction est d&apos;autant plus marquée que a est petit devant λ.</p>
          </Notes>
        </>
      }
      footnote="Calcul par le principe de Huygens : chaque point de la fente émet une onde circulaire, et l'onde observée est leur somme. Pour une fente étroite, l'onde diffractée est faible : son contraste est renforcé à l'affichage."
    />
  );
}
