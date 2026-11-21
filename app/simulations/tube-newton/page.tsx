"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import {
  GhostButton,
  Notes,
  PlayButton,
  Segmented,
  SimCanvas,
  SimShell,
  SIM_FONT,
  drawArrow,
  fmt,
  prepareCanvas,
  useSimClock,
} from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Expérience du tube de Newton (hauteur 1 m), deux tubes côte à côte.
   • Tube vidé de son air : seul le poids agit, a = g pour les trois objets,
     ils tombent ensemble (chute libre).
   • Tube rempli d'air : en plus du poids, frottement fluide f = ½·ρ·Cₓ·S·v²
     et poussée d'Archimède F_A = ρ·V·g (négligeable ici). Paramètres choisis
     pour des vitesses limites réalistes : bille d'acier ≈ 42 m/s, boule de
     papier ≈ 5 m/s, plume ≈ 0,6 m/s.
   Intégration RK4 de m·dv/dt = m·g − f − F_A.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 520;
const G = 9.81;
const RHO_AIR = 1.2;
const HEIGHT = 1;
const TUBE = { top: 80, h: 380, w: 170 };

const OBJECTS = [
  { id: "bille", label: "Bille d'acier", m: 4.08e-3, CS: 0.47 * Math.PI * 0.005 ** 2, V: (4 / 3) * Math.PI * 0.005 ** 3, color: "#B8C4DA" },
  { id: "papier", label: "Papier froissé", m: 0.5e-3, CS: 0.5 * Math.PI * 0.015 ** 2, V: (4 / 3) * Math.PI * 0.015 ** 3, color: "#E8EEFA" },
  { id: "plume", label: "Plume", m: 0.03e-3, CS: 1.2e-3, V: 5e-8, color: "#FFB547" },
] as const;

type Traj = { t: number[]; z: number[]; v: number[] };

function fall(m: number, CS: number, V: number, air: boolean): Traj {
  const dt = 0.0005;
  const t: number[] = [0];
  const z: number[] = [0];
  const v: number[] = [0];
  const acc = (vv: number) => (air ? G - (0.5 * RHO_AIR * CS * vv * vv + RHO_AIR * V * G) / m : G);
  let tt = 0;
  let zz = 0;
  let vv = 0;
  while (zz < HEIGHT && tt < 10) {
    const k1v = acc(vv);
    const k1z = vv;
    const k2v = acc(vv + (dt / 2) * k1v);
    const k2z = vv + (dt / 2) * k1v;
    const k3v = acc(vv + (dt / 2) * k2v);
    const k3z = vv + (dt / 2) * k2v;
    const k4v = acc(vv + dt * k3v);
    const k4z = vv + dt * k3v;
    vv += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    zz += (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    tt += dt;
    t.push(tt);
    z.push(Math.min(zz, HEIGHT));
    v.push(vv);
  }
  return { t, z, v };
}

function at(tr: Traj, time: number) {
  const i = Math.min(tr.t.length - 1, Math.max(0, Math.round(time / 0.0005)));
  return { z: tr.z[i], v: tr.v[i], landed: i === tr.t.length - 1 };
}

export default function TubeNewtonPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slow, setSlow] = useState(0.2);
  const [running, setRunning] = useState(true);
  const [t, setT] = useSimClock(running, slow);

  const trajs = useMemo(
    () =>
      OBJECTS.map((o) => ({
        vide: fall(o.m, o.CS, o.V, false),
        air: fall(o.m, o.CS, o.V, true),
      })),
    []
  );
  const tEnd = Math.max(...trajs.map((x) => x.air.t[x.air.t.length - 1]));

  useEffect(() => {
    if (t >= tEnd + 0.2) setRunning(false);
  }, [t, tEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const tubes = [
      { x: 170, title: "Tube vidé de son air", key: "vide" as const },
      { x: 560, title: "Tube rempli d'air", key: "air" as const },
    ];
    const Y = (z: number) => TUBE.top + 20 + (z / HEIGHT) * (TUBE.h - 40);

    for (const tube of tubes) {
      ctx.fillStyle = tube.key === "vide" ? "rgba(5, 8, 15, 0.6)" : "rgba(34, 228, 217, 0.06)";
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.lineWidth = 2;
      ctx.fillRect(tube.x, TUBE.top, TUBE.w, TUBE.h);
      ctx.strokeRect(tube.x, TUBE.top, TUBE.w, TUBE.h);
      ctx.lineWidth = 1;
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.font = "600 16px ui-sans-serif, system-ui";
      ctx.fillText(tube.title, tube.x, TUBE.top - 14);

      OBJECTS.forEach((o, k) => {
        const tr = trajs[k][tube.key];
        const s = at(tr, t);
        const x = tube.x + 32 + k * 53;
        const y = Y(s.z);
        ctx.fillStyle = o.color;
        if (o.id === "plume") {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(0.5);
          ctx.beginPath();
          ctx.ellipse(0, 0, 6, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#7a5a20";
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(0, 18);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, o.id === "bille" ? 7 : 11, 0, Math.PI * 2);
          ctx.fill();
        }
        // Forces (échelle relative au poids de chaque objet).
        if (tube.key === "air" && k === 2) {
          const P = o.m * G;
          const f = 0.5 * RHO_AIR * o.CS * s.v * s.v;
          drawArrow(ctx, x + 16, y, x + 16, y + 50, SIM_COLORS.vectorY, "P");
          if (f > P * 0.04) drawArrow(ctx, x + 16, y, x + 16, y - 50 * Math.min(f / P, 1.05), SIM_COLORS.vectorResult, "f");
        }
        if (tube.key === "vide" && k === 0) drawArrow(ctx, x - 16, y, x - 16, y + 46, SIM_COLORS.vectorY, "P");
      });
    }

    // Légende des objets.
    ctx.font = SIM_FONT;
    OBJECTS.forEach((o, k) => {
      ctx.fillStyle = o.color;
      ctx.fillRect(24, 110 + k * 26, 12, 12);
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.fillText(o.label, 42, 121 + k * 26);
    });
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.fillText(`t = ${fmt(Math.min(t, tEnd), 2)} s`, 24, 210);
    ctx.fillText("Hauteur : 1 m", 24, 234);

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    ctx.fillText("Expérience du tube de Newton", 24, 34);
  });

  const durations = trajs.map((x) => ({ vide: x.vide.t[x.vide.t.length - 1], air: x.air.t[x.air.t.length - 1] }));

  return (
    <SimShell
      title="Expérience du tube de Newton"
      intro="Une bille, une boule de papier et une plume tombent dans deux tubes. Dans le tube vidé de son air, ils ne sont soumis qu'à leur poids et tombent ensemble : c'est la chute libre. Dans l'air, les frottements les freinent différemment."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (t >= tEnd + 0.2 ? (setT(0), setRunning(true)) : setRunning((r) => !r))} />
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
              { id: 0.05, label: "ralenti ×20" },
              { id: 0.2, label: "×5" },
              { id: 1, label: "temps réel" },
            ]}
            value={slow}
            onChange={setSlow}
          />
        </>
      }
      readouts={[
        { label: "Durée de chute dans le vide", value: `${fmt(durations[0].vide, 2)} s pour les trois` },
        { label: "Bille d'acier dans l'air", value: `${fmt(durations[0].air, 2)} s` },
        { label: "Papier froissé dans l'air", value: `${fmt(durations[1].air, 2)} s` },
        { label: "Plume dans l'air", value: `${fmt(durations[2].air, 2)} s` },
      ]}
      side={
        <Notes>
          <p>Le poids d&apos;un corps : P = m·g, où g est l&apos;intensité du champ de pesanteur (N/kg).</p>
          <p>Dans le vide, seul le poids agit : les trois objets ont la même accélération g et tombent ensemble.</p>
          <p>Dans l&apos;air s&apos;ajoutent la réaction de l&apos;air (frottement) et la poussée d&apos;Archimède : la plume, très freinée, arrive bien après la bille.</p>
          <p>Définition : un corps est en chute libre s&apos;il n&apos;est soumis qu&apos;à son poids. Pour un corps dense et aérodynamique, comme la bille, l&apos;action de l&apos;air est négligeable.</p>
        </Notes>
      }
      footnote="Dans le tube rempli d'air, les forces sont dessinées sur la plume : le frottement f grandit avec la vitesse jusqu'à équilibrer presque le poids."
    />
  );
}
