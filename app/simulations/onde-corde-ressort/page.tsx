"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS } from "../_theme";
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
  useModeParam,
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Onde mécanique progressive : corde (transversale) et ressort (longitudinal).
   La source S émet une perturbation de durée Δ ; un point d'abscisse x
   reproduit le mouvement de S avec le retard x/v :
     élongation(x, t) = A·s(t − t₀ − x/v),  s(u) = sin²(πu/Δ) pour 0 ≤ u ≤ Δ.
   Corde : élongation verticale (u⃗ ⊥ v⃗). Ressort : déplacement selon l'axe
   (u⃗ ∥ v⃗). Extrémité amortie : pas de réflexion.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 400;
const L = 10;
const X0 = 60;
const PX = 80;
const Y0 = 215;
const X = (x: number) => X0 + x * PX;

type Mode = "corde" | "ressort";
const MODES = ["corde", "ressort"] as const;

function bump(u: number, d: number) {
  return u >= 0 && u <= d ? Math.sin((Math.PI * u) / d) ** 2 : 0;
}

export default function OndeCordeRessortPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "corde");
  const [v, setV] = useState(2);
  const [amp, setAmp] = useState(3);
  const [dur, setDur] = useState(0.6);
  const [xMark, setXMark] = useState(5);
  const [running, setRunning] = useState(true);
  const [pulses, setPulses] = useState<number[]>([]);
  const [t, setT] = useSimClock(running, 1);

  // Une première perturbation part dès l'ouverture.
  useEffect(() => {
    setPulses([0.2]);
  }, []);

  // On oublie les perturbations sorties de la corde.
  useEffect(() => {
    if (pulses.some((t0) => t - t0 - dur > L / v + 0.5)) {
      setPulses((ps) => ps.filter((t0) => t - t0 - dur <= L / v + 0.5));
    }
  }, [t, pulses, dur, v]);

  const elong = (x: number) => pulses.reduce((s, t0) => s + bump(t - t0 - x / v, dur), 0);
  const markU = amp * elong(xMark);
  const last = pulses.length ? pulses[pulses.length - 1] : null;
  const front = last === null ? null : Math.min(L, Math.max(0, v * (t - last)));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    // Source et axe.
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(X(0), Y0);
    ctx.lineTo(X(L), Y0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    for (let x = 0; x <= L; x += 1) {
      ctx.fillText(`${x}`, X(x) - 3, H - 18);
      ctx.fillRect(X(x), H - 34, 1, 6);
    }
    ctx.fillText("x (m)", X(L) - 10, H - 40);
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.fillRect(18, Y0 - 50, 30, 100);
    ctx.strokeRect(18, Y0 - 50, 30, 100);
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 14px ui-sans-serif, system-ui";
    ctx.fillText("S", 28, Y0 - 60);

    const xmPx = X(xMark);

    if (mode === "corde") {
      const Apx = 22;
      ctx.strokeStyle = SIM_COLORS.vectorX;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(xmPx, Y0 - amp * Apx - 12);
      ctx.lineTo(xmPx, Y0 + 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = SIM_COLORS.accent;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const x = (L * i) / 400;
        const y = Y0 - amp * Apx * elong(x);
        if (i === 0) ctx.moveTo(X(x), y);
        else ctx.lineTo(X(x), y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      for (let x = 0.25; x < L; x += 0.25) {
        ctx.fillStyle = SIM_COLORS.ground;
        ctx.beginPath();
        ctx.arc(X(x), Y0 - amp * Apx * elong(x), 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const ym = Y0 - markU * Apx;
      if (Math.abs(markU) > 0.08) drawArrow(ctx, xmPx, Y0, xmPx, ym, SIM_COLORS.vectorX, "u");
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.shadowColor = SIM_COLORS.vectorX;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(xmPx, ym, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const pitch = 0.2;
      const R = 34;
      const xi = (s: number) => amp * 0.07 * elong(s);
      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = SIM_COLORS.accent;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i <= 2400; i++) {
        const s = (L * i) / 2400;
        const ph = (2 * Math.PI * s) / pitch;
        const px = X(s + xi(s)) + 6 * Math.cos(ph);
        const py = Y0 + R * Math.sin(ph);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      const sm = Math.round(xMark / pitch) * pitch + pitch / 4;
      const xmNow = X(sm + xi(sm)) + 6 * Math.cos((2 * Math.PI * sm) / pitch);
      const xmRest = X(sm) + 6 * Math.cos((2 * Math.PI * sm) / pitch);
      ctx.strokeStyle = SIM_COLORS.vectorX;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(xmRest - 6, Y0 + R + 26);
      ctx.lineTo(xmRest + amp * 0.07 * PX * 2 + 10, Y0 + R + 26);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (Math.abs(xmNow - xmRest) > 0.6) {
        drawArrow(ctx, xmRest, Y0 + R + 26, xmRest + (xmNow - xmRest) * 2, Y0 + R + 26, SIM_COLORS.vectorX, "u");
      }
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.shadowColor = SIM_COLORS.vectorX;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(xmNow, Y0 - R, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("u agrandi ×2", xmRest - 30, Y0 + R + 50);
    }

    // Vecteur de propagation au niveau de la perturbation la plus récente.
    if (last !== null) {
      const xc = v * (t - last - dur / 2);
      if (xc > 0.3 && xc < L - 0.8) {
        const yv = mode === "corde" ? Y0 - amp * 22 - 34 : Y0 - 70;
        drawArrow(ctx, X(xc) - 30, yv, X(xc) + 45, yv, SIM_COLORS.vectorResult, "v");
      }
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 20px ui-sans-serif, system-ui";
    ctx.fillText(
      mode === "corde" ? "Onde transversale : u ⊥ v" : "Onde longitudinale : u ∥ v",
      X0,
      38
    );
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(
      "Le point marqué oscille sur place puis revient au repos : la matière n'est pas transportée, l'énergie l'est.",
      X0,
      64
    );
  });

  const send = () => setPulses((ps) => [...ps, t]);
  const reset = () => {
    setPulses([]);
    setT(0);
  };

  return (
    <SimShell
      title="Onde transversale et onde longitudinale"
      intro="Une onde mécanique est la propagation d'une perturbation dans un milieu matériel élastique, sans transport de matière mais avec transport d'énergie. Comparez la corde, où l'élongation est perpendiculaire à la propagation, et le ressort, où elle lui est parallèle."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <button type="button" onClick={send} className={SIM_CLASSES.btnPrimary}>
            ↯ Envoyer une perturbation
          </button>
          <PlayButton running={running} onToggle={() => setRunning((r) => !r)} />
          <GhostButton onClick={reset}>⟲ Réinitialiser</GhostButton>
        </>
      }
      readouts={[
        { label: "Temps t", value: `${fmt(t)} s` },
        { label: "Front de l'onde", value: front === null ? "—" : `x = ${fmt(front)} m` },
        { label: "Élongation du point marqué", value: `${fmt(markU, 1)} cm` },
        { label: "Type d'onde", value: mode === "corde" ? "transversale" : "longitudinale" },
      ]}
      side={
        <>
          <Segmented
            options={[
              { id: "corde", label: "Corde (transversale)" },
              { id: "ressort", label: "Ressort (longitudinale)" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Slider label="Célérité v" value={v} unit="m/s" min={0.5} max={4} step={0.1} digits={1} onChange={setV} />
          <Slider label="Amplitude" value={amp} unit="cm" min={1} max={4} step={0.5} digits={1} onChange={setAmp} />
          <Slider label="Durée de la perturbation Δ" value={dur} unit="s" min={0.2} max={1.2} step={0.05} digits={2} onChange={setDur} />
          <Slider label="Position du point marqué" value={xMark} unit="m" min={1} max={9} step={0.25} digits={2} onChange={setXMark} />
          <Notes>
            <p>Onde transversale : le vecteur déplacement u est perpendiculaire à la direction de propagation (corde, surface de l&apos;eau).</p>
            <p>Onde longitudinale : u est parallèle à la direction de propagation (ressort, son).</p>
            <p>Changez l&apos;amplitude ou la durée : la célérité, elle, ne change pas. Elle ne dépend que du milieu.</p>
          </Notes>
        </>
      }
      footnote="Les élongations sont agrandies par rapport aux distances le long de l'axe, pour rester visibles. Extrémité de droite amortie : la perturbation n'est pas réfléchie ; la réflexion est étudiée dans la simulation « Superposition et réflexion »."
    />
  );
}
