"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Chute verticale avec frottement fluide (axe Oz vers le bas).
   Forces : poids P = m·g, poussée d'Archimède F_A = ρ_f·V·g (vers le haut),
   frottement fluide f = h·vⁿ (opposé à la vitesse ; n = 1 ou 2).
   2ᵉ loi de Newton : dv/dt = A − B·vⁿ, avec A = g·(1 − ρ_f·V/m) et B = h/m.
   Régime permanent : v_lim = (A/B)^(1/n). Temps caractéristique τ : abscisse
   de l'intersection de la tangente à l'origine (pente A) avec v = v_lim,
   soit τ = v_lim/A (pour n = 1 : τ = 1/B = m/h et v(τ) = 0,63·v_lim).
   Résolution RK4 avec un pas fin (la méthode d'Euler a sa propre simulation).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 520;
const GR = { x: 330, y: 70, w: 560, h: 380 };

type Preset = { id: string; label: string; m: number; V: number; rhoF: number; h: number; n: 1 | 2; g: number; archi: boolean };
const PRESETS: Preset[] = [
  { id: "grelon", label: "Grêlon (exercice 1)", m: 0.013, V: (4 / 3) * Math.PI * 0.015 ** 3, rhoF: 1.3, h: 0.013 * 1.56e-2, n: 2, g: 9.8, archi: false },
  { id: "caisse", label: "Caisse et parachute (exercice 3)", m: 150, V: 0.5, rhoF: 1.3, h: 100, n: 1, g: 10, archi: false },
  { id: "charge", label: "Charge de 30 kg (exercice 4)", m: 30, V: 0.02, rhoF: 1.3, h: 2.7, n: 2, g: 9.8, archi: false },
];

function solve(A: number, B: number, n: number, tMax: number) {
  const N = 600;
  const dt = tMax / N;
  const ts: number[] = [0];
  const vs: number[] = [0];
  let v = 0;
  const f = (vv: number) => A - B * Math.pow(Math.max(vv, 0), n);
  for (let i = 1; i <= N; i++) {
    const k1 = f(v);
    const k2 = f(v + (dt / 2) * k1);
    const k3 = f(v + (dt / 2) * k2);
    const k4 = f(v + dt * k3);
    v += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    ts.push(i * dt);
    vs.push(v);
  }
  return { ts, vs, dt };
}

export default function ChuteFrottementPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset] = useState("caisse");
  const p0 = PRESETS.find((x) => x.id === preset)!;
  const [m, setM] = useState(p0.m);
  const [hCoef, setHCoef] = useState(p0.h);
  const [n, setN] = useState<1 | 2>(p0.n);
  const [archi, setArchi] = useState(p0.archi);
  const [running, setRunning] = useState(true);
  const [tAnim, setT] = useSimClock(running, 1);

  useEffect(() => {
    const p = PRESETS.find((x) => x.id === preset)!;
    setM(p.m);
    setHCoef(p.h);
    setN(p.n);
    setArchi(p.archi);
  }, [preset]);

  const g = p0.g;
  const FA = archi ? p0.rhoF * p0.V * g : 0;
  const A = g * (1 - (archi ? (p0.rhoF * p0.V) / m : 0));
  const B = hCoef / m;
  const vlim = Math.pow(A / B, 1 / n);
  const tau = vlim / A;
  const tMax = 8 * tau;
  const sol = useMemo(() => solve(A, B, n, tMax), [A, B, n, tMax]);
  // L'animation parcourt 8τ en 8 secondes environ, quelle que soit la valeur de τ.
  const t = Math.min(tMax, (tAnim * tMax) / 8);
  const i = Math.min(sol.vs.length - 1, Math.round(t / sol.dt));
  const v = sol.vs[i];
  const a = A - B * Math.pow(v, n);
  const f = hCoef * Math.pow(v, n);
  const P = m * g;

  useEffect(() => {
    setT(0);
    setRunning(true);
  }, [m, hCoef, n, archi, preset, setT]);
  useEffect(() => {
    if (t >= tMax) setRunning(false);
  }, [t, tMax]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    // ---- Objet et forces ----
    const ox = 160;
    const oy = 250;
    ctx.fillStyle = "rgba(34, 228, 217, 0.06)";
    ctx.fillRect(60, 70, 200, 380);
    ctx.strokeStyle = SIM_COLORS.border;
    ctx.strokeRect(60, 70, 200, 380);
    // Lignes de fond qui défilent vers le haut : le corps descend.
    const offset = ((sol.ts.slice(0, i + 1).reduce((s, _, k) => s + sol.vs[k] * sol.dt, 0) * 40) % 40) || 0;
    ctx.strokeStyle = SIM_COLORS.grid;
    for (let y = 70 - offset; y < 450; y += 40) {
      if (y < 70) continue;
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(250, y);
      ctx.stroke();
    }
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ox, oy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1;
    const S = 150 / P;
    drawArrow(ctx, ox, oy, ox, oy + P * S, SIM_COLORS.vectorY, "P");
    if (f > P * 0.02) drawArrow(ctx, ox - 10, oy, ox - 10, oy - f * S, SIM_COLORS.vectorResult, "f");
    if (archi && FA > P * 0.02) drawArrow(ctx, ox + 12, oy, ox + 12, oy - FA * S, SIM_COLORS.vectorX, "F_A");
    drawArrow(ctx, 40, 90, 40, 160, SIM_COLORS.textMuted);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "italic 15px ui-serif, Georgia, serif";
    ctx.fillText("z", 28, 150);

    // ---- Graphe v(t) ----
    const vMaxPlot = vlim * 1.15;
    const gx = (tt: number) => GR.x + (tt / tMax) * GR.w;
    const gy = (vv: number) => GR.y + GR.h - (vv / vMaxPlot) * GR.h;
    // Régimes : transitoire jusqu'à ≈ 5τ (n = 1) puis permanent.
    const tPerm = 5 * tau;
    ctx.fillStyle = "rgba(155, 123, 255, 0.07)";
    ctx.fillRect(gx(0), GR.y, gx(tPerm) - gx(0), GR.h);
    ctx.fillStyle = "rgba(74, 222, 128, 0.07)";
    ctx.fillRect(gx(tPerm), GR.y, gx(tMax) - gx(tPerm), GR.h);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText("régime transitoire", gx(0) + 8, GR.y + GR.h - 10);
    ctx.fillText("régime permanent", gx(tPerm) + 8, GR.y + GR.h - 10);
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.beginPath();
    ctx.moveTo(GR.x, GR.y);
    ctx.lineTo(GR.x, GR.y + GR.h);
    ctx.lineTo(GR.x + GR.w, GR.y + GR.h);
    ctx.stroke();
    for (let k = 0; k <= 8; k++) ctx.fillText(fmt(k * tau, tau < 1 ? 2 : 1), gx(k * tau) - 8, GR.y + GR.h + 18);
    ctx.fillText("t (s)", GR.x + GR.w - 30, GR.y + GR.h + 34);
    ctx.fillText("v (m/s)", GR.x - 8, GR.y - 10);
    // v_lim et tangente à l'origine.
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = SIM_COLORS.vectorResult;
    ctx.beginPath();
    ctx.moveTo(GR.x, gy(vlim));
    ctx.lineTo(GR.x + GR.w, gy(vlim));
    ctx.stroke();
    ctx.strokeStyle = SIM_COLORS.vectorX;
    ctx.beginPath();
    ctx.moveTo(gx(0), gy(0));
    ctx.lineTo(gx(tau), gy(vlim));
    ctx.stroke();
    ctx.strokeStyle = SIM_COLORS.textMuted;
    ctx.beginPath();
    ctx.moveTo(gx(tau), gy(vlim));
    ctx.lineTo(gx(tau), GR.y + GR.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SIM_COLORS.vectorResult;
    ctx.font = "italic 600 15px ui-serif, Georgia, serif";
    ctx.fillText(`v_lim = ${fmt(vlim, 2)} m/s`, GR.x + GR.w - 150, gy(vlim) - 8);
    ctx.fillStyle = SIM_COLORS.vectorX;
    ctx.fillText(`τ = ${fmt(tau, 2)} s`, gx(tau) + 6, GR.y + GR.h - 30);
    // Courbe.
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let k = 0; k <= i; k++) {
      if (k === 0) ctx.moveTo(gx(sol.ts[k]), gy(sol.vs[k]));
      else ctx.lineTo(gx(sol.ts[k]), gy(sol.vs[k]));
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.beginPath();
    ctx.arc(gx(t), gy(v), 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 18px ui-sans-serif, system-ui";
    ctx.fillText(`dv/dt = A − B·v${n === 2 ? "²" : ""}`, 24, 32);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(
      a > 0.02 * A ? "Régime transitoire : v augmente, f augmente, a diminue." : "Régime permanent : v ≈ v_lim, f équilibre P − F_A, a ≈ 0.",
      24,
      56
    );
  });

  return (
    <SimShell
      title="Chute verticale avec frottement"
      intro="Un corps qui tombe dans un fluide est soumis à son poids, à la poussée d'Archimède et à un frottement fluide f = h·vⁿ. La vitesse augmente d'abord (régime transitoire), puis se stabilise à une vitesse limite (régime permanent)."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (t >= tMax ? (setT(0), setRunning(true)) : setRunning((r) => !r))} />
          <GhostButton
            onClick={() => {
              setT(0);
              setRunning(true);
            }}
          >
            ⟲ Recommencer
          </GhostButton>
        </>
      }
      readouts={[
        { label: "A = g·(1 − ρ_f·V/m)", value: `${fmt(A, 3)} m/s²` },
        { label: "B = h/m", value: B < 0.01 ? `${fmt(B * 1000, 3)} × 10⁻³` : fmt(B, 4) },
        { label: "v_lim = (A/B)^(1/n)", value: `${fmt(vlim, 2)} m/s` },
        { label: "τ (tangente à l'origine)", value: `${fmt(tau, 2)} s` },
        { label: "t", value: `${fmt(t, 2)} s` },
        { label: "v", value: `${fmt(v, 2)} m/s` },
        { label: "a = dv/dt", value: `${fmt(a, 2)} m/s²` },
        { label: "f = h·vⁿ ; P", value: `${fmt(f, f < 1 ? 4 : 1)} N ; ${fmt(P, P < 1 ? 4 : 1)} N` },
      ]}
      side={
        <>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`rounded-2xl border px-3 py-2 text-start text-xs font-semibold transition ${
                  preset === p.id
                    ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                    : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Segmented
            options={[
              { id: 1, label: "f = h·v (n = 1)" },
              { id: 2, label: "f = h·v² (n = 2)" },
            ]}
            value={n}
            onChange={setN}
          />
          <Slider label="Masse m" value={m} unit="kg" min={p0.m / 4} max={p0.m * 3} step={p0.m / 40} digits={p0.m < 1 ? 4 : 1} onChange={setM} />
          <Slider label="Coefficient de frottement h" value={hCoef} min={p0.h / 4} max={p0.h * 3} step={p0.h / 40} digits={p0.h < 1 ? 5 : 1} onChange={setHCoef} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={archi} onChange={(e) => setArchi(e.target.checked)} className="accent-[var(--sim-accent-strong)]" />
            Tenir compte de la poussée d&apos;Archimède
          </label>
          <Notes>
            <p>Forces : P = m·g ; F_A = ρ_f·V·g (vers le haut) ; f = h·vⁿ, avec n = 1 pour un petit corps lent et n = 2 pour un grand corps rapide.</p>
            <p>En projetant P + F_A + f = m·a sur Oz (vers le bas) : dv/dt = A − B·vⁿ, A = g·(1 − ρ_f·V/m), B = h/m.</p>
            <p>Régime permanent : a = 0, d&apos;où v_lim = (A/B)^(1/n). τ se lit à l&apos;intersection de la tangente à l&apos;origine avec v_lim{n === 1 ? " ; pour n = 1, v(τ) = 0,63·v_lim" : ""}.</p>
          </Notes>
        </>
      }
      footnote="Pour les exercices du cours, la poussée d'Archimède est négligée : elle est minuscule devant le poids dans l'air. Cochez-la pour vérifier son effet."
    />
  );
}
