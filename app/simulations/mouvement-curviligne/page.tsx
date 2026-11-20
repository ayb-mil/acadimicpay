"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import {
  GhostButton,
  Notes,
  PlayButton,
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
   Bille sur un rail ABCD (exemple du cours).
   • AB incliné d'un angle α, sans frottement : a = g·sin α, v_B = √(2·g·AB·sin α).
   • BC horizontal avec frottement f constant : a = −f/m,
     v_C² = v_B² − 2·(f/m)·BC (arrêt sur BC si négatif).
   • CD quart de cercle de rayon r (bille sur l'extérieur), sans frottement :
     θ'' = (g/r)·sin θ ; v² = v_C² + 2·g·r·(1 − cos θ) ;
     R = m·g·cos θ − m·v²/r = m·g·(3·cos θ − 2) − m·v_C²/r.
     La bille quitte le rail quand R = 0 : cos θ_d = (2 + v_C²/(g·r))/3.
   • Ensuite, chute libre jusqu'au niveau de D.
   Repère : origine en C, x vers la droite, y vers le haut.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 520;
const g = 9.81;
const BC = 1;
const DT = 0.001;

type Seg = "AB" | "BC" | "CD" | "chute" | "arrêt";
type Sample = { t: number; x: number; y: number; vx: number; vy: number; seg: Seg; R: number | null; theta: number | null };

function simulate(alpha: number, AB: number, f: number, m: number, r: number) {
  const out: Sample[] = [];
  const s = Math.sin(alpha);
  const c = Math.cos(alpha);
  const xA = -BC - AB * c;
  const yA = AB * s;
  const aAB = g * s;
  const tB = Math.sqrt((2 * AB) / aAB);
  const vB = aAB * tB;
  for (let t = 0; t < tB; t += DT) {
    const d = 0.5 * aAB * t * t;
    const v = aAB * t;
    out.push({ t, x: xA + d * c, y: yA - d * s, vx: v * c, vy: -v * s, seg: "AB", R: m * g * c, theta: null });
  }
  const dec = f / m;
  const vC2 = vB * vB - 2 * dec * BC;
  if (vC2 <= 0) {
    const tStop = dec > 0 ? vB / dec : Infinity;
    for (let t = 0; t <= tStop; t += DT) {
      out.push({ t: tB + t, x: -BC + vB * t - 0.5 * dec * t * t, y: 0, vx: vB - dec * t, vy: 0, seg: "BC", R: null, theta: null });
    }
    const last = out[out.length - 1];
    out.push({ ...last, t: last.t + 0.5, vx: 0, seg: "arrêt" });
    return { out, vB, vC: 0, thetaD: null as number | null, xA, yA };
  }
  const vC = Math.sqrt(vC2);
  const tC = dec > 0 ? (vB - vC) / dec : BC / vB;
  for (let t = 0; t < tC; t += DT) {
    out.push({ t: tB + t, x: -BC + vB * t - 0.5 * dec * t * t, y: 0, vx: vB - dec * t, vy: 0, seg: "BC", R: null, theta: null });
  }
  // Portion circulaire : intégration RK4 de θ'' = (g/r)·sin θ.
  const thetaD = Math.acos(Math.min(1, (2 + vC2 / (g * r)) / 3));
  let th = 0;
  let w = vC / r;
  let t = tB + tC;
  const acc = (x: number) => (g / r) * Math.sin(x);
  while (true) {
    const v = w * r;
    const R = m * g * Math.cos(th) - (m * v * v) / r;
    if (R <= 0 || th >= Math.PI / 2) break;
    out.push({ t, x: r * Math.sin(th), y: -r + r * Math.cos(th), vx: v * Math.cos(th), vy: -v * Math.sin(th), seg: "CD", R, theta: th });
    const k1t = w;
    const k1w = acc(th);
    const k2t = w + (DT / 2) * k1w;
    const k2w = acc(th + (DT / 2) * k1t);
    const k3t = w + (DT / 2) * k2w;
    const k3w = acc(th + (DT / 2) * k2t);
    const k4t = w + DT * k3w;
    const k4w = acc(th + DT * k3t);
    th += (DT / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    w += (DT / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    t += DT;
  }
  // Chute libre depuis le point de décollage, jusqu'au niveau de D (y = −r).
  const v = w * r;
  let x = r * Math.sin(th);
  let y = -r + r * Math.cos(th);
  const vx = v * Math.cos(th);
  let vy = -v * Math.sin(th);
  while (y > -r) {
    out.push({ t, x, y, vx, vy, seg: "chute", R: null, theta: null });
    x += vx * DT;
    vy -= g * DT;
    y += vy * DT;
    t += DT;
  }
  out.push({ t: t + 0.4, x, y: -r, vx: 0, vy: 0, seg: "arrêt", R: null, theta: null });
  return { out, vB, vC, thetaD, xA, yA };
}

export default function MouvementCurvilignePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [alphaDeg, setAlphaDeg] = useState(30);
  const [AB, setAB] = useState(0.5);
  const [f, setF] = useState(0.1);
  const [m, setM] = useState(0.1);
  const [r, setR] = useState(0.6);
  const [running, setRunning] = useState(true);
  const [slow, setSlow] = useState(0.5);
  const [t, setT] = useSimClock(running, slow);

  const sim = useMemo(() => simulate((alphaDeg * Math.PI) / 180, AB, f, m, r), [alphaDeg, AB, f, m, r]);
  const tEnd = sim.out[sim.out.length - 1].t;
  const idx = Math.min(sim.out.length - 1, Math.max(0, Math.round(t / DT)));
  const cur = sim.out.find((p, i) => i >= idx - 2 && p.t >= t) ?? sim.out[sim.out.length - 1];

  useEffect(() => {
    setT(0);
    setRunning(true);
  }, [sim, setT]);
  useEffect(() => {
    if (t >= tEnd) setRunning(false);
  }, [t, tEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    let xmax = r;
    for (const p of sim.out) xmax = Math.max(xmax, p.x);
    const xmin = sim.xA;
    const ymin = -r;
    const ymax = sim.yA;
    const k = Math.min((W - 120) / (xmax - xmin), (H - 170) / (ymax - ymin));
    const ox = 60 + ((W - 120) - k * (xmax - xmin)) / 2;
    const X = (x: number) => ox + (x - xmin) * k;
    const Y = (y: number) => 90 + (ymax - y) * k;

    // Rail.
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(X(sim.xA), Y(sim.yA));
    ctx.lineTo(X(-BC), Y(0));
    ctx.lineTo(X(0), Y(0));
    for (let i = 0; i <= 60; i++) {
      const th = ((Math.PI / 2) * i) / 60;
      ctx.lineTo(X(r * Math.sin(th)), Y(-r + r * Math.cos(th)));
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(xmin) - 20, Y(-r));
    ctx.lineTo(X(xmax) + 20, Y(-r));
    ctx.stroke();
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(0), Y(-r));
    ctx.lineTo(X(r), Y(-r));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 15px ui-sans-serif, system-ui";
    ctx.fillText("A", X(sim.xA) - 16, Y(sim.yA) - 6);
    ctx.fillText("B", X(-BC) - 4, Y(0) + 22);
    ctx.fillText("C", X(0) - 4, Y(0) - 10);
    ctx.fillText("D", X(r) + 6, Y(-r) + 20);
    ctx.fillText("O", X(0) - 18, Y(-r) + 4);

    // Angle de décollage théorique.
    if (sim.thetaD !== null) {
      const th = sim.thetaD;
      ctx.strokeStyle = SIM_COLORS.vectorX;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(X(0), Y(-r));
      ctx.lineTo(X(r * Math.sin(th)), Y(-r + r * Math.cos(th)));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.font = "italic 600 14px ui-serif, Georgia, serif";
      ctx.fillText("θ_d", X(0) + 10, Y(-r) - 26);
    }

    // Trajectoire parcourue.
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= idx; i += 10) {
      const p = sim.out[i];
      if (!started) {
        ctx.moveTo(X(p.x), Y(p.y));
        started = true;
      } else ctx.lineTo(X(p.x), Y(p.y));
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;

    // Bille et vecteurs.
    const bx = X(cur.x);
    const by = Y(cur.y);
    const rad = 9;
    let cx = bx;
    let cy = by;
    if (cur.seg === "AB") {
      const a = (alphaDeg * Math.PI) / 180;
      cx = bx - rad * Math.sin(a);
      cy = by - rad * Math.cos(a);
    } else if (cur.seg === "BC" || cur.seg === "arrêt") cy = by - rad;
    else if (cur.seg === "CD" && cur.theta !== null) {
      cx = bx + rad * Math.sin(cur.theta);
      cy = by - rad * Math.cos(cur.theta);
    }
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1;
    const vsc = 24;
    if (Math.hypot(cur.vx, cur.vy) > 0.05) drawArrow(ctx, cx, cy, cx + cur.vx * vsc, cy - cur.vy * vsc, SIM_COLORS.accent, "v");
    drawArrow(ctx, cx, cy, cx, cy + 50, SIM_COLORS.vectorY, "P");
    if (cur.seg === "CD" && cur.R !== null && cur.theta !== null) {
      const len = (cur.R / (m * g)) * 50;
      drawArrow(ctx, cx, cy, cx + len * Math.sin(cur.theta), cy - len * Math.cos(cur.theta), SIM_COLORS.vectorResult, "R");
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    const head: Record<Seg, string> = {
      AB: "Portion AB : plan incliné sans frottement",
      BC: "Portion BC : horizontale avec frottement",
      CD: "Portion CD : circulaire, sans frottement",
      chute: "La bille a quitté le rail : chute libre",
      "arrêt": sim.vC === 0 ? "La bille s'arrête sur BC" : "Fin du mouvement",
    };
    ctx.fillText(head[cur.seg], 24, 32);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(
      cur.seg === "AB"
        ? "a = g·sin α : mouvement rectiligne uniformément accéléré."
        : cur.seg === "BC"
          ? "a = −f/m : mouvement rectiligne uniformément retardé."
          : cur.seg === "CD"
            ? "R = m·g·cos θ − m·v²/r diminue ; la bille décolle quand R = 0."
            : "",
      24,
      56
    );
  });

  const v = Math.hypot(cur.vx, cur.vy);

  return (
    <SimShell
      title="Mouvement curviligne sur un rail"
      intro="Une bille parcourt un rail ABCD : un plan incliné sans frottement, une partie horizontale avec frottement, puis un quart de cercle. Sur la partie circulaire, la réaction du rail diminue jusqu'à s'annuler : la bille quitte alors le rail."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => (t >= tEnd ? (setT(0), setRunning(true)) : setRunning((x) => !x))} />
          <GhostButton
            onClick={() => {
              setT(0);
              setRunning(true);
            }}
          >
            ⟲ Recommencer
          </GhostButton>
          <div className="ms-auto flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
            {[0.25, 0.5, 1].map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setSlow(x)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  slow === x ? "bg-[var(--sim-accent-soft)] text-[var(--sim-text)]" : "text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                }`}
              >
                ×{fmt(x, x < 1 ? 2 : 0)}
              </button>
            ))}
          </div>
        </>
      }
      readouts={[
        { label: "v_B = √(2·g·AB·sin α)", value: `${fmt(sim.vB, 2)} m/s` },
        { label: "v_C", value: sim.vC > 0 ? `${fmt(sim.vC, 2)} m/s` : "arrêt sur BC" },
        { label: "Angle de décollage θ_d", value: sim.thetaD !== null ? `${fmt((sim.thetaD * 180) / Math.PI, 1)}°` : "—" },
        { label: "Vitesse actuelle", value: `${fmt(v, 2)} m/s` },
        { label: "Portion", value: cur.seg },
        { label: "R sur CD", value: cur.seg === "CD" && cur.R !== null ? `${fmt(cur.R, 3)} N` : "—" },
        { label: "θ", value: cur.theta !== null ? `${fmt((cur.theta * 180) / Math.PI, 1)}°` : "—" },
        { label: "Temps t", value: `${fmt(Math.min(t, tEnd), 2)} s` },
      ]}
      side={
        <>
          <Slider label="Inclinaison α de AB" value={alphaDeg} unit="°" min={10} max={50} step={1} onChange={setAlphaDeg} />
          <Slider label="Longueur AB" value={AB} unit="m" min={0.3} max={2} step={0.05} digits={2} onChange={setAB} />
          <Slider label="Frottement f sur BC (BC = 1 m)" value={f} unit="N" min={0} max={0.6} step={0.01} digits={2} onChange={setF} />
          <Slider label="Masse m" value={m} unit="kg" min={0.05} max={0.5} step={0.01} digits={2} onChange={setM} />
          <Slider label="Rayon r de CD" value={r} unit="m" min={0.2} max={1} step={0.05} digits={2} onChange={setR} />
          <Notes>
            <p>AB : a = g·sin α, d&apos;où v_B = √(2·g·AB·sin α).</p>
            <p>BC : a = −f/m, d&apos;où v_C² = v_B² − 2·(f/m)·BC.</p>
            <p>
              CD : R = m·g·(3·cos θ − 2) − m·v_C²/r. Si la bille arrive en C sans vitesse, on retrouve R = m·g·(3·cos θ − 2) et elle décolle pour cos θ = 2/3,
              soit θ ≈ 48,2°.
            </p>
          </Notes>
        </>
      }
      footnote="Pour retrouver le cas du cours (v_C = 0), augmentez f jusqu'à ce que la bille arrive en C presque sans vitesse : θ_d tend vers 48,2°."
    />
  );
}
