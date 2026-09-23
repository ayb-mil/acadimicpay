"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Mouvement d'un projectile dans un champ de pesanteur uniforme.
   Physique : x(t) = v0·cos(θ)·t ; y(t) = h0 + v0·sin(θ)·t − ½·g·t².
   Le tracé (prédit et parcouru) est redessiné à partir de cette formule à
   chaque frame — pas de tableau de points à accumuler, la courbe est connue
   à l'avance dès que (v0, θ, g, h0) sont fixés.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const CANVAS_H = 520;
const PAD = { left: 56, right: 28, top: 28, bottom: 46 };

const G_PRESETS = { terre: 9.8, lune: 1.62, mars: 3.71 } as const;
type Preset = keyof typeof G_PRESETS | "perso";

/** Pas de grille "rond" (1/2/5/10/20/50…) proche de `targetTicks` graduations. */
function niceStep(maxVal: number, targetTicks = 6) {
  const raw = maxVal / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

export default function ProjectileSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [preset, setPreset] = useState<Preset>("terre");
  const [customG, setCustomG] = useState(9.8);
  const [v0, setV0] = useState(20);
  const [angle, setAngle] = useState(50);
  const [h0, setH0] = useState(0);
  const [showTrace, setShowTrace] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0);
  const [finished, setFinished] = useState(false);

  const g = preset === "perso" ? customG : G_PRESETS[preset];

  /* ─────────── Grandeurs théoriques, dérivées des seuls paramètres ─────────── */
  const physics = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    const vx0 = v0 * Math.cos(rad);
    const vy0 = v0 * Math.sin(rad);
    const disc = vy0 * vy0 + 2 * g * h0;
    const flightTime = Math.max((vy0 + Math.sqrt(disc)) / g, 0.05);
    const range = vx0 * flightTime;
    const tApex = Math.max(vy0 / g, 0);
    const maxHeight = h0 + (vy0 * tApex - 0.5 * g * tApex * tApex);
    return { vx0, vy0, flightTime, range, maxHeight: Math.max(maxHeight, h0) };
  }, [v0, angle, g, h0]);

  const { vx0, vy0, flightTime, range, maxHeight } = physics;

  /* Réinitialise l'animation dès qu'un paramètre change. */
  useEffect(() => {
    setT(0);
    setRunning(false);
    setFinished(false);
  }, [v0, angle, g, h0]);

  /* Boucle d'animation. */
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= flightTime) {
          setRunning(false);
          setFinished(true);
          return flightTime;
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, flightTime]);

  const tc = Math.min(t, flightTime);
  const x = vx0 * tc;
  const y = h0 + vy0 * tc - 0.5 * g * tc * tc;
  const vy = vy0 - g * tc;
  const speedNow = Math.sqrt(vx0 * vx0 + vy * vy);

  /* ─────────── Rendu canvas ─────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const worldW = Math.max(range * 1.15, 5);
    const worldH = Math.max(maxHeight * 1.35, 5);
    const scale = Math.min(
      (CANVAS_W - PAD.left - PAD.right) / worldW,
      (CANVAS_H - PAD.top - PAD.bottom) / worldH
    );
    const toX = (wx: number) => PAD.left + wx * scale;
    const toY = (wy: number) => CANVAS_H - PAD.bottom - wy * scale;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    /* Grille + graduations. */
    const stepX = niceStep(worldW);
    const stepY = niceStep(worldH);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "11px ui-sans-serif, system-ui";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= worldW; gx += stepX) {
      const px = toX(gx);
      ctx.beginPath();
      ctx.moveTo(px, PAD.top);
      ctx.lineTo(px, CANVAS_H - PAD.bottom);
      ctx.stroke();
      ctx.fillText(String(Math.round(gx)), px - 6, CANVAS_H - PAD.bottom + 18);
    }
    for (let gy = 0; gy <= worldH; gy += stepY) {
      const py = toY(gy);
      ctx.beginPath();
      ctx.moveTo(PAD.left, py);
      ctx.lineTo(CANVAS_W - PAD.right, py);
      ctx.stroke();
      ctx.fillText(String(Math.round(gy)), PAD.left - 34, py + 4);
    }
    ctx.fillText("x (m)", CANVAS_W - PAD.right - 28, CANVAS_H - PAD.bottom + 34);
    ctx.fillText("y (m)", PAD.left - 40, PAD.top - 10);

    /* Sol. */
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD.left, toY(0));
    ctx.lineTo(CANVAS_W - PAD.right, toY(0));
    ctx.stroke();

    /* Trajectoire prédite (pointillés) puis parcourue (trait plein). */
    const curve = (from: number, to: number) => {
      ctx.beginPath();
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const tt = from + ((to - from) * i) / steps;
        const cx = toX(vx0 * tt);
        const cy = toY(h0 + vy0 * tt - 0.5 * g * tt * tt);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    };
    if (showTrace) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.lineWidth = 1.5;
      curve(0, flightTime);
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    curve(0, tc);

    /* Lanceur. */
    ctx.fillStyle = SIM_COLORS.ground;
    ctx.beginPath();
    ctx.arc(toX(0), toY(h0), 5, 0, Math.PI * 2);
    ctx.fill();

    /* Vecteurs vitesse (composantes + résultante) à la position courante. */
    if (showVectors && !finished) {
      const vpx = scale * 0.55; // px par (m/s), au jugé pour rester lisible
      const px = toX(x);
      const py = toY(y);
      const arrow = (dx: number, dy: number, color: string) => {
        const ex = px + dx;
        const ey = py - dy;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        const ang = Math.atan2(-dy, dx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey + 8 * Math.sin(ang - 0.4));
        ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey + 8 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
      };
      arrow(vx0 * vpx, 0, SIM_COLORS.vectorX);
      arrow(0, vy * vpx, SIM_COLORS.vectorY);
      arrow(vx0 * vpx, vy * vpx, SIM_COLORS.vectorResult);
    }

    /* Projectile — trait net, sans lueur ni effet. */
    ctx.fillStyle = SIM_COLORS.accentStrong;
    ctx.beginPath();
    ctx.arc(toX(x), toY(Math.max(y, 0)), 7, 0, Math.PI * 2);
    ctx.fill();
  }, [tc, x, y, vy, vx0, vy0, g, h0, range, maxHeight, flightTime, showTrace, showVectors, finished]);

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
          Mouvement d&apos;un projectile
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Chute d&apos;un objet lancé avec une vitesse initiale, dans un champ de pesanteur uniforme.
          Modifiez la vitesse, l&apos;angle ou la gravité et observez la trajectoire.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* ─────────── Canvas + lecture ─────────── */}
          <div className={SIM_CLASSES.card}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="block w-full rounded-t-3xl"
              style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sim-border)] p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (finished) {
                      setT(0);
                      setFinished(false);
                    }
                    setRunning((r) => !r);
                  }}
                  className={SIM_CLASSES.btnPrimary}
                >
                  {running ? "⏸ Pause" : finished ? "▶ Rejouer" : "▶ Lancer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setT(0);
                    setRunning(false);
                    setFinished(false);
                  }}
                  className={SIM_CLASSES.btnGhost}
                >
                  ⟲ Réinitialiser
                </button>
                <div className="ms-1 flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
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
              <div className="flex items-center gap-4 text-xs text-[var(--sim-text-muted)]">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={showTrace}
                    onChange={(e) => setShowTrace(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--sim-accent-strong)]"
                  />
                  Trajectoire
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={(e) => setShowVectors(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--sim-accent-strong)]"
                  />
                  Vecteurs vitesse
                </label>
              </div>
            </div>

            {/* Lecture des grandeurs en direct. */}
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-6">
              {[
                { label: "t", value: `${fmt(tc)} s` },
                { label: "x", value: `${fmt(x)} m` },
                { label: "y", value: `${fmt(Math.max(y, 0))} m` },
                { label: "v", value: `${fmt(speedNow)} m/s` },
                { label: "vx", value: `${fmt(vx0)} m/s` },
                { label: "vy", value: `${fmt(vy)} m/s` },
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

          {/* ─────────── Panneau de contrôle ─────────── */}
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
              {preset === "perso" && (
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
              )}
              {preset !== "perso" && (
                <p className="mt-2 text-xs text-[var(--sim-text-muted)]">g = {G_PRESETS[preset]} m/s²</p>
              )}
            </div>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Vitesse initiale
                </span>
                <span className="text-sm font-semibold tabular-nums">{v0} m/s</span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={1}
                value={v0}
                onChange={(e) => setV0(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Angle de tir
                </span>
                <span className="text-sm font-semibold tabular-nums">{angle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={1}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Hauteur de départ
                </span>
                <span className="text-sm font-semibold tabular-nums">{h0} m</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={h0}
                onChange={(e) => setH0(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <div className="space-y-2 border-t border-[var(--sim-border)] pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--sim-text-muted)]">Portée</span>
                <span className="font-semibold tabular-nums">{fmt(range)} m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--sim-text-muted)]">Hauteur max.</span>
                <span className="font-semibold tabular-nums">{fmt(maxHeight)} m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--sim-text-muted)]">Temps de vol</span>
                <span className="font-semibold tabular-nums">{fmt(flightTime)} s</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-xs leading-relaxed text-[var(--sim-text-muted)]">
          Modèle : chute libre sans frottement de l&apos;air. x(t) = v₀·cos(θ)·t,
          y(t) = h₀ + v₀·sin(θ)·t − ½·g·t². Vecteurs : ocre = v<sub>x</sub>, lavande = v<sub>y</sub>,
          vert foncé = vitesse résultante.
        </p>
      </div>
    </div>
  );
}
