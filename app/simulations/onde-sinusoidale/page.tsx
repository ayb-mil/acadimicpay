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
  fmt,
  prepareCanvas,
  useModeParam,
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Onde mécanique progressive sinusoïdale.
   La source S (x = 0) vibre à la fréquence f depuis t = 0 ; le front avance
   à la célérité v. Pour x ≤ v·t : y(x, t) = A·sin(2πf(t − x/v)).
   λ = v·T = v/f ; deux points distants de d vibrent en phase si d/λ est
   entier, en opposition de phase si d/λ est demi-entier.
   Milieu dispersif (surface de l'eau) : relation des ondes capillaires-
   gravitaires en eau profonde, ω² = g·k + (σ/ρ)·k³, résolue par Newton.
   Corde et air (son) : célérité indépendante de f (non dispersifs).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 560;
const PL = 60;
const PW = 820;
const TOP = { y: 70, h: 190 };
const BOT = { y: 330, h: 190 };

type Medium = "corde" | "eau" | "air";
const MEDIA = ["corde", "eau", "air"] as const;

const G = 9.81;
const SIGMA_RHO = 7.28e-5;

function waterSpeed(f: number) {
  const w = 2 * Math.PI * f;
  let k = (w * w) / G;
  for (let i = 0; i < 40; i++) {
    const F = G * k + SIGMA_RHO * k ** 3 - w * w;
    k -= F / (G + 3 * SIGMA_RHO * k * k);
  }
  return w / k;
}

const CFG: Record<
  Medium,
  { label: string; fMin: number; fMax: number; fStep: number; f0: number; len: number; unit: "m" | "cm"; v: (f: number) => number; dispersive: boolean }
> = {
  corde: { label: "Corde", fMin: 2, fMax: 10, fStep: 0.5, f0: 4, len: 6, unit: "m", v: () => 5, dispersive: false },
  eau: { label: "Surface de l'eau", fMin: 5, fMax: 40, fStep: 1, f0: 10, len: 0.12, unit: "cm", v: waterSpeed, dispersive: true },
  air: { label: "Air (son)", fMin: 200, fMax: 2000, fStep: 50, f0: 500, len: 4, unit: "m", v: () => 340, dispersive: false },
};

export default function OndeSinusoidalePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [medium, setMedium] = useModeParam<Medium>(MEDIA, "corde");
  const cfg = CFG[medium];
  const [f, setF] = useState(cfg.f0);
  const [p1, setP1] = useState(0.25);
  const [p2, setP2] = useState(0.5);
  const [running, setRunning] = useState(true);

  // Le temps physique avance lentement : une période réelle dure environ 1,2 s à l'écran.
  const rate = 1 / (1.2 * f);
  const [t, setT] = useSimClock(running, rate);

  useEffect(() => {
    setF(CFG[medium].f0);
    setT(0);
  }, [medium, setT]);

  const v = cfg.v(f);
  const T = 1 / f;
  const lambda = v / f;
  const A = 1;
  const y = (x: number, time: number) => (x <= v * time ? A * Math.sin(2 * Math.PI * f * (time - x / v)) : 0);
  const x1 = p1 * cfg.len;
  const x2 = p2 * cfg.len;
  const d = Math.abs(x2 - x1);
  const k = d / lambda;
  const frac = k - Math.floor(k);
  const relation =
    Math.min(frac, 1 - frac) < 0.03 ? "en phase" : Math.abs(frac - 0.5) < 0.03 ? "en opposition de phase" : "ni en phase, ni en opposition";
  const u = cfg.unit === "cm" ? 100 : 1;
  const fmtLen = (m: number, dd = 2) => `${fmt(m * u, dd)} ${cfg.unit}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const gxX = (x: number) => PL + (x / cfg.len) * PW;

    // ---- y(x) à l'instant t ----
    const midT = TOP.y + TOP.h / 2;
    const ampPx = TOP.h * 0.36;
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 16px ui-sans-serif, system-ui";
    ctx.fillText(`Aspect du milieu à t = ${fmt(t * 1000, 1)} ms : y(x)`, PL, TOP.y - 30);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(PL, midT);
    ctx.lineTo(PL + PW, midT);
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    for (let i = 0; i <= 6; i++) {
      const x = (cfg.len * i) / 6;
      ctx.fillText(fmt(x * u, cfg.unit === "cm" ? 0 : 1), gxX(x) - 8, TOP.y + TOP.h + 16);
    }
    ctx.fillText(`x (${cfg.unit})`, PL + PW - 30, TOP.y + TOP.h + 34);

    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = SIM_COLORS.accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i <= 800; i++) {
      const x = (cfg.len * i) / 800;
      const py = midT - ampPx * y(x, t);
      if (i === 0) ctx.moveTo(gxX(x), py);
      else ctx.lineTo(gxX(x), py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    // Repère λ entre deux crêtes consécutives (positions x = v(t − (n + 1/4)/f)).
    const crests: number[] = [];
    for (let n = 0; n < 400; n++) {
      const xc = v * (t - (n + 0.25) / f);
      if (xc < 0) break;
      if (xc <= cfg.len) crests.push(xc);
    }
    if (crests.length >= 2) {
      const sorted = crests.sort((a, b) => a - b);
      const mid = cfg.len / 2;
      let i = 0;
      while (i < sorted.length - 2 && sorted[i + 1] < mid) i++;
      const [a, b] = [sorted[i], sorted[i + 1]];
      const yb = midT - ampPx - 18;
      ctx.strokeStyle = SIM_COLORS.vectorX;
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.beginPath();
      ctx.moveTo(gxX(a), yb);
      ctx.lineTo(gxX(b), yb);
      ctx.moveTo(gxX(a), yb - 6);
      ctx.lineTo(gxX(a), yb + 6);
      ctx.moveTo(gxX(b), yb - 6);
      ctx.lineTo(gxX(b), yb + 6);
      ctx.stroke();
      ctx.font = "italic 600 16px ui-serif, Georgia, serif";
      ctx.fillText(`λ = ${fmtLen(lambda)}`, (gxX(a) + gxX(b)) / 2 - 40, yb - 8);
    }

    const marker = (x: number, color: string, name: string) => {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(gxX(x), TOP.y);
      ctx.lineTo(gxX(x), TOP.y + TOP.h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(gxX(x), midT - ampPx * y(x, t), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText(name, gxX(x) + 8, TOP.y + 12);
    };
    marker(x1, SIM_COLORS.vectorX, "M₁");
    marker(x2, SIM_COLORS.vectorY, "M₂");

    // ---- y(t) des deux points sur les 3 dernières périodes ----
    const midB = BOT.y + BOT.h / 2;
    const ampB = BOT.h * 0.36;
    const span = 3 * T;
    const t0 = Math.max(0, t - span);
    const gxT = (time: number) => PL + ((time - t0) / span) * PW;
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 16px ui-sans-serif, system-ui";
    ctx.fillText("Mouvement de M₁ et M₂ : y(t)", PL, BOT.y - 20);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(PL, midB);
    ctx.lineTo(PL + PW, midB);
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    for (let i = 0; i <= 6; i++) {
      const time = t0 + (span * i) / 6;
      ctx.fillText(fmt(time * 1000, 1), PL + (PW * i) / 6 - 12, BOT.y + BOT.h + 16);
    }
    ctx.fillText("t (ms)", PL + PW - 30, BOT.y + BOT.h + 34);
    const trace = (x: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i <= 600; i++) {
        const time = t0 + (Math.min(span, t - t0) * i) / 600;
        const py = midB - ampB * y(x, time);
        if (i === 0) ctx.moveTo(gxT(time), py);
        else ctx.lineTo(gxT(time), py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
    };
    trace(x1, SIM_COLORS.vectorX);
    trace(x2, SIM_COLORS.vectorY);

    // Repère T entre deux maxima de M₁ dans la fenêtre.
    const peaks: number[] = [];
    for (let n = 0; n < 2000; n++) {
      const tp = x1 / v + (n + 0.25) / f;
      if (tp > t) break;
      if (tp >= t0) peaks.push(tp);
    }
    if (peaks.length >= 2) {
      const [a, b] = [peaks[peaks.length - 2], peaks[peaks.length - 1]];
      const yb = midB - ampB - 14;
      ctx.strokeStyle = SIM_COLORS.vectorResult;
      ctx.fillStyle = SIM_COLORS.vectorResult;
      ctx.beginPath();
      ctx.moveTo(gxT(a), yb);
      ctx.lineTo(gxT(b), yb);
      ctx.moveTo(gxT(a), yb - 6);
      ctx.lineTo(gxT(a), yb + 6);
      ctx.moveTo(gxT(b), yb - 6);
      ctx.lineTo(gxT(b), yb + 6);
      ctx.stroke();
      ctx.font = "italic 600 16px ui-serif, Georgia, serif";
      ctx.fillText(`T = ${fmt(T * 1000, 2)} ms`, (gxT(a) + gxT(b)) / 2 - 40, yb - 8);
    }
  });

  return (
    <SimShell
      title="Onde progressive sinusoïdale"
      intro="Une onde progressive périodique a une périodicité temporelle (la période T) et une périodicité spatiale (la longueur d'onde λ), liées par v = λ/T = λ·f. Placez deux points et comparez leurs mouvements ; changez de milieu pour voir l'effet de la dispersion."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => setRunning((r) => !r)} />
          <GhostButton onClick={() => setT(0)}>⟲ Depuis le début</GhostButton>
          <GhostButton onClick={() => setT((cfg.len / v) + 2 * T)}>Régime établi</GhostButton>
        </>
      }
      readouts={[
        { label: "Période T = 1/f", value: `${fmt(T * 1000, 2)} ms` },
        { label: "Longueur d'onde λ = v/f", value: fmtLen(lambda) },
        { label: "Célérité v", value: `${fmt(v, medium === "eau" ? 3 : 0)} m/s` },
        { label: "d = M₁M₂ ; d/λ", value: `${fmtLen(d)} ; ${fmt(k, 2)}` },
      ]}
      side={
        <>
          <Segmented
            options={MEDIA.map((m) => ({ id: m, label: CFG[m].label }))}
            value={medium}
            onChange={setMedium}
          />
          <Slider
            label="Fréquence f de la source"
            value={f}
            unit="Hz"
            min={cfg.fMin}
            max={cfg.fMax}
            step={cfg.fStep}
            digits={medium === "corde" ? 1 : 0}
            onChange={setF}
          />
          <Slider label="Position de M₁" value={x1 * u} unit={cfg.unit} min={0} max={cfg.len * u} step={(cfg.len * u) / 240} digits={2} onChange={(val) => setP1(val / (cfg.len * u))} />
          <Slider label="Position de M₂" value={x2 * u} unit={cfg.unit} min={0} max={cfg.len * u} step={(cfg.len * u) / 240} digits={2} onChange={(val) => setP2(val / (cfg.len * u))} />
          <div className="rounded-2xl border border-[var(--sim-border)] bg-[var(--sim-panel-alt)] p-3 text-sm">
            <p className="text-xs text-[var(--sim-text-muted)]">M₁ et M₂ vibrent</p>
            <p className="mt-0.5 font-semibold">{relation}</p>
          </div>
          <SpeedChart medium={medium} f={f} />
          <Notes>
            <p>v = λ/T = λ·f, et d/λ = Δt/T = k.</p>
            <p>En phase : d = k·λ. En opposition de phase : d = (2k + 1)·λ/2.</p>
            <p>
              {cfg.dispersive
                ? "Surface de l'eau : la célérité dépend de la fréquence, c'est un milieu dispersif."
                : "Ce milieu n'est pas dispersif : la célérité ne dépend pas de la fréquence."}
            </p>
          </Notes>
        </>
      }
      footnote="Animation ralentie : une période dure environ 1,2 s à l'écran, quelle que soit la fréquence ; les temps affichés sont les temps réels."
    />
  );
}

/** Célérité en fonction de la fréquence dans le milieu choisi, avec le point courant. */
function SpeedChart({ medium, f }: { medium: Medium; f: number }) {
  const cfg = CFG[medium];
  const n = 40;
  const fs = Array.from({ length: n + 1 }, (_, i) => cfg.fMin + ((cfg.fMax - cfg.fMin) * i) / n);
  const vs = fs.map((ff) => cfg.v(ff));
  const vMin = Math.min(...vs) * 0.9;
  const vMax = Math.max(...vs) * 1.1;
  const X = (ff: number) => 30 + ((ff - cfg.fMin) / (cfg.fMax - cfg.fMin)) * 240;
  const Y = (vv: number) => 90 - ((vv - vMin) / (vMax - vMin || 1)) * 75;
  const d = fs.map((ff, i) => `${i ? "L" : "M"}${X(ff).toFixed(1)},${Y(vs[i]).toFixed(1)}`).join("");
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-[var(--sim-text-muted)]">Célérité v en fonction de f</p>
      <svg viewBox="0 0 280 110" className="mt-2 w-full">
        <line x1="30" y1="92" x2="272" y2="92" stroke={SIM_COLORS.ground} />
        <line x1="30" y1="8" x2="30" y2="92" stroke={SIM_COLORS.ground} />
        <path d={d} fill="none" stroke={SIM_COLORS.accent} strokeWidth="2" />
        <circle cx={X(f)} cy={Y(cfg.v(f))} r="4.5" fill={SIM_COLORS.vectorX} />
        <text x="272" y="106" textAnchor="end" fontSize="10" fill={SIM_COLORS.textMuted}>
          f (Hz)
        </text>
        <text x="2" y="12" fontSize="10" fill={SIM_COLORS.textMuted}>
          v
        </text>
      </svg>
    </div>
  );
}
