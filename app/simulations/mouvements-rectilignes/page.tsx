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
   Mouvement rectiligne uniforme (a = 0, x = v·t + x₀) et uniformément varié
   (v = a·t + v₀, x = ½·a·t² + v₀·t + x₀). Graphes a(t), v(t), x(t) comme
   dans le cours ; la pente de v(t) est l'accélération. Accéléré si a·v > 0,
   retardé si a·v < 0.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 520;
const T_MAX = 8;
const TRACK = { x0: 60, x1: 860, y: 110, min: -10, max: 40 };
const PANELS = [0, 1, 2].map((i) => ({ x: 40 + i * 300, y: 230, w: 260, h: 230 }));

type Mode = "mru" | "mruv";
const MODES = ["mru", "mruv"] as const;

export default function MouvementsRectilignesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "mruv");
  const [x0, setX0] = useState(0);
  const [v0, setV0] = useState(1);
  const [acc, setAcc] = useState(0.8);
  const [running, setRunning] = useState(true);
  const [tRaw, setT] = useSimClock(running, 1);
  const t = Math.min(tRaw, T_MAX);
  const a = mode === "mru" ? 0 : acc;

  useEffect(() => {
    if (tRaw >= T_MAX) setRunning(false);
  }, [tRaw]);

  const xAt = (tt: number) => 0.5 * a * tt * tt + v0 * tt + x0;
  const vAt = (tt: number) => a * tt + v0;
  const x = xAt(t);
  const v = vAt(t);
  const nature = a === 0 ? "uniforme" : v === 0 ? "arrêt instantané" : a * v > 0 ? "accéléré" : "retardé";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    // ---- Rail et mobile ----
    const px = (xx: number) => TRACK.x0 + ((xx - TRACK.min) / (TRACK.max - TRACK.min)) * (TRACK.x1 - TRACK.x0);
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TRACK.x0, TRACK.y + 22);
    ctx.lineTo(TRACK.x1, TRACK.y + 22);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    for (let g = TRACK.min; g <= TRACK.max; g += 10) {
      ctx.fillRect(px(g), TRACK.y + 22, 1, 8);
      ctx.fillText(`${g}`, px(g) - 8, TRACK.y + 46);
    }
    ctx.fillText("x (m)", TRACK.x1 - 30, TRACK.y + 64);
    ctx.fillText("O", px(0) - 4, TRACK.y + 64);
    // Positions toutes les secondes (chronophotographie).
    for (let k = 0; k <= Math.floor(t); k++) {
      ctx.fillStyle = SIM_COLORS.ground;
      ctx.beginPath();
      ctx.arc(px(xAt(k)), TRACK.y + 22, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const cx = Math.max(TRACK.x0, Math.min(TRACK.x1, px(x)));
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 22, TRACK.y - 6, 44, 24);
    ctx.strokeRect(cx - 22, TRACK.y - 6, 44, 24);
    ctx.lineWidth = 1;
    if (Math.abs(v) > 0.05) drawArrow(ctx, cx, TRACK.y - 22, cx + v * 22, TRACK.y - 22, SIM_COLORS.accent, "v");
    if (a !== 0) drawArrow(ctx, cx, TRACK.y - 46, cx + a * 40, TRACK.y - 46, SIM_COLORS.vectorX, "a");

    // ---- Graphes a(t), v(t), x(t) ----
    const graphs: { title: string; f: (tt: number) => number; color: string; unit: string }[] = [
      { title: "a (m/s²)", f: () => a, color: SIM_COLORS.vectorX, unit: "m/s²" },
      { title: "v (m/s)", f: vAt, color: SIM_COLORS.accent, unit: "m/s" },
      { title: "x (m)", f: xAt, color: SIM_COLORS.vectorY, unit: "m" },
    ];
    graphs.forEach((g, i) => {
      const P = PANELS[i];
      let lo = 0;
      let hi = 0;
      for (let k = 0; k <= 80; k++) {
        const val = g.f((T_MAX * k) / 80);
        lo = Math.min(lo, val);
        hi = Math.max(hi, val);
      }
      if (hi - lo < 1e-6) {
        hi += 1;
        lo -= 1;
      }
      const pad = (hi - lo) * 0.1;
      lo -= pad;
      hi += pad;
      const gx = (tt: number) => P.x + (tt / T_MAX) * P.w;
      const gy = (val: number) => P.y + P.h - ((val - lo) / (hi - lo)) * P.h;
      ctx.strokeStyle = SIM_COLORS.grid;
      ctx.strokeRect(P.x, P.y, P.w, P.h);
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.beginPath();
      ctx.moveTo(P.x, gy(0));
      ctx.lineTo(P.x + P.w, gy(0));
      ctx.stroke();
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText(g.title, P.x, P.y - 10);
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("t (s)", P.x + P.w - 30, P.y + P.h + 18);
      ctx.fillText(fmt(hi - pad, 1), P.x + 4, gy(hi - pad) - 4);
      ctx.fillText(fmt(lo + pad, 1), P.x + 4, gy(lo + pad) + 14);
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let k = 0; k <= 200; k++) {
        const tt = (t * k) / 200;
        if (k === 0) ctx.moveTo(gx(tt), gy(g.f(tt)));
        else ctx.lineTo(gx(tt), gy(g.f(tt)));
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(gx(t), gy(g.f(t)), 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Triangle de pente sur v(t) : Δv/Δt = a.
      if (i === 1 && t > 3) {
        const t1 = 1;
        const t2 = 3;
        ctx.strokeStyle = SIM_COLORS.textMuted;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(gx(t1), gy(vAt(t1)));
        ctx.lineTo(gx(t2), gy(vAt(t1)));
        ctx.lineTo(gx(t2), gy(vAt(t2)));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = SIM_COLORS.textMuted;
        ctx.fillText("Δt", (gx(t1) + gx(t2)) / 2 - 8, gy(vAt(t1)) + (a >= 0 ? 16 : -6));
        ctx.fillText("Δv", gx(t2) + 4, (gy(vAt(t1)) + gy(vAt(t2))) / 2 + 4);
      }
    });

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    ctx.fillText(mode === "mru" ? "Mouvement rectiligne uniforme" : "Mouvement rectiligne uniformément varié", 24, 32);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "italic 15px ui-serif, Georgia, serif";
    ctx.fillText(
      mode === "mru"
        ? `x(t) = ${fmt(v0, 1)}·t + ${fmt(x0, 1)}`
        : `v(t) = ${fmt(a, 1)}·t + ${fmt(v0, 1)}   ;   x(t) = ${fmt(a / 2, 2)}·t² + ${fmt(v0, 1)}·t + ${fmt(x0, 1)}`,
      24,
      56
    );
  });

  const restart = () => {
    setT(0);
    setRunning(true);
  };

  return (
    <SimShell
      title="Mouvements rectilignes"
      intro="Mouvement rectiligne uniforme : vitesse constante, accélération nulle. Mouvement rectiligne uniformément varié : accélération constante, la vitesse est une fonction affine du temps dont le coefficient directeur est l'accélération."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (tRaw >= T_MAX ? restart() : setRunning((r) => !r))} />
          <GhostButton onClick={restart}>⟲ Recommencer</GhostButton>
          <Segmented
            className="ms-auto"
            options={[
              { id: "mru", label: "Uniforme" },
              { id: "mruv", label: "Uniformément varié" },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              restart();
            }}
          />
        </>
      }
      readouts={[
        { label: "t", value: `${fmt(t, 2)} s` },
        { label: "x", value: `${fmt(x, 2)} m` },
        { label: "v", value: `${fmt(v, 2)} m/s` },
        { label: "Mouvement", value: nature },
      ]}
      side={
        <>
          <Slider label="Abscisse initiale x₀" value={x0} unit="m" min={-5} max={10} step={0.5} digits={1} onChange={(val) => { setX0(val); restart(); }} />
          <Slider label="Vitesse initiale v₀" value={v0} unit="m/s" min={-4} max={5} step={0.1} digits={1} onChange={(val) => { setV0(val); restart(); }} />
          {mode === "mruv" ? (
            <Slider label="Accélération a" value={acc} unit="m/s²" min={-2} max={2} step={0.1} digits={1} onChange={(val) => { setAcc(val); restart(); }} />
          ) : null}
          <Notes>
            <p>Uniforme : a = 0 et x = v·t + x₀.</p>
            <p>Uniformément varié : v = a·t + v₀ et x = ½·a·t² + v₀·t + x₀. La pente de v(t) vaut a = Δv/Δt.</p>
            <p>Le mouvement est accéléré si a·v &gt; 0 et retardé si a·v &lt; 0 : essayez v₀ &gt; 0 avec a &lt; 0.</p>
          </Notes>
        </>
      }
      footnote="Les points sur le rail marquent la position du mobile à chaque seconde, comme une chronophotographie."
    />
  );
}
