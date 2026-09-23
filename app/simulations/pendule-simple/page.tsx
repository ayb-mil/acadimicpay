"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Pendule simple non amorti.
   Équation exacte : θ''(t) = −(g/L)·sin θ(t), intégrée par Runge-Kutta 4
   (pas fixe, sous-pas par frame) : contrairement à l'approximation des
   petites oscillations, ceci reste correct pour un grand angle initial —
   utile pour montrer aux élèves que la période dépend alors de l'amplitude.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const CANVAS_H = 460;
const PIVOT = { x: CANVAS_W / 2, y: 60 };
const L_MAX = 2.5; // borne haute du slider, sert de référence d'échelle fixe
const SCALE = (CANVAS_H - PIVOT.y - 60) / L_MAX; // px par mètre, constant

const G_PRESETS = { terre: 9.8, lune: 1.62, mars: 3.71 } as const;
type Preset = keyof typeof G_PRESETS | "perso";
const FIXED_DT = 1 / 240;

function derivative(theta: number, omega: number, g: number, L: number) {
  return { dtheta: omega, domega: -(g / L) * Math.sin(theta) };
}

function rk4Step(theta: number, omega: number, dt: number, g: number, L: number) {
  const k1 = derivative(theta, omega, g, L);
  const k2 = derivative(theta + (dt / 2) * k1.dtheta, omega + (dt / 2) * k1.domega, g, L);
  const k3 = derivative(theta + (dt / 2) * k2.dtheta, omega + (dt / 2) * k2.domega, g, L);
  const k4 = derivative(theta + dt * k3.dtheta, omega + dt * k3.domega, g, L);
  return {
    theta: theta + (dt / 6) * (k1.dtheta + 2 * k2.dtheta + 2 * k3.dtheta + k4.dtheta),
    omega: omega + (dt / 6) * (k1.domega + 2 * k2.domega + 2 * k3.domega + k4.domega),
  };
}

export default function PenduleSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [preset, setPreset] = useState<Preset>("terre");
  const [customG, setCustomG] = useState(9.8);
  const [L, setL] = useState(1.5);
  const [theta0Deg, setTheta0Deg] = useState(30);
  const [running, setRunning] = useState(false);

  const [theta, setTheta] = useState((theta0Deg * Math.PI) / 180);
  const [omega, setOmega] = useState(0);
  const [t, setT] = useState(0);
  const [measuredPeriod, setMeasuredPeriod] = useState<number | null>(null);

  const g = preset === "perso" ? customG : G_PRESETS[preset];
  const theoreticalPeriod = useMemo(() => 2 * Math.PI * Math.sqrt(L / g), [L, g]);

  const physicsRef = useRef({ theta, omega, t });
  const lastFlipRef = useRef<number | null>(null);

  /* Réinitialise dès qu'un paramètre change. */
  useEffect(() => {
    const th0 = (theta0Deg * Math.PI) / 180;
    physicsRef.current = { theta: th0, omega: 0, t: 0 };
    lastFlipRef.current = null;
    setTheta(th0);
    setOmega(0);
    setT(0);
    setMeasuredPeriod(null);
    setRunning(false);
  }, [L, theta0Deg, g]);

  /* Boucle d'intégration : pas fixe, plusieurs sous-pas par frame. */
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const frameDt = ((now - last) / 1000) * 1;
      last = now;
      acc += frameDt;

      let { theta: th, omega: om, t: tt } = physicsRef.current;
      let prevSign = Math.sign(om);
      let steps = 0;
      while (acc >= FIXED_DT && steps < 40) {
        const next = rk4Step(th, om, FIXED_DT, g, L);
        th = next.theta;
        om = next.omega;
        tt += FIXED_DT;
        const sign = Math.sign(om);
        if (sign !== 0 && prevSign !== 0 && sign !== prevSign) {
          if (lastFlipRef.current !== null) {
            setMeasuredPeriod((tt - lastFlipRef.current) * 2);
          }
          lastFlipRef.current = tt;
        }
        if (sign !== 0) prevSign = sign;
        acc -= FIXED_DT;
        steps++;
      }
      physicsRef.current = { theta: th, omega: om, t: tt };
      setTheta(th);
      setOmega(om);
      setT(tt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, g, L]);

  /* ─────────── Rendu canvas ─────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const theta0 = (theta0Deg * Math.PI) / 180;
    const bobAt = (th: number) => ({
      x: PIVOT.x + L * SCALE * Math.sin(th),
      y: PIVOT.y + L * SCALE * Math.cos(th),
    });

    /* Repère vertical d'équilibre. */
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PIVOT.x, PIVOT.y);
    ctx.lineTo(PIVOT.x, PIVOT.y + L * SCALE + 20);
    ctx.stroke();

    /* Enveloppe d'amplitude (±θ0), guides discrets. */
    [theta0, -theta0].forEach((th) => {
      const p = bobAt(th);
      ctx.beginPath();
      ctx.moveTo(PIVOT.x, PIVOT.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    /* Fil + masse. */
    const bob = bobAt(theta);
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PIVOT.x, PIVOT.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.stroke();

    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.beginPath();
    ctx.arc(PIVOT.x, PIVOT.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SIM_COLORS.accentStrong;
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, 14, 0, Math.PI * 2);
    ctx.fill();
  }, [theta, theta0Deg, L]);

  const fmt = (n: number, d = 2) => n.toFixed(d);
  const thetaDeg = (theta * 180) / Math.PI;

  return (
    <div style={simThemeVars()} className="min-h-screen bg-[var(--sim-page)] text-[var(--sim-text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <a
          href="/simulations"
          className="text-sm font-medium text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
        >
          ‹ Retour aux simulations
        </a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Pendule simple</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Oscillations d&apos;une masse suspendue à un fil, sans frottement. La trajectoire exacte est
          calculée (pas seulement l&apos;approximation des petites oscillations).
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
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className={SIM_CLASSES.btnPrimary}
              >
                {running ? "⏸ Pause" : "▶ Lancer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const th0 = (theta0Deg * Math.PI) / 180;
                  physicsRef.current = { theta: th0, omega: 0, t: 0 };
                  lastFlipRef.current = null;
                  setTheta(th0);
                  setOmega(0);
                  setT(0);
                  setMeasuredPeriod(null);
                  setRunning(false);
                }}
                className={SIM_CLASSES.btnGhost}
              >
                ⟲ Réinitialiser
              </button>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-4">
              {[
                { label: "t", value: `${fmt(t)} s` },
                { label: "θ", value: `${fmt(thetaDeg, 1)}°` },
                { label: "ω", value: `${fmt(omega)} rad/s` },
                { label: "période mesurée", value: measuredPeriod ? `${fmt(measuredPeriod)} s` : "—" },
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                Gravité
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["terre", "lune", "mars", "perso"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      preset === p
                        ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                        : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    }`}
                  >
                    {p === "perso" ? "Personnalisé" : p}
                  </button>
                ))}
              </div>
              {preset === "perso" ? (
                <div className="mt-2.5">
                  <input
                    type="range"
                    min={1}
                    max={25}
                    step={0.1}
                    value={customG}
                    onChange={(e) => setCustomG(Number(e.target.value))}
                    className="w-full accent-[var(--sim-accent-strong)]"
                  />
                  <p className="mt-1 text-xs text-[var(--sim-text-muted)]">g = {fmt(customG, 1)} m/s²</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--sim-text-muted)]">g = {G_PRESETS[preset]} m/s²</p>
              )}
            </div>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Longueur du fil
                </span>
                <span className="text-sm font-semibold tabular-nums">{L} m</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={L_MAX}
                step={0.1}
                value={L}
                onChange={(e) => setL(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Angle initial
                </span>
                <span className="text-sm font-semibold tabular-nums">{theta0Deg}°</span>
              </div>
              <input
                type="range"
                min={5}
                max={90}
                step={1}
                value={theta0Deg}
                onChange={(e) => setTheta0Deg(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <div className="space-y-2 border-t border-[var(--sim-border)] pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--sim-text-muted)]">Période (petites oscillations)</span>
                <span className="font-semibold tabular-nums">{fmt(theoreticalPeriod)} s</span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--sim-text-muted)]">
                T₀ = 2π√(L/g). Pour un grand angle initial, la période réellement mesurée est un peu
                plus longue que T₀.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
