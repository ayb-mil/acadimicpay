"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import {
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
   Cinématique du point : vecteurs position, vitesse, accélération et
   repère de Frenet. Pour chaque trajectoire, x(t), y(t) et leurs dérivées
   sont données exactement. Repère de Frenet (M, u, n) :
     u = v/‖v‖ ;  aₜ = a·u = dv/dt ;  aₙ = ‖a − aₜ·u‖ = v²/ρ ;
     n = (a − aₜ·u)/aₙ, dirigé vers le centre de courbure ; ρ = v²/aₙ.
   Échelle identique sur x et y pour ne pas déformer la trajectoire.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 540;
const M = { l: 60, r: 30, t: 70, b: 50 };

type Mode = "vecteurs" | "frenet";
const MODES = ["vecteurs", "frenet"] as const;

type Preset = {
  id: string;
  label: string;
  eq: [string, string];
  tMax: number;
  f: (t: number) => { x: number; y: number; vx: number; vy: number; ax: number; ay: number };
};

const G = 9.81;
const PRESETS: Preset[] = [
  {
    id: "exercice",
    label: "Exercice du cours",
    eq: ["x(t) = t + 3", "y(t) = t² − t + 3"],
    tMax: 3,
    f: (t) => ({ x: t + 3, y: t * t - t + 3, vx: 1, vy: 2 * t - 1, ax: 0, ay: 2 }),
  },
  {
    id: "circ-uniforme",
    label: "Circulaire uniforme",
    eq: ["x(t) = 2·cos(1,2·t)", "y(t) = 2·sin(1,2·t)"],
    tMax: (2 * Math.PI) / 1.2,
    f: (t) => {
      const R = 2;
      const w = 1.2;
      return {
        x: R * Math.cos(w * t),
        y: R * Math.sin(w * t),
        vx: -R * w * Math.sin(w * t),
        vy: R * w * Math.cos(w * t),
        ax: -R * w * w * Math.cos(w * t),
        ay: -R * w * w * Math.sin(w * t),
      };
    },
  },
  {
    id: "circ-acceleree",
    label: "Circulaire accélérée",
    eq: ["x(t) = 2·cos(0,25·t²)", "y(t) = 2·sin(0,25·t²)"],
    tMax: Math.sqrt((4 * Math.PI) / 0.5),
    f: (t) => {
      const R = 2;
      const al = 0.5;
      const th = 0.5 * al * t * t;
      const w = al * t;
      return {
        x: R * Math.cos(th),
        y: R * Math.sin(th),
        vx: -R * Math.sin(th) * w,
        vy: R * Math.cos(th) * w,
        ax: -R * Math.cos(th) * w * w - R * Math.sin(th) * al,
        ay: -R * Math.sin(th) * w * w + R * Math.cos(th) * al,
      };
    },
  },
  {
    id: "projectile",
    label: "Parabolique",
    eq: ["x(t) = 4·t", "y(t) = 6,93·t − 4,905·t²"],
    tMax: (2 * 8 * Math.sin(Math.PI / 3)) / G,
    f: (t) => {
      const c = 8 * Math.cos(Math.PI / 3);
      const s = 8 * Math.sin(Math.PI / 3);
      return { x: c * t, y: s * t - 0.5 * G * t * t, vx: c, vy: s - G * t, ax: 0, ay: -G };
    },
  },
];

function niceStep(span: number) {
  const raw = span / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}

export default function CinematiqueFrenetPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "vecteurs");
  const [presetId, setPresetId] = useState("exercice");
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const [tRaw, setT] = useSimClock(running, speed);
  const preset = PRESETS.find((p) => p.id === presetId)!;
  const t = tRaw % preset.tMax;

  const s = preset.f(t);
  const v = Math.hypot(s.vx, s.vy);
  const a = Math.hypot(s.ax, s.ay);
  const ux = s.vx / v;
  const uy = s.vy / v;
  const at = s.ax * ux + s.ay * uy;
  const anx = s.ax - at * ux;
  const any = s.ay - at * uy;
  const an = Math.hypot(anx, any);
  const rho = an > 1e-6 ? (v * v) / an : Infinity;

  useEffect(() => {
    setT(0);
  }, [presetId, setT]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    // Bornes de la trajectoire (avec l'origine O), échelle identique en x et y.
    let xmin = 0;
    let xmax = 0;
    let ymin = 0;
    let ymax = 0;
    let vmax = 0;
    let amax = 0;
    for (let i = 0; i <= 200; i++) {
      const p = preset.f((preset.tMax * i) / 200);
      xmin = Math.min(xmin, p.x);
      xmax = Math.max(xmax, p.x);
      ymin = Math.min(ymin, p.y);
      ymax = Math.max(ymax, p.y);
      vmax = Math.max(vmax, Math.hypot(p.vx, p.vy));
      amax = Math.max(amax, Math.hypot(p.ax, p.ay));
    }
    const padX = (xmax - xmin) * 0.12 + 0.5;
    const padY = (ymax - ymin) * 0.12 + 0.5;
    xmin -= padX;
    xmax += padX;
    ymin -= padY;
    ymax += padY;
    const k = Math.min((W - M.l - M.r) / (xmax - xmin), (H - M.t - M.b) / (ymax - ymin));
    const ox = M.l + ((W - M.l - M.r) - k * (xmax - xmin)) / 2;
    const oy = M.t + ((H - M.t - M.b) - k * (ymax - ymin)) / 2;
    const X = (x: number) => ox + (x - xmin) * k;
    const Y = (y: number) => oy + (ymax - y) * k;

    // Grille et axes.
    const step = niceStep(Math.max(xmax - xmin, ymax - ymin));
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    for (let gx = Math.ceil(xmin / step) * step; gx <= xmax; gx += step) {
      ctx.beginPath();
      ctx.moveTo(X(gx), Y(ymin));
      ctx.lineTo(X(gx), Y(ymax));
      ctx.stroke();
      ctx.fillText(fmt(gx, step < 1 ? 1 : 0), X(gx) + 3, Y(0) + 16);
    }
    for (let gy = Math.ceil(ymin / step) * step; gy <= ymax; gy += step) {
      ctx.beginPath();
      ctx.moveTo(X(xmin), Y(gy));
      ctx.lineTo(X(xmax), Y(gy));
      ctx.stroke();
      if (Math.abs(gy) > 1e-9) ctx.fillText(fmt(gy, step < 1 ? 1 : 0), X(0) + 5, Y(gy) - 4);
    }
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(xmin), Y(0));
    ctx.lineTo(X(xmax), Y(0));
    ctx.moveTo(X(0), Y(ymin));
    ctx.lineTo(X(0), Y(ymax));
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillText("x (m)", X(xmax) - 40, Y(0) - 8);
    ctx.fillText("y (m)", X(0) + 8, Y(ymax) + 14);
    ctx.fillText("O", X(0) - 14, Y(0) + 16);

    // Trajectoire : entière en pointillés, parcourue en trait plein.
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const p = preset.f((preset.tMax * i) / 300);
      if (i === 0) ctx.moveTo(X(p.x), Y(p.y));
      else ctx.lineTo(X(p.x), Y(p.y));
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const p = preset.f((t * i) / 300);
      if (i === 0) ctx.moveTo(X(p.x), Y(p.y));
      else ctx.lineTo(X(p.x), Y(p.y));
    }
    ctx.stroke();
    ctx.lineWidth = 1;

    const mx = X(s.x);
    const my = Y(s.y);
    const kv = 120 / vmax;
    const ka = amax > 0 ? 100 / amax : 0;

    if (mode === "vecteurs") {
      ctx.setLineDash([4, 4]);
      drawArrow(ctx, X(0), Y(0), mx, my, SIM_COLORS.textMuted, "OM");
      ctx.setLineDash([]);
      drawArrow(ctx, mx, my, mx + s.vx * kv, my - s.vy * kv, SIM_COLORS.accent, "v");
      if (a > 1e-6) drawArrow(ctx, mx, my, mx + s.ax * ka, my - s.ay * ka, SIM_COLORS.vectorX, "a");
    } else {
      // Vecteurs unitaires u et n, puis décomposition de a.
      const L = 60;
      drawArrow(ctx, mx, my, mx + ux * L, my - uy * L, SIM_COLORS.vectorResult, "u");
      if (an > 1e-6) drawArrow(ctx, mx, my, mx + (anx / an) * L, my - (any / an) * L, SIM_COLORS.vectorY, "n");
      if (a > 1e-6) {
        const ex = mx + s.ax * ka;
        const ey = my - s.ay * ka;
        drawArrow(ctx, mx, my, ex, ey, SIM_COLORS.vectorX, "a");
        const tx = mx + at * ux * ka;
        const ty = my - at * uy * ka;
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = SIM_COLORS.vectorX;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(tx, ty);
        ctx.moveTo(ex, ey);
        ctx.lineTo(mx + anx * ka, my - any * ka);
        ctx.stroke();
        ctx.setLineDash([]);
        if (Math.abs(at) * ka > 4) drawArrow(ctx, mx, my, tx, ty, SIM_COLORS.vectorX, "aₜ");
        if (an * ka > 4) drawArrow(ctx, mx, my, mx + anx * ka, my - any * ka, SIM_COLORS.vectorY, "aₙ");
      }
      // Cercle de courbure (s'il tient à l'écran).
      if (Number.isFinite(rho) && rho * k < 2000) {
        const cx = mx + (anx / an) * rho * k;
        const cy = my - (any / an) * rho * k;
        ctx.strokeStyle = SIM_COLORS.vectorY;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, rho * k, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "600 14px ui-sans-serif, system-ui";
    ctx.fillText("M", mx + 8, my + 18);

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    ctx.fillText(mode === "frenet" ? "Repère de Frenet (M, u, n)" : "Vecteurs position, vitesse et accélération", 24, 32);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "italic 15px ui-serif, Georgia, serif";
    ctx.fillText(`${preset.eq[0]}   ;   ${preset.eq[1]}`, 24, 56);
  });

  const rhoText = Number.isFinite(rho) && rho < 1e4 ? `${fmt(rho, 2)} m` : "∞ (droite)";

  return (
    <SimShell
      title="Vecteurs vitesse, accélération et repère de Frenet"
      intro="Le vecteur vitesse est la dérivée du vecteur position, le vecteur accélération la dérivée du vecteur vitesse. Dans le repère de Frenet, l'accélération se décompose en une composante tangentielle aₜ = dv/dt et une composante normale aₙ = v²/ρ."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => setRunning((r) => !r)} />
          <Segmented
            options={[
              { id: "vecteurs", label: "Vecteurs" },
              { id: "frenet", label: "Repère de Frenet" },
            ]}
            value={mode}
            onChange={setMode}
          />
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
        { label: "t", value: `${fmt(t, 2)} s` },
        { label: "Position (x ; y)", value: `(${fmt(s.x, 2)} ; ${fmt(s.y, 2)}) m` },
        { label: "Vitesse v = √(ẋ² + ẏ²)", value: `${fmt(v, 2)} m/s` },
        { label: "Accélération a", value: `${fmt(a, 2)} m/s²` },
        { label: "aₜ = dv/dt", value: `${fmt(at, 2)} m/s²` },
        { label: "aₙ = v²/ρ", value: `${fmt(an, 2)} m/s²` },
        { label: "Rayon de courbure ρ", value: rhoText },
        { label: "Mouvement", value: Math.abs(at) < 1e-3 ? "uniforme" : at > 0 ? "accéléré" : "retardé" },
      ]}
      side={
        <>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[var(--sim-text-muted)]">Trajectoire</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  aria-pressed={presetId === p.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    presetId === p.id
                      ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                      : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Slider
            label="Instant t"
            value={t}
            unit="s"
            min={0}
            max={preset.tMax}
            step={preset.tMax / 300}
            digits={2}
            onChange={(val) => {
              setRunning(false);
              setT(val);
            }}
          />
          <Notes>
            <p>v = dOG/dt : le vecteur vitesse est tangent à la trajectoire.</p>
            <p>a = dv/dt. Dans le repère de Frenet : aₜ = dv/dt (variation de la valeur de la vitesse) et aₙ = v²/ρ (changement de direction).</p>
            <p>Mouvement accéléré si aₜ &gt; 0, retardé si aₜ &lt; 0, uniforme si aₜ = 0 (cas du cercle uniforme : seule aₙ subsiste).</p>
          </Notes>
        </>
      }
      footnote="« Exercice du cours » reprend l'exercice 1 de la séance : x = t + 3 et y = t² − t + 3 (trajectoire parabolique)."
    />
  );
}
