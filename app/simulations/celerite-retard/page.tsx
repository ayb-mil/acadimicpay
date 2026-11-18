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
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Célérité et retard temporel le long d'une corde.
   v = √(F/μ) (F en N, μ en kg/m). La source S émet une perturbation de
   durée Δ à t = 0 ; le point M d'abscisse x reproduit le mouvement de S
   avec le retard x/v. Entre M et M' : τ = MM'/v et y_M'(t) = y_M(t − τ).
   Le temps affiché est le temps physique ; l'animation peut être ralentie.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 500;
const L = 12;
const X0 = 60;
const PX = 800 / L;
const Y0 = 140;
const APX = 26;
const DUR = 0.08;
const X = (x: number) => X0 + x * PX;

/* Zone du graphe y(t). */
const G = { x: 70, y: 260, w: 810, h: 190 };

function bump(u: number) {
  return u >= 0 && u <= DUR ? Math.sin((Math.PI * u) / DUR) ** 2 : 0;
}

export default function CeleriteRetardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [F, setF] = useState(8);
  const [mu, setMu] = useState(50);
  const [xM, setXM] = useState(3);
  const [xMp, setXMp] = useState(9);
  const [slow, setSlow] = useState(0.1);
  const [showShift, setShowShift] = useState(false);
  const [running, setRunning] = useState(true);
  const [t, setT] = useSimClock(running, slow);

  const v = Math.sqrt(F / (mu / 1000));
  const tau = (xMp - xM) / v;
  const tWin = xMp / v + 3 * DUR;
  const tEnd = (L + 1) / v + DUR;

  useEffect(() => {
    if (t > tEnd) setRunning(false);
  }, [t, tEnd]);

  const y = (x: number, time: number) => bump(time - x / v);
  const reachedMp = t >= xMp / v + DUR;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    // ---- Corde ----
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.fillRect(18, Y0 - 40, 30, 80);
    ctx.strokeRect(18, Y0 - 40, 30, 80);
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 14px ui-sans-serif, system-ui";
    ctx.fillText("S", 28, Y0 - 48);
    // Poulie et masse qui tend la corde.
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.beginPath();
    ctx.arc(X(L) + 14, Y0 + 14, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X(L) + 28, Y0 + 14);
    ctx.lineTo(X(L) + 28, Y0 + 70);
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.panelAlt;
    ctx.fillRect(X(L) + 16, Y0 + 70, 24, 26);
    ctx.strokeRect(X(L) + 16, Y0 + 70, 24, 26);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(`F = ${fmt(F, 0)} N`, X(L) - 70, Y0 + 34);

    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = SIM_COLORS.accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i <= 600; i++) {
      const x = (L * i) / 600;
      const yy = Y0 - APX * y(x, t);
      if (i === 0) ctx.moveTo(X(x), yy);
      else ctx.lineTo(X(x), yy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    const point = (x: number, color: string, name: string) => {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(X(x), Y0 - 50);
      ctx.lineTo(X(x), Y0 + 40);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(X(x), Y0 - APX * y(x, t), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = "600 15px ui-sans-serif, system-ui";
      ctx.fillText(name, X(x) - 8, Y0 + 60);
    };
    point(xM, SIM_COLORS.vectorX, "M");
    point(xMp, SIM_COLORS.vectorY, "M'");

    // Cote MM'.
    const yc = Y0 + 84;
    ctx.strokeStyle = SIM_COLORS.textMuted;
    ctx.beginPath();
    ctx.moveTo(X(xM), yc);
    ctx.lineTo(X(xMp), yc);
    ctx.moveTo(X(xM), yc - 6);
    ctx.lineTo(X(xM), yc + 6);
    ctx.moveTo(X(xMp), yc - 6);
    ctx.lineTo(X(xMp), yc + 6);
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(`MM' = ${fmt(xMp - xM, 1)} m`, (X(xM) + X(xMp)) / 2 - 40, yc - 8);

    const xc = v * (t - DUR / 2);
    if (xc > 0.5 && xc < L - 0.6) drawArrow(ctx, X(xc) - 30, Y0 - 62, X(xc) + 40, Y0 - 62, SIM_COLORS.vectorResult, "v");

    // ---- Graphe y_M(t) et y_M'(t) ----
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    const gx = (time: number) => G.x + (time / tWin) * G.w;
    const gy = (val: number) => G.y + G.h - 24 - val * (G.h - 60);
    const nTicks = 6;
    for (let k = 0; k <= nTicks; k++) {
      const time = (tWin * k) / nTicks;
      ctx.beginPath();
      ctx.moveTo(gx(time), G.y);
      ctx.lineTo(gx(time), G.y + G.h - 24);
      ctx.stroke();
      ctx.fillText(`${fmt(time * 1000, 0)}`, gx(time) - 10, G.y + G.h - 4);
    }
    ctx.fillText("t (ms)", G.x + G.w - 30, G.y - 8);
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.beginPath();
    ctx.moveTo(G.x, gy(0));
    ctx.lineTo(G.x + G.w, gy(0));
    ctx.stroke();

    const curve = (f: (time: number) => number, color: string, upTo: number, dash?: number[]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = dash ? 1.6 : 2.4;
      ctx.setLineDash(dash ?? []);
      if (!dash) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      const n = 500;
      for (let i = 0; i <= n; i++) {
        const time = (Math.min(upTo, tWin) * i) / n;
        if (i === 0) ctx.moveTo(gx(time), gy(f(time)));
        else ctx.lineTo(gx(time), gy(f(time)));
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
    };
    curve((time) => y(xM, time), SIM_COLORS.vectorX, t);
    curve((time) => y(xMp, time), SIM_COLORS.vectorY, t);
    if (showShift) curve((time) => y(xM, time - tau), SIM_COLORS.textPrimary, t, [5, 5]);

    if (reachedMp) {
      const tA = xM / v;
      const tB = xMp / v;
      const yb = G.y + 14;
      ctx.strokeStyle = SIM_COLORS.vectorResult;
      ctx.fillStyle = SIM_COLORS.vectorResult;
      ctx.beginPath();
      ctx.moveTo(gx(tA), yb);
      ctx.lineTo(gx(tB), yb);
      ctx.moveTo(gx(tA), yb - 6);
      ctx.lineTo(gx(tA), yb + 6);
      ctx.moveTo(gx(tB), yb - 6);
      ctx.lineTo(gx(tB), yb + 6);
      ctx.stroke();
      ctx.font = "italic 600 15px ui-serif, Georgia, serif";
      ctx.fillText(`τ = ${fmt(tau * 1000, 1)} ms`, (gx(tA) + gx(tB)) / 2 - 40, yb - 8);
    }

    ctx.font = "600 13px ui-sans-serif, system-ui";
    ctx.fillStyle = SIM_COLORS.vectorX;
    ctx.fillText("y_M(t)", G.x + 6, G.y + G.h - 34);
    ctx.fillStyle = SIM_COLORS.vectorY;
    ctx.fillText("y_M'(t)", G.x + 66, G.y + G.h - 34);
    if (showShift) {
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.fillText("y_M(t − τ) (pointillés)", G.x + 136, G.y + G.h - 34);
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 20px ui-sans-serif, system-ui";
    ctx.fillText(`v = √(F/μ) = ${fmt(v, 1)} m/s`, X0, 34);
  });

  const restart = () => {
    setT(0);
    setRunning(true);
  };

  return (
    <SimShell
      title="Célérité d'une onde et retard temporel"
      intro="La célérité d'une onde ne dépend que du milieu : le long d'une corde, v = √(F/μ). Un point M' situé après M reproduit le mouvement de M avec un retard τ = MM'/v."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <button type="button" onClick={restart} className={SIM_CLASSES.btnPrimary}>
            ↯ Lancer la perturbation
          </button>
          <PlayButton running={running} onToggle={() => (t > tEnd ? restart() : setRunning((r) => !r))} />
          <GhostButton onClick={() => setShowShift((s) => !s)}>
            {showShift ? "Masquer" : "Superposer"} y_M(t − τ)
          </GhostButton>
          <Segmented
            className="ms-auto"
            options={[
              { id: 0.02, label: "ralenti ×50" },
              { id: 0.1, label: "×10" },
              { id: 0.5, label: "×2" },
            ]}
            value={slow}
            onChange={setSlow}
          />
        </>
      }
      readouts={[
        { label: "Célérité v = √(F/μ)", value: `${fmt(v, 2)} m/s` },
        { label: "Distance MM'", value: `${fmt(xMp - xM, 2)} m` },
        { label: "Retard τ = t_M' − t_M", value: reachedMp ? `${fmt(tau * 1000, 1)} ms` : "en attente…" },
        { label: "v = MM' / τ", value: reachedMp ? `${fmt((xMp - xM) / tau, 2)} m/s` : "—" },
      ]}
      side={
        <>
          <Slider label="Tension de la corde F" value={F} unit="N" min={2} max={20} step={0.5} digits={1} onChange={(val) => { setF(val); restart(); }} />
          <Slider label="Masse linéique μ" value={mu} unit="g/m" min={20} max={200} step={5} onChange={(val) => { setMu(val); restart(); }} />
          <Slider label="Position de M" value={xM} unit="m" min={1} max={5} step={0.25} digits={2} onChange={(val) => { setXM(val); restart(); }} />
          <Slider label="Position de M'" value={xMp} unit="m" min={6} max={11} step={0.25} digits={2} onChange={(val) => { setXMp(val); restart(); }} />
          <Notes>
            <p>v = d/Δt : la célérité est la distance parcourue divisée par la durée du parcours.</p>
            <p>v = √(F/μ), avec μ = m/ℓ la masse linéique (ici convertie en kg/m) : tendre la corde augmente v, une corde plus lourde la diminue.</p>
            <p>τ = MM&apos;/v et y_M&apos;(t) = y_M(t − τ) : superposez la courbe décalée, elle coïncide avec celle de M&apos;.</p>
          </Notes>
        </>
      }
      footnote="Les temps affichés sont les temps réels ; l'animation est ralentie pour qu'on puisse suivre la perturbation."
    />
  );
}
