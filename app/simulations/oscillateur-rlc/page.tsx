"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Oscillations libres dans un dipôle RLC série.
   Décharge d'un condensateur (chargé à U0) dans une bobine et une résistance :
   u''(t) + 2ξω0·u'(t) + ω0²·u(t) = 0, avec ω0 = 1/√(LC) et ξ = (R/2)·√(C/L).
   Solution exacte selon le régime (pas d'intégration numérique nécessaire,
   l'équation est linéaire à coefficients constants) :
   ξ<1 pseudo-périodique, ξ=1 critique, ξ>1 apériodique.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const SCHEM_H = 180;
const GRAPH_TOP = 200;
const GRAPH_H = 300;
const CANVAS_H = GRAPH_TOP + GRAPH_H + 40;
const GPAD = { left: 56, right: 28, top: 16, bottom: 40 };

function niceStep(maxVal: number, targetTicks = 5) {
  const raw = maxVal / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

/** u(t) exact, régime déterminé par ξ. Conditions initiales u(0)=U0, u'(0)=0. */
function dampedU(t: number, U0: number, xi: number, omega0: number) {
  if (xi < 0.999) {
    const wd = omega0 * Math.sqrt(1 - xi * xi);
    return U0 * Math.exp(-xi * omega0 * t) * (Math.cos(wd * t) + (xi * omega0 / wd) * Math.sin(wd * t));
  }
  if (xi < 1.001) {
    return U0 * Math.exp(-omega0 * t) * (1 + omega0 * t);
  }
  const r1 = -omega0 * (xi - Math.sqrt(xi * xi - 1));
  const r2 = -omega0 * (xi + Math.sqrt(xi * xi - 1));
  const B = (r1 * U0) / (r1 - r2);
  const A = U0 - B;
  return A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
}

export default function OscillateurRLCSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [Lh, setLh] = useState(0.5); // H
  const [R, setR] = useState(50); // Ω
  const [Cuf, setCuf] = useState(5); // µF
  const [U0, setU0] = useState(6); // V
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);

  const { omega0, xi, regime, Tpseudo } = useMemo(() => {
    const Cf = Cuf * 1e-6;
    const w0 = 1 / Math.sqrt(Lh * Cf);
    const x = (R / 2) * Math.sqrt(Cf / Lh);
    const reg = x < 0.98 ? "pseudo-périodique" : x < 1.02 ? "critique" : "apériodique";
    const Tp = x < 1 ? (2 * Math.PI) / (w0 * Math.sqrt(1 - x * x)) : null;
    return { omega0: w0, xi: x, regime: reg, Tpseudo: Tp };
  }, [Lh, Cuf, R]);

  const displayWindow = useMemo(() => {
    const decayRate =
      xi < 1 ? xi * omega0 : omega0 * (xi - Math.sqrt(Math.max(xi * xi - 1, 1e-6)));
    const base = Math.max(5 / Math.max(decayRate, 1e-6), Tpseudo ? 4 * Tpseudo : 0);
    return Math.min(Math.max(base, 0.01), 3);
  }, [xi, omega0, Tpseudo]);

  useEffect(() => {
    setT(0);
    setRunning(false);
  }, [Lh, R, Cuf, U0]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const cap = displayWindow * 1.4;
    const loop = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setT((prev) => Math.min(prev + dt, cap));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, displayWindow]);

  const u = dampedU(t, U0, xi, omega0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    /* ---- Schéma : boucle C - L - R ---- */
    const y = 100;
    const x0 = 260;
    const x1 = 660;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const line = (ax: number, ay: number, bx: number, by: number) => {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    };
    /* fils du bas */
    line(x0, y + 60, x1, y + 60);
    /* condensateur, à gauche */
    line(x0, y + 60, x0, y + 20);
    line(x0 - 18, y + 8, x0 + 18, y + 8);
    line(x0 - 18, y - 8, x0 + 18, y - 8);
    line(x0, y - 8, x0, y - 40);
    line(x0, y - 40, 380, y - 40);
    /* bobine, au milieu */
    ctx.beginPath();
    ctx.moveTo(380, y - 40);
    const coilW = 140;
    const bumps = 5;
    for (let i = 0; i < bumps; i++) {
      const cx0 = 380 + (coilW * i) / bumps + coilW / bumps / 2;
      ctx.arc(cx0, y - 40, coilW / bumps / 2, Math.PI, 0, false);
    }
    ctx.lineTo(380 + coilW, y - 40);
    ctx.stroke();
    line(380 + coilW, y - 40, 560, y - 40);
    /* résistance, à droite */
    ctx.beginPath();
    ctx.moveTo(560, y - 40);
    const resW = 80;
    const zigzags = 6;
    for (let i = 0; i < zigzags; i++) {
      const zx = 560 + ((resW) * (i + 1)) / zigzags;
      const zy = y - 40 + (i % 2 === 0 ? -10 : 10);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(560 + resW, y - 40);
    ctx.stroke();
    line(560 + resW, y - 40, x1, y - 40);
    line(x1, y - 40, x1, y + 60);

    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.fillText("C", x0 - 6, y + 26);
    ctx.fillText("L", 380 + coilW / 2 - 4, y - 58);
    ctx.fillText("R", 560 + resW / 2 - 4, y - 58);

    /* ---- Graphe u(t) ---- */
    const uMax = Math.max(Math.abs(U0), 1) * 1.2;
    const gx = (tt: number) => GPAD.left + (tt / displayWindow) * (CANVAS_W - GPAD.left - GPAD.right);
    const gy = (uu: number) =>
      GRAPH_TOP + GRAPH_H / 2 - (uu / uMax) * (GRAPH_H / 2 - GPAD.top);

    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "11px ui-sans-serif, system-ui";
    ctx.lineWidth = 1;
    const stepT = niceStep(displayWindow);
    for (let gt = 0; gt <= displayWindow; gt += stepT) {
      const px = gx(gt);
      ctx.beginPath();
      ctx.moveTo(px, GRAPH_TOP + GPAD.top);
      ctx.lineTo(px, GRAPH_TOP + GRAPH_H - GPAD.bottom);
      ctx.stroke();
      ctx.fillText(gt.toFixed(gt < 0.1 ? 3 : 2), px - 10, GRAPH_TOP + GRAPH_H - GPAD.bottom + 18);
    }
    [-uMax / 1.2, 0, uMax / 1.2].forEach((uu) => {
      const py = gy(uu);
      ctx.beginPath();
      ctx.moveTo(GPAD.left, py);
      ctx.lineTo(CANVAS_W - GPAD.right, py);
      ctx.stroke();
      ctx.fillText(uu.toFixed(1), GPAD.left - 34, py + 4);
    });
    ctx.fillText("t (s)", CANVAS_W - GPAD.right - 24, GRAPH_TOP + GRAPH_H - GPAD.bottom + 34);
    ctx.fillText("u (V)", GPAD.left - 40, GRAPH_TOP + GPAD.top - 4);

    const curve = (from: number, to: number) => {
      ctx.beginPath();
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const tt = from + ((to - from) * i) / steps;
        const px = gx(tt);
        const py = gy(dampedU(tt, U0, xi, omega0));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.lineWidth = 1.5;
    curve(0, displayWindow);
    ctx.setLineDash([]);

    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    curve(0, Math.min(t, displayWindow));

    ctx.fillStyle = SIM_COLORS.accentStrong;
    ctx.beginPath();
    ctx.arc(gx(Math.min(t, displayWindow)), gy(u), 6, 0, Math.PI * 2);
    ctx.fill();
  }, [t, u, U0, xi, omega0, displayWindow]);

  const fmt = (n: number, d = 2) => n.toFixed(d);

  return (
    <div style={simThemeVars()} className="min-h-screen bg-[var(--sim-page)] text-[var(--sim-text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <a
          href="/simulations"
          className="text-sm font-medium text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
        >
          ‹ Retour aux simulations
        </a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Oscillations libres dans un dipôle RLC
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Décharge d&apos;un condensateur chargé à U₀ dans une bobine et une résistance. Le régime
          (pseudo-périodique, critique ou apériodique) dépend de R.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className={SIM_CLASSES.card}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="block w-full rounded-t-3xl"
              style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sim-border)] p-4">
              <button type="button" onClick={() => setRunning((r) => !r)} className={SIM_CLASSES.btnPrimary}>
                {running ? "⏸ Pause" : "▶ Lancer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setT(0);
                  setRunning(false);
                }}
                className={SIM_CLASSES.btnGhost}
              >
                ⟲ Réinitialiser
              </button>
              <div className="ms-auto flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
                {[0.2, 0.5, 1].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      speed === s
                        ? "bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                        : "text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    }`}
                  >
                    ×{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-4">
              {[
                { label: "t", value: `${fmt(t, 3)} s` },
                { label: "u_C", value: `${fmt(u)} V` },
                { label: "régime", value: regime },
                { label: "période mesurée", value: Tpseudo ? `${fmt(Tpseudo, 4)} s` : "—" },
              ].map((r) => (
                <div key={r.label} className="bg-[var(--sim-panel)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                    {r.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${SIM_CLASSES.card} h-fit space-y-5 p-5`}>
            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Inductance L
                </span>
                <span className="text-sm font-semibold tabular-nums">{Lh} H</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2}
                step={0.1}
                value={Lh}
                onChange={(e) => setLh(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Résistance R
                </span>
                <span className="text-sm font-semibold tabular-nums">{R} Ω</span>
              </div>
              <input
                type="range"
                min={0}
                max={800}
                step={10}
                value={R}
                onChange={(e) => setR(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Capacité C
                </span>
                <span className="text-sm font-semibold tabular-nums">{Cuf} µF</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={Cuf}
                onChange={(e) => setCuf(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Tension initiale U₀
                </span>
                <span className="text-sm font-semibold tabular-nums">{U0} V</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={U0}
                onChange={(e) => setU0(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <div className="space-y-1.5 border-t border-[var(--sim-border)] pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--sim-text-muted)]">ω₀ = 1/√(LC)</span>
                <span className="font-semibold tabular-nums">{fmt(omega0, 0)} rad/s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--sim-text-muted)]">ξ = (R/2)·√(C/L)</span>
                <span className="font-semibold tabular-nums">{fmt(xi, 3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
