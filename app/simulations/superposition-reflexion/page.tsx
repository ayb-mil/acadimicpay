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
  useModeParam,
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Superposition : deux perturbations se propageant en sens inverses sur une
   corde se croisent ; l'élongation résultante est la somme algébrique
   y = y₁ + y₂, puis chacune poursuit son chemin sans être altérée.
   Réflexion : arrivée à l'extrémité, la perturbation repart en sens inverse.
   Méthode des images : y = y₁(x) + σ·y₁(2L − x), σ = −1 extrémité fixe
   (perturbation renversée), σ = +1 extrémité libre (même sens).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 400;
const L = 10;
const X0 = 60;
const PX = 80;
const Y0 = 225;
const APX = 24;
const X = (x: number) => X0 + x * PX;

type Mode = "superposition" | "reflexion";
type End = "fixe" | "libre";
const MODES = ["superposition", "reflexion"] as const;

/** Bosse centrée de largeur totale w (cos²), nulle ailleurs. */
function bump(s: number, w: number) {
  return Math.abs(s) < w / 2 ? Math.cos((Math.PI * s) / w) ** 2 : 0;
}

export default function SuperpositionReflexionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "superposition");
  const [a1, setA1] = useState(2);
  const [a2, setA2] = useState(1.5);
  const [w, setW] = useState(1.6);
  const [end, setEnd] = useState<End>("fixe");
  const [showParts, setShowParts] = useState(true);
  const [running, setRunning] = useState(true);
  const [t, setT] = useSimClock(running, 1);
  const v = 2;

  const x1 = 1.5 + v * t;
  const x2 = 8.5 - v * t;
  // Superposition : les deux bosses ont quitté la corde. Réflexion : la bosse réfléchie revient près de la source.
  const tEnd = mode === "superposition" ? (7 + w) / v + 0.6 : (2 * L - 2) / v;
  useEffect(() => {
    if (t > tEnd) setRunning(false);
  }, [t, tEnd]);

  const y1 = (x: number) => a1 * bump(x - x1, w);
  const y2 = (x: number) => (mode === "superposition" ? a2 * bump(x - x2, w) : (end === "fixe" ? -1 : 1) * a1 * bump(2 * L - x - x1, w));
  const total = (x: number) => y1(x) + y2(x);

  let maxAbs = 0;
  for (let i = 0; i <= 400; i++) {
    const val = total((L * i) / 400);
    if (Math.abs(val) > Math.abs(maxAbs)) maxAbs = val;
  }
  const overlap = Math.abs(x1 - (mode === "superposition" ? x2 : 2 * L - x1)) < w;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(X(0), Y0);
    ctx.lineTo(X(L), Y0);
    ctx.stroke();
    ctx.setLineDash([]);

    const plot = (f: (x: number) => number, color: string, width: number, dash?: number[]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash ?? []);
      if (!dash) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      for (let i = 0; i <= 500; i++) {
        const x = (L * i) / 500;
        const y = Y0 - f(x) * APX;
        if (i === 0) ctx.moveTo(X(x), y);
        else ctx.lineTo(X(x), y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    };

    if (showParts) {
      plot(y1, SIM_COLORS.vectorX, 1.5, [5, 5]);
      plot(y2, SIM_COLORS.vectorY, 1.5, [5, 5]);
    }
    plot(total, SIM_COLORS.accent, 2.8);

    // Extrémités.
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.ground;
    if (mode === "reflexion" && end === "fixe") {
      ctx.fillRect(X(L), Y0 - 70, 22, 140);
      ctx.strokeRect(X(L), Y0 - 70, 22, 140);
      for (let k = 0; k < 8; k++) {
        ctx.beginPath();
        ctx.moveTo(X(L) + 22, Y0 - 66 + k * 18);
        ctx.lineTo(X(L) + 34, Y0 - 76 + k * 18);
        ctx.stroke();
      }
    } else if (mode === "reflexion") {
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X(L) + 6, Y0 - 90);
      ctx.lineTo(X(L) + 6, Y0 + 90);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = SIM_COLORS.vectorResult;
      const yEnd = Y0 - total(L) * APX;
      ctx.beginPath();
      ctx.ellipse(X(L) + 6, yEnd, 9, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // Flèches de propagation au-dessus de chaque perturbation visible.
    const arrowAt = (xc: number, dir: 1 | -1, color: string) => {
      if (xc < 0.4 || xc > L - 0.4) return;
      const y = Y0 - 4 * APX;
      drawArrow(ctx, X(xc) - dir * 30, y, X(xc) + dir * 40, y, color, "v");
    };
    if (mode === "superposition") {
      arrowAt(x1, 1, SIM_COLORS.vectorX);
      arrowAt(x2, -1, SIM_COLORS.vectorY);
    } else {
      arrowAt(x1, 1, SIM_COLORS.vectorX);
      arrowAt(2 * L - x1, -1, SIM_COLORS.vectorY);
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 20px ui-sans-serif, system-ui";
    ctx.fillText(
      mode === "superposition" ? "Superposition : y = y₁ + y₂" : `Réflexion sur une extrémité ${end}`,
      X0,
      38
    );
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(
      mode === "superposition"
        ? overlap
          ? "Les deux perturbations se croisent : leurs élongations s'ajoutent algébriquement."
          : "Après le croisement, chaque perturbation garde sa forme et son amplitude."
        : end === "fixe"
          ? "Extrémité fixe : la perturbation réfléchie est renversée."
          : "Extrémité libre : la perturbation réfléchie reste du même côté.",
      X0,
      64
    );
    if (showParts) {
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.fillText(mode === "superposition" ? "y₁ (pointillés)" : "incidente", X0, H - 22);
      ctx.fillStyle = SIM_COLORS.vectorY;
      ctx.fillText(mode === "superposition" ? "y₂ (pointillés)" : "réfléchie", X0 + 150, H - 22);
      ctx.fillStyle = SIM_COLORS.accent;
      ctx.fillText("corde (résultante)", X0 + 300, H - 22);
    }
  });

  const restart = () => {
    setT(0);
    setRunning(true);
  };

  return (
    <SimShell
      title="Superposition et réflexion"
      intro="Deux perturbations qui se rencontrent se superposent : leurs élongations s'ajoutent algébriquement, puis elles s'éloignent sans être altérées. Arrivée au bout de la corde, une perturbation se réfléchit et repart en sens inverse."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (t > tEnd ? restart() : setRunning((r) => !r))} />
          <GhostButton onClick={restart}>⟲ Recommencer</GhostButton>
          <label className="ms-auto flex items-center gap-2 text-sm text-[var(--sim-text-muted)]">
            <input
              type="checkbox"
              checked={showParts}
              onChange={(e) => setShowParts(e.target.checked)}
              className="accent-[var(--sim-accent-strong)]"
            />
            Afficher chaque perturbation
          </label>
        </>
      }
      readouts={
        mode === "superposition"
          ? [
              { label: "Temps t", value: `${fmt(t)} s` },
              { label: "a₁ + a₂", value: `${fmt(a1 + a2, 1)} cm` },
              { label: "Élongation maximale de la corde", value: `${fmt(maxAbs, 1)} cm` },
              { label: "État", value: overlap ? "croisement" : x1 < x2 ? "avant croisement" : "après croisement" },
            ]
          : [
              { label: "Temps t", value: `${fmt(t)} s` },
              { label: "Extrémité", value: end },
              { label: "Élongation maximale de la corde", value: `${fmt(maxAbs, 1)} cm` },
              { label: "Sens", value: x1 < L ? "vers l'extrémité" : "retour vers la source" },
            ]
      }
      side={
        <>
          <Segmented
            options={[
              { id: "superposition", label: "Superposition" },
              { id: "reflexion", label: "Réflexion" },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              restart();
            }}
          />
          <Slider label="Amplitude a₁" value={a1} unit="cm" min={-3} max={3} step={0.5} digits={1} onChange={setA1} />
          {mode === "superposition" ? (
            <Slider label="Amplitude a₂" value={a2} unit="cm" min={-3} max={3} step={0.5} digits={1} onChange={setA2} />
          ) : (
            <Segmented
              options={[
                { id: "fixe", label: "Extrémité fixe" },
                { id: "libre", label: "Extrémité libre" },
              ]}
              value={end}
              onChange={(e) => {
                setEnd(e);
                restart();
              }}
            />
          )}
          <Slider label="Largeur de la perturbation" value={w} unit="m" min={0.8} max={3} step={0.1} digits={1} onChange={setW} />
          <Notes>
            {mode === "superposition" ? (
              <>
                <p>Au croisement, l&apos;élongation de chaque point est y = y₁ + y₂ : avec a₁ = 2 cm et a₂ = 1,5 cm, la corde monte jusqu&apos;à 3,5 cm.</p>
                <p>Essayez a₂ = −a₁ : au croisement, la corde paraît plate un instant, puis les deux perturbations réapparaissent intactes.</p>
              </>
            ) : (
              <>
                <p>La perturbation réfléchie repart vers la source avec la même célérité.</p>
                <p>Extrémité fixe : elle revient renversée. Extrémité libre : elle revient du même côté.</p>
              </>
            )}
          </Notes>
        </>
      }
    />
  );
}
