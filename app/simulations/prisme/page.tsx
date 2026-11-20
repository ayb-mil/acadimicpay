"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import { Notes, Segmented, SimCanvas, SimShell, Slider, SIM_FONT, fmt, prepareCanvas, useModeParam } from "../_lib/sim";
import { cauchy, radiationName, rgbCss, wavelengthToRgb } from "../_lib/spectrum";

/* ══════════════════════════════════════════════════════════════════════════
   Prisme d'angle A, dans l'air. Relations du prisme :
     sin i = n·sin r ;  n·sin r' = sin i' ;  A = r + r' ;  D = i + i' − A.
   Le tracé géométrique utilise la loi de Snell-Descartes sous forme
   vectorielle à chaque face (mêmes résultats). Si n·sin r' > 1, il n'y a pas
   de rayon émergent : réflexion totale sur la deuxième face.
   Dispersion : l'indice suit la loi de Cauchy n = a + b/λ₀² ; en lumière
   blanche, chaque radiation est déviée différemment (le violet plus que le
   rouge), d'où le spectre sur l'écran.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 560;
const APEX = { x: 400, y: 90 };
const HEIGHT = 330;
const S0 = 0.55;
const SCREEN_X = 880;

type Mode = "mono" | "blanche";
type Glass = "crown" | "flint";
const MODES = ["mono", "blanche"] as const;
const GLASS: Record<Glass, { label: string; a: number; b: number }> = {
  crown: { label: "Verre crown", a: 1.5046, b: 0.0042 },
  flint: { label: "Verre flint", a: 1.585, b: 0.0122 },
};
const WHITE = Array.from({ length: 39 }, (_, i) => 400 + i * 10);

type V = { x: number; y: number };
const add = (a: V, b: V, k = 1): V => ({ x: a.x + k * b.x, y: a.y + k * b.y });
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;

/** Réfraction de la direction u sur une surface de normale N (côté incident), rapport η = n₁/n₂. */
function refract(u: V, N: V, eta: number): V | null {
  const cosi = -dot(N, u);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  return add({ x: eta * u.x, y: eta * u.y }, N, eta * cosi - Math.sqrt(k));
}

/** Intersection de la demi-droite P + t·u avec le segment A + s·d (s ∈ [0, len]). */
function hit(P: V, u: V, A: V, d: V, len: number) {
  const det = u.x * -d.y - u.y * -d.x;
  if (Math.abs(det) < 1e-9) return null;
  const rx = A.x - P.x;
  const ry = A.y - P.y;
  const t = (rx * -d.y - ry * -d.x) / det;
  const s = (u.x * ry - u.y * rx) / det;
  if (t <= 1e-6 || s < 0 || s > len) return null;
  return { t, s, point: add(P, u, t) };
}

type Trace = {
  P: V;
  uIn: V;
  t1: V;
  n1: V;
  n2: V;
  Q: V | null;
  refl: V | null;
  end: V | null;
  exit: { dir: V; screen: V } | null;
  tir: boolean;
  base: boolean;
};

function trace(Adeg: number, ideg: number, n: number): Trace {
  const h = (Adeg * Math.PI) / 360;
  const len = HEIGHT / Math.cos(h);
  const d1 = { x: -Math.sin(h), y: Math.cos(h) };
  const d2 = { x: Math.sin(h), y: Math.cos(h) };
  const n1 = { x: -Math.cos(h), y: -Math.sin(h) };
  const n2 = { x: Math.cos(h), y: -Math.sin(h) };
  const i = (ideg * Math.PI) / 180;
  const P = add(APEX, d1, S0 * len);
  const uIn = { x: Math.cos(h - i), y: Math.sin(h - i) };
  const t1 = refract(uIn, n1, 1 / n)!;
  const Q = hit(P, t1, APEX, d2, len);
  if (!Q) {
    const baseL = add(APEX, d1, len);
    const B = hit(P, t1, baseL, { x: 1, y: 0 }, 2 * HEIGHT * Math.tan(h));
    const end = B?.point ?? add(P, t1, 200);
    return { P, uIn, t1, n1, n2, Q: null, refl: null, end, exit: null, tir: false, base: true };
  }
  const t2 = refract(t1, { x: -n2.x, y: -n2.y }, n);
  if (!t2) {
    const refl = add(t1, n2, -2 * dot(t1, n2));
    return { P, uIn, t1, n1, n2, Q: Q.point, refl, end: null, exit: null, tir: true, base: false };
  }
  const S = t2.x > 0 ? add(Q.point, t2, (SCREEN_X - Q.point.x) / t2.x) : add(Q.point, t2, 300);
  return { P, uIn, t1, n1, n2, Q: Q.point, refl: null, end: null, exit: { dir: t2, screen: S }, tir: false, base: false };
}

function angles(Adeg: number, ideg: number, n: number) {
  const rad = Math.PI / 180;
  const r = Math.asin(Math.sin(ideg * rad) / n) / rad;
  const rp = Adeg - r;
  const s = n * Math.sin(rp * rad);
  const ip = Math.abs(s) <= 1 ? Math.asin(s) / rad : null;
  return { r, rp, ip, D: ip === null ? null : ideg + ip - Adeg };
}

export default function PrismePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "mono");
  const [glass, setGlass] = useState<Glass>("crown");
  const [A, setA] = useState(60);
  const [i, setI] = useState(50);
  const [lambda, setLambda] = useState(589);

  const g = GLASS[glass];
  const nMono = cauchy(g.a, g.b, lambda);
  const ang = angles(A, i, nMono);
  const nV = cauchy(g.a, g.b, 400);
  const nR = cauchy(g.a, g.b, 780);
  const aV = angles(A, i, nV);
  const aR = angles(A, i, nR);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const h = (A * Math.PI) / 360;
    const halfBase = HEIGHT * Math.tan(h);

    // Prisme.
    ctx.fillStyle = "rgba(34, 228, 217, 0.08)";
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(APEX.x, APEX.y);
    ctx.lineTo(APEX.x - halfBase, APEX.y + HEIGHT);
    ctx.lineTo(APEX.x + halfBase, APEX.y + HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.accent;
    ctx.font = "italic 600 16px ui-serif, Georgia, serif";
    ctx.fillText("A", APEX.x - 5, APEX.y - 10);

    // Écran.
    ctx.fillStyle = SIM_COLORS.panelAlt;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.fillRect(SCREEN_X, 40, 10, H - 80);
    ctx.strokeRect(SCREEN_X, 40, 10, H - 80);

    const ray = (a: V, b: V, color: string, width = 2.2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.lineWidth = 1;
    };
    const dashed = (a: V, b: V) => {
      ctx.strokeStyle = SIM_COLORS.textMuted;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const base = trace(A, i, nMono);
    const start = add(base.P, base.uIn, -320);
    ray(start, base.P, mode === "blanche" ? "rgba(255,255,255,0.95)" : rgbCss(wavelengthToRgb(lambda)), 3);
    dashed(add(base.P, base.n1, 80), add(base.P, base.n1, -110));

    if (mode === "mono") {
      const c = rgbCss(wavelengthToRgb(lambda));
      ctx.shadowColor = c;
      ctx.shadowBlur = 10;
      if (base.base) {
        if (base.end) ray(base.P, base.end, c);
      } else if (base.Q) {
        ray(base.P, base.Q, c);
        dashed(add(base.Q, base.n2, 110), add(base.Q, base.n2, -80));
        if (base.tir && base.refl) ray(base.Q, add(base.Q, base.refl, 120), c);
        if (base.exit) ray(base.Q, base.exit.screen, c);
      }
      ctx.shadowBlur = 0;
      // Prolongement du rayon incident, pour lire la déviation D.
      if (base.exit) {
        dashed(base.P, add(base.P, base.uIn, 420));
        ctx.fillStyle = SIM_COLORS.vectorResult;
        ctx.font = "italic 600 16px ui-serif, Georgia, serif";
        const Dp = add(base.P, base.uIn, 380);
        ctx.fillText("D", Dp.x + 6, Dp.y + 22);
      }
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.font = "italic 600 15px ui-serif, Georgia, serif";
      ctx.fillText("i", base.P.x - 60, base.P.y - 6);
      ctx.fillText("r", base.P.x + 22, base.P.y + 20);
      if (base.Q) {
        ctx.fillText("r'", base.Q.x - 34, base.Q.y + 22);
        if (base.exit) ctx.fillText("i'", base.Q.x + 40, base.Q.y + (base.exit.dir.y > 0 ? 36 : -10));
      }
    } else {
      ctx.globalCompositeOperation = "lighter";
      for (const nm of WHITE) {
        const n = cauchy(g.a, g.b, nm);
        const tr = trace(A, i, n);
        const c = rgbCss(wavelengthToRgb(nm), 0.55);
        if (tr.base && tr.end) ray(tr.P, tr.end, c, 1.6);
        else if (tr.Q) {
          ray(tr.P, tr.Q, c, 1.6);
          if (tr.exit) ray(tr.Q, tr.exit.screen, c, 1.6);
          if (tr.tir && tr.refl) ray(tr.Q, add(tr.Q, tr.refl, 120), c, 1.6);
          if (tr.exit && tr.exit.dir.x > 0) {
            ctx.fillStyle = rgbCss(wavelengthToRgb(nm), 0.9);
            ctx.fillRect(SCREEN_X, tr.exit.screen.y - 3, 10, 6);
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    ctx.fillText(
      mode === "blanche"
        ? "Lumière blanche : chaque radiation est déviée différemment"
        : base.tir
          ? "Réflexion totale sur la deuxième face : pas de rayon émergent"
          : `Radiation λ = ${lambda} nm (${radiationName(lambda)}), n = ${fmt(nMono, 4)}`,
      24,
      34
    );
    if (base.base && mode === "mono") {
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.font = SIM_FONT;
      ctx.fillText("Le rayon atteint la base du prisme : augmentez i ou A.", 24, 58);
    }
  });

  const deg = (x: number | null, d = 1) => (x === null ? "—" : `${fmt(x, d)}°`);

  return (
    <SimShell
      title="Dispersion de la lumière par un prisme"
      intro="Un rayon lumineux traverse un prisme d'angle A : il est réfracté deux fois et dévié d'un angle D. L'indice du verre dépend de la longueur d'onde, donc chaque radiation est déviée différemment : la lumière blanche est décomposée en un spectre."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <Segmented
            options={[
              { id: "mono", label: "Monochromatique" },
              { id: "blanche", label: "Lumière blanche" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Segmented
            className="ms-auto"
            options={(Object.keys(GLASS) as Glass[]).map((k) => ({ id: k, label: GLASS[k].label }))}
            value={glass}
            onChange={setGlass}
          />
        </>
      }
      readouts={
        mode === "mono"
          ? [
              { label: "sin i = n·sin r", value: `r = ${deg(ang.r)}` },
              { label: "A = r + r'", value: `r' = ${deg(ang.rp)}` },
              { label: "n·sin r' = sin i'", value: ang.ip === null ? "réflexion totale" : `i' = ${deg(ang.ip)}` },
              { label: "D = i + i' − A", value: deg(ang.D) },
            ]
          : [
              { label: "n (violet, 400 nm)", value: fmt(nV, 4) },
              { label: "n (rouge, 780 nm)", value: fmt(nR, 4) },
              { label: "D violet / D rouge", value: `${deg(aV.D)} / ${deg(aR.D)}` },
              { label: "Écart violet – rouge", value: aV.D !== null && aR.D !== null ? deg(aV.D - aR.D, 2) : "—" },
            ]
      }
      side={
        <>
          <Slider label="Angle d'incidence i" value={i} unit="°" min={0} max={89} step={1} onChange={setI} />
          <Slider label="Angle du prisme A" value={A} unit="°" min={30} max={75} step={1} onChange={setA} />
          {mode === "mono" ? (
            <Slider label="Longueur d'onde λ₀" value={lambda} unit="nm" min={400} max={780} step={1} onChange={setLambda} />
          ) : null}
          <div className="rounded-2xl border border-[var(--sim-border)] bg-[var(--sim-panel-alt)] p-3 text-xs leading-relaxed text-[var(--sim-text-muted)]">
            <p className="font-semibold text-[var(--sim-text)]">{g.label} : n = a + b/λ₀²</p>
            <p className="mt-1">a = {fmt(g.a, 4)} ; b = {fmt(g.b * 1000, 1)}·10⁻³ µm²</p>
          </div>
          <Notes>
            <p>Première face : sin i = n·sin r. Deuxième face : n·sin r&apos; = sin i&apos;.</p>
            <p>A = r + r&apos; et la déviation vaut D = i + i&apos; − A.</p>
            <p>Le violet, pour lequel n est le plus grand, est le plus dévié ; le rouge l&apos;est le moins. Le verre est un milieu dispersif.</p>
          </Notes>
        </>
      }
      footnote="Coefficients de Cauchy typiques d'un verre crown et d'un verre flint (plus dispersif). Le prisme est dans l'air (n = 1,00)."
    />
  );
}
