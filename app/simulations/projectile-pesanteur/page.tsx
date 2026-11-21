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
  useModeParam,
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Mouvement d'un projectile dans le champ de pesanteur uniforme.
   Repère (O, i, j) : O au point de lancement, Ox horizontal, Oy vertical
   vers le haut ; v₀ fait l'angle α avec l'horizontale.
     2ᵉ loi de Newton : a = g  →  a_x = 0 ; a_y = −g
     v_x = v₀·cos α          ;  v_y = −g·t + v₀·sin α
     x = v₀·cos α·t          ;  y = −½·g·t² + v₀·sin α·t
     Trajectoire : y = −g·x² / (2·v₀²·cos²α) + x·tan α   (parabole)
     Flèche (v_y = 0) : x_S = v₀²·sin 2α / (2g) ; y_S = v₀²·sin²α / (2g)
     Portée (retour à y = 0) : OP = v₀²·sin 2α / g   (maximale pour α = 45°)
   Le sol est à y = −h (h : hauteur du point de lancement).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 540;
const MODES = ["horaires", "trajectoire", "fleche-portee"] as const;
type Mode = (typeof MODES)[number];

type Target = { kind: "panier"; x: number; y: number } | { kind: "mur"; x: number; top: number } | { kind: "eau" } | null;

const PRESETS: { id: string; label: string; v0: number; alpha: number; h: number; g: number; target: Target }[] = [
  { id: "cours", label: "Cours : lancer depuis le sol", v0: 15, alpha: 45, h: 0, g: 9.8, target: null },
  {
    id: "basket",
    label: "Exercice 1 : basket, h_A = 2,4 m, α = 40°, panier à 6,2 m et 3,0 m",
    v0: 7,
    alpha: 40,
    h: 2.4,
    g: 9.8,
    target: { kind: "panier", x: 6.2, y: 3.0 },
  },
  {
    id: "mur",
    label: "Exercice 2 : ballon, h = 1 m, v₀ = 16 m/s, mur de 5 m à 8 m",
    v0: 16,
    alpha: 45,
    h: 1,
    g: 9.8,
    target: { kind: "mur", x: 8, top: 5 },
  },
  {
    id: "toboggan",
    label: "Exercice 3 : toboggan, v₀ = 5 m/s, α = 30°, eau 0,50 m sous O",
    v0: 5,
    alpha: 30,
    h: 0.5,
    g: 10,
    target: { kind: "eau" },
  },
];

function niceStep(span: number) {
  const raw = span / 7;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

export default function ProjectilePesanteurPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "horaires");
  const [v0, setV0] = useState(15);
  const [alpha, setAlpha] = useState(45);
  const [h, setH] = useState(0);
  const [g, setG] = useState(9.8);
  const [target, setTarget] = useState<Target>(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const [t, setT] = useSimClock(running, speed);

  const rad = (alpha * Math.PI) / 180;
  const vx = v0 * Math.cos(rad);
  const vy0 = v0 * Math.sin(rad);
  const tGround = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h)) / g;
  const X = vx * tGround;
  const tS = vy0 / g;
  const xS = vx * tS;
  const yS = (vy0 * vy0) / (2 * g);
  const OP = (v0 * v0 * Math.sin(2 * rad)) / g;
  const yAt = (xx: number) => (vx > 1e-9 ? (-g * xx * xx) / (2 * vx * vx) + xx * Math.tan(rad) : 0);

  // Fin du mouvement : sol (ou eau), ou choc contre le mur.
  let tEnd = Math.max(tGround, 0.02);
  let wallHit = false;
  if (target?.kind === "mur" && target.x < X && yAt(target.x) < target.top - h) {
    tEnd = target.x / vx;
    wallHit = true;
  }
  const tc = Math.min(t, tEnd);
  const px = vx * tc;
  const py = -0.5 * g * tc * tc + vy0 * tc;
  const vyc = -g * tc + vy0;

  useEffect(() => {
    setT(0);
    setRunning(true);
  }, [v0, alpha, h, g, target, mode, setT]);
  useEffect(() => {
    if (t >= tEnd) setRunning(false);
  }, [t, tEnd]);

  // État vis-à-vis de la cible de l'exercice.
  let targetText = "";
  if (target?.kind === "panier") {
    const d = yAt(target.x) - (target.y - h);
    targetText = Math.abs(d) <= 0.12 ? `Panier ! (écart ${fmt(Math.abs(d) < 0.005 ? 0 : d, 2)} m)` : `${d > 0 ? "trop haut" : "trop bas"} de ${fmt(Math.abs(d), 2)} m`;
  } else if (target?.kind === "mur") {
    const d = yAt(target.x) - (target.top - h);
    targetText = target.x >= X ? "retombe avant le mur" : d >= 0 ? `passe à ${fmt(d, 2)} m au-dessus` : `touche le mur (${fmt(-d, 2)} m trop bas)`;
  } else if (target?.kind === "eau") {
    targetText = `x_P = ${fmt(X, 2)} m à ${fmt(tGround, 2)} s`;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const C = SIM_COLORS;
    const rad2 = Math.PI / 2 - rad;
    const yS2 = (v0 * v0 * Math.sin(rad2) ** 2) / (2 * g);

    const R =
      mode === "horaires"
        ? { x: 20, y: 70, w: 880, h: 235 }
        : mode === "fleche-portee"
          ? { x: 20, y: 74, w: 620, h: 450 }
          : { x: 20, y: 74, w: 880, h: 450 };

    // Bornes du monde visibles.
    let tgtX = 0;
    let tgtY = 0;
    if (target?.kind === "panier") {
      tgtX = target.x + 0.8;
      tgtY = target.y - h + 0.6;
    } else if (target?.kind === "mur") {
      tgtX = target.x + 1;
      tgtY = target.top - h + 0.4;
    }
    const xMaxW = Math.max(X, OP, tgtX, 1) * 1.08;
    const yTopW = Math.max(yS, mode === "fleche-portee" ? yS2 : 0, tgtY, 0.4) * 1.12;
    const yMinW = -h - Math.max(0.15, 0.06 * (yTopW + h));
    const s = Math.min((R.w - 50) / xMaxW, (R.h - 26) / (yTopW - yMinW));
    const ox = R.x + 40;
    // Sol calé en bas de la zone (l'espace libre éventuel passe au-dessus).
    const oy = R.y + R.h - 14 + yMinW * s;
    const SX = (x: number) => ox + x * s;
    const SY = (y: number) => oy - y * s;

    // Sol ou eau.
    const gy = SY(-h);
    if (target?.kind === "eau") {
      ctx.fillStyle = "rgba(56,130,246,0.22)";
      ctx.fillRect(SX(0) + 4, gy, R.x + R.w - SX(0) - 4, R.y + R.h - gy + 10);
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(SX(0) + 4, gy);
      ctx.lineTo(R.x + R.w, gy);
      ctx.stroke();
      ctx.fillStyle = "#7FB2FF";
      ctx.font = SIM_FONT;
      ctx.fillText("eau", R.x + R.w - 40, gy + 20);
      // Toboggan : rampe qui se termine en O.
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(R.x, SY(0) - 70);
      ctx.quadraticCurveTo(SX(0) - 30, SY(0) + 12, SX(0), SY(0));
      ctx.stroke();
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(R.x, gy);
      ctx.lineTo(R.x + R.w, gy);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    if (h > 0) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.ground;
      ctx.beginPath();
      ctx.moveTo(SX(0), SY(0));
      ctx.lineTo(SX(0), gy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText(`h = ${fmt(h, 2)} m`, SX(0) + 8, (SY(0) + gy) / 2 + 24);
    }

    // Axes et graduations.
    drawArrow(ctx, R.x + 10, oy, R.x + R.w - 6, oy, C.textMuted);
    drawArrow(ctx, ox, Math.min(gy, R.y + R.h), ox, R.y + 2, C.textMuted);
    ctx.fillStyle = C.textMuted;
    ctx.font = "italic 15px ui-serif, Georgia, serif";
    ctx.fillText("x", R.x + R.w - 16, oy - 8);
    ctx.fillText("y", ox - 16, R.y + 14);
    ctx.fillText("O", ox - 18, oy + 16);
    const step = niceStep(xMaxW);
    ctx.font = "12px ui-sans-serif, system-ui";
    for (let k = 1; k * step < xMaxW; k++) {
      const xx = SX(k * step);
      ctx.strokeStyle = C.textMuted;
      ctx.beginPath();
      ctx.moveTo(xx, oy - 3);
      ctx.lineTo(xx, oy + 3);
      ctx.stroke();
      ctx.fillText(fmt(k * step, step < 1 ? 1 : 0), xx - 8, oy + 16);
    }

    // Cibles des exercices.
    if (target?.kind === "panier") {
      const hy = SY(target.y - h);
      ctx.strokeStyle = C.textMuted;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(SX(target.x + 0.45), gy);
      ctx.lineTo(SX(target.x + 0.45), hy - 0.9 * s);
      ctx.stroke();
      ctx.strokeStyle = C.vectorX;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(SX(target.x), hy, 0.225 * s, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.vectorX;
      ctx.font = SIM_FONT;
      ctx.fillText("C", SX(target.x) - 4, hy - 10);
    } else if (target?.kind === "mur") {
      ctx.fillStyle = C.ground;
      const wx = SX(target.x);
      ctx.fillRect(wx - 4, SY(target.top - h), 8, gy - SY(target.top - h));
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText(`mur H = ${fmt(target.top, 1)} m`, wx + 10, SY(target.top - h) + 4);
    }

    // Trajectoire complète (pointillés) et partie parcourue.
    const path = (a: number, v: number, tMax: number, upto: number) => {
      const cx = v * Math.cos(a);
      const cy = v * Math.sin(a);
      ctx.beginPath();
      for (let k = 0; k <= 160; k++) {
        const tt = (Math.min(upto, tMax) * k) / 160;
        const x = SX(cx * tt);
        const y = SY(-0.5 * g * tt * tt + cy * tt);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    path(rad, v0, tEnd, tEnd);
    ctx.setLineDash([]);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2.4;
    path(rad, v0, tEnd, tc);
    ctx.lineWidth = 1;

    // Chronophotographie : positions à intervalles égaux (x avance régulièrement).
    if (mode === "trajectoire") {
      const dt = tEnd / 14;
      for (let k = 1; k * dt <= tc + 1e-9; k++) {
        const tt = k * dt;
        const x = SX(vx * tt);
        const y = SY(-0.5 * g * tt * tt + vy0 * tt);
        ctx.fillStyle = C.ground;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.grid;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x, oy);
        ctx.lineTo(x, oy + 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Flèche et portée.
    if (mode === "fleche-portee") {
      const sx = SX(xS);
      const sy = SY(yS);
      ctx.strokeStyle = C.vectorY;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, oy);
      ctx.moveTo(sx, sy);
      ctx.lineTo(ox, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.vectorY;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText("S (flèche)", sx + 8, sy - 8);
      ctx.fillText("x_S", sx - 10, oy + 32);
      ctx.fillText("y_S", ox - 34, sy + 4);
      if (OP > 0.01) {
        ctx.fillStyle = C.vectorResult;
        ctx.beginPath();
        ctx.arc(SX(OP), oy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText("P", SX(OP) + 6, oy - 8);
        ctx.strokeStyle = C.vectorResult;
        ctx.beginPath();
        ctx.moveTo(ox, oy + 40);
        ctx.lineTo(SX(OP), oy + 40);
        ctx.stroke();
        ctx.fillText(`OP = ${fmt(OP, 2)} m`, (ox + SX(OP)) / 2 - 40, oy + 56);
      }
      // Angle complémentaire : même portée.
      if (Math.abs(alpha - 45) > 0.5) {
        const t2 = (2 * v0 * Math.sin(rad2)) / g;
        ctx.strokeStyle = C.vectorX;
        ctx.globalAlpha = 0.75;
        ctx.setLineDash([2, 5]);
        ctx.lineWidth = 2;
        path(rad2, v0, t2, t2);
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.vectorX;
        ctx.font = SIM_FONT;
        ctx.fillText(`90° − α = ${90 - alpha}°`, SX((v0 * Math.cos(rad2) * t2) / 2) + 8, SY(yS2) - 8);
      }
      // Encadré : portée en fonction de α.
      const G = { x: 676, y: 110, w: 210, h: 150 };
      const opMax = (v0 * v0) / g;
      ctx.strokeStyle = C.grid;
      ctx.strokeRect(G.x, G.y, G.w, G.h);
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText("Portée OP selon α", G.x, G.y - 12);
      ctx.strokeStyle = C.vectorResult;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let a = 0; a <= 90; a++) {
        const xg = G.x + (a / 90) * G.w;
        const yg = G.y + G.h - (Math.sin((2 * a * Math.PI) / 180) * G.h) * 0.92;
        if (a === 0) ctx.moveTo(xg, yg);
        else ctx.lineTo(xg, yg);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.textMuted;
      ctx.beginPath();
      ctx.moveTo(G.x + G.w / 2, G.y);
      ctx.lineTo(G.x + G.w / 2, G.y + G.h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(G.x + (alpha / 90) * G.w, G.y + G.h - Math.sin(2 * rad) * G.h * 0.92, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.textMuted;
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillText("0°", G.x - 4, G.y + G.h + 16);
      ctx.fillText("45°", G.x + G.w / 2 - 10, G.y + G.h + 16);
      ctx.fillText("90°", G.x + G.w - 14, G.y + G.h + 16);
      ctx.font = SIM_FONT;
      ctx.fillText(`max : v₀²/g = ${fmt(opMax, 1)} m`, G.x, G.y + G.h + 44);
      ctx.fillText("à α = 45°", G.x, G.y + G.h + 66);
      ctx.fillStyle = C.vectorX;
      ctx.fillText("α et 90° − α :", G.x, G.y + G.h + 104);
      ctx.fillText("même portée", G.x, G.y + G.h + 126);
    }

    // Projectile et vecteurs.
    const bx = SX(px);
    const by = SY(py);
    ctx.fillStyle = C.accent;
    ctx.shadowColor = C.accent;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (mode !== "fleche-portee") {
      const kv = 75 / Math.max(v0, 1);
      drawArrow(ctx, bx, by, bx + vx * kv, by, C.vectorX, "vₓ");
      drawArrow(ctx, bx, by, bx, by - vyc * kv, C.vectorY, "v_y");
      drawArrow(ctx, bx, by, bx + vx * kv, by - vyc * kv, C.textPrimary, "v");
      drawArrow(ctx, bx + 26, by + 8, bx + 26, by + 50, C.vectorResult, "g");
    } else {
      // Vecteur v₀ et angle α au point O.
      drawArrow(ctx, ox, oy, ox + 70 * Math.cos(rad), oy - 70 * Math.sin(rad), C.textPrimary, "v₀");
      ctx.strokeStyle = C.textMuted;
      ctx.beginPath();
      ctx.arc(ox, oy, 34, -rad, 0);
      ctx.stroke();
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText("α", ox + 40, oy - 8);
    }
    if (wallHit && tc >= tEnd) {
      ctx.fillStyle = C.vectorX;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText("choc contre le mur", bx - 150, by - 12);
    }

    // Graphes v(t) et position(t).
    if (mode === "horaires") {
      const graphs = [
        {
          x: 60,
          y: 352,
          title: "vitesses (m/s)",
          series: [
            { f: () => vx, color: C.vectorX, label: "vₓ" },
            { f: (tt: number) => -g * tt + vy0, color: C.vectorY, label: "v_y" },
          ],
        },
        {
          x: 510,
          y: 352,
          title: "coordonnées (m)",
          series: [
            { f: (tt: number) => vx * tt, color: C.vectorX, label: "x" },
            { f: (tt: number) => -0.5 * g * tt * tt + vy0 * tt, color: C.vectorY, label: "y" },
          ],
        },
      ];
      const gw = 360;
      const gh = 150;
      graphs.forEach((G) => {
        let lo = 0;
        let hi = 0;
        for (const sr of G.series)
          for (let k = 0; k <= 60; k++) {
            const v = sr.f((tEnd * k) / 60);
            lo = Math.min(lo, v);
            hi = Math.max(hi, v);
          }
        const pad = (hi - lo) * 0.08 + 0.1;
        const L = lo - pad;
        const U = hi + pad;
        const X2 = (tt: number) => G.x + (tt / tEnd) * gw;
        const Y2 = (v: number) => G.y + gh - ((v - L) / (U - L)) * gh;
        ctx.strokeStyle = C.grid;
        ctx.strokeRect(G.x, G.y, gw, gh);
        ctx.strokeStyle = C.ground;
        ctx.beginPath();
        ctx.moveTo(G.x, Y2(0));
        ctx.lineTo(G.x + gw, Y2(0));
        ctx.stroke();
        ctx.fillStyle = C.textPrimary;
        ctx.font = "600 14px ui-sans-serif, system-ui";
        ctx.fillText(G.title, G.x, G.y - 12);
        ctx.font = SIM_FONT;
        G.series.forEach((sr, i) => {
          ctx.fillStyle = sr.color;
          ctx.fillText(sr.label, G.x + 150 + i * 50, G.y - 12);
        });
        ctx.fillStyle = C.textMuted;
        ctx.fillText(fmt(hi, 1), G.x - 44, Y2(hi) + 5);
        ctx.fillText(fmt(lo, 1), G.x - 44, Y2(lo) + 5);
        ctx.fillText(`t (s) — ${fmt(tEnd, 2)}`, G.x + gw - 92, G.y + gh + 18);
        G.series.forEach((sr) => {
          ctx.strokeStyle = sr.color;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (let k = 0; k <= 160; k++) {
            const tt = (tc * k) / 160;
            if (k === 0) ctx.moveTo(X2(tt), Y2(sr.f(tt)));
            else ctx.lineTo(X2(tt), Y2(sr.f(tt)));
          }
          ctx.stroke();
          ctx.lineWidth = 1;
        });
      });
    }

    // Équations du mode.
    ctx.fillStyle = C.textPrimary;
    ctx.font = "600 17px ui-sans-serif, system-ui";
    const sgn = (v: number) => (v >= 0 ? "+" : "−");
    if (mode === "horaires") {
      ctx.fillText("a = g  :  aₓ = 0  ;  a_y = −g", 24, 28);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText(
        `vₓ = ${fmt(vx, 2)}  ;  v_y = −${fmt(g, 2)}·t ${sgn(vy0)} ${fmt(Math.abs(vy0), 2)}  ;  x = ${fmt(vx, 2)}·t  ;  y = −${fmt(g / 2, 2)}·t² ${sgn(vy0)} ${fmt(Math.abs(vy0), 2)}·t`,
        24,
        54
      );
    } else if (mode === "trajectoire") {
      const A = vx > 1e-9 ? g / (2 * vx * vx) : 0;
      ctx.fillText("Trajectoire : y = −g·x² / (2·v₀²·cos²α) + x·tan α  (parabole)", 24, 28);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText(`y = −${fmt(A, 4)}·x² ${sgn(Math.tan(rad))} ${fmt(Math.abs(Math.tan(rad)), 3)}·x     (points tous les ${fmt(tEnd / 14, 3)} s : x avance de façon régulière)`, 24, 54);
    } else {
      ctx.fillText("Flèche S (v_y = 0) et portée OP (retour à y = 0)", 24, 28);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText(
        `x_S = v₀²·sin2α/(2g) = ${fmt(xS, 2)} m  ;  y_S = v₀²·sin²α/(2g) = ${fmt(yS, 2)} m  ;  OP = v₀²·sin2α/g = ${fmt(OP, 2)} m`,
        24,
        54
      );
    }
  });

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!;
    setV0(p.v0);
    setAlpha(p.alpha);
    setH(p.h);
    setG(p.g);
    setTarget(p.target);
  };

  const v = Math.hypot(vx, vyc);
  return (
    <SimShell
      title="Projectile dans le champ de pesanteur"
      intro="Un projectile lancé avec une vitesse v₀ inclinée d'un angle α n'est soumis qu'à son poids : a = g. Le mouvement est uniforme selon Ox et uniformément varié selon Oy ; la trajectoire est une parabole, caractérisée par sa flèche et sa portée."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (t >= tEnd ? (setT(0), setRunning(true)) : setRunning((r) => !r))} />
          <GhostButton
            onClick={() => {
              setT(0);
              setRunning(true);
            }}
          >
            ⟲ Recommencer
          </GhostButton>
          <Segmented
            className="ms-auto"
            options={[
              { id: 0.25, label: "×0,25" },
              { id: 0.5, label: "×0,5" },
              { id: 1, label: "×1" },
            ]}
            value={speed}
            onChange={setSpeed}
          />
        </>
      }
      readouts={[
        { label: "t", value: `${fmt(tc, 2)} s` },
        { label: "x ; y", value: `${fmt(px, 2)} m ; ${fmt(py, 2)} m` },
        { label: "vₓ ; v_y", value: `${fmt(vx, 2)} ; ${fmt(vyc, 2)} m/s` },
        { label: "v", value: `${fmt(v, 2)} m/s` },
        { label: "Flèche S (t_S ; y_S)", value: `${fmt(tS, 2)} s ; ${fmt(yS, 2)} m${h > 0 ? ` (sol : ${fmt(h + yS, 2)} m)` : ""}` },
        { label: "Portée OP", value: `${fmt(OP, 2)} m` },
        { label: "Arrivée au sol", value: `x = ${fmt(X, 2)} m à ${fmt(tGround, 2)} s` },
        target ? { label: "Exercice", value: targetText } : { label: "x_S (abscisse du sommet)", value: `${fmt(xS, 2)} m` },
      ]}
      side={
        <>
          <Segmented
            options={[
              { id: "horaires", label: "Équations horaires" },
              { id: "trajectoire", label: "Trajectoire" },
              { id: "fleche-portee", label: "Flèche et portée" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className="rounded-2xl border border-[var(--sim-border)] px-3 py-2 text-start text-xs font-semibold text-[var(--sim-text-muted)] transition hover:border-[var(--sim-accent)] hover:text-[var(--sim-text)]"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Slider label="Vitesse initiale v₀" value={v0} unit="m/s" min={1} max={25} step={0.05} digits={2} onChange={setV0} />
          <Slider label="Angle de tir α" value={alpha} unit="°" min={0} max={89} step={1} onChange={setAlpha} />
          <Slider label="Hauteur du point de lancement h" value={h} unit="m" min={0} max={5} step={0.1} digits={1} onChange={setH} />
          <Segmented
            options={[
              { id: 9.8, label: "g = 9,8" },
              { id: 10, label: "g = 10" },
              { id: 1.62, label: "Lune 1,62" },
            ]}
            value={g}
            onChange={setG}
          />
          <Notes>
            <p>Système : le projectile, soumis à son seul poids. 2ᵉ loi de Newton : m·a = m·g, donc a = g.</p>
            <p>Projection : aₓ = 0 (mouvement rectiligne uniforme selon Ox), a_y = −g (uniformément varié selon Oy).</p>
            <p>En éliminant t = x/(v₀·cos α), on obtient l&apos;équation de la trajectoire : une parabole.</p>
            <p>Les préréglages reprennent les exercices du cours : ajustez v₀ ou α pour marquer le panier ou passer le mur.</p>
          </Notes>
        </>
      }
    />
  );
}
