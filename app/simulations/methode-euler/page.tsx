"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import { Notes, SimCanvas, SimShell, Slider, SIM_FONT, fmt, prepareCanvas } from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Méthode d'Euler pour dv/dt = A − B·vⁿ.
     aᵢ = A − B·vᵢⁿ ;  vᵢ₊₁ = vᵢ + aᵢ·Δt ;  tᵢ₊₁ = tᵢ + Δt.
   Comparaison avec la solution « exacte » (RK4 à pas très fin) et la
   vitesse limite (A/B)^(1/n). Préréglages : tableaux des exercices du cours
   (grêlon : A = 9,80, B = 1,56·10⁻², Δt = 0,5 s ; caisse : A = 10,
   B = 100/150, n = 1, Δt = 0,1 s ; charge : A = 9,8, B = 9·10⁻², Δt = 0,024 s).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 440;
const GR = { x: 70, y: 40, w: 820, h: 340 };

const PRESETS = [
  { id: "grelon", label: "Grêlon (exercice 1)", A: 9.8, B: 1.56e-2, n: 2 as const, dt: 0.5 },
  { id: "caisse", label: "Caisse et parachute (exercice 3)", A: 10, B: 100 / 150, n: 1 as const, dt: 0.1 },
  { id: "charge", label: "Charge (exercice 4)", A: 9.8, B: 9e-2, n: 2 as const, dt: 0.024 },
];

function euler(A: number, B: number, n: number, v0: number, dt: number, steps: number) {
  const rows: { t: number; v: number; a: number }[] = [];
  let v = v0;
  for (let i = 0; i <= steps; i++) {
    const a = A - B * Math.pow(Math.max(v, 0), n);
    rows.push({ t: i * dt, v, a });
    v = v + a * dt;
  }
  return rows;
}

function exact(A: number, B: number, n: number, v0: number, tMax: number) {
  const N = 2000;
  const h = tMax / N;
  const out: { t: number; v: number }[] = [{ t: 0, v: v0 }];
  let v = v0;
  const f = (x: number) => A - B * Math.pow(Math.max(x, 0), n);
  for (let i = 1; i <= N; i++) {
    const k1 = f(v);
    const k2 = f(v + (h / 2) * k1);
    const k3 = f(v + (h / 2) * k2);
    const k4 = f(v + h * k3);
    v += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    out.push({ t: i * h, v });
  }
  return out;
}

export default function MethodeEulerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [presetId, setPresetId] = useState("grelon");
  const p = PRESETS.find((x) => x.id === presetId)!;
  const [dt, setDt] = useState(p.dt);
  useEffect(() => setDt(p.dt), [p.dt]);

  const vlim = Math.pow(p.A / p.B, 1 / p.n);
  const tau = vlim / p.A;
  const tMax = 6 * tau;
  const steps = Math.max(1, Math.min(400, Math.ceil(tMax / dt)));
  const rows = useMemo(() => euler(p.A, p.B, p.n, 0, dt, steps), [p, dt, steps]);
  const ref = useMemo(() => exact(p.A, p.B, p.n, 0, tMax), [p, tMax]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const vMax = Math.max(vlim * 1.15, ...rows.filter((r) => r.t <= tMax).map((r) => r.v * 1.05));
    const gx = (t: number) => GR.x + (t / tMax) * GR.w;
    const gy = (v: number) => GR.y + GR.h - (v / vMax) * GR.h;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.beginPath();
    ctx.moveTo(GR.x, GR.y);
    ctx.lineTo(GR.x, GR.y + GR.h);
    ctx.lineTo(GR.x + GR.w, GR.y + GR.h);
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    for (let k = 0; k <= 6; k++) ctx.fillText(fmt(k * tau, tau < 1 ? 2 : 1), gx(k * tau) - 10, GR.y + GR.h + 18);
    for (let k = 1; k <= 4; k++) ctx.fillText(fmt((vMax * k) / 4, 1), GR.x - 40, gy((vMax * k) / 4) + 4);
    ctx.fillText("t (s)", GR.x + GR.w - 30, GR.y + GR.h + 34);
    ctx.fillText("v (m/s)", GR.x - 50, GR.y - 10);

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = SIM_COLORS.vectorResult;
    ctx.beginPath();
    ctx.moveTo(GR.x, gy(vlim));
    ctx.lineTo(GR.x + GR.w, gy(vlim));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SIM_COLORS.vectorResult;
    ctx.fillText(`v_lim = ${fmt(vlim, 2)} m/s`, GR.x + GR.w - 130, gy(vlim) - 8);

    // Solution exacte.
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ref.forEach((r, k) => (k === 0 ? ctx.moveTo(gx(r.t), gy(r.v)) : ctx.lineTo(gx(r.t), gy(r.v))));
    ctx.stroke();
    ctx.lineWidth = 1;
    // Points d'Euler reliés.
    const shown = rows.filter((r) => r.t <= tMax + 1e-9);
    ctx.strokeStyle = SIM_COLORS.vectorX;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    shown.forEach((r, k) => (k === 0 ? ctx.moveTo(gx(r.t), gy(r.v)) : ctx.lineTo(gx(r.t), gy(r.v))));
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (shown.length <= 120) {
      for (const r of shown) {
        ctx.fillStyle = SIM_COLORS.vectorX;
        ctx.beginPath();
        ctx.arc(gx(r.t), gy(r.v), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.font = "600 13px ui-sans-serif, system-ui";
    ctx.fillStyle = SIM_COLORS.accent;
    ctx.fillText("solution exacte", GR.x + 14, GR.y + 14);
    ctx.fillStyle = SIM_COLORS.vectorX;
    ctx.fillText(`méthode d'Euler (Δt = ${fmt(dt, 3)} s)`, GR.x + 140, GR.y + 14);
  });

  const tableRows = rows.slice(0, 13);
  const err = (() => {
    const last = rows[Math.min(rows.length - 1, Math.round(tau / dt))];
    const exactV = ref[Math.min(ref.length - 1, Math.round((last.t / tMax) * (ref.length - 1)))].v;
    return Math.abs(last.v - exactV);
  })();

  return (
    <SimShell
      title="Méthode d'Euler"
      intro="La méthode d'Euler résout pas à pas l'équation différentielle dv/dt = A − B·vⁿ : on calcule l'accélération à partir de la vitesse, puis la vitesse suivante à partir de l'accélération. Plus le pas Δt est petit, plus les points se rapprochent de la solution exacte."
      canvas={
        <>
          <SimCanvas canvasRef={canvasRef} W={W} H={H} />
          <div className="overflow-x-auto border-t border-[var(--sim-border)] px-4 py-3">
            <table className="w-full min-w-[560px] text-center text-xs tabular-nums">
              <thead className="text-[var(--sim-text-muted)]">
                <tr>
                  <th className="py-1 text-start font-semibold">i</th>
                  {tableRows.map((_, i) => (
                    <th key={i} className="py-1 font-semibold">
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 text-start text-[var(--sim-text-muted)]">t (s)</td>
                  {tableRows.map((r, i) => (
                    <td key={i}>{fmt(r.t, dt < 0.1 ? 3 : 2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 text-start text-[var(--sim-text-muted)]">v (m/s)</td>
                  {tableRows.map((r, i) => (
                    <td key={i} style={{ color: SIM_COLORS.vectorX }}>
                      {fmt(r.v, 2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 text-start text-[var(--sim-text-muted)]">a (m/s²)</td>
                  {tableRows.map((r, i) => (
                    <td key={i}>{fmt(r.a, 2)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      }
      toolbar={
        <span className="text-xs text-[var(--sim-text-muted)]">
          aᵢ = A − B·vᵢ{p.n === 2 ? "²" : ""} puis vᵢ₊₁ = vᵢ + aᵢ·Δt, en partant de v₀ = 0.
        </span>
      }
      readouts={[
        { label: "A ; B", value: `${fmt(p.A, 2)} ; ${p.B < 0.1 ? `${fmt(p.B * 100, 2)} × 10⁻²` : fmt(p.B, 3)}` },
        { label: "v_lim = (A/B)^(1/n)", value: `${fmt(vlim, 2)} m/s` },
        { label: "τ ; pas conseillé τ/10", value: `${fmt(tau, 2)} s ; ${fmt(tau / 10, 3)} s` },
        { label: "Écart à t ≈ τ", value: `${fmt(err, 2)} m/s` },
      ]}
      side={
        <>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setPresetId(x.id)}
                aria-pressed={presetId === x.id}
                className={`rounded-2xl border px-3 py-2 text-start text-xs font-semibold transition ${
                  presetId === x.id
                    ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                    : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
          <Slider label="Pas de calcul Δt" value={dt} unit="s" min={p.dt / 10} max={Math.max(p.dt * 4, tau)} step={p.dt / 20} digits={3} onChange={setDt} />
          <Notes>
            <p>Étape 1 : à partir de vᵢ, calculer aᵢ = A − B·vᵢⁿ.</p>
            <p>Étape 2 : vᵢ₊₁ = vᵢ + aᵢ·Δt. On recommence avec la nouvelle vitesse.</p>
            <p>Avec le pas du préréglage, le tableau est celui de l&apos;exercice. Augmentez Δt : les points s&apos;écartent de la solution exacte et peuvent même dépasser la vitesse limite.</p>
          </Notes>
        </>
      }
    />
  );
}
