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
   Solide sur un plan horizontal ou incliné, partant du repos.
   Projection de ΣF = m·a sur l'axe Ox du mouvement :
   • horizontal (Ox vers la droite) : force motrice D = F ;
   • incliné d'un angle α (Ox vers le bas de la pente, comme dans le cours),
     solide tiré vers le haut par T parallèle au plan : D = m·g·sin α − T.
   Réaction normale R_N = m·g·cos α. Frottement de coefficient k = tan φ :
   au repos, le solide ne bouge pas tant que |D| ≤ k·R_N ; sinon
   f = k·R_N s'oppose au mouvement et a = (D − f·signe(D))/m, constante.
   R = √(f² + R_N²).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 520;
const g = 9.81;
const LEN = 3;

type Mode = "horizontal" | "incline";
const MODES = ["horizontal", "incline"] as const;

export default function PlanInclinePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "horizontal");
  const [alphaDeg, setAlphaDeg] = useState(20);
  const [m, setM] = useState(1);
  const [F, setF] = useState(5);
  const [k, setK] = useState(0);
  const [running, setRunning] = useState(true);
  const [t, setT] = useSimClock(running, 1);

  useEffect(() => {
    setF(mode === "horizontal" ? 5 : 0);
  }, [mode]);
  useEffect(() => {
    setT(0);
    setRunning(true);
  }, [mode, alphaDeg, m, F, k, setT]);

  const alpha = mode === "incline" ? (alphaDeg * Math.PI) / 180 : 0;
  const RN = m * g * Math.cos(alpha);
  const D = mode === "horizontal" ? F : m * g * Math.sin(alpha) - F;
  const fMax = k * RN;
  const moves = Math.abs(D) > fMax + 1e-9;
  const f = moves ? fMax : Math.abs(D);
  const a = moves ? (D - Math.sign(D) * fMax) / m : 0;
  const tEnd = moves ? Math.sqrt((2 * (LEN / 2 - 0.25)) / Math.abs(a)) : Infinity;
  const tc = Math.min(t, tEnd);
  const x = 0.5 * a * tc * tc;
  const v = a * tc;
  const R = Math.hypot(f, RN);
  const phi = (Math.atan2(f, RN) * 180) / Math.PI;

  useEffect(() => {
    if (t >= tEnd) setRunning(false);
  }, [t, tEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const c = Math.cos(alpha);
    const s = Math.sin(alpha);
    // Échelle adaptée à l'angle : le plan tient dans 440 px de large et 330 px de haut.
    const PXM = Math.min(200, 330 / (LEN * Math.max(s, 1e-3)), 440 / (LEN * c));
    // Plan : point le plus bas à gauche, montée vers la droite.
    const P0 = { x: 140, y: 420 };
    const eUp = { x: c, y: -s };
    const nOut = { x: -s, y: -c };
    const ex = mode === "horizontal" ? { x: 1, y: 0 } : { x: -c, y: s };
    const mid = { x: P0.x + eUp.x * (LEN / 2) * PXM, y: P0.y + eUp.y * (LEN / 2) * PXM };
    const P1 = { x: P0.x + eUp.x * LEN * PXM, y: P0.y + eUp.y * LEN * PXM };

    ctx.fillStyle = "rgba(140, 156, 192, 0.10)";
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(P0.x, P0.y);
    ctx.lineTo(P1.x, P1.y);
    ctx.lineTo(P1.x, P0.y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(P0.x, P0.y);
    ctx.lineTo(P1.x, P1.y);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, P0.y);
    ctx.lineTo(P1.x + 40, P0.y);
    ctx.stroke();
    if (mode === "incline") {
      ctx.strokeStyle = SIM_COLORS.textMuted;
      ctx.beginPath();
      ctx.arc(P0.x, P0.y, 70, -alpha, 0);
      ctx.stroke();
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = "italic 600 15px ui-serif, Georgia, serif";
      ctx.fillText("α", P0.x + 78, P0.y - 8);
    }

    // Solide.
    const hw = 34;
    const hh = 22;
    const G = { x: mid.x + ex.x * x * PXM + nOut.x * hh, y: mid.y + ex.y * x * PXM + nOut.y * hh };
    ctx.save();
    ctx.translate(G.x, G.y);
    ctx.rotate(-alpha);
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2;
    ctx.fillRect(-hw, -hh, 2 * hw, 2 * hh);
    ctx.strokeRect(-hw, -hh, 2 * hw, 2 * hh);
    ctx.restore();
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.beginPath();
    ctx.arc(G.x, G.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Axe Ox.
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = SIM_COLORS.textMuted;
    ctx.beginPath();
    ctx.moveTo(G.x - ex.x * 180, G.y - ex.y * 180);
    ctx.lineTo(G.x + ex.x * 200, G.y + ex.y * 200);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = "italic 15px ui-serif, Georgia, serif";
    ctx.fillText("x", G.x + ex.x * 210 - 4, G.y + ex.y * 210 + 4);

    // Forces (même échelle pour toutes).
    const S = 110 / (m * g);
    const tip = (vx: number, vy: number) => ({ x: G.x + vx * S, y: G.y + vy * S });
    const Pt = tip(0, m * g);
    drawArrow(ctx, G.x, G.y, Pt.x, Pt.y, SIM_COLORS.vectorY, "P");
    const fDir = moves ? -Math.sign(D) : -Math.sign(D || 1);
    const fx = ex.x * fDir * f;
    const fy = ex.y * fDir * f;
    const Rx = nOut.x * RN + fx;
    const Ry = nOut.y * RN + fy;
    const Rt = tip(Rx, Ry);
    drawArrow(ctx, G.x, G.y, Rt.x, Rt.y, SIM_COLORS.vectorResult, "R");
    if (f > 1e-6) {
      ctx.setLineDash([3, 4]);
      const RNt = tip(nOut.x * RN, nOut.y * RN);
      drawArrow(ctx, G.x, G.y, RNt.x, RNt.y, SIM_COLORS.vectorResult, "R_N");
      const ft = tip(fx, fy);
      drawArrow(ctx, G.x, G.y, ft.x, ft.y, SIM_COLORS.vectorResult, "f");
      ctx.setLineDash([]);
    }
    if (F > 1e-6) {
      const dir = mode === "horizontal" ? 1 : -1;
      const Ft = tip(ex.x * dir * F, ex.y * dir * F);
      drawArrow(ctx, G.x, G.y, Ft.x, Ft.y, SIM_COLORS.vectorX, mode === "horizontal" ? "F" : "T");
    }

    // Graphe v(t).
    const Gr = { x: 620, y: 110, w: 260, h: 120 };
    const tSpan = Number.isFinite(tEnd) ? tEnd : 3;
    const vSpan = Math.max(Math.abs(a * tSpan), 0.5);
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.strokeRect(Gr.x, Gr.y, Gr.w, Gr.h);
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(Gr.x, Gr.y + Gr.h);
    ctx.lineTo(Gr.x + (tc / tSpan) * Gr.w, Gr.y + Gr.h - (Math.abs(v) / vSpan) * Gr.h);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText("|v| (m/s) en fonction de t", Gr.x, Gr.y - 8);
    ctx.fillText(fmt(vSpan, 1), Gr.x + 4, Gr.y + 14);
    ctx.fillText(`${fmt(tSpan, 2)} s`, Gr.x + Gr.w - 44, Gr.y + Gr.h + 16);

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    const head =
      mode === "horizontal"
        ? k === 0
          ? "Plan horizontal sans frottement : a = F/m"
          : "Plan horizontal avec frottement"
        : k === 0 && F === 0
          ? "Plan incliné sans frottement : a = g·sin α"
          : k === 0
            ? "Plan incliné sans frottement, solide tiré"
            : "Plan incliné avec frottement";
    ctx.fillText(head, 24, 32);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(
      moves ? `Le solide accélère : a = ${fmt(a, 2)} m/s² selon Ox.` : "Le frottement équilibre la force motrice : le solide reste immobile.",
      24,
      56
    );
  });

  return (
    <SimShell
      title="Mouvement sur un plan horizontal ou incliné"
      intro="On applique la 2ᵉ loi de Newton au solide, ΣF = m·a, puis on projette sur l'axe du mouvement. Sans frottement, la réaction R est perpendiculaire au plan ; avec frottement, elle s'incline d'un angle φ tel que tan φ = f/R_N = k."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (t >= tEnd ? (setT(0), setRunning(true)) : setRunning((r) => !r))} />
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
              { id: "horizontal", label: "Plan horizontal" },
              { id: "incline", label: "Plan incliné" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </>
      }
      readouts={[
        { label: "Accélération a (selon Ox)", value: `${fmt(a, 2)} m/s²` },
        { label: "R_N = m·g·cos α", value: `${fmt(RN, 2)} N` },
        { label: "f ; R = √(f² + R_N²)", value: `${fmt(f, 2)} N ; ${fmt(R, 2)} N` },
        { label: "Angle de frottement φ", value: `${fmt(phi, 1)}°` },
      ]}
      side={
        <>
          {mode === "incline" ? (
            <Slider label="Inclinaison α" value={alphaDeg} unit="°" min={5} max={45} step={1} onChange={setAlphaDeg} />
          ) : null}
          <Slider label="Masse m" value={m} unit="kg" min={0.5} max={5} step={0.1} digits={1} onChange={setM} />
          <Slider
            label={mode === "horizontal" ? "Force F (horizontale)" : "Traction T (vers le haut, parallèle au plan)"}
            value={F}
            unit="N"
            min={0}
            max={30}
            step={0.5}
            digits={1}
            onChange={setF}
          />
          <Slider label="Coefficient de frottement k = tan φ" value={k} min={0} max={0.6} step={0.02} digits={2} onChange={setK} />
          <Notes>
            {mode === "horizontal" ? (
              <>
                <p>Sans frottement : F + P + R = m·a, et P, R se compensent : a = F/m.</p>
                <p>Avec frottement : R a deux composantes, R_N et f ; R = √(f² + R_N²) et k = tan φ = f/R_N.</p>
              </>
            ) : (
              <>
                <p>Sans frottement et sans traction : P + R = m·a donne a = g·sin α (Ox vers le bas).</p>
                <p>Avec traction et frottement : P + R + T = m·a. Le solide monte si T &gt; m·g·sin α + f.</p>
              </>
            )}
          </Notes>
        </>
      }
      footnote="Le solide part du repos. Au repos, le frottement peut équilibrer la force motrice tant que celle-ci ne dépasse pas k·R_N."
    />
  );
}
