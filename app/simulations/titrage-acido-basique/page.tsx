"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Titrage d'un acide fort par une base forte, suivi pH-métrique.
   Avant l'équivalence l'acide est en excès, après c'est la base : dans les
   deux cas on calcule la concentration de l'espèce en excès rapportée au
   volume total, puis le pH par sa définition. À l'équivalence exacte
   (Ca·Va = Cb·Vb), pH = 7 pour un couple fort/fort.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const APPARATUS_H = 220;
const GRAPH_TOP = 240;
const GRAPH_H = 280;
const CANVAS_H = GRAPH_TOP + GRAPH_H + 40;
const GPAD = { left: 56, right: 28, top: 16, bottom: 40 };
const RATE = 2; // mL/s de titrant versé, à vitesse ×1

function niceStep(maxVal: number, targetTicks = 5) {
  const raw = maxVal / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

function computePH(Ca: number, Va: number, Cb: number, Vb: number) {
  const nA = Ca * (Va / 1000);
  const nB = Cb * (Vb / 1000);
  const Vtot = (Va + Vb) / 1000;
  const diff = nA - nB;
  let pH: number;
  if (Math.abs(diff) < 1e-12) pH = 7;
  else if (diff > 0) pH = -Math.log10(diff / Vtot);
  else pH = 14 + Math.log10(-diff / Vtot);
  return Math.max(0, Math.min(14, pH));
}

/** Couleur d'indicateur (type phénolphtaléine) : incolore avant pH 8, rose au-delà de 10. */
function indicatorColor(pH: number) {
  const f = Math.max(0, Math.min(1, (pH - 8) / 2));
  const from = [0xf2, 0xee, 0xe0];
  const to = [0xe3, 0xae, 0xc2];
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * f));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

export default function TitrageSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [Ca, setCa] = useState(0.1);
  const [Va, setVa] = useState(20);
  const [Cb, setCb] = useState(0.1);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [speed, setSpeed] = useState(1);

  const Veq = useMemo(() => (Ca * Va) / Cb, [Ca, Va, Cb]);
  const Vmax = useMemo(() => Math.max(2 * Veq, 10), [Veq]);

  useEffect(() => {
    setT(0);
    setRunning(false);
    setFinished(false);
  }, [Ca, Va, Cb]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const maxT = Vmax / RATE;
    const loop = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= maxT) {
          setRunning(false);
          setFinished(true);
          return maxT;
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, Vmax]);

  const Vb = Math.min(t * RATE, Vmax);
  const pH = computePH(Ca, Va, Cb, Vb);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    /* ---- Burette + bécher ---- */
    const cx = CANVAS_W / 2;
    const buretteTop = 20;
    const buretteBottom = 130;
    const buretteW = 34;

    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - buretteW / 2, buretteTop, buretteW, buretteBottom - buretteTop);
    const fillFrac = Math.max(0.08, 1 - Vb / (Vmax * 1.2));
    ctx.fillStyle = SIM_COLORS.accentSoft;
    const fillTop = buretteTop + (buretteBottom - buretteTop) * (1 - fillFrac);
    ctx.fillRect(cx - buretteW / 2 + 2, fillTop, buretteW - 4, buretteBottom - fillTop - 2);
    /* Robinet. */
    ctx.beginPath();
    ctx.moveTo(cx - 10, buretteBottom);
    ctx.lineTo(cx + 10, buretteBottom);
    ctx.lineTo(cx, buretteBottom + 14);
    ctx.closePath();
    ctx.fillStyle = SIM_COLORS.ground;
    ctx.fill();

    /* Goutte qui tombe, discrète, en boucle lente pendant la lecture. */
    if (running) {
      const cyclePos = (t * 1.6) % 1;
      const dropY = buretteBottom + 20 + cyclePos * 50;
      ctx.globalAlpha = 1 - cyclePos * 0.6;
      ctx.fillStyle = SIM_COLORS.accent;
      ctx.beginPath();
      ctx.arc(cx, dropY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* Bécher. */
    const beakerW = 170;
    const beakerX0 = cx - beakerW / 2;
    const beakerBottom = APPARATUS_H - 10;
    const beakerTop = APPARATUS_H - 70;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(beakerX0, beakerTop);
    ctx.lineTo(beakerX0, beakerBottom);
    ctx.lineTo(beakerX0 + beakerW, beakerBottom);
    ctx.lineTo(beakerX0 + beakerW, beakerTop);
    ctx.stroke();

    const liquidFrac = 0.35 + 0.35 * ((Va + Vb) / (Va + Vmax));
    const liquidTop = beakerBottom - (beakerBottom - beakerTop) * liquidFrac;
    ctx.fillStyle = indicatorColor(pH);
    ctx.fillRect(beakerX0 + 2, liquidTop, beakerW - 4, beakerBottom - liquidTop - 2);

    /* ---- Graphe pH = f(Vb) ---- */
    const gx = (v: number) => GPAD.left + (v / Vmax) * (CANVAS_W - GPAD.left - GPAD.right);
    const gy = (ph: number) =>
      GRAPH_TOP + GRAPH_H - GPAD.bottom - (ph / 14) * (GRAPH_H - GPAD.top - GPAD.bottom);

    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "11px ui-sans-serif, system-ui";
    ctx.lineWidth = 1;
    const stepV = niceStep(Vmax);
    for (let v = 0; v <= Vmax; v += stepV) {
      const px = gx(v);
      ctx.beginPath();
      ctx.moveTo(px, GRAPH_TOP + GPAD.top);
      ctx.lineTo(px, GRAPH_TOP + GRAPH_H - GPAD.bottom);
      ctx.stroke();
      ctx.fillText(v.toFixed(0), px - 8, GRAPH_TOP + GRAPH_H - GPAD.bottom + 18);
    }
    for (let ph = 0; ph <= 14; ph += 2) {
      const py = gy(ph);
      ctx.beginPath();
      ctx.moveTo(GPAD.left, py);
      ctx.lineTo(CANVAS_W - GPAD.right, py);
      ctx.stroke();
      ctx.fillText(String(ph), GPAD.left - 26, py + 4);
    }
    ctx.fillText("V versé (mL)", CANVAS_W - GPAD.right - 60, GRAPH_TOP + GRAPH_H - GPAD.bottom + 34);
    ctx.fillText("pH", GPAD.left - 34, GRAPH_TOP + GPAD.top - 4);

    /* Équivalence : repère vertical + pH = 7. */
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = SIM_COLORS.vectorY;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx(Veq), GRAPH_TOP + GPAD.top);
    ctx.lineTo(gx(Veq), GRAPH_TOP + GRAPH_H - GPAD.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.fillText("Véq", gx(Veq) + 4, GRAPH_TOP + GPAD.top + 12);

    /* Courbe pH(V) complète (repère discret) puis parcourue. */
    const curve = (from: number, to: number) => {
      ctx.beginPath();
      const steps = 140;
      for (let i = 0; i <= steps; i++) {
        const v = from + ((to - from) * i) / steps;
        const px = gx(v);
        const py = gy(computePH(Ca, Va, Cb, v));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.lineWidth = 1.5;
    curve(0, Vmax);
    ctx.setLineDash([]);

    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    curve(0, Vb);

    ctx.fillStyle = SIM_COLORS.accentStrong;
    ctx.beginPath();
    ctx.arc(gx(Vb), gy(pH), 6, 0, Math.PI * 2);
    ctx.fill();
  }, [t, Vb, pH, Ca, Va, Cb, Vmax, Veq, running]);

  const fmt = (n: number, d = 2) => n.toFixed(d);
  const status = Vb < Veq * 0.98 ? "avant l'équivalence" : Vb > Veq * 1.02 ? "après l'équivalence" : "à l'équivalence";

  return (
    <div style={simThemeVars()} className="min-h-screen bg-[var(--sim-page)] text-[var(--sim-text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <a
          href="/simulations"
          className="text-sm font-medium text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
        >
          ‹ Retour aux simulations
        </a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Titrage acido-basique</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Suivi pH-métrique du titrage d&apos;un acide fort par une base forte. Versez le titrant et
          observez le pH évoluer, avec le saut caractéristique à l&apos;équivalence.
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
                onClick={() => {
                  if (finished) {
                    setT(0);
                    setFinished(false);
                  }
                  setRunning((r) => !r);
                }}
                className={SIM_CLASSES.btnPrimary}
              >
                {running ? "⏸ Pause" : finished ? "▶ Rejouer" : "▶ Verser"}
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
              <span className="ms-auto text-xs font-medium text-[var(--sim-text-muted)]">{status}</span>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-4">
              {[
                { label: "V versé", value: `${fmt(Vb, 1)} mL` },
                { label: "pH", value: fmt(pH, 2) },
                { label: "V équivalence", value: `${fmt(Veq, 1)} mL` },
                { label: "pH à l'équivalence", value: "7,0" },
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
                  Acide — concentration Cₐ
                </span>
                <span className="text-sm font-semibold tabular-nums">{fmt(Ca, 2)} mol/L</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.2}
                step={0.01}
                value={Ca}
                onChange={(e) => setCa(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Acide — volume Vₐ
                </span>
                <span className="text-sm font-semibold tabular-nums">{Va} mL</span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                step={1}
                value={Va}
                onChange={(e) => setVa(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Base — concentration C_b
                </span>
                <span className="text-sm font-semibold tabular-nums">{fmt(Cb, 2)} mol/L</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.2}
                step={0.01}
                value={Cb}
                onChange={(e) => setCb(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <div className="space-y-2 border-t border-[var(--sim-border)] pt-4 text-xs leading-relaxed text-[var(--sim-text-muted)]">
              <p>Acide fort + base forte : à l&apos;équivalence, Cₐ·Vₐ = C_b·V_b et pH = 7.</p>
              <p>Couleur du bécher : indicateur coloré, virage entre pH 8 et 10 (type phénolphtaléine).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
