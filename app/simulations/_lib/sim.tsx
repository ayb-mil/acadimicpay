"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";

/* ══════════════════════════════════════════════════════════════════════════
   Briques communes aux simulations du programme (cadre de page, curseurs,
   lectures, horloge d'animation, canvas net sur écrans haute densité).
   ══════════════════════════════════════════════════════════════════════════ */

/** Temps simulé (s) qui avance tant que `running`, multiplié par `speed`. */
export function useSimClock(running: boolean, speed: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) * speed;
      last = now;
      setT((p) => p + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed]);
  return [t, setT] as const;
}

/** Lit `?mode=…` une fois monté (lien direct depuis une page de leçon). */
export function useModeParam<T extends string>(allowed: readonly T[], fallback: T) {
  const [mode, setMode] = useState<T>(fallback);
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode") as T | null;
    if (m && allowed.includes(m)) setMode(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [mode, setMode] as const;
}

/** Prépare un canvas de taille logique W×H, net quel que soit le devicePixelRatio. */
export function prepareCanvas(canvas: HTMLCanvasElement, W: number, H: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(W * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = SIM_COLORS.canvasBg;
  ctx.fillRect(0, 0, W, H);
  return ctx;
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  color: string,
  label?: string
) {
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 3) return;
  const ang = Math.atan2(by - ay, bx - ax);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - 9 * Math.cos(ang - 0.42), by - 9 * Math.sin(ang - 0.42));
  ctx.lineTo(bx - 9 * Math.cos(ang + 0.42), by - 9 * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.shadowBlur = 0;
    ctx.font = "italic 600 14px ui-serif, Georgia, serif";
    ctx.fillText(label, bx + 6 * Math.cos(ang + Math.PI / 2) + 4, by + 6 * Math.sin(ang + Math.PI / 2) - 6);
  }
  ctx.restore();
}

export const SIM_FONT = "15px ui-sans-serif, system-ui, sans-serif";
export const SIM_MONO = "15px ui-monospace, Menlo, Consolas, monospace";

/* ---------- Composants d'interface ---------- */

export function SimShell({
  title,
  intro,
  canvas,
  toolbar,
  readouts,
  side,
  footnote,
}: {
  title: string;
  intro: ReactNode;
  canvas: ReactNode;
  toolbar: ReactNode;
  readouts: { label: ReactNode; value: string }[];
  side: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div style={simThemeVars()} className="min-h-screen bg-[var(--sim-page)] text-[var(--sim-text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <a href="/simulations#programme" className="text-sm font-medium text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]">
          ‹ Retour au programme
        </a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[var(--sim-text-muted)]">{intro}</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className={SIM_CLASSES.card}>
            {canvas}
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sim-border)] p-4">{toolbar}</div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-4">
              {readouts.map((r, i) => (
                <div key={i} className="bg-[var(--sim-panel)] px-3 py-2.5">
                  <p className="text-[11px] font-semibold tracking-wide text-[var(--sim-text-muted)]">{r.label}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`${SIM_CLASSES.card} h-fit space-y-5 p-5`}>{side}</div>
        </div>
        {footnote ? (
          <div className="mt-5 max-w-3xl text-xs leading-relaxed text-[var(--sim-text-muted)]">{footnote}</div>
        ) : null}
      </div>
    </div>
  );
}

export function SimCanvas({
  canvasRef,
  W,
  H,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  W: number;
  H: number;
}) {
  // Sur téléphone, la figure garde une largeur minimale (texte lisible) et défile horizontalement.
  return (
    <>
      <div className="overflow-x-auto rounded-t-3xl">
        <canvas
          ref={canvasRef}
          className="block w-full min-w-[640px] rounded-t-3xl"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>
      <p className="px-4 pt-2 text-[11px] text-[var(--sim-text-muted)] sm:hidden">↔ Faites glisser la figure pour la voir en entier.</p>
    </>
  );
}

export function Slider({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  digits = 0,
}: {
  label: ReactNode;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  digits?: number;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide text-[var(--sim-text-muted)]">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {value.toFixed(digits).replace(".", ",")}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--sim-accent-strong)]"
      />
    </label>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: readonly { id: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1 rounded-full border border-[var(--sim-border)] p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            value === o.id
              ? "bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
              : "text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PlayButton({ running, onToggle }: { running: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={SIM_CLASSES.btnPrimary}>
      {running ? "⏸ Pause" : "▶ Lancer"}
    </button>
  );
}

export function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={SIM_CLASSES.btnGhost}>
      {children}
    </button>
  );
}

export function Notes({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2 border-t border-[var(--sim-border)] pt-4 text-xs leading-relaxed text-[var(--sim-text-muted)]">
      {children}
    </div>
  );
}

/** ν (nu) en italique serif : dans la police du site il se confond avec v (vitesse). */
export function Nu() {
  return <span className="font-serif text-[1.08em] italic">ν</span>;
}

export const fmt = (x: number, d = 2) => x.toFixed(d).replace(".", ",");
