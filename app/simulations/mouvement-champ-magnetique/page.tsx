"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import {
  GhostButton,
  Notes,
  PlayButton,
  Segmented,
  SimCanvas,
  SimShell,
  Slider,
  SIM_FONT,
  drawArrow,
  fmt,
  prepareCanvas,
  sci,
  useModeParam,
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Mouvement d'une particule chargée dans un champ magnétique uniforme (v₀ ⊥ B).
     F = q·v ∧ B est toujours ⊥ v : P = F·v = 0, W(F) = 0, Ec = cte, v = cte.
     a_t = dv/dt = 0 ; projection sur la normale : |q|·v·B = m·v²/R
       → R = m·v / (|q|·B) : mouvement circulaire uniforme, dans le plan ⊥ B.
     Période T = 2π·m / (|q|·B) (indépendante de v).
   Déviation magnétique (zone de champ de largeur ℓ, écran à D du milieu) :
     sin α = ℓ/R ; exact : D_m = R − √(R² − ℓ²) + (D − ℓ/2)·tan α
     approché (α petit) : D_m ≈ D·ℓ/R = D·ℓ·|q|·B / (m·v₀).
   Repère : x à droite, y en haut, z vers l'observateur (⊙ = +z, ⊗ = −z).
   Rotation horaire (vue de face) quand q·B_z > 0.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 540;
const MODES = ["experience", "cercle", "deviation", "ions"] as const;
type Mode = (typeof MODES)[number];

const E = 1.602e-19;
const ME = 9.109e-31;
const U = 1.6605e-27;

const PARTS = {
  electron: { label: "électron", m: ME, q: -E, vExp: 6, vDef: 8, vMin: 2, vMax: 16, vStep: 0.5, bDef: 0.5, bMin: 0.25, bMax: 1, bStep: 0.05, bUnit: "mT", bScale: 1e-3 },
  proton: { label: "proton", m: 1.673e-27, q: E, vExp: 5, vDef: 10, vMin: 3, vMax: 20, vStep: 0.5, bDef: 0.1, bMin: 0.05, bMax: 0.3, bStep: 0.01, bUnit: "T", bScale: 1 },
  alpha: { label: "He²⁺", m: 6.68e-27, q: 2 * E, vExp: 5, vDef: 10, vMin: 3, vMax: 20, vStep: 0.5, bDef: 0.1, bMin: 0.05, bMax: 0.3, bStep: 0.01, bUnit: "T", bScale: 1 },
  mg: { label: "Mg²⁺", m: 4.0e-26, q: 2 * E, vExp: 4, vDef: 1.6, vMin: 0.5, vMax: 3.2, vStep: 0.1, bDef: 0.1, bMin: 0.05, bMax: 0.3, bStep: 0.01, bUnit: "T", bScale: 1 },
} as const;
type PKey = keyof typeof PARTS;

type IonsEx = "ex1" | "ex2" | "ex3";

function fieldSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, out: boolean, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  if (out) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const k = r * 0.62;
    ctx.beginPath();
    ctx.moveTo(x - k, y - k);
    ctx.lineTo(x + k, y + k);
    ctx.moveTo(x + k, y - k);
    ctx.lineTo(x - k, y + k);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

function fieldGrid(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, out: boolean, gap = 56) {
  for (let x = x0 + gap / 2; x < x1; x += gap) for (let y = y0 + gap / 2; y < y1; y += gap) fieldSymbol(ctx, x, y, out, 7, "rgba(155,123,255,0.4)");
}

/** Point situé à la distance `d` le long d'une ligne brisée. */
function along(pts: [number, number][], d: number): [number, number] {
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg) {
      const k = seg ? d / seg : 0;
      return [pts[i - 1][0] + k * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + k * (pts[i][1] - pts[i - 1][1])];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
}
function polyLen(pts: [number, number][]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
function strokePoly(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

export default function MouvementChampMagnetiquePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "experience");
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useSimClock(running, speed);

  // Expérience (tube à électrons).
  const [config, setConfig] = useState<"aucun" | "parallele" | "perp">("perp");
  const [vTube, setVTube] = useState(2);
  const [bTube, setBTube] = useState(2.5);
  // Cercle.
  const [pk, setPk] = useState<PKey>("electron");
  const [vM, setVM] = useState<number>(PARTS.electron.vDef);
  const [bM, setBM] = useState<number>(PARTS.electron.bDef);
  const [bOut, setBOut] = useState<1 | -1>(-1);
  // Déviation.
  const [vDev, setVDev] = useState(2);
  const [bDev, setBDev] = useState(1);
  const [lDev, setLDev] = useState(4);
  const [dDev, setDDev] = useState(30);
  // Ions (exercices).
  const [ionsEx, setIonsEx] = useState<IonsEx>("ex1");
  const [mMg, setMMg] = useState(2.5);
  const [ionsB, setIonsB] = useState<1 | -1>(1);

  const P = PARTS[pk];
  const vC = vM * Math.pow(10, P.vExp);
  const bC = bM * P.bScale;
  const RC = (P.m * vC) / (Math.abs(P.q) * bC);
  const TC = (2 * Math.PI * P.m) / (Math.abs(P.q) * bC);
  const FC = Math.abs(P.q) * vC * bC;
  const EcC = 0.5 * P.m * vC * vC;

  const RT = (ME * vTube * 1e7) / (E * bTube * 1e-3);

  const v0D = vDev * 1e7;
  const RD = (ME * v0D) / (E * bDev * 1e-3);
  const lM = lDev / 100;
  const DM = dDev / 100;
  const exits = RD > lM;
  const sinA = exits ? lM / RD : 1;
  const alphaD = Math.asin(sinA);
  const yExit = exits ? RD - Math.sqrt(RD * RD - lM * lM) : 2 * RD;
  const DmExact = exits ? yExit + (DM - lM / 2) * Math.tan(alphaD) : NaN;
  const DmApprox = (DM * lM) / RD;

  // Données des exercices sur les ions.
  const ions =
    ionsEx === "ex1"
      ? [{ label: "Mg²⁺", m: mMg * 1e-26, q: 2 * E, color: SIM_COLORS.vectorX }]
      : ionsEx === "ex2"
        ? [
            { label: "²⁰⁰Hg²⁺", m: 200 * U, q: 2 * E, color: SIM_COLORS.vectorX },
            { label: "²⁰²Hg²⁺", m: 202 * U, q: 2 * E, color: SIM_COLORS.accent },
          ]
        : [
            { label: "He²⁺", m: 6.68e-27, q: 2 * E, color: SIM_COLORS.vectorX },
            { label: "O²⁻", m: 2.67e-26, q: -2 * E, color: SIM_COLORS.accent },
          ];
  const ionsV = ionsEx === "ex1" ? 1.6e4 : 1e5;
  const ionsBval = ionsEx === "ex1" ? 0.1 : ionsEx === "ex2" ? 0.5 : 0.1;
  const ionR = ions.map((i) => (i.m * ionsV) / (Math.abs(i.q) * ionsBval));

  const pickParticle = (k: PKey) => {
    setPk(k);
    setVM(PARTS[k].vDef);
    setBM(PARTS[k].bDef);
  };
  const pickIons = (e: IonsEx) => {
    setIonsEx(e);
    setIonsB(e === "ex3" ? -1 : 1);
    setT(0);
  };

  useEffect(() => {
    setT(0);
    setRunning(true);
  }, [mode, config, vDev, bDev, lDev, dDev, ionsEx, ionsB, mMg, setT]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const C = SIM_COLORS;
    const title = (a: string, b: string) => {
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 17px ui-sans-serif, system-ui";
      ctx.fillText(a, 24, 30);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText(b, 24, 54);
    };
    const dot = (x: number, y: number, color: string, r = 6) => {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    /* ---------- Expérience : tube à faisceau d'électrons ---------- */
    if (mode === "experience") {
      const T = { x: 70, y: 100, w: 780, h: 380 };
      ctx.strokeStyle = "rgba(140,156,192,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(T.x, T.y, T.w, T.h, 60);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(34,228,217,0.03)";
      ctx.fill();
      if (config === "perp") fieldGrid(ctx, T.x + 20, T.y + 10, T.x + T.w - 20, T.y + T.h - 10, false, 64);
      if (config === "parallele")
        for (let y = T.y + 50; y < T.y + T.h; y += 70) drawArrow(ctx, T.x + 120, y, T.x + 260, y, "rgba(155,123,255,0.6)", y === T.y + 50 ? "B" : undefined);
      // Canon à électrons.
      const gx = T.x + 280;
      const gy = T.y + 56;
      ctx.fillStyle = "#3A4B70";
      ctx.fillRect(gx - 20, gy - 12, 50, 24);
      ctx.fillStyle = C.textMuted;
      ctx.font = "13px ui-sans-serif, system-ui";
      ctx.fillText("canon à électrons", gx - 22, gy - 20);
      const s = 3040; // px par mètre (tube ≈ 25 cm)
      const pts: [number, number][] = [[gx + 30, gy]];
      if (config === "perp") {
        // Électron, B ⊗ : rotation horaire vue de face, centre en dessous.
        const Rpx = RT * s;
        const cx = gx + 30;
        const cy = gy + Rpx;
        for (let k = 1; k <= 400; k++) {
          const a = (k / 400) * 2 * Math.PI;
          const x = cx + Rpx * Math.sin(a);
          const y = cy - Rpx * Math.cos(a);
          if (x > T.x + T.w - 8 || y > T.y + T.h - 8 || y < T.y + 8 || x < T.x + 8) {
            pts.push([x, y]);
            break;
          }
          pts.push([x, y]);
        }
      } else pts.push([T.x + T.w - 10, gy]);
      const glow = "rgba(34,228,217,0.75)";
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3;
      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 14;
      strokePoly(ctx, pts);
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      const L = polyLen(pts);
      for (let k = 0; k < 12; k++) {
        const d = (t * 220 + (k * L) / 12) % L;
        const [x, y] = along(pts, d);
        dot(x, y, C.accent, 3.5);
      }
      const end = pts[pts.length - 1];
      const closed = Math.hypot(end[0] - pts[0][0], end[1] - pts[0][1]) < 4;
      if (!closed) dot(end[0], end[1], "#FDE68A", 7);
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 16px ui-sans-serif, system-ui";
      const msg =
        config === "aucun"
          ? "Sans champ : faisceau rectiligne"
          : config === "parallele"
            ? "v₀ parallèle à B : aucune déviation"
            : closed
              ? "v₀ ⊥ B : trajectoire circulaire"
              : "v₀ ⊥ B : faisceau courbé (le cercle sort du tube)";
      ctx.fillText(msg, T.x + 30, T.y + T.h + 36);
      title("Déviation d'un faisceau d'électrons par un champ magnétique uniforme", `v₀ = ${fmt(vTube, 1)}·10⁷ m/s ; B = ${fmt(bTube, 2)} mT${config === "perp" ? ` ; R = ${fmt(RT * 100, 2)} cm` : ""}`);
      return;
    }

    /* ---------- Mouvement circulaire uniforme ---------- */
    if (mode === "cercle") {
      const cx = 320;
      const cy = 300;
      const base = 100 / ((P.m * P.vDef * Math.pow(10, P.vExp)) / (Math.abs(P.q) * P.bDef * P.bScale));
      const s = Math.min(base, 205 / RC);
      const Rpx = RC * s;
      const out = bOut > 0;
      fieldGrid(ctx, 20, 70, 620, 530, out);
      const cw = P.q * bOut > 0;
      const phi = (2 * Math.PI * t) / 4;
      const pos = (a: number): [number, number] => (cw ? [cx + Rpx * Math.sin(a), cy - Rpx * Math.cos(a)] : [cx + Rpx * Math.sin(a), cy + Rpx * Math.cos(a)]);
      const ccy = cy;
      ctx.strokeStyle = "rgba(140,156,192,0.4)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(cx, ccy, Rpx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = P.q > 0 ? C.vectorX : C.accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      const trail = Math.min(phi, 2 * Math.PI);
      for (let k = 0; k <= 80; k++) {
        const [x, y] = pos(phi - trail + (trail * k) / 80);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.textMuted;
      ctx.beginPath();
      ctx.arc(cx, ccy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText("C", cx + 6, ccy - 6);
      const X0 = 650;
      const [px, py] = pos(phi);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.textMuted;
      ctx.beginPath();
      ctx.moveTo(cx, ccy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText("R", (cx + px) / 2 + 6, (ccy + py) / 2);
      // Vecteurs : v tangent (sens du mouvement), F vers le centre.
      const tx = Math.cos(phi);
      const ty = cw ? Math.sin(phi) : -Math.sin(phi);
      drawArrow(ctx, px, py, px + tx * 80, py + ty * 80, C.textPrimary, "v");
      const nx = (cx - px) / Rpx;
      const ny = (ccy - py) / Rpx;
      drawArrow(ctx, px, py, px + nx * 62, py + ny * 62, C.vectorX, "F");
      ctx.fillStyle = C.vectorX;
      ctx.font = SIM_FONT;
      ctx.fillText("F et a dirigés vers le centre C (selon n)", X0, 470);
      dot(px, py, P.q > 0 ? C.vectorX : C.accent, 7);
      // Échelle.
      const target = 120 / s;
      const pw = Math.pow(10, Math.floor(Math.log10(target)));
      const nice = [1, 2, 5, 10].map((k) => k * pw).reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
      ctx.strokeStyle = C.textPrimary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 515);
      ctx.lineTo(40 + nice * s, 515);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.textPrimary;
      ctx.font = SIM_FONT;
      ctx.fillText(nice >= 0.01 ? `${fmt(nice * 100, 0)} cm` : `${fmt(nice * 1000, 0)} mm`, 46 + nice * s, 520);

      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText("Étude du mouvement", X0, 100);
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      [
        "F ⊥ v  ⇒  P = F·v = 0",
        "W(F) = 0  ⇒  Ec = cte",
        "⇒ v = cte : mouvement uniforme",
        "",
        "F ⊥ B : mouvement plan,",
        "dans le plan ⊥ B",
        "",
        "a_t = dv/dt = 0 ; a = a_n",
        "|q|·v·B = m·v²/R",
        "⇒ R = m·v / (|q|·B) = cte",
        "mouvement circulaire uniforme",
      ].forEach((l, i) => ctx.fillText(l, X0, 130 + i * 24));
      ctx.fillStyle = cw ? C.vectorX : C.accent;
      ctx.fillText(`Sens : ${cw ? "horaire" : "trigonométrique"}`, X0, 410);
      ctx.fillStyle = C.textMuted;
      ctx.fillText("Inverser q ou B inverse le sens.", X0, 434);
      title(`Mouvement circulaire uniforme : ${P.label} dans B ${out ? "⊙" : "⊗"}`, `R = m·v/(|q|·B) = ${sci(RC, 3)} m   ;   T = 2π·m/(|q|·B) = ${sci(TC, 3)} s (animation ralentie)`);
      return;
    }

    /* ---------- Déviation magnétique ---------- */
    if (mode === "deviation") {
      const margin = 0.03;
      const s = 800 / (margin + lM / 2 + DM + 0.035);
      const ox = 50 + margin * s;
      const oy = 150;
      const SX = (x: number) => ox + x * s;
      const SY = (y: number) => oy + y * s; // y positif vers le bas (déviation)
      // Zone de champ.
      ctx.fillStyle = "rgba(155,123,255,0.07)";
      ctx.fillRect(SX(0), 80, lM * s, 440);
      ctx.strokeStyle = "rgba(155,123,255,0.5)";
      ctx.strokeRect(SX(0), 80, lM * s, 440);
      for (let y = 105; y < 520; y += 50) for (let x = SX(0) + 14; x < SX(lM) - 6; x += 30) fieldSymbol(ctx, x, y, false, 7, "rgba(155,123,255,0.5)");
      // Écran.
      const xs = SX(lM / 2 + DM);
      ctx.strokeStyle = C.textPrimary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xs, 80);
      ctx.lineTo(xs, 525);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("écran", xs + 8, 96);
      // Axe initial.
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = "rgba(140,156,192,0.4)";
      ctx.beginPath();
      ctx.moveTo(30, oy);
      ctx.lineTo(xs, oy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText("O", ox - 18, oy - 8);
      ctx.fillText("O'", xs + 8, oy + 5);
      // Cotes ℓ et D.
      ctx.strokeStyle = C.textMuted;
      ctx.beginPath();
      ctx.moveTo(SX(0), 74);
      ctx.lineTo(SX(lM), 74);
      ctx.moveTo(SX(lM / 2), 120);
      ctx.lineTo(xs, 120);
      ctx.stroke();
      ctx.fillText("ℓ", SX(lM) + 6, 79);
      ctx.fillText("D", (SX(lM / 2) + xs) / 2, 114);
      // Trajectoire.
      const pts: [number, number][] = [[30, oy]];
      const Rpx = RD * s;
      const steps = 120;
      if (exits) {
        for (let k = 0; k <= steps; k++) {
          const a = (alphaD * k) / steps;
          pts.push([SX(RD * Math.sin(a)), SY(RD - RD * Math.cos(a))]);
        }
        const yP = DmExact;
        pts.push([xs, SY(yP)]);
      } else {
        for (let k = 0; k <= steps; k++) {
          const a = (Math.PI * k) / steps;
          pts.push([ox + Rpx * Math.sin(a), oy + Rpx - Rpx * Math.cos(a)]);
        }
        pts.push([30, oy + 2 * Rpx]);
      }
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 8;
      strokePoly(ctx, pts);
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      if (exits) {
        // Tangente prolongée jusqu'à l'axe (point J) et angle α.
        const xe = SX(lM);
        const ye = SY(yExit);
        const xJ = lM - yExit / Math.tan(alphaD);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.vectorY;
        ctx.beginPath();
        ctx.moveTo(SX(xJ), oy);
        ctx.lineTo(xe, ye);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.vectorY;
        ctx.beginPath();
        ctx.arc(SX(xJ), oy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "italic 15px ui-serif, Georgia, serif";
        ctx.fillText("J", SX(xJ) - 4, oy - 10);
        ctx.strokeStyle = C.vectorY;
        ctx.beginPath();
        ctx.arc(SX(xJ), oy, 46, 0, alphaD);
        ctx.stroke();
        ctx.fillText("α", SX(xJ) + 52, oy + 22);
        // D_m sur l'écran.
        const yP = SY(DmExact);
        dot(xs, Math.min(yP, 528), "#FDE68A", 6);
        ctx.fillStyle = "#FDE68A";
        ctx.fillText("P", xs + 10, Math.min(yP, 528) + 4);
        drawArrow(ctx, xs - 16, oy, xs - 16, Math.min(yP, 528), C.vectorX);
        ctx.font = "600 14px ui-sans-serif, system-ui";
        ctx.fillStyle = C.vectorX;
        ctx.fillText("D_m", xs - 52, (oy + Math.min(yP, 528)) / 2);
        if (yP > 528) {
          ctx.fillText("(P hors cadre)", xs - 120, 512);
        }
      } else {
        ctx.fillStyle = C.vectorX;
        ctx.font = "600 15px ui-sans-serif, system-ui";
        ctx.fillText("R ≤ ℓ : l'électron fait demi-tour dans le champ", SX(lM) + 20, 300);
      }
      const L = polyLen(pts);
      const d = (t * 260) % (L + 120);
      if (d <= L) {
        const [x, y] = along(pts, d);
        dot(x, y, C.accent, 5);
      }
      title(
        "Déviation magnétique d'un faisceau d'électrons (B ⊗)",
        exits
          ? `R = ${fmt(RD * 100, 2)} cm ; α = ${fmt((alphaD * 180) / Math.PI, 1)}° ; D_m ≈ D·ℓ·|q|·B/(m·v₀) = ${fmt(DmApprox * 100, 2)} cm (exact : ${fmt(DmExact * 100, 2)} cm)`
          : `R = ${fmt(RD * 100, 2)} cm ≤ ℓ = ${fmt(lDev, 1)} cm : pas de sortie vers l'écran`
      );
      return;
    }

    /* ---------- Ions : exercices du cours ---------- */
    const geo =
      ionsEx === "ex1"
        ? { ax: 120, ay: 120, dx: 1, dy: 0, s: 5000 }
        : ionsEx === "ex2"
          ? { ax: 130, ay: 470, dx: 0, dy: 1, s: 1250 }
          : { ax: 300, ay: 450, dx: 0, dy: 1, s: 3000 };
    const toPx = (x: number, y: number): [number, number] => [geo.ax + x * geo.s, geo.ay - y * geo.s];
    // Région de champ (demi-plan du côté de v).
    if (ionsEx === "ex1") {
      ctx.fillStyle = "rgba(155,123,255,0.06)";
      ctx.fillRect(geo.ax, 70, 760, 460);
      fieldGrid(ctx, geo.ax, 70, 890, 530, ionsB > 0);
      ctx.strokeStyle = C.textMuted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(geo.ax, 70);
      ctx.lineTo(geo.ax, 530);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = "rgba(155,123,255,0.06)";
      ctx.fillRect(20, 70, 880, geo.ay - 70);
      fieldGrid(ctx, 20, 70, 900, geo.ay, ionsB > 0);
      ctx.strokeStyle = C.textMuted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, geo.ay);
      ctx.lineTo(900, geo.ay);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    if (ionsEx === "ex1") {
      // Point M visé : OM = 4 cm sous O.
      const [mx, my] = toPx(0, -0.04);
      ctx.fillStyle = "#FDE68A";
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText("M (OM = 4 cm)", mx - 120, my + 5);
    }
    if (ionsEx === "ex2") {
      const [d0] = toPx(0.3, 0);
      const [d1] = toPx(0.5, 0);
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(d0, geo.ay + 4);
      ctx.lineTo(d1, geo.ay + 4);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = "#FDE68A";
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText("détecteur D", (d0 + d1) / 2 - 40, geo.ay + 26);
    }
    if (ionsEx === "ex3") {
      // Règle graduée en cm.
      ctx.strokeStyle = C.textMuted;
      ctx.fillStyle = C.textMuted;
      ctx.font = "11px ui-sans-serif, system-ui";
      for (let k = -9; k <= 19; k++) {
        const [x] = toPx(k * 0.01, 0);
        ctx.beginPath();
        ctx.moveTo(x, geo.ay);
        ctx.lineTo(x, geo.ay + (k % 5 === 0 ? 10 : 5));
        ctx.stroke();
        if (k % 5 === 0) ctx.fillText(`${k}`, x - 4, geo.ay + 22);
      }
      ctx.fillText("cm", 860, geo.ay + 22);
    }
    ctx.fillStyle = C.textPrimary;
    ctx.font = "600 15px ui-sans-serif, system-ui";
    ctx.fillText(ionsEx === "ex1" ? "O" : "A", geo.ax - (ionsEx === "ex1" ? 22 : 4), geo.ay + (ionsEx === "ex1" ? 5 : 24));
    drawArrow(ctx, geo.ax, geo.ay, geo.ax + geo.dx * 60, geo.ay - geo.dy * 60, C.textPrimary, "v₀");
    const ph = Math.min(Math.PI, ((t % 3.6) / 2.6) * Math.PI);
    ions.forEach((ion, i) => {
      const R = ionR[i];
      const cw = ion.q * ionsB > 0;
      const nx = cw ? geo.dy : -geo.dy;
      const ny = cw ? -geo.dx : geo.dx;
      const P2 = (a: number) => {
        // centre = A + R·n ; position = centre − R·n·cos a + R·d·sin a
        const x = R * nx * (1 - Math.cos(a)) + R * geo.dx * Math.sin(a);
        const y = R * ny * (1 - Math.cos(a)) + R * geo.dy * Math.sin(a);
        return toPx(x, y);
      };
      ctx.strokeStyle = "rgba(140,156,192,0.4)";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      for (let k = 0; k <= 80; k++) {
        const [x, y] = P2((Math.PI * k) / 80);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = ion.color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let k = 0; k <= 80; k++) {
        const [x, y] = P2((ph * k) / 80);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      const [px, py] = P2(ph);
      dot(px, py, ion.color, 6);
      const [lx, ly] = P2(Math.PI / 2);
      ctx.fillStyle = ion.color;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText(`${ion.label} : R = ${fmt(R * 100, 2)} cm`, lx + (lx > geo.ax ? 10 : -170), ly + (ionsEx === "ex1" ? 0 : -10) + i * (ionsEx === "ex2" ? 22 : 0));
    });
    if (ionsEx === "ex2") {
      // Loupe sur les points d'impact (×20).
      const imp = ionR.map((r) => 2 * r * (ionsB > 0 ? 1 : -1));
      const Z = { x: 640, y: 90, w: 250, h: 90 };
      ctx.strokeStyle = "rgba(140,156,192,0.4)";
      ctx.strokeRect(Z.x, Z.y, Z.w, Z.h);
      ctx.fillStyle = C.textMuted;
      ctx.font = "13px ui-sans-serif, system-ui";
      ctx.fillText("loupe ×20 sur les impacts", Z.x + 6, Z.y + 16);
      const mid = (imp[0] + imp[1]) / 2;
      ions.forEach((ion, i) => {
        const x = Z.x + Z.w / 2 + (imp[i] - mid) * geo.s * 20;
        ctx.fillStyle = ion.color;
        ctx.beginPath();
        ctx.arc(x, Z.y + 55, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(ion.label, x - 22, Z.y + 80);
      });
    }
    const ttl =
      ionsEx === "ex1"
        ? ["Exercice 1 : ions Mg²⁺, V₀ = 1,6·10⁴ m/s, B = 0,1 T", `Trouvez la masse pour que l'ion arrive en M : OM = 2R = ${fmt(2 * ionR[0] * 100, 2)} cm`]
        : ionsEx === "ex2"
          ? ["Exercice 2 : isotopes ²⁰⁰Hg²⁺ et ²⁰²Hg²⁺ (V = 10⁵ m/s, B = 0,5 T)", `Écart entre les impacts : ${fmt(2 * (ionR[1] - ionR[0]) * 1000, 2)} mm`]
          : ["Exercice 3 : He²⁺ et O²⁻, même vitesse V, B ⊗ (V = 10⁵ m/s, B = 0,1 T)", `R(O²⁻) / R(He²⁺) = ${fmt(ionR[1] / ionR[0], 2)} = m(O²⁻) / m(He²⁺)`];
    title(ttl[0], ttl[1]);
  });

  const modeSel = (
    <Segmented
      options={[
        { id: "experience", label: "Expérience" },
        { id: "cercle", label: "Mouvement circulaire" },
        { id: "deviation", label: "Déviation magnétique" },
        { id: "ions", label: "Exercices (ions)" },
      ]}
      value={mode}
      onChange={setMode}
    />
  );

  const readouts =
    mode === "experience"
      ? [
          { label: "Champ", value: config === "aucun" ? "B = 0" : config === "parallele" ? "B ∥ v₀" : "B ⊥ v₀ (⊗)" },
          { label: "v₀", value: `${fmt(vTube, 1)}·10⁷ m/s` },
          { label: "B", value: `${fmt(bTube, 2)} mT` },
          { label: "Rayon R = m·v₀/(e·B)", value: config === "perp" ? `${fmt(RT * 100, 2)} cm` : "pas de déviation" },
        ]
      : mode === "cercle"
        ? [
            { label: "Rayon R", value: `${sci(RC, 3)} m` },
            { label: "Période T", value: `${sci(TC, 3)} s` },
            { label: "F = |q|·v·B", value: `${sci(FC, 3)} N` },
            { label: "Ec = ½·m·v² (constante)", value: `${sci(EcC, 3)} J` },
          ]
        : mode === "deviation"
          ? [
              { label: "Rayon R", value: `${fmt(RD * 100, 2)} cm` },
              { label: "Angle α", value: exits ? `${fmt((alphaD * 180) / Math.PI, 2)}°` : "—" },
              { label: "D_m approché D·ℓ/R", value: `${fmt(DmApprox * 100, 2)} cm` },
              { label: "D_m exact (écart)", value: exits ? `${fmt(DmExact * 100, 2)} cm (${fmt((Math.abs(DmApprox - DmExact) / DmExact) * 100, 1)} %)` : "—" },
            ]
          : ionsEx === "ex1"
            ? [
                { label: "Masse m", value: `${fmt(mMg, 2)}·10⁻²⁶ kg` },
                { label: "R = m·V₀/(2e·B)", value: `${fmt(ionR[0] * 100, 2)} cm` },
                { label: "OM = 2R", value: `${fmt(2 * ionR[0] * 100, 2)} cm` },
                { label: "Arrivée", value: ionsB < 0 ? "dévié vers le haut : B ⊗ ne convient pas" : Math.abs(2 * ionR[0] - 0.04) < 0.0005 ? "en M ✓" : "pas en M" },
              ]
            : ionsEx === "ex2"
              ? [
                  { label: "R (²⁰⁰Hg²⁺)", value: `${fmt(ionR[0] * 100, 2)} cm` },
                  { label: "R (²⁰²Hg²⁺)", value: `${fmt(ionR[1] * 100, 2)} cm` },
                  { label: "Écart des impacts", value: `${fmt(2 * (ionR[1] - ionR[0]) * 1000, 2)} mm` },
                  { label: "Vers le détecteur ?", value: ionsB > 0 ? "oui (B ⊙)" : "non : B ⊗ dévie à gauche" },
                ]
              : [
                  { label: "R (He²⁺)", value: `${fmt(ionR[0] * 100, 2)} cm` },
                  { label: "R (O²⁻)", value: `${fmt(ionR[1] * 100, 2)} cm` },
                  { label: "R(O²⁻) / R(He²⁺)", value: fmt(ionR[1] / ionR[0], 2) },
                  { label: "m(O²⁻) = rapport × m(He²⁺)", value: `${sci((ionR[1] / ionR[0]) * 6.68e-27, 3)} kg` },
                ];

  return (
    <SimShell
      title="Particule chargée dans un champ magnétique"
      intro="Une particule chargée qui entre dans un champ magnétique uniforme avec une vitesse v₀ ⊥ B subit la force de Lorentz, toujours perpendiculaire à sa vitesse : son mouvement est circulaire uniforme, de rayon R = m·v₀/(|q|·B). C'est le principe de la déviation magnétique et de la séparation des ions."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => setRunning((r) => !r)} />
          <GhostButton onClick={() => setT(0)}>⟲ Recommencer</GhostButton>
          <Segmented
            className="ms-auto"
            options={[
              { id: 0.5, label: "×0,5" },
              { id: 1, label: "×1" },
              { id: 2, label: "×2" },
            ]}
            value={speed}
            onChange={setSpeed}
          />
        </>
      }
      readouts={readouts}
      side={
        <>
          {modeSel}
          {mode === "experience" && (
            <>
              <Segmented
                options={[
                  { id: "aucun", label: "Sans champ" },
                  { id: "parallele", label: "v₀ ∥ B" },
                  { id: "perp", label: "v₀ ⊥ B" },
                ]}
                value={config}
                onChange={setConfig}
              />
              <Slider label="Vitesse des électrons v₀" value={vTube} unit="·10⁷ m/s" min={1} max={4} step={0.1} digits={1} onChange={setVTube} />
              <Slider label="Champ B (bobines de Helmholtz)" value={bTube} unit="mT" min={1} max={5} step={0.05} digits={2} onChange={setBTube} />
              <Notes>
                <p>Si v₀ est parallèle à B, le faisceau n&apos;est pas dévié.</p>
                <p>Si v₀ est perpendiculaire à B, le faisceau dévie et sa trajectoire devient circulaire : c&apos;est l&apos;effet de la force magnétique (force de Lorentz).</p>
              </Notes>
            </>
          )}
          {mode === "cercle" && (
            <>
              <Segmented
                options={(Object.keys(PARTS) as PKey[]).map((k) => ({ id: k, label: PARTS[k].label }))}
                value={pk}
                onChange={pickParticle}
              />
              <Slider label="Vitesse v" value={vM} unit={`·10${["⁰", "¹", "²", "³", "⁴", "⁵", "⁶"][P.vExp]} m/s`} min={P.vMin} max={P.vMax} step={P.vStep} digits={1} onChange={setVM} />
              <Slider label="Champ B" value={bM} unit={P.bUnit} min={P.bMin} max={P.bMax} step={P.bStep} digits={2} onChange={setBM} />
              <Segmented
                options={[
                  { id: 1, label: "⊙ B sortant" },
                  { id: -1, label: "⊗ B entrant" },
                ]}
                value={bOut}
                onChange={setBOut}
              />
              <Notes>
                <p>v double → R double ; B double → R divisé par deux. La période T ne dépend pas de v.</p>
                <p>La force magnétique ne modifie pas l&apos;énergie cinétique : elle change seulement la direction de v.</p>
              </Notes>
            </>
          )}
          {mode === "deviation" && (
            <>
              <Slider label="Vitesse v₀" value={vDev} unit="·10⁷ m/s" min={1} max={5} step={0.1} digits={1} onChange={setVDev} />
              <Slider label="Champ B" value={bDev} unit="mT" min={0.2} max={3} step={0.05} digits={2} onChange={setBDev} />
              <Slider label="Largeur de la zone de champ ℓ" value={lDev} unit="cm" min={1} max={8} step={0.5} digits={1} onChange={setLDev} />
              <Slider label="Distance D (milieu de la zone → écran)" value={dDev} unit="cm" min={10} max={40} step={1} onChange={setDDev} />
              <Notes>
                <p>Dans le champ : arc de cercle de rayon R, avec sin α = ℓ/R. Hors du champ : mouvement rectiligne uniforme jusqu&apos;à l&apos;écran.</p>
                <p>Pour α petit, tan α ≈ sin α et J est presque au milieu de la zone : D_m ≈ D·ℓ/R = D·ℓ·|q|·B/(m·v₀).</p>
              </Notes>
            </>
          )}
          {mode === "ions" && (
            <>
              <Segmented
                options={[
                  { id: "ex1", label: "Ex. 1 : Mg²⁺" },
                  { id: "ex2", label: "Ex. 2 : isotopes Hg" },
                  { id: "ex3", label: "Ex. 3 : He²⁺ / O²⁻" },
                ]}
                value={ionsEx}
                onChange={pickIons}
              />
              <Segmented
                options={[
                  { id: 1, label: "⊙ B sortant" },
                  { id: -1, label: "⊗ B entrant" },
                ]}
                value={ionsB}
                onChange={setIonsB}
              />
              {ionsEx === "ex1" && <Slider label="Masse de l'ion Mg²⁺" value={mMg} unit="·10⁻²⁶ kg" min={1} max={8} step={0.05} digits={2} onChange={setMMg} />}
              <Notes>
                {ionsEx === "ex1" && <p>Ajustez la masse pour que l&apos;ion arrive en M : m = 2e·B·R/V₀ avec R = OM/2.</p>}
                {ionsEx === "ex2" && <p>Même charge, même vitesse : R est proportionnel à m. L&apos;ion le plus léger (²⁰⁰Hg²⁺) a le plus petit rayon : il est le plus dévié.</p>}
                {ionsEx === "ex3" && <p>Charges opposées : déviations de sens opposés. |q| identique, donc R(O²⁻)/R(He²⁺) = m(O²⁻)/m(He²⁺).</p>}
                <p>Changez le sens de B pour trouver celui qui envoie les ions au bon endroit.</p>
              </Notes>
            </>
          )}
        </>
      }
    />
  );
}
