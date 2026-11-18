"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import { Notes, Segmented, SimCanvas, SimShell, Slider, SIM_FONT, fmt, prepareCanvas, useModeParam } from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Mesure de la célérité des ultrasons à l'oscilloscope.
   Émetteur E (f = 40 kHz), récepteur R₁ à 5 cm de E, récepteur R₂ à la
   distance d de R₁. Célérité dans l'air : v ≈ 331,5 + 0,6·θ (m/s, θ en °C).
   Salves : R₂ reçoit la salve avec le retard τ = d/v ; à l'écran,
   τ = V_H·x (balayage × nombre de divisions).
   Continu : CH1 sert de déclenchement ; CH2 est décalée de τ modulo T.
   Les deux courbes sont en phase chaque fois que d est un multiple de λ = v/f.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 580;
const F = 40000;
const D0 = 0.05;
const N_CYCLES = 6;

const SCR = { x: 150, y: 220, w: 640, h: 320 };
const DIVX = 10;
const DIVY = 8;

type Mode = "salves" | "continu";
const MODES = ["salves", "continu"] as const;
const SWEEPS = [10, 20, 50, 100, 200] as const;

export default function UltrasonsOscilloscopePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "salves");
  const [dCm, setDCm] = useState(10);
  const [theta, setTheta] = useState(20);
  const [sweep, setSweep] = useState<(typeof SWEEPS)[number]>(100);

  // Balayage adapté au mode : salves entières à l'écran, ou quelques périodes en continu.
  useEffect(() => {
    setSweep(mode === "salves" ? 100 : 10);
  }, [mode]);

  const v = 331.5 + 0.6 * theta;
  const d = dCm / 100;
  const tau = d / v;
  const lambda = v / F;
  const k = d / lambda;
  const frac = k - Math.floor(k);
  const inPhase = Math.min(frac, 1 - frac) < 0.04;
  const opposition = Math.abs(frac - 0.5) < 0.04;
  const xDiv = (tau * 1e6) / sweep;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    // ---- Banc : règle, émetteur, récepteurs ----
    const bx = 70;
    const scale = 2.2; // px par mm
    const by = 110;
    const toPx = (m: number) => bx + 40 + m * 1000 * scale;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.beginPath();
    ctx.moveTo(toPx(0), by + 40);
    ctx.lineTo(toPx(0.36), by + 40);
    ctx.stroke();
    for (let cm = 0; cm <= 36; cm += 2) {
      const px = toPx(cm / 100);
      ctx.beginPath();
      ctx.moveTo(px, by + 40);
      ctx.lineTo(px, by + (cm % 10 === 0 ? 52 : 47));
      ctx.stroke();
      if (cm % 10 === 0) ctx.fillText(`${cm} cm`, px - 14, by + 68);
    }

    const box = (x: number, label: string, color: string) => {
      ctx.fillStyle = SIM_COLORS.panel;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x - 14, by - 22, 28, 44);
      ctx.strokeRect(x - 14, by - 22, 28, 44);
      ctx.lineWidth = 1;
      ctx.fillStyle = color;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText(label, x - 9, by - 30);
    };
    box(toPx(0) - 10, "E", SIM_COLORS.accent);
    box(toPx(D0), "R₁", SIM_COLORS.vectorX);
    box(toPx(D0 + d), "R₂", SIM_COLORS.vectorY);

    // Fronts d'onde (arcs) entre E et R₂, espacés de λ (agrandi pour être visible si besoin).
    ctx.strokeStyle = SIM_COLORS.accent;
    ctx.globalAlpha = 0.35;
    const stepPx = lambda * 1000 * scale;
    for (let x = toPx(0) + 6; x < toPx(D0 + d) - 16; x += stepPx) {
      ctx.beginPath();
      ctx.arc(toPx(0) - 10, by, x - toPx(0) + 10, -0.35, 0.35);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Cote d.
    ctx.strokeStyle = SIM_COLORS.textMuted;
    ctx.beginPath();
    ctx.moveTo(toPx(D0), by - 48);
    ctx.lineTo(toPx(D0 + d), by - 48);
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(`d = R₁R₂ = ${fmt(dCm, 1)} cm`, (toPx(D0) + toPx(D0 + d)) / 2 - 50, by - 56);

    // ---- Oscilloscope ----
    ctx.fillStyle = "#03110F";
    ctx.fillRect(SCR.x - 10, SCR.y - 10, SCR.w + 20, SCR.h + 20);
    ctx.strokeStyle = "rgba(74, 222, 128, 0.16)";
    for (let i = 0; i <= DIVX; i++) {
      const x = SCR.x + (SCR.w * i) / DIVX;
      ctx.beginPath();
      ctx.moveTo(x, SCR.y);
      ctx.lineTo(x, SCR.y + SCR.h);
      ctx.stroke();
    }
    for (let j = 0; j <= DIVY; j++) {
      const y = SCR.y + (SCR.h * j) / DIVY;
      ctx.beginPath();
      ctx.moveTo(SCR.x, y);
      ctx.lineTo(SCR.x + SCR.w, y);
      ctx.stroke();
    }

    const win = (DIVX * sweep) / 1e6;
    const tx = (time: number) => SCR.x + (time / win) * SCR.w;
    const divPx = SCR.h / DIVY;
    const y1c = SCR.y + 2 * divPx;
    const y2c = SCR.y + 6 * divPx;

    // Instants d'arrivée (salves : déclenchement à l'émission ; continu : sur CH1).
    const t1 = mode === "salves" ? D0 / v : 0;
    const t2 = mode === "salves" ? (D0 + d) / v : tau;
    const amp2 = 1.4 * Math.sqrt(D0 / (D0 + d));
    const signal = (time: number, tArr: number, amp: number) => {
      const u = time - tArr;
      if (mode === "salves") {
        if (u < 0 || u > N_CYCLES / F) return 0;
        const ramp = Math.min(1, u * F, (N_CYCLES / F - u) * F);
        return amp * ramp * Math.sin(2 * Math.PI * F * u);
      }
      return amp * Math.sin(2 * Math.PI * F * u);
    };
    const trace = (tArr: number, amp: number, yc: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const n = 1600;
      for (let i = 0; i <= n; i++) {
        const time = (win * i) / n;
        const y = yc - signal(time, tArr, amp) * divPx;
        if (i === 0) ctx.moveTo(tx(time), y);
        else ctx.lineTo(tx(time), y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
    };
    trace(t1, 1.5, y1c, SIM_COLORS.vectorX);
    trace(t2, mode === "salves" ? amp2 : 1.5, y2c, SIM_COLORS.vectorY);

    ctx.font = "600 13px ui-sans-serif, system-ui";
    ctx.fillStyle = SIM_COLORS.vectorX;
    ctx.fillText("CH1 · R₁", SCR.x + 8, SCR.y + 18);
    ctx.fillStyle = SIM_COLORS.vectorY;
    ctx.fillText("CH2 · R₂", SCR.x + 8, SCR.y + 4 * divPx + 18);

    if (mode === "salves" && t2 <= win) {
      const yb = SCR.y + SCR.h - 14;
      ctx.strokeStyle = SIM_COLORS.vectorResult;
      ctx.fillStyle = SIM_COLORS.vectorResult;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(tx(t1), SCR.y);
      ctx.lineTo(tx(t1), SCR.y + SCR.h);
      ctx.moveTo(tx(t2), SCR.y);
      ctx.lineTo(tx(t2), SCR.y + SCR.h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(tx(t1), yb);
      ctx.lineTo(tx(t2), yb);
      ctx.stroke();
      ctx.font = "italic 600 15px ui-serif, Georgia, serif";
      ctx.fillText(`τ : ${fmt(xDiv, 1)} div`, (tx(t1) + tx(t2)) / 2 - 36, yb - 8);
    }

    // Réglages affichés à droite de l'écran.
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText("Balayage", SCR.x + SCR.w + 24, SCR.y + 20);
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 16px ui-sans-serif, system-ui";
    ctx.fillText(`${sweep} µs/div`, SCR.x + SCR.w + 24, SCR.y + 42);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText("Déclenchement", SCR.x + SCR.w + 24, SCR.y + 72);
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.fillText(mode === "salves" ? "émission" : "CH1", SCR.x + SCR.w + 24, SCR.y + 92);

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 20px ui-sans-serif, system-ui";
    ctx.fillText(
      mode === "salves" ? "Salves d'ultrasons : mesure directe du retard" : "Émission continue : repérer la longueur d'onde",
      30,
      34
    );
    if (mode === "salves" && t2 > win) {
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.font = SIM_FONT;
      ctx.fillText("La salve reçue par R₂ sort de l'écran : augmentez le balayage.", SCR.x, SCR.y + SCR.h + 30);
    }
  });

  return (
    <SimShell
      title="Ultrasons et oscilloscope"
      intro="Un émetteur d'ultrasons (40 kHz) et deux récepteurs reliés à un oscilloscope. En salves, le décalage entre les deux courbes donne directement le retard τ = V_H·x ; en continu, on déplace R₂ pour retrouver les courbes en phase, ce qui donne la longueur d'onde."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <Segmented
            options={[
              { id: "salves", label: "Salves" },
              { id: "continu", label: "Émission continue" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Segmented
            className="ms-auto"
            options={SWEEPS.map((s) => ({ id: s, label: `${s} µs/div` }))}
            value={sweep}
            onChange={setSweep}
          />
        </>
      }
      readouts={
        mode === "salves"
          ? [
              { label: "Décalage x", value: `${fmt(xDiv, 2)} div` },
              { label: "τ = V_H·x", value: `${fmt(tau * 1e6, 0)} µs` },
              { label: "v = d/τ", value: `${fmt(d / tau, 1)} m/s` },
              { label: "Distance d", value: `${fmt(dCm, 1)} cm` },
            ]
          : [
              { label: "Longueur d'onde λ = v/f", value: `${fmt(lambda * 1000, 2)} mm` },
              { label: "d/λ", value: fmt(k, 2) },
              { label: "Courbes", value: inPhase ? "en phase" : opposition ? "en opposition de phase" : "décalées" },
              { label: "Célérité v", value: `${fmt(v, 1)} m/s` },
            ]
      }
      side={
        <>
          <Slider label="Distance d = R₁R₂" value={dCm} unit="cm" min={0} max={30} step={mode === "continu" ? 0.05 : 0.5} digits={mode === "continu" ? 2 : 1} onChange={setDCm} />
          <Slider label="Température de l'air θ" value={theta} unit="°C" min={0} max={40} step={1} onChange={setTheta} />
          <Notes>
            {mode === "salves" ? (
              <>
                <p>Le retard se lit sur l&apos;écran : τ = V_H·x, avec V_H le balayage et x le nombre de divisions.</p>
                <p>Puis v = d/τ. Choisissez un balayage qui garde les deux salves à l&apos;écran.</p>
              </>
            ) : (
              <>
                <p>Partez de d = 0 (courbes en phase), puis éloignez R₂ : les courbes se retrouvent en phase chaque fois que d augmente de λ.</p>
                <p>En comptant 10 positions en phase, on mesure 10λ avec précision, puis v = λ·f.</p>
              </>
            )}
            <p>Célérité du son dans l&apos;air : v ≈ 331,5 + 0,6·θ (m/s). Elle dépend du milieu (ici sa température), pas de la fréquence.</p>
          </Notes>
        </>
      }
      footnote="Le décalage horizontal de l'écran ne s'anime pas : comme à l'oscilloscope réel, la trace est stable grâce au déclenchement."
    />
  );
}
