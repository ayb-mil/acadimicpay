"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Dipôle RC : charge et décharge d'un condensateur.
   Formule unique pour les deux régimes : u(t) = cible + (u0 − cible)·e^(−t/τ),
   où « cible » vaut E en charge (interrupteur en position 1) et 0 en
   décharge (position 2), et u0 est la tension au moment du dernier
   basculement — ce qui reste correct même si on bascule avant la fin.
   R est exprimé en kΩ et C en µF : R·C donne alors directement τ en ms,
   et une tension (V) divisée par R (kΩ) donne directement un courant en mA.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const SCHEM_H = 220;
const GRAPH_TOP = 250;
const GRAPH_H = 260;
const CANVAS_H = GRAPH_TOP + GRAPH_H + 40;
const GPAD = { left: 56, right: 28, top: 16, bottom: 40 };

type Branch = "charge" | "decharge" | null;

function niceStep(maxVal: number, targetTicks = 5) {
  const raw = maxVal / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

export default function CircuitRCSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [E, setEValue] = useState(6);
  const [R, setR] = useState(10); // kΩ
  const [C, setC] = useState(100); // µF
  const [branch, setBranch] = useState<Branch>(null);
  const [u0, setU0] = useState(0);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);

  const tau = useMemo(() => (R * C) / 1000, [R, C]); // secondes

  /* Changer un paramètre repart d'un condensateur déchargé. */
  useEffect(() => {
    setBranch(null);
    setU0(0);
    setT(0);
    setRunning(false);
  }, [E, R, C]);

  /* Horloge de phase, remise à zéro à chaque bascule de l'interrupteur. */
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const cap = 50 * Math.max(tau, 0.02);
    const loop = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setT((prev) => Math.min(prev + dt, cap));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, tau]);

  const target = branch === "charge" ? E : 0;
  const u = target + (u0 - target) * Math.exp(-t / tau);
  const i = (target - u0) / R * Math.exp(-t / tau); // mA, cf. commentaire en tête

  function selectBranch(next: Exclude<Branch, null>) {
    setU0(u);
    setT(0);
    setBranch(next);
  }

  /* ─────────── Rendu canvas ─────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    /* ---- Schéma ---- */
    const railY = 190;
    const batteryX = 300;
    const bypassX = 380;
    const k1 = { x: 460, y: 90 };
    const k2 = { x: 460, y: 150 };
    const pivot = { x: 500, y: 120 };
    const resStart = 560;
    const resEnd = 640;
    const capX = 700;

    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    /* Rail commun. */
    line(280, railY, capX, railY);
    /* Branche pile. */
    line(batteryX, railY, batteryX, 165);
    ctx.beginPath();
    ctx.moveTo(batteryX - 14, 155);
    ctx.lineTo(batteryX + 14, 155);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(batteryX - 8, 143);
    ctx.lineTo(batteryX + 8, 143);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 2;
    line(batteryX, 143, batteryX, 90);
    line(batteryX, 90, k1.x, k1.y);
    /* Branche directe (décharge). */
    line(bypassX, railY, bypassX, k2.y);
    line(bypassX, k2.y, k2.x, k2.y);
    /* Interrupteur : deux contacts fixes + bras mobile. */
    ctx.fillStyle = SIM_COLORS.ground;
    [k1, k2].forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    const activeContact = branch === "charge" ? k1 : branch === "decharge" ? k2 : null;
    ctx.strokeStyle = activeContact ? SIM_COLORS.accentStrong : SIM_COLORS.grid;
    ctx.lineWidth = 2.5;
    if (activeContact) line(pivot.x, pivot.y, activeContact.x, activeContact.y);
    else line(pivot.x, pivot.y, (k1.x + k2.x) / 2 - 6, (k1.y + k2.y) / 2);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.fillText("1", k1.x + 8, k1.y - 6);
    ctx.fillText("2", k2.x + 8, k2.y + 14);

    /* Résistance + condensateur. */
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    line(pivot.x, pivot.y, resStart, pivot.y);
    ctx.beginPath();
    ctx.moveTo(resStart, pivot.y);
    const zigzags = 6;
    for (let i2 = 0; i2 < zigzags; i2++) {
      const zx = resStart + ((resEnd - resStart) * (i2 + 1)) / zigzags;
      const zy = pivot.y + (i2 % 2 === 0 ? -10 : 10);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(resEnd, pivot.y);
    ctx.stroke();
    line(resEnd, pivot.y, capX, pivot.y);
    line(capX, pivot.y, capX, pivot.y + 20);

    const chargeFrac = Math.max(0, Math.min(1, u / Math.max(E, 1)));
    ctx.strokeStyle = SIM_COLORS.ground;
    line(capX - 22, pivot.y + 20, capX + 22, pivot.y + 20);
    ctx.strokeStyle = SIM_COLORS.accentStrong;
    ctx.globalAlpha = 0.35 + 0.65 * chargeFrac;
    ctx.lineWidth = 4;
    line(capX - 22, pivot.y + 20, capX + 22, pivot.y + 20);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.strokeStyle = SIM_COLORS.ground;
    line(capX - 22, pivot.y + 32, capX + 22, pivot.y + 32);
    line(capX, pivot.y + 32, capX, railY);

    /* ---- Graphe u(t) ---- */
    const displayWindow = Math.max(5 * tau, 0.4);
    const uMax = Math.max(E, 1) * 1.15;
    const gx = (tt: number) => GPAD.left + (tt / displayWindow) * (CANVAS_W - GPAD.left - GPAD.right);
    const gy = (uu: number) =>
      GRAPH_TOP + GRAPH_H - GPAD.bottom - (uu / uMax) * (GRAPH_H - GPAD.top - GPAD.bottom);

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
      ctx.fillText(gt.toFixed(gt < 1 ? 2 : 1), px - 8, GRAPH_TOP + GRAPH_H - GPAD.bottom + 18);
    }
    const stepU = niceStep(uMax);
    for (let gu = 0; gu <= uMax; gu += stepU) {
      const py = gy(gu);
      ctx.beginPath();
      ctx.moveTo(GPAD.left, py);
      ctx.lineTo(CANVAS_W - GPAD.right, py);
      ctx.stroke();
      ctx.fillText(gu.toFixed(1), GPAD.left - 34, py + 4);
    }
    ctx.fillText("t (s)", CANVAS_W - GPAD.right - 24, GRAPH_TOP + GRAPH_H - GPAD.bottom + 34);
    ctx.fillText("u (V)", GPAD.left - 40, GRAPH_TOP + GPAD.top - 4);

    const curve = (target2: number, u0v: number, from: number, to: number) => {
      ctx.beginPath();
      const steps = 100;
      for (let i2 = 0; i2 <= steps; i2++) {
        const tt = from + ((to - from) * i2) / steps;
        const uu = target2 + (u0v - target2) * Math.exp(-tt / tau);
        const px = gx(tt);
        const py = gy(uu);
        if (i2 === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    if (branch !== null) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = SIM_COLORS.grid;
      ctx.lineWidth = 1.5;
      curve(target, u0, 0, displayWindow);
      ctx.setLineDash([]);

      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      curve(target, u0, 0, Math.min(t, displayWindow));

      ctx.fillStyle = SIM_COLORS.accentStrong;
      ctx.beginPath();
      ctx.arc(gx(Math.min(t, displayWindow)), gy(u), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [t, u, u0, target, branch, tau, E]);

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
          Charge et décharge d&apos;un condensateur
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Dipôle RC : basculez l&apos;interrupteur en position 1 pour charger le condensateur à
          travers R, en position 2 pour le décharger.
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
              <div className="flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
                <button
                  type="button"
                  onClick={() => selectBranch("charge")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    branch === "charge"
                      ? "bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                      : "text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                  }`}
                >
                  1 — Charger
                </button>
                <button
                  type="button"
                  onClick={() => selectBranch("decharge")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    branch === "decharge"
                      ? "bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                      : "text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                  }`}
                >
                  2 — Décharger
                </button>
              </div>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                disabled={branch === null}
                className={`${SIM_CLASSES.btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {running ? "⏸ Pause" : "▶ Lancer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBranch(null);
                  setU0(0);
                  setT(0);
                  setRunning(false);
                }}
                className={SIM_CLASSES.btnGhost}
              >
                ⟲ Réinitialiser
              </button>
              <div className="ms-auto flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
                {[0.5, 1, 2].map((s) => (
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
                { label: "t", value: `${fmt(t)} s` },
                { label: "u (tension)", value: `${fmt(u)} V` },
                { label: "i (courant)", value: `${fmt(i)} mA` },
                { label: "τ = RC", value: `${fmt(tau)} s` },
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
                  Tension E
                </span>
                <span className="text-sm font-semibold tabular-nums">{E} V</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={E}
                onChange={(e) => setEValue(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Résistance R
                </span>
                <span className="text-sm font-semibold tabular-nums">{R} kΩ</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
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
                <span className="text-sm font-semibold tabular-nums">{C} µF</span>
              </div>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={C}
                onChange={(e) => setC(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <div className="space-y-2 border-t border-[var(--sim-border)] pt-4 text-xs leading-relaxed text-[var(--sim-text-muted)]">
              <p>u(t) = cible + (u₀ − cible)·e^(−t/τ), avec τ = R·C.</p>
              <p>Cible = E en charge, 0 en décharge. u₀ = tension au dernier basculement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
