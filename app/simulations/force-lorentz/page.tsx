"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import { GhostButton, Notes, Segmented, SimCanvas, SimShell, Slider, SIM_FONT, drawArrow, fmt, prepareCanvas, sci, useModeParam } from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Champ magnétique uniforme et force de Lorentz.
   • Bobines de Helmholtz (N spires, rayon R, écartées de R) :
       B(x) = μ₀·N·I·R²/2 · [ (R² + (x − R/2)²)^(−3/2) + (R² + (x + R/2)²)^(−3/2) ]
       au centre : B₀ = (4/5)^(3/2) · μ₀·N·I / R  → champ quasi uniforme entre les bobines.
   • Force de Lorentz : F = q·v ∧ B ; F = |q|·v·B·sin(B, v) ;
     (q·v, B, F) forment un trièdre direct (règle de la main droite).
   Repère : x vers la droite, y vers le haut, z vers l'observateur (⊙ = +z, ⊗ = −z).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 540;
const MODES = ["champ", "force", "regle"] as const;
type Mode = (typeof MODES)[number];

const MU0 = 4 * Math.PI * 1e-7;
const N_SPIRES = 130;
const R_BOB = 0.15;
const E = 1.602e-19;

const PARTICLES = {
  proton: { label: "proton", q: E },
  electron: { label: "électron", q: -E },
  alpha: { label: "particule α (He²⁺)", q: 2 * E },
} as const;
type PKey = keyof typeof PARTICLES;

// Exemples du tableau du cours : on cherche l'élément « inconnu ».
const EXAMPLES = [
  { q: -1, phi: 0, b: 1, unknown: "B" as const },
  { q: -1, phi: 0, b: 1, unknown: "v" as const },
  { q: -1, phi: 0, b: 1, unknown: "F" as const },
  { q: -1, phi: 90, b: 1, unknown: "F" as const },
  { q: 1, phi: 90, b: 1, unknown: "F" as const },
];

function dirName(dx: number, dy: number) {
  const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  const names = ["vers la droite", "en haut à droite", "vers le haut", "en haut à gauche", "vers la gauche", "en bas à gauche", "vers le bas", "en bas à droite"];
  return names[Math.round(a / 45) % 8];
}

function drawFieldSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, out: boolean, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
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

export default function ForceLorentzPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "champ");
  // Mode « champ ».
  const [current, setCurrent] = useState(2);
  const [sense, setSense] = useState<1 | -1>(1);
  // Mode « force ».
  const [pk, setPk] = useState<PKey>("proton");
  const [theta, setTheta] = useState(90);
  const [vMant, setVMant] = useState(2);
  const [bField, setBField] = useState(0.1);
  // Mode « règle ».
  const [qSign, setQSign] = useState<1 | -1>(-1);
  const [phi, setPhi] = useState(0);
  const [bSign, setBSign] = useState<1 | -1>(1);
  const [ex, setEx] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [phase, setPhase] = useState(0);

  // Petite animation (ondulation des lignes de champ).
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      setPhase(now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const B0 = Math.pow(0.8, 1.5) * MU0 * N_SPIRES * current / R_BOB;
  const Bx = (x: number) =>
    ((MU0 * N_SPIRES * current * R_BOB * R_BOB) / 2) *
    (Math.pow(R_BOB * R_BOB + (x - R_BOB / 2) ** 2, -1.5) + Math.pow(R_BOB * R_BOB + (x + R_BOB / 2) ** 2, -1.5));

  const P = PARTICLES[pk];
  const v = vMant * 1e6;
  const thRad = (theta * Math.PI) / 180;
  const F = Math.abs(P.q) * v * bField * Math.sin(thRad);

  // Règle : F = q·v ∧ B, v = (cos φ, sin φ, 0), B = (0, 0, b).
  const phR = (phi * Math.PI) / 180;
  const Fdx = qSign * bSign * Math.sin(phR);
  const Fdy = -qSign * bSign * Math.cos(phR);

  const pickExample = (i: number) => {
    const e = EXAMPLES[i];
    setQSign(e.q as 1 | -1);
    setPhi(e.phi);
    setBSign(e.b as 1 | -1);
    setEx(i);
    setReveal(false);
  };
  const hidden = (what: "B" | "v" | "F") => ex !== null && EXAMPLES[ex].unknown === what && !reveal;
  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setEx(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const C = SIM_COLORS;

    if (mode === "champ") {
      const cy = 238;
      const x1 = 300;
      const x2 = 430;
      const ry = 130;
      const rx = 26;
      const alpha = Math.min(1, 0.25 + current / 4);
      const green = C.vectorResult;
      // Lignes de champ.
      ctx.globalAlpha = current > 0 ? alpha : 0.15;
      for (let k = -3; k <= 3; k++) {
        const yk = cy + k * 38;
        ctx.strokeStyle = green;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x1 - 140, cy + k * 38 * 1.9);
        ctx.quadraticCurveTo(x1 - 50, yk, x1, yk);
        ctx.lineTo(x2, yk);
        ctx.quadraticCurveTo(x2 + 50, yk, x2 + 140, cy + k * 38 * 1.9);
        ctx.stroke();
        if (current > 0) {
          const off = ((phase * 40) % 50) * sense;
          for (let xa = x1 + 10; xa < x2 - 10; xa += 50) {
            const xx = xa + ((off + 50) % 50);
            if (xx > x2 - 8) continue;
            const d = sense * 7;
            ctx.fillStyle = green;
            ctx.beginPath();
            ctx.moveTo(xx + d, yk);
            ctx.lineTo(xx - d, yk - 5);
            ctx.lineTo(xx - d, yk + 5);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
      // Bobines (ellipses) et sens du courant.
      for (const xc of [x1, x2]) {
        ctx.strokeStyle = "#C08A4E";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.ellipse(xc, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#F87171";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(xc, cy, rx + 8, ry + 8, 0, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        // Flèche du courant sur la partie avant (vue de l'avant : sens trigo si B vers la droite).
        const ang = sense > 0 ? Math.PI * 0.15 : Math.PI * 0.85;
        const ax = xc + (rx + 8) * Math.cos(ang);
        const ay = cy + (ry + 8) * Math.sin(ang);
        ctx.fillStyle = "#F87171";
        ctx.beginPath();
        ctx.moveTo(ax + (sense > 0 ? 8 : -8), ay - 10);
        ctx.lineTo(ax - 6, ay + 4);
        ctx.lineTo(ax + 8, ay + 6);
        ctx.closePath();
        ctx.fill();
        ctx.font = "italic 600 15px ui-serif, Georgia, serif";
        ctx.fillText("I", xc - 4, cy + ry + 30);
      }
      ctx.lineWidth = 1;
      drawArrow(ctx, 330, cy - ry - 22, 330 + sense * 70, cy - ry - 22, green, "B");
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("Bobines : N = 130 spires, R = 15 cm", 650, 500);

      // Profil B(x) sur l'axe.
      const G = { x: 150, y: 442, w: 430, h: 72 };
      ctx.strokeStyle = C.grid;
      ctx.strokeRect(G.x, G.y, G.w, G.h);
      const xmin = -1.6 * R_BOB;
      const xmax = 1.6 * R_BOB;
      const bMax = Bx(0) || 1;
      ctx.strokeStyle = green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k <= 120; k++) {
        const xx = xmin + ((xmax - xmin) * k) / 120;
        const gx = G.x + (k / 120) * G.w;
        const gy = G.y + G.h - (current > 0 ? (Bx(xx) / bMax) * G.h * 0.85 : 0);
        if (k === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      // Repères des bobines sur le profil.
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.textMuted;
      for (const xb of [-R_BOB / 2, R_BOB / 2]) {
        const gx = G.x + ((xb - xmin) / (xmax - xmin)) * G.w;
        ctx.beginPath();
        ctx.moveTo(gx, G.y);
        ctx.lineTo(gx, G.y + G.h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText("B le long de l'axe : plateau entre les bobines = champ uniforme", G.x, G.y - 10);

      // Vue de face.
      const out = sense > 0;
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText("Représentation dans le plan", 640, 100);
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("(observateur placé à droite,", 640, 124);
      ctx.fillText(" regardant vers les bobines)", 640, 144);
      ctx.strokeStyle = C.grid;
      ctx.strokeRect(650, 170, 230, 200);
      if (current > 0)
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 4; j++) drawFieldSymbol(ctx, 680 + i * 57, 198 + j * 48, out, 11, green);
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 16px ui-sans-serif, system-ui";
      ctx.fillText(current > 0 ? (out ? "⊙ B : vers l'avant" : "⊗ B : vers l'arrière") : "I = 0 : pas de champ", 650, 400);
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("Inversez le courant :", 650, 430);
      ctx.fillText("B change de sens.", 650, 452);

      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 17px ui-sans-serif, system-ui";
      ctx.fillText("Champ magnétique uniforme : même direction, même sens, même valeur", 24, 30);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText(`Au centre : B = (4/5)^(3/2)·μ₀·N·I/R = ${sci(B0, 2)} T  (unité : le tesla, T)`, 24, 54);
      return;
    }

    if (mode === "force") {
      const cx = 290;
      const cy = 350;
      const s = 195;
      const ca = Math.cos((35 * Math.PI) / 180) * 0.55;
      const sa = Math.sin((35 * Math.PI) / 180) * 0.55;
      const Pj = (x: number, y: number, z: number) => [cx + (x + y * ca) * s, cy - (z + y * sa) * s] as const;
      // Axes.
      const axes: [number, number, number, string][] = [
        [1.25, 0, 0, "x"],
        [0, 1.3, 0, "y"],
        [0, 0, 1.25, "z"],
      ];
      for (const [x, y, z, n] of axes) {
        const [ax, ay] = Pj(-x * 0.25, -y * 0.25, -z * 0.25);
        const [bx, by] = Pj(x, y, z);
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.textMuted;
        ctx.font = "italic 14px ui-serif, Georgia, serif";
        ctx.fillText(n, bx + 4, by - 4);
      }
      // Plan (B, v).
      const corners = [Pj(-0.15, 0, -0.15), Pj(1.1, 0, -0.15), Pj(1.1, 0, 1.1), Pj(-0.15, 0, 1.1)];
      ctx.fillStyle = "rgba(155,123,255,0.07)";
      ctx.beginPath();
      corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.textMuted;
      ctx.font = "13px ui-sans-serif, system-ui";
      ctx.fillText("plan (B, v)", corners[1][0] - 70, corners[1][1] - 6);

      const [ox, oy] = Pj(0, 0, 0);
      const [bx, by] = Pj(0, 0, 0.95);
      drawArrow(ctx, ox, oy, bx, by, C.vectorY, "B");
      const [vx, vy] = Pj(Math.sin(thRad), 0, Math.cos(thRad));
      drawArrow(ctx, ox, oy, vx, vy, C.accent, "v");
      if (P.q < 0) {
        const [qx, qy] = Pj(-Math.sin(thRad) * 0.8, 0, -Math.cos(thRad) * 0.8);
        ctx.setLineDash([5, 4]);
        drawArrow(ctx, ox, oy, qx, qy, C.vectorResult, "q·v");
        ctx.setLineDash([]);
      }
      // Angle θ entre B et v.
      ctx.strokeStyle = C.textMuted;
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const a = (thRad * k) / 30;
        const [x, y] = Pj(Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const [tx, ty] = Pj(Math.sin(thRad / 2) * 0.38, 0, Math.cos(thRad / 2) * 0.38);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText("θ", tx + 2, ty);
      // F = q·v ∧ B = q·v·B·(0, −sin θ, 0).
      const fl = -Math.sign(P.q) * Math.sin(thRad) * 1.1;
      if (Math.abs(fl) > 0.02) {
        const [fx, fy] = Pj(0, fl, 0);
        drawArrow(ctx, ox, oy, fx, fy, C.vectorX, "F");
      }
      ctx.fillStyle = C.accent;
      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ox, oy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Encadré explicatif.
      const L = 620;
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText("Caractéristiques de F", L, 110);
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      const lines = [
        "• direction : ⊥ au plan (B, v)",
        "• sens : (q·v, B, F) trièdre direct",
        "  (règle de la main droite)",
        `• intensité : |q|·v·B·sin θ`,
        `  sin θ = ${fmt(Math.sin(thRad), 3)}`,
        `  F = ${sci(F, 2)} N`,
        "",
        theta === 0 || theta === 180 ? "v ∥ B : F = 0, pas de déviation" : theta === 90 ? "v ⊥ B : F est maximale" : "",
      ];
      lines.forEach((l, i) => ctx.fillText(l, L, 140 + i * 26));
      if (P.q < 0) {
        ctx.fillStyle = C.vectorResult;
        ctx.fillText("q < 0 : q·v est opposé à v", L, 370);
      }

      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 17px ui-sans-serif, system-ui";
      ctx.fillText("Force de Lorentz : F = q·v ∧ B", 24, 30);
      ctx.fillStyle = C.textMuted;
      ctx.font = "italic 15px ui-serif, Georgia, serif";
      ctx.fillText(`${P.label} : q = ${sci(P.q, 2)} C ; v = ${sci(v, 2)} m/s ; B = ${fmt(bField, 2)} T ; θ = (B, v) = ${theta}°`, 24, 54);
      return;
    }

    // Mode « règle » : plan de la figure ⊥ B.
    const cx = 310;
    const cy = 300;
    const e = ex !== null ? EXAMPLES[ex] : null;
    const hide = (what: "B" | "v" | "F") => e !== null && e.unknown === what && !reveal;
    ctx.strokeStyle = C.grid;
    ctx.strokeRect(40, 80, 540, 440);
    if (!hide("B")) {
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 7; j++) {
          const x = 70 + i * 60;
          const y = 110 + j * 62;
          if (Math.hypot(x - cx, y - cy) < 150 || (i === 0 && j === 0)) continue;
          drawFieldSymbol(ctx, x, y, bSign > 0, 9, "rgba(155,123,255,0.55)");
        }
      drawFieldSymbol(ctx, 80, 110, bSign > 0, 13, C.vectorY);
      ctx.fillStyle = C.vectorY;
      ctx.font = "italic 600 16px ui-serif, Georgia, serif";
      ctx.fillText("B", 100, 116);
    } else {
      ctx.fillStyle = C.vectorY;
      ctx.font = "600 34px ui-sans-serif, system-ui";
      ctx.fillText("B ?", 70, 130);
    }
    const L = 120;
    const vxp = Math.cos(phR) * L;
    const vyp = -Math.sin(phR) * L;
    if (!hide("v")) {
      drawArrow(ctx, cx, cy, cx + vxp, cy + vyp, C.accent, "v");
      ctx.setLineDash([5, 4]);
      drawArrow(ctx, cx, cy, cx + qSign * vxp * 0.75, cy + qSign * vyp * 0.75, C.vectorResult, "q·v");
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = C.accent;
      ctx.font = "600 30px ui-sans-serif, system-ui";
      ctx.fillText("v ?", cx + 40, cy + 70);
    }
    if (!hide("F")) drawArrow(ctx, cx, cy, cx + Fdx * L, cy - Fdy * L, C.vectorX, "F");
    else {
      ctx.fillStyle = C.vectorX;
      ctx.font = "600 30px ui-sans-serif, system-ui";
      ctx.fillText("F ?", cx - 90, cy - 50);
    }
    ctx.fillStyle = qSign > 0 ? C.vectorX : C.accent;
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = C.onAccent;
    ctx.font = "700 14px ui-sans-serif, system-ui";
    ctx.fillText(qSign > 0 ? "+" : "−", cx - 4, cy + 5);

    const X0 = 610;
    ctx.fillStyle = C.textPrimary;
    ctx.font = "600 15px ui-sans-serif, system-ui";
    ctx.fillText("Règle de la main droite", X0, 110);
    ctx.fillStyle = C.textMuted;
    ctx.font = SIM_FONT;
    ["Main droite tendue :", "• les doigts dans le sens de q·v", "• la paume tournée vers B", "• le pouce donne le sens de F"].forEach((l, i) =>
      ctx.fillText(l, X0, 140 + i * 24)
    );
    ctx.fillText(`q ${qSign > 0 ? "> 0 : q·v a le sens de v" : "< 0 : q·v est opposé à v"}`, X0, 260);
    ctx.fillText(`B ${bSign > 0 ? "⊙ : sort du plan" : "⊗ : entre dans le plan"}`, X0, 286);
    if (e !== null) {
      ctx.fillStyle = C.textPrimary;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText(`Exemple ${ex! + 1} du cours : trouver ${e.unknown}`, X0, 340);
      ctx.font = SIM_FONT;
      ctx.fillStyle = reveal ? C.vectorResult : C.textMuted;
      const answer =
        e.unknown === "B" ? `B ${bSign > 0 ? "⊙ (sortant)" : "⊗ (entrant)"}` : e.unknown === "v" ? `v ${dirName(Math.cos(phR), Math.sin(phR))}` : `F ${dirName(Fdx, Fdy)}`;
      ctx.fillText(reveal ? `Réponse : ${answer}` : "Réfléchissez, puis affichez la réponse.", X0, 368);
    } else {
      ctx.fillStyle = C.vectorX;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText(`F ${dirName(Fdx, Fdy)}`, X0, 340);
      ctx.fillStyle = C.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("F ⊥ v : elle courbe la trajectoire", X0, 368);
      ctx.fillText("sans changer la valeur de v.", X0, 392);
    }

    ctx.fillStyle = C.textPrimary;
    ctx.font = "600 17px ui-sans-serif, system-ui";
    ctx.fillText("Sens de la force de Lorentz (B perpendiculaire au plan de la figure)", 24, 30);
    ctx.fillStyle = C.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText("⊙ : B vers l'avant (vers vous)   ;   ⊗ : B vers l'arrière", 24, 54);
  });

  const modeSel = (
    <Segmented
      options={[
        { id: "champ", label: "Champ uniforme" },
        { id: "force", label: "Force de Lorentz" },
        { id: "regle", label: "Main droite" },
      ]}
      value={mode}
      onChange={setMode}
    />
  );

  const readouts =
    mode === "champ"
      ? [
          { label: "Intensité I", value: `${fmt(current, 2)} A` },
          { label: "B au centre", value: `${sci(B0, 2)} T` },
          { label: "B (mT)", value: `${fmt(B0 * 1000, 2)} mT` },
          { label: "Représentation", value: current > 0 ? (sense > 0 ? "⊙ (vers l'avant)" : "⊗ (vers l'arrière)") : "—" },
        ]
      : mode === "force"
        ? [
            { label: "Charge q", value: `${sci(P.q, 2)} C` },
            { label: "θ = (B, v)", value: `${theta}°` },
            { label: "sin θ", value: fmt(Math.sin(thRad), 3) },
            { label: "F = |q|·v·B·sin θ", value: `${sci(F, 2)} N` },
          ]
        : [
            { label: "Signe de q", value: qSign > 0 ? "q > 0" : "q < 0" },
            { label: "B", value: hidden("B") ? "?" : bSign > 0 ? "⊙ sortant" : "⊗ entrant" },
            { label: "v", value: hidden("v") ? "?" : dirName(Math.cos(phR), Math.sin(phR)) },
            { label: "F", value: hidden("F") ? "?" : dirName(Fdx, Fdy) },
          ];

  return (
    <SimShell
      title="Champ magnétique et force de Lorentz"
      intro="Entre deux bobines de Helmholtz, le champ magnétique est uniforme. Une particule de charge q qui s'y déplace à la vitesse v subit la force de Lorentz F = q·v ∧ B, perpendiculaire à v et à B, d'intensité |q|·v·B·sin(B, v)."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        mode === "regle" ? (
          <>
            {EXAMPLES.map((_, i) => (
              <GhostButton key={i} onClick={() => pickExample(i)}>
                Exemple {i + 1}
              </GhostButton>
            ))}
            <GhostButton onClick={() => setReveal(true)}>Afficher la réponse</GhostButton>
          </>
        ) : (
          <p className="text-xs text-[var(--sim-text-muted)]">
            {mode === "champ" ? "Faites varier l'intensité et le sens du courant." : "Faites tourner v autour de B et changez de particule."}
          </p>
        )
      }
      readouts={readouts}
      side={
        <>
          {modeSel}
          {mode === "champ" && (
            <>
              <Slider label="Intensité du courant I" value={current} unit="A" min={0} max={5} step={0.1} digits={1} onChange={setCurrent} />
              <Segmented
                options={[
                  { id: 1, label: "Courant sens 1" },
                  { id: -1, label: "Courant inversé" },
                ]}
                value={sense}
                onChange={setSense}
              />
              <Notes>
                <p>Un champ magnétique est uniforme s&apos;il garde la même direction, le même sens et la même valeur en tout point.</p>
                <p>B est proportionnel à l&apos;intensité I ; son sens dépend du sens du courant (règle de la main droite).</p>
                <p>B perpendiculaire à la feuille : ⊙ s&apos;il est dirigé vers l&apos;avant, ⊗ vers l&apos;arrière.</p>
              </Notes>
            </>
          )}
          {mode === "force" && (
            <>
              <Segmented
                options={(Object.keys(PARTICLES) as PKey[]).map((k) => ({ id: k, label: PARTICLES[k].label }))}
                value={pk}
                onChange={setPk}
              />
              <Slider label="Angle θ = (B, v)" value={theta} unit="°" min={0} max={180} step={5} onChange={setTheta} />
              <Slider label="Vitesse v" value={vMant} unit="·10⁶ m/s" min={0.5} max={10} step={0.5} digits={1} onChange={setVMant} />
              <Slider label="Champ B" value={bField} unit="T" min={0.01} max={1} step={0.01} digits={2} onChange={setBField} />
              <Notes>
                <p>F est perpendiculaire à la fois à v et à B : elle ne travaille pas.</p>
                <p>F est nulle si v est parallèle à B (θ = 0° ou 180°), maximale si v ⊥ B.</p>
              </Notes>
            </>
          )}
          {mode === "regle" && (
            <>
              <Segmented
                options={[
                  { id: 1, label: "q > 0" },
                  { id: -1, label: "q < 0" },
                ]}
                value={qSign}
                onChange={touch(setQSign)}
              />
              <Segmented
                options={[
                  { id: 1, label: "⊙ B sortant" },
                  { id: -1, label: "⊗ B entrant" },
                ]}
                value={bSign}
                onChange={touch(setBSign)}
              />
              <Slider label="Direction de v" value={phi} unit="°" min={0} max={345} step={15} onChange={touch(setPhi)} />
              <Notes>
                <p>Les exemples 1 à 5 reprennent le tableau du cours : l&apos;élément inconnu est remplacé par « ? ».</p>
                <p>Inverser le signe de q, ou le sens de B, inverse le sens de F.</p>
              </Notes>
            </>
          )}
        </>
      }
    />
  );
}
