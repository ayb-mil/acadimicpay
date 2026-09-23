"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Pile Daniell (Zn / Zn²⁺ ‖ Cu²⁺ / Cu).
   Oxydation à l'anode (Zn → Zn²⁺ + 2e⁻), réduction à la cathode
   (Cu²⁺ + 2e⁻ → Cu). Les électrons cheminent par le fil extérieur de
   l'électrode de zinc vers celle de cuivre ; le pont salin assure la
   neutralité électrique des deux compartiments.
   Loi de Nernst (approximation usuelle à 25 °C, 0,06/n) :
   E = E° − (0,06/2)·log10([Zn²⁺]/[Cu²⁺]), E° = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) = 1,10 V.
   ══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 920;
const CANVAS_H = 420;
const E_STANDARD = 1.1;

export default function PileDaniellSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [znConc, setZnConc] = useState(0.5);
  const [cuConc, setCuConc] = useState(0.5);
  const [closed, setClosed] = useState(false);
  const [time, setTime] = useState(0);

  const E = useMemo(
    () => E_STANDARD - (0.06 / 2) * Math.log10(znConc / cuConc),
    [znConc, cuConc]
  );

  useEffect(() => {
    if (!closed) return;
    let raf = 0;
    const loop = (now: number) => {
      setTime(now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [closed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = SIM_COLORS.canvasBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const beakerW = 220;
    const beakerTop = 210;
    const beakerBottom = 380;
    const leftX = 130;
    const rightX = CANVAS_W - 130 - beakerW;
    const electrodeTop = 100;
    const line = (ax: number, ay: number, bx: number, by: number) => {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    };

    /* Béchers + solutions (teinte plus soutenue côté Cu²⁺, plus pâle côté Zn²⁺). */
    const drawBeaker = (x: number, tint: string, label: string) => {
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, beakerTop);
      ctx.lineTo(x, beakerBottom);
      ctx.lineTo(x + beakerW, beakerBottom);
      ctx.lineTo(x + beakerW, beakerTop);
      ctx.stroke();
      ctx.fillStyle = tint;
      ctx.fillRect(x + 2, beakerTop + 40, beakerW - 4, beakerBottom - beakerTop - 42);
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.fillText(label, x + 10, beakerBottom - 10);
    };
    drawBeaker(leftX, "rgba(167, 156, 196, 0.18)", "Zn²⁺ (SO₄²⁻)");
    drawBeaker(rightX, "rgba(110, 168, 159, 0.28)", "Cu²⁺ (SO₄²⁻)");

    /* Électrodes. */
    const znX = leftX + beakerW / 2;
    const cuX = rightX + beakerW / 2;
    ctx.strokeStyle = SIM_COLORS.textMuted;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    line(znX, electrodeTop, znX, beakerTop + 60);
    ctx.strokeStyle = SIM_COLORS.accentStrong;
    line(cuX, electrodeTop, cuX, beakerTop + 60);
    ctx.font = "13px ui-sans-serif, system-ui";
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.fillText("Zn (−)", znX - 18, electrodeTop - 10);
    ctx.fillText("Cu (+)", cuX - 18, electrodeTop - 10);

    /* Fil extérieur + voltmètre. */
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    line(znX, electrodeTop, znX, 50);
    line(znX, 50, cuX, 50);
    line(cuX, 50, cuX, electrodeTop);
    ctx.beginPath();
    ctx.arc((znX + cuX) / 2, 50, 18, 0, Math.PI * 2);
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "bold 13px ui-sans-serif, system-ui";
    ctx.fillText("V", (znX + cuX) / 2 - 5, 55);
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillText(`${E.toFixed(2)} V`, (znX + cuX) / 2 - 20, 26);

    /* Pont salin (arc). */
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(znX + 40, beakerTop + 10);
    ctx.quadraticCurveTo((znX + cuX) / 2, beakerTop - 70, cuX - 40, beakerTop + 10);
    ctx.stroke();
    ctx.font = "11px ui-sans-serif, system-ui";
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.fillText("pont salin", (znX + cuX) / 2 - 26, beakerTop - 40);

    if (closed) {
      /* Électrons sur le fil, de Zn vers Cu. */
      const wireLen = cuX - znX;
      for (let k = 0; k < 3; k++) {
        const frac = ((time * 0.35 + k / 3) % 1);
        const ex = znX + frac * wireLen;
        ctx.fillStyle = SIM_COLORS.accent;
        ctx.beginPath();
        ctx.arc(ex, 50, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "10px ui-sans-serif, system-ui";
        ctx.fillText("e⁻", ex - 6, 38);
      }
      /* Ions dans le pont salin (anions vers Zn, cations vers Cu). */
      for (let k = 0; k < 2; k++) {
        const frac = (time * 0.15 + k / 2) % 1;
        const px = znX + 40 + frac * (cuX - 40 - (znX + 40));
        const py = beakerTop + 10 - Math.sin(frac * Math.PI) * 80;
        ctx.fillStyle = SIM_COLORS.vectorY;
        ctx.font = "11px ui-sans-serif, system-ui";
        ctx.fillText(frac < 0.5 ? "SO₄²⁻" : "", px - 10, py + 4);
      }
    }
  }, [znConc, cuConc, closed, time, E]);

  return (
    <div style={simThemeVars()} className="min-h-screen bg-[var(--sim-page)] text-[var(--sim-text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <a
          href="/simulations"
          className="text-sm font-medium text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
        >
          ‹ Retour aux simulations
        </a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Pile Daniell</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Pile Zn / Zn²⁺ ‖ Cu²⁺ / Cu. Faites varier les concentrations pour voir leur effet sur la
          tension, via la loi de Nernst.
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
                onClick={() => setClosed((c) => !c)}
                className={closed ? SIM_CLASSES.btnPrimary : SIM_CLASSES.btnGhost}
              >
                {closed ? "Circuit fermé" : "Circuit ouvert"}
              </button>
              <span className="text-xs text-[var(--sim-text-muted)]">
                {closed
                  ? "e⁻ : Zn → Cu par le fil extérieur ; ions SO₄²⁻ vers le compartiment Zn."
                  : "Cliquez pour fermer le circuit et observer la circulation des charges."}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-4">
              {[
                { label: "E (Nernst)", value: `${E.toFixed(2)} V` },
                { label: "anode (oxydation)", value: "Zn (−)" },
                { label: "cathode (réduction)", value: "Cu (+)" },
                { label: "E° (standard)", value: `${E_STANDARD.toFixed(2)} V` },
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
                  [Zn²⁺]
                </span>
                <span className="text-sm font-semibold tabular-nums">{znConc.toFixed(2)} mol/L</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={1}
                step={0.01}
                value={znConc}
                onChange={(e) => setZnConc(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sim-text-muted)]">
                  [Cu²⁺]
                </span>
                <span className="text-sm font-semibold tabular-nums">{cuConc.toFixed(2)} mol/L</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={1}
                step={0.01}
                value={cuConc}
                onChange={(e) => setCuConc(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
            </label>

            <div className="space-y-1.5 border-t border-[var(--sim-border)] pt-4 text-xs leading-relaxed text-[var(--sim-text-muted)]">
              <p>Zn → Zn²⁺ + 2e⁻ (oxydation, anode)</p>
              <p>Cu²⁺ + 2e⁻ → Cu (réduction, cathode)</p>
              <p>E = E° − (0,06/2)·log([Zn²⁺]/[Cu²⁺])</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
