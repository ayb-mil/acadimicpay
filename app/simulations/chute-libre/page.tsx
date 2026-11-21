"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import {
  GhostButton,
  Notes,
  PlayButton,
  Segmented,
  SimCanvas,
  SimShell,
  Slider,
  SIM_FONT,
  drawArrow,
  fmt,
  prepareCanvas,
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Chute libre verticale : seul le poids agit, a = g.
   Axe Oz vers le bas (O au point de départ, comme dans le cours) :
     a_z = +g ; z₀ = 0 ; sol en z = h.
   Axe Oz vers le haut (O au sol, comme dans les exercices) :
     a_z = −g ; z₀ = h ; sol en z = 0.
   v_z(t) = a_z·t + v₀z ;  z(t) = ½·a_z·t² + v₀z·t + z₀.
   Lancé vers le haut : sommet atteint pour v_z = 0.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 540;
const SCENE = { x: 60, top: 70, bottom: 490, w: 300 };
const GRAPHS = [
  { x: 440, y: 80, w: 440, h: 170, title: "z (m)" },
  { x: 440, y: 320, w: 440, h: 170, title: "v_z (m/s)" },
];

type Axis = "bas" | "haut";
type Dir = "bas" | "haut";
const PRESETS = [
  { id: "ex1", label: "Exercice 1 : bille, h = 10 m, v₀ = 4 m/s vers le bas", h: 10, v0: 4, dir: "bas" as Dir, g: 10, axis: "haut" as Axis },
  { id: "ex2", label: "Exercice 2 : fléchette, 1,75 m, 5 m/s vers le haut", h: 1.75, v0: 5, dir: "haut" as Dir, g: 9.8, axis: "haut" as Axis },
  { id: "cours", label: "Cours : lâchée sans vitesse, Oz vers le bas", h: 10, v0: 0, dir: "bas" as Dir, g: 9.81, axis: "bas" as Axis },
];

export default function ChuteLibrePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [h, setH] = useState(10);
  const [v0, setV0] = useState(4);
  const [dir, setDir] = useState<Dir>("bas");
  const [g, setG] = useState(10);
  const [axis, setAxis] = useState<Axis>("haut");
  const [running, setRunning] = useState(true);
  const [slow, setSlow] = useState(0.5);
  const [t, setT] = useSimClock(running, slow);

  const az = axis === "bas" ? g : -g;
  const z0 = axis === "bas" ? 0 : h;
  const v0z = (dir === "bas") === (axis === "bas") ? v0 : -v0;
  const zGround = axis === "bas" ? h : 0;
  // Instant d'arrivée au sol : ½·a·t² + v₀z·t + (z₀ − z_sol) = 0, racine positive.
  const disc = v0z * v0z - 2 * az * (z0 - zGround);
  const tGround = (-v0z + Math.sign(az) * Math.sqrt(Math.max(0, disc))) / az;
  const tc = Math.min(t, tGround);
  const z = 0.5 * az * tc * tc + v0z * tc + z0;
  const vz = az * tc + v0z;
  const height = (time: number) => {
    const zz = 0.5 * az * time * time + v0z * time + z0;
    return axis === "bas" ? h - zz : zz;
  };
  const up = dir === "haut" && v0 > 0;
  const tTop = up ? v0 / g : null;
  const hTop = up ? h + (v0 * v0) / (2 * g) : null;
  const vGround = Math.abs(az * tGround + v0z);

  useEffect(() => {
    setT(0);
    setRunning(true);
  }, [h, v0, dir, g, axis, setT]);
  useEffect(() => {
    if (t >= tGround) setRunning(false);
  }, [t, tGround]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const hMax = (hTop ?? h) * 1.08;
    const Y = (alt: number) => SCENE.bottom - (alt / hMax) * (SCENE.bottom - SCENE.top);
    const bx = SCENE.x + 170;

    // Sol et graduations de hauteur.
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SCENE.x, SCENE.bottom);
    ctx.lineTo(SCENE.x + SCENE.w, SCENE.bottom);
    ctx.stroke();
    ctx.lineWidth = 1;
    // Axe Oz.
    const ax = SCENE.x + 40;
    const oY = axis === "bas" ? Y(h) : Y(0);
    const endY = axis === "bas" ? SCENE.bottom + 2 : SCENE.top;
    drawArrow(ctx, ax, axis === "bas" ? SCENE.top - 4 : SCENE.bottom, ax, endY, SIM_COLORS.textMuted);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "italic 15px ui-serif, Georgia, serif";
    ctx.fillText("z", ax - 18, axis === "bas" ? SCENE.bottom - 6 : SCENE.top + 10);
    ctx.fillText("O", ax - 20, oY + 5);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.beginPath();
    ctx.arc(ax, oY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = SIM_FONT;
    ctx.fillText(`h = ${fmt(h, 2)} m`, bx + 30, Y(h) + 4);
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(SCENE.x, Y(h));
    ctx.lineTo(SCENE.x + SCENE.w, Y(h));
    ctx.stroke();
    if (hTop !== null) {
      ctx.beginPath();
      ctx.moveTo(SCENE.x, Y(hTop));
      ctx.lineTo(SCENE.x + SCENE.w, Y(hTop));
      ctx.stroke();
      ctx.fillText(`sommet ${fmt(hTop, 2)} m`, bx + 30, Y(hTop) + 4);
    }
    ctx.setLineDash([]);

    // Chronophotographie (une position tous les 0,1 s) et bille.
    for (let k = 0; k * 0.1 <= tc; k++) {
      ctx.fillStyle = SIM_COLORS.ground;
      ctx.beginPath();
      ctx.arc(bx - 30, Y(height(k * 0.1)), 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const by = Y(height(tc));
    ctx.fillStyle = SIM_COLORS.accent;
    ctx.shadowColor = SIM_COLORS.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawArrow(ctx, bx + 18, by, bx + 18, by + 46, SIM_COLORS.vectorY, "P");
    const vUp = axis === "bas" ? -vz : vz;
    if (Math.abs(vz) > 0.1) drawArrow(ctx, bx - 18, by, bx - 18, by - vUp * 5, SIM_COLORS.accent, "v");

    // Graphes z(t) et v_z(t).
    const series = [(time: number) => 0.5 * az * time * time + v0z * time + z0, (time: number) => az * time + v0z];
    GRAPHS.forEach((Gr, i) => {
      const f = series[i];
      let lo = 0;
      let hi = 0;
      for (let k = 0; k <= 60; k++) {
        const val = f((tGround * k) / 60);
        lo = Math.min(lo, val);
        hi = Math.max(hi, val);
      }
      const pad = (hi - lo) * 0.08 + 0.1;
      lo -= pad;
      hi += pad;
      const gx = (time: number) => Gr.x + (time / tGround) * Gr.w;
      const gy = (val: number) => Gr.y + Gr.h - ((val - lo) / (hi - lo)) * Gr.h;
      ctx.strokeStyle = SIM_COLORS.grid;
      ctx.strokeRect(Gr.x, Gr.y, Gr.w, Gr.h);
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.beginPath();
      ctx.moveTo(Gr.x, gy(0));
      ctx.lineTo(Gr.x + Gr.w, gy(0));
      ctx.stroke();
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText(Gr.title, Gr.x, Gr.y - 10);
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText(fmt(hi - pad, 1), Gr.x + 4, gy(hi - pad) + 14);
      ctx.fillText(fmt(lo + pad, 1), Gr.x + 4, gy(lo + pad) - 4);
      ctx.fillText(`t (s) — ${fmt(tGround, 2)}`, Gr.x + Gr.w - 92, Gr.y + Gr.h + 18);
      ctx.strokeStyle = i === 0 ? SIM_COLORS.vectorY : SIM_COLORS.accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let k = 0; k <= 200; k++) {
        const time = (tc * k) / 200;
        if (k === 0) ctx.moveTo(gx(time), gy(f(time)));
        else ctx.lineTo(gx(time), gy(f(time)));
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    });

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 17px ui-sans-serif, system-ui";
    ctx.fillText(`Oz vers le ${axis} : a_z = ${fmt(az, 2)} m/s²`, 24, 30);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "italic 15px ui-serif, Georgia, serif";
    ctx.fillText(
      `v_z = ${fmt(az, 2)}·t ${v0z >= 0 ? "+" : "−"} ${fmt(Math.abs(v0z), 2)}   ;   z = ${fmt(az / 2, 3)}·t² ${v0z >= 0 ? "+" : "−"} ${fmt(Math.abs(v0z), 2)}·t + ${fmt(z0, 2)}`,
      24,
      54
    );
  });

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!;
    setH(p.h);
    setV0(p.v0);
    setDir(p.dir);
    setG(p.g);
    setAxis(p.axis);
  };

  return (
    <SimShell
      title="Chute libre verticale"
      intro="Un corps en chute libre n'est soumis qu'à son poids : la 2ᵉ loi de Newton donne a = g. En intégrant, on obtient v = g·t + v₀ et z = ½·g·t² + v₀·t + z₀, avec des signes qui dépendent de l'orientation de l'axe Oz."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (t >= tGround ? (setT(0), setRunning(true)) : setRunning((r) => !r))} />
          <GhostButton
            onClick={() => {
              setT(0);
              setRunning(true);
            }}
          >
            ⟲ Recommencer
          </GhostButton>
          <Segmented
            className="ms-auto"
            options={[
              { id: 0.25, label: "×0,25" },
              { id: 0.5, label: "×0,5" },
              { id: 1, label: "×1" },
            ]}
            value={slow}
            onChange={setSlow}
          />
        </>
      }
      readouts={[
        { label: "t", value: `${fmt(tc, 2)} s` },
        { label: "z", value: `${fmt(z, 2)} m` },
        { label: "v_z", value: `${fmt(vz, 2)} m/s` },
        { label: "Arrivée au sol", value: `${fmt(tGround, 2)} s à ${fmt(vGround, 2)} m/s` },
        { label: "Sommet (t_S ; h_S)", value: tTop !== null && hTop !== null ? `${fmt(tTop, 2)} s ; ${fmt(hTop, 2)} m` : "—" },
        { label: "Accélération a_z", value: `${fmt(az, 2)} m/s²` },
        { label: "Vitesse initiale v₀z", value: `${fmt(v0z, 2)} m/s` },
        { label: "Abscisse initiale z₀", value: `${fmt(z0, 2)} m` },
      ]}
      side={
        <>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className="rounded-2xl border border-[var(--sim-border)] px-3 py-2 text-start text-xs font-semibold text-[var(--sim-text-muted)] transition hover:border-[var(--sim-accent)] hover:text-[var(--sim-text)]"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Segmented
            options={[
              { id: "bas", label: "Oz vers le bas" },
              { id: "haut", label: "Oz vers le haut" },
            ]}
            value={axis}
            onChange={setAxis}
          />
          <Slider label="Hauteur de départ h" value={h} unit="m" min={0.5} max={20} step={0.25} digits={2} onChange={setH} />
          <Slider label="Vitesse initiale v₀" value={v0} unit="m/s" min={0} max={10} step={0.5} digits={1} onChange={setV0} />
          <Segmented
            options={[
              { id: "bas", label: "lancée vers le bas" },
              { id: "haut", label: "lancée vers le haut" },
            ]}
            value={dir}
            onChange={setDir}
          />
          <Segmented
            options={[
              { id: 9.81, label: "g = 9,81" },
              { id: 10, label: "g = 10" },
              { id: 1.62, label: "Lune 1,62" },
            ]}
            value={g}
            onChange={setG}
          />
          <Notes>
            <p>2ᵉ loi de Newton : m·a = P = m·g, donc a = g, quelle que soit la masse.</p>
            <p>v = g·t + v₀ et z = ½·g·t² + v₀·t + z₀ (Oz vers le bas). Avec Oz vers le haut, remplacez g par −g.</p>
            <p>Au sommet, la vitesse est nulle : t_S = v₀/g et h_S = h + v₀²/(2g).</p>
          </Notes>
        </>
      }
    />
  );
}
