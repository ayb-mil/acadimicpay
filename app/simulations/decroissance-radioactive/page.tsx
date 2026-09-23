"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Décroissance radioactive, approche Monte-Carlo.
   Plutôt que d'appliquer la loi N(t)=N0·e^(−λt) directement, chaque noyau
   reçoit sa propre date de désintégration tirée d'une loi exponentielle
   (inversion de la fonction de répartition : t = −ln(u)/λ, u uniforme sur
   ]0,1]). Cela reproduit la vraie nature statistique du phénomène — la
   courbe empirique fluctue légèrement autour de la courbe théorique, et la
   demi-vie « mesurée » sur l'échantillon (médiane des dates tirées) peut
   être comparée à la demi-vie théorique choisie.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const DOTS_TOP = 24;
const DOTS_H = 170;
const GRAPH_TOP = 220;
const GRAPH_H = 280;
const CANVAS_H = GRAPH_TOP + GRAPH_H + 40;
const GPAD = { left: 56, right: 28, top: 16, bottom: 40 };
const FADE_S = 0.4;

function niceStep(maxVal: number, targetTicks = 5) {
  const raw = maxVal / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

function lerpColor(a: [number, number, number], b: [number, number, number], f: number) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export default function DecroissanceRadioactiveSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [N0, setN0] = useState(120);
  const [Thalf, setThalf] = useState(4);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [resetNonce, setResetNonce] = useState(0);

  const lambda = Math.LN2 / Thalf;

  /* Tirage aléatoire différé au client (useEffect) : Math.random() ne peut
     pas s'exécuter pendant le rendu serveur sans provoquer une désynchro-
     nisation d'hydratation (le serveur et le client tireraient chacun un
     échantillon différent). */
  const [decayTimes, setDecayTimes] = useState<number[]>([]);
  useEffect(() => {
    setDecayTimes(Array.from({ length: N0 }, () => -Math.log(Math.random()) / lambda));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N0, Thalf, resetNonce]);

  const sortedDecayTimes = useMemo(() => [...decayTimes].sort((a, b) => a - b), [decayTimes]);
  const measuredHalfLife = sortedDecayTimes[Math.floor(N0 / 2)] ?? Thalf;

  const displayWindow = Math.max(6 * Thalf, 1);

  useEffect(() => {
    setT(0);
    setRunning(false);
  }, [N0, Thalf, resetNonce]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= displayWindow) {
          setRunning(false);
          return displayWindow;
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, displayWindow]);

  const nRemaining = decayTimes.filter((d) => d > t).length;
  const activite = lambda * nRemaining;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    /* ---- Grille de noyaux ---- */
    const zoneW = CANVAS_W - 80;
    const aspect = zoneW / DOTS_H;
    const cols = Math.max(1, Math.ceil(Math.sqrt(N0 * aspect)));
    const rows = Math.ceil(N0 / cols);
    const spacingX = zoneW / cols;
    const spacingY = DOTS_H / Math.max(rows, 1);
    const radius = Math.max(3, Math.min(10, Math.min(spacingX, spacingY) * 0.32));

    const activeColor: [number, number, number] = [63, 111, 104]; // SIM_COLORS.accentStrong
    const decayedColor: [number, number, number] = [222, 231, 225]; // SIM_COLORS.grid

    for (let i = 0; i < N0; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = 40 + spacingX * (col + 0.5);
      const cy = DOTS_TOP + spacingY * (row + 0.5);
      const dt = decayTimes[i] ?? Infinity;
      const sinceDecay = t - dt;
      const f = sinceDecay <= 0 ? 0 : Math.min(1, sinceDecay / FADE_S);
      ctx.fillStyle = lerpColor(activeColor, decayedColor, f);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ---- Graphe N(t) ---- */
    const gx = (tt: number) => GPAD.left + (tt / displayWindow) * (CANVAS_W - GPAD.left - GPAD.right);
    const gy = (n: number) =>
      GRAPH_TOP + GRAPH_H - GPAD.bottom - (n / N0) * (GRAPH_H - GPAD.top - GPAD.bottom);

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
      ctx.fillText(gt.toFixed(1), px - 8, GRAPH_TOP + GRAPH_H - GPAD.bottom + 18);
    }
    const stepN = niceStep(N0);
    for (let n = 0; n <= N0; n += stepN) {
      const py = gy(n);
      ctx.beginPath();
      ctx.moveTo(GPAD.left, py);
      ctx.lineTo(CANVAS_W - GPAD.right, py);
      ctx.stroke();
      ctx.fillText(String(Math.round(n)), GPAD.left - 30, py + 4);
    }
    ctx.fillText("t", CANVAS_W - GPAD.right - 8, GRAPH_TOP + GRAPH_H - GPAD.bottom + 34);
    ctx.fillText("N", GPAD.left - 30, GRAPH_TOP + GPAD.top - 4);

    /* Repères demi-vie théorique / mesurée. */
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(GPAD.left, gy(N0 / 2));
    ctx.lineTo(CANVAS_W - GPAD.right, gy(N0 / 2));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx(Thalf), GRAPH_TOP + GPAD.top);
    ctx.lineTo(gx(Thalf), GRAPH_TOP + GRAPH_H - GPAD.bottom);
    ctx.stroke();
    ctx.strokeStyle = SIM_COLORS.vectorY;
    ctx.beginPath();
    ctx.moveTo(gx(measuredHalfLife), GRAPH_TOP + GPAD.top);
    ctx.lineTo(gx(measuredHalfLife), GRAPH_TOP + GRAPH_H - GPAD.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Courbe théorique N0·e^(−λt), puis empirique tirée de l'échantillon. */
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const tt = (displayWindow * i) / 120;
      const px = gx(tt);
      const py = gy(N0 * Math.exp(-lambda * tt));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let prevN = N0;
    let started = false;
    for (const dtEvent of sortedDecayTimes) {
      if (dtEvent > t) break;
      const px = gx(dtEvent);
      if (!started) {
        ctx.moveTo(gx(0), gy(prevN));
        started = true;
      }
      ctx.lineTo(px, gy(prevN));
      prevN -= 1;
      ctx.lineTo(px, gy(prevN));
    }
    if (!started) ctx.moveTo(gx(0), gy(prevN));
    ctx.lineTo(gx(t), gy(prevN));
    ctx.stroke();

    ctx.fillStyle = SIM_COLORS.accentStrong;
    ctx.beginPath();
    ctx.arc(gx(t), gy(nRemaining), 5, 0, Math.PI * 2);
    ctx.fill();
  }, [t, decayTimes, sortedDecayTimes, N0, lambda, Thalf, measuredHalfLife, displayWindow, nRemaining]);

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Décroissance radioactive</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Chaque point représente un noyau, avec sa propre date de désintégration tirée au hasard.
          La courbe empirique (en couleur) fluctue naturellement autour de la loi théorique
          N(t) = N₀·e^(−λt).
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
                onClick={() => setResetNonce((n) => n + 1)}
                className={SIM_CLASSES.btnGhost}
              >
                ⟲ Nouvel échantillon
              </button>
              <div className="ms-auto flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
                {[0.5, 1, 2, 5].map((s) => (
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
                { label: "N restants", value: `${nRemaining} / ${N0}` },
                { label: "activité", value: `${fmt(activite)} /s` },
                { label: "T½ mesurée", value: `${fmt(measuredHalfLife)} s` },
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
                  Nombre de noyaux N₀
                </span>
                <span className="text-sm font-semibold tabular-nums">{N0}</span>
              </div>
              <input
                type="range"
                min={20}
                max={200}
                step={10}
                value={N0}
                onChange={(e) => setN0(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Demi-vie théorique T½
                </span>
                <span className="text-sm font-semibold tabular-nums">{Thalf} s</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={Thalf}
                onChange={(e) => setThalf(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <div className="space-y-2 border-t border-[var(--sim-border)] pt-4 text-xs leading-relaxed text-[var(--sim-text-muted)]">
              <p>λ = ln2 / T½ ≈ {fmt(lambda, 3)} s⁻¹.</p>
              <p>
                Avec peu de noyaux, la courbe réelle s&apos;écarte visiblement de la théorie : c&apos;est
                normal, la désintégration est un phénomène statistique.
              </p>
              <p>Échelle de temps arbitraire (« secondes du modèle »), pas des secondes réelles.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
