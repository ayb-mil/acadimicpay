"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Réfraction de la lumière (loi de Snell-Descartes).
   n1·sin(θ1) = n2·sin(θ2). Purement géométrique : pas d'évolution dans le
   temps, le tracé se recalcule directement à chaque changement de curseur.
   Si n1>n2 et θ1 dépasse l'angle critique θc=asin(n2/n1), le rapport
   n1·sinθ1/n2 dépasse 1 : il n'y a plus de rayon réfracté, seulement une
   réflexion totale.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const CANVAS_H = 460;
const O = { x: CANVAS_W / 2, y: CANVAS_H / 2 };
const RAY_LEN = 190;

const MEDIA = [
  { label: "Air", n: 1.0 },
  { label: "Eau", n: 1.33 },
  { label: "Verre", n: 1.5 },
  { label: "Diamant", n: 2.42 },
];

export default function RefractionSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.33);
  const [theta1Deg, setTheta1Deg] = useState(30);

  const { theta2Deg, isTIR, criticalAngleDeg } = useMemo(() => {
    const theta1 = (theta1Deg * Math.PI) / 180;
    const ratio = (n1 * Math.sin(theta1)) / n2;
    const critical = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
    if (Math.abs(ratio) > 1) return { theta2Deg: null, isTIR: true, criticalAngleDeg: critical };
    return { theta2Deg: (Math.asin(ratio) * 180) / Math.PI, isTIR: false, criticalAngleDeg: critical };
  }, [n1, n2, theta1Deg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, O.y);
    ctx.fillStyle = SIM_COLORS.panelAlt;
    ctx.fillRect(0, O.y, CANVAS_W, CANVAS_H - O.y);

    /* Interface. */
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, O.y);
    ctx.lineTo(CANVAS_W, O.y);
    ctx.stroke();

    /* Normale. */
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(O.x, O.y - RAY_LEN - 20);
    ctx.lineTo(O.x, O.y + RAY_LEN + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    const theta1 = (theta1Deg * Math.PI) / 180;
    const incidentStart = { x: O.x - RAY_LEN * Math.sin(theta1), y: O.y - RAY_LEN * Math.cos(theta1) };
    const reflectedEnd = { x: O.x + RAY_LEN * Math.sin(theta1), y: O.y - RAY_LEN * Math.cos(theta1) };

    /* Rayon incident. */
    ctx.strokeStyle = SIM_COLORS.accentStrong;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(incidentStart.x, incidentStart.y);
    ctx.lineTo(O.x, O.y);
    ctx.stroke();

    /* Rayon réfléchi (fin, sauf en cas de réflexion totale). */
    ctx.strokeStyle = isTIR ? SIM_COLORS.accentStrong : SIM_COLORS.vectorY;
    ctx.lineWidth = isTIR ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(O.x, O.y);
    ctx.lineTo(reflectedEnd.x, reflectedEnd.y);
    ctx.stroke();

    /* Rayon réfracté. */
    if (theta2Deg !== null) {
      const theta2 = (theta2Deg * Math.PI) / 180;
      const refractedEnd = { x: O.x + RAY_LEN * Math.sin(theta2), y: O.y + RAY_LEN * Math.cos(theta2) };
      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(refractedEnd.x, refractedEnd.y);
      ctx.stroke();
    }

    /* Arcs + libellés d'angles. */
    ctx.strokeStyle = SIM_COLORS.textMuted;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "13px ui-sans-serif, system-ui";
    ctx.lineWidth = 1.5;
    const arcR = 42;
    ctx.beginPath();
    ctx.arc(O.x, O.y, arcR, -Math.PI / 2 - theta1, -Math.PI / 2, false);
    ctx.stroke();
    ctx.fillText(`θ₁ = ${theta1Deg.toFixed(0)}°`, O.x - arcR - 46, O.y - arcR + 6);

    if (theta2Deg !== null) {
      const theta2 = (theta2Deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(O.x, O.y, arcR, Math.PI / 2, Math.PI / 2 + theta2, false);
      ctx.stroke();
      ctx.fillText(`θ₂ = ${theta2Deg.toFixed(1)}°`, O.x + arcR + 6, O.y + arcR + 4);
    }

    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillText(`n₁ = ${n1.toFixed(2)}`, 14, 24);
    ctx.fillText(`n₂ = ${n2.toFixed(2)}`, 14, CANVAS_H - 14);

    if (isTIR) {
      ctx.font = "bold 14px ui-sans-serif, system-ui";
      ctx.fillStyle = SIM_COLORS.accentStrong;
      ctx.fillText("Réflexion totale", O.x + 60, O.y - 60);
    }
  }, [n1, n2, theta1Deg, theta2Deg, isTIR]);

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Réfraction de la lumière</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Loi de Snell-Descartes : n₁·sin(θ₁) = n₂·sin(θ₂). Si le milieu 1 est plus réfringent que le
          milieu 2, un angle d&apos;incidence trop grand produit une réflexion totale.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className={SIM_CLASSES.card}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="block w-full rounded-3xl"
              style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            />
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-4">
              {[
                { label: "θ₁ (incidence)", value: `${theta1Deg}°` },
                { label: "θ₂ (réfraction)", value: isTIR ? "réflexion totale" : `${fmt(theta2Deg ?? 0, 1)}°` },
                { label: "angle critique", value: criticalAngleDeg !== null ? `${fmt(criticalAngleDeg, 1)}°` : "—" },
                { label: "n₁ / n₂", value: `${n1.toFixed(2)} / ${n2.toFixed(2)}` },
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
                Milieu 1 (incident)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MEDIA.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setN1(m.n)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      Math.abs(n1 - m.n) < 0.001
                        ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                        : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.01}
                value={n1}
                onChange={(e) => setN1(Number(e.target.value))}
                className="mt-2.5 w-full accent-[var(--sim-accent-strong)]"
              />
              <p className="mt-1 text-xs text-[var(--sim-text-muted)]">n₁ = {n1.toFixed(2)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                Milieu 2 (réfraction)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MEDIA.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setN2(m.n)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      Math.abs(n2 - m.n) < 0.001
                        ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                        : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.01}
                value={n2}
                onChange={(e) => setN2(Number(e.target.value))}
                className="mt-2.5 w-full accent-[var(--sim-accent-strong)]"
              />
              <p className="mt-1 text-xs text-[var(--sim-text-muted)]">n₂ = {n2.toFixed(2)}</p>
            </div>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  Angle d&apos;incidence θ₁
                </span>
                <span className="text-sm font-semibold tabular-nums">{theta1Deg}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={89}
                step={1}
                value={theta1Deg}
                onChange={(e) => setTheta1Deg(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
