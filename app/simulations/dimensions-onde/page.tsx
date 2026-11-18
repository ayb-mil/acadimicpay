"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS } from "../_theme";
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
   Dimension d'une onde : une onde se propage à partir de la source dans
   toutes les directions qui lui sont offertes.
   1D : corde (un axe) ; 2D : surface de l'eau (fronts circulaires) ;
   3D : son dans l'air (fronts sphériques, c ≈ 340 m/s, animation ralentie).
   L'énergie d'une perturbation se répartit sur le front : l'amplitude
   décroît comme 1/√r en 2D et comme 1/r en 3D (constante en 1D, sans perte).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 440;
const PX = 80;
const DUR = 0.5;

type Mode = "1d" | "2d" | "3d";
const MODES = ["1d", "2d", "3d"] as const;

/** Son : célérité réelle et facteur de ralenti de l'animation. */
const V_SOUND = 340;
const SLOW_SOUND = 200;

function bump(u: number) {
  return u >= 0 && u <= DUR ? Math.sin((Math.PI * u) / DUR) ** 2 : 0;
}

const INFO: Record<Mode, { dim: string; dirs: string; ex: string }> = {
  "1d": { dim: "1 dimension", dirs: "un seul axe", ex: "corde, ressort" },
  "2d": { dim: "2 dimensions", dirs: "toutes les directions d'un plan", ex: "surface de l'eau" },
  "3d": { dim: "3 dimensions", dirs: "toutes les directions de l'espace", ex: "son dans l'air" },
};

export default function DimensionsOndePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "2d");
  const [v, setV] = useState(1.5);
  const [auto, setAuto] = useState(true);
  const [running, setRunning] = useState(true);
  const [t, setT] = useSimClock(running, 1);
  const [pulses, setPulses] = useState<number[]>([0]);

  // En mode son, le temps physique est le temps d'animation divisé par le ralenti.
  const vVis = mode === "3d" ? V_SOUND / SLOW_SOUND : v;
  const maxR = mode === "1d" ? 11 : 7;

  useEffect(() => {
    if (!auto) return;
    const lastT = pulses.length ? pulses[pulses.length - 1] : -Infinity;
    if (t - lastT >= 1.6) setPulses((ps) => [...ps.filter((t0) => vVis * (t - t0) < maxR + 1), t]);
  }, [t, auto, pulses, vVis, maxR]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const radii = pulses.map((t0) => vVis * (t - t0)).filter((r) => r >= 0 && r < maxR + 1);

    if (mode === "1d") {
      const x0 = 70;
      const y0 = H / 2 + 20;
      ctx.strokeStyle = SIM_COLORS.grid;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 10 * PX, y0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = SIM_COLORS.accent;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const x = (10 * i) / 400;
        const y = y0 - 70 * pulses.reduce((s, t0) => s + bump(t - t0 - x / v), 0);
        if (i === 0) ctx.moveTo(x0 + x * PX, y);
        else ctx.lineTo(x0 + x * PX, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      ctx.fillStyle = SIM_COLORS.panel;
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.fillRect(x0 - 46, y0 - 45, 30, 90);
      ctx.strokeRect(x0 - 46, y0 - 45, 30, 90);
      drawArrow(ctx, x0 + 3.5 * PX, y0 - 120, x0 + 6.5 * PX, y0 - 120, SIM_COLORS.vectorResult, "v");
    } else {
      const cx = W / 2;
      const cy = H / 2 + 14;
      if (mode === "2d") {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 60);
        g.addColorStop(0, "rgba(34, 228, 217, 0.08)");
        g.addColorStop(1, "rgba(34, 228, 217, 0.02)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      const scale = 60;
      for (const r of radii) {
        const rp = r * scale;
        if (rp < 2) continue;
        const ampFactor = mode === "2d" ? 1 / Math.sqrt(Math.max(r, 0.3) / 0.3) : 0.3 / Math.max(r, 0.3);
        // Luminosité et épaisseur suivent l'amplitude, compressées pour rester visibles.
        const a = Math.min(1, ampFactor);
        ctx.strokeStyle = mode === "2d" ? SIM_COLORS.accent : SIM_COLORS.vectorY;
        ctx.globalAlpha = 0.3 + 0.7 * a;
        ctx.lineWidth = 1.5 + 7 * a;
        ctx.shadowColor = ctx.strokeStyle as string;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, rp, 0, Math.PI * 2);
        ctx.stroke();
        if (mode === "3d") {
          // Équateur et méridien en pointillés pour suggérer une sphère.
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.ellipse(cx, cy, rp, rp * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, cy, rp * 0.28, rp, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
      // Source.
      ctx.fillStyle = mode === "2d" ? SIM_COLORS.accent : SIM_COLORS.vectorY;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText("S", cx + 10, cy - 10);
      const n = mode === "2d" ? 8 : 6;
      for (let k = 0; k < n; k++) {
        const a = (2 * Math.PI * k) / n + (mode === "3d" ? Math.PI / 6 : 0);
        const r1 = 30;
        const r2 = 95;
        drawArrow(
          ctx,
          cx + r1 * Math.cos(a),
          cy + r1 * Math.sin(a) * (mode === "3d" ? 0.8 : 1),
          cx + r2 * Math.cos(a),
          cy + r2 * Math.sin(a) * (mode === "3d" ? 0.8 : 1),
          SIM_COLORS.vectorResult
        );
      }
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 20px ui-sans-serif, system-ui";
    ctx.fillText(`Onde à ${INFO[mode].dim} : ${INFO[mode].ex}`, 24, 36);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(`Propagation dans ${INFO[mode].dirs}.`, 24, 62);
    if (mode === "3d") ctx.fillText(`Célérité du son ≈ ${V_SOUND} m/s · animation ralentie ×${SLOW_SOUND}`, 24, H - 18);
  });

  const front = pulses.length ? vVis * (t - pulses[pulses.length - 1]) : 0;
  const tPhys = pulses.length ? (t - pulses[pulses.length - 1]) / (mode === "3d" ? SLOW_SOUND : 1) : 0;

  return (
    <SimShell
      title="Dimension d'une onde : 1D, 2D, 3D"
      intro="Une onde mécanique se propage à partir de la source dans toutes les directions qui lui sont offertes : le long d'un axe pour une corde, dans un plan pour la surface de l'eau, dans tout l'espace pour le son."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <button type="button" onClick={() => setPulses((ps) => [...ps, t])} className={SIM_CLASSES.btnPrimary}>
            ↯ Émettre une perturbation
          </button>
          <PlayButton running={running} onToggle={() => setRunning((r) => !r)} />
          <GhostButton
            onClick={() => {
              setPulses([]);
              setT(0);
            }}
          >
            ⟲ Réinitialiser
          </GhostButton>
        </>
      }
      readouts={[
        { label: "Dimension", value: INFO[mode].dim },
        { label: "Directions", value: INFO[mode].dirs },
        { label: "Distance parcourue par le dernier front", value: `${fmt(mode === "3d" ? V_SOUND * tPhys : front)} m` },
        { label: "Temps depuis l'émission", value: mode === "3d" ? `${fmt(tPhys * 1000, 1)} ms` : `${fmt(tPhys)} s` },
      ]}
      side={
        <>
          <Segmented
            options={[
              { id: "1d", label: "1D · corde" },
              { id: "2d", label: "2D · eau" },
              { id: "3d", label: "3D · son" },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setPulses([t]);
            }}
          />
          {mode !== "3d" ? (
            <Slider label="Célérité v" value={v} unit="m/s" min={0.5} max={3} step={0.1} digits={1} onChange={setV} />
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="accent-[var(--sim-accent-strong)]"
            />
            Émission automatique
          </label>
          <Notes>
            <p>1D : la corde ou le ressort ; l&apos;onde suit un seul axe.</p>
            <p>2D : à la surface de l&apos;eau, les fronts d&apos;onde sont des cercles centrés sur la source.</p>
            <p>3D : le son se propage dans tout l&apos;espace ; les fronts sont des sphères.</p>
            <p>
              En 2D et en 3D, l&apos;énergie se répartit sur un cercle ou une sphère de plus en plus grand :
              l&apos;amplitude diminue en s&apos;éloignant de la source.
            </p>
          </Notes>
        </>
      }
    />
  );
}
