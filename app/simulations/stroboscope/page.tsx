"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_COLORS } from "../_theme";
import { GhostButton, Notes, PlayButton, SimCanvas, SimShell, Slider, SIM_FONT, fmt, prepareCanvas, useSimClock } from "../_lib/sim";

/* ══════════════════════════════════════════════════════════════════════════
   Étude stroboscopique. Le phénomène (disque, corde) a la fréquence f ;
   le stroboscope émet des éclairs de fréquence fₑ. On ne voit le phénomène
   qu'aux instants tₙ = n/fₑ, et l'œil garde chaque image ≈ 0,07 s
   (persistance rétinienne). On dessine donc les états aux éclairs récents,
   avec une opacité qui décroît avec leur âge. En découlent naturellement :
   • immobilité apparente si f = k·fₑ (k entier ≥ 1) ;
   • ralenti apparent de fréquence fₐ = f − fₑ si fₑ est proche de f :
     sens réel si fₐ > 0, sens inverse si fₐ < 0 ;
   • plusieurs images si fₑ > f ; flou en lumière continue.
   Le temps s'écoule ici en temps réel.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 470;
const PERSIST = 0.07;
const DISK = { x: 190, y: 255, r: 120 };
const STRING = { x: 380, w: 500, y: 255, amp: 55, lambda: 250 };

export default function StroboscopePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f, setF] = useState(50);
  const [fe, setFe] = useState(49.5);
  const [strobe, setStrobe] = useState(true);
  const [running, setRunning] = useState(true);
  const [t] = useSimClock(running, 1);

  const ratio = f / fe;
  const kNear = Math.round(ratio);
  const fa = f - kNear * fe;
  let observation: string;
  if (!strobe) observation = "lumière continue : image floue";
  else if (kNear >= 1 && Math.abs(fa) < 0.05) observation = `immobilité apparente (f = ${kNear}·fₑ)`;
  else if (kNear >= 1 && Math.abs(fa) <= 3) observation = fa > 0 ? "ralenti apparent, sens réel" : "ralenti apparent, sens inverse";
  else if (fe > f) observation = "plusieurs images";
  else observation = "mouvement rapide : image brouillée";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);

    // Instants à afficher : les éclairs récents, ou un échantillonnage dense en lumière continue.
    const frames: { time: number; alpha: number }[] = [];
    if (strobe) {
      const nLast = Math.floor(t * fe);
      for (let n = nLast; n >= 0; n--) {
        const tn = n / fe;
        const age = t - tn;
        if (age > PERSIST) break;
        frames.push({ time: tn, alpha: 1 - age / PERSIST });
      }
    } else {
      for (let i = 0; i < 60; i++) frames.push({ time: t - (PERSIST * i) / 60, alpha: 0.25 });
    }

    // ---- Disque ----
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(DISK.x, DISK.y, DISK.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.ground;
    ctx.beginPath();
    ctx.arc(DISK.x, DISK.y, 6, 0, Math.PI * 2);
    ctx.fill();
    for (const fr of frames) {
      const ang = -2 * Math.PI * f * fr.time;
      ctx.globalAlpha = fr.alpha;
      ctx.strokeStyle = SIM_COLORS.vectorX;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(DISK.x, DISK.y);
      ctx.lineTo(DISK.x + (DISK.r - 18) * Math.cos(ang), DISK.y + (DISK.r - 18) * Math.sin(ang));
      ctx.stroke();
      ctx.fillStyle = SIM_COLORS.vectorX;
      ctx.beginPath();
      ctx.arc(DISK.x + (DISK.r - 18) * Math.cos(ang), DISK.y + (DISK.r - 18) * Math.sin(ang), 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText("Disque tournant (f tours/s)", DISK.x - 90, DISK.y + DISK.r + 32);

    // ---- Corde parcourue par une onde progressive sinusoïdale ----
    ctx.strokeStyle = SIM_COLORS.grid;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(STRING.x, STRING.y);
    ctx.lineTo(STRING.x + STRING.w, STRING.y);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const fr of frames) {
      ctx.globalAlpha = fr.alpha;
      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const x = (STRING.w * i) / 300;
        const yv = STRING.y - STRING.amp * Math.sin(2 * Math.PI * (f * fr.time - x / STRING.lambda));
        if (i === 0) ctx.moveTo(STRING.x + x, yv);
        else ctx.lineTo(STRING.x + x, yv);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.fillText("Corde : l'onde se propage vers la droite", STRING.x, STRING.y + STRING.amp + 50);

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 20px ui-sans-serif, system-ui";
    ctx.fillText(strobe ? `Éclairs à fₑ = ${fmt(fe, 1)} Hz` : "Éclairage continu", 30, 36);
    ctx.fillStyle = SIM_COLORS.vectorResult;
    ctx.font = "600 16px ui-sans-serif, system-ui";
    ctx.fillText(observation, 30, 64);
  });

  return (
    <SimShell
      title="Étude stroboscopique"
      intro="Le stroboscope émet des éclairs brefs de fréquence fₑ réglable. On n'aperçoit le phénomène qu'à chaque éclair : selon le rapport entre f et fₑ, il paraît immobile, ralenti dans un sens ou dans l'autre, ou dédoublé."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => setRunning((r) => !r)} />
          <GhostButton onClick={() => setStrobe((s) => !s)}>{strobe ? "Éteindre le stroboscope" : "Allumer le stroboscope"}</GhostButton>
          <GhostButton onClick={() => setFe(f)}>fₑ = f</GhostButton>
          <GhostButton onClick={() => setFe(f / 2)}>fₑ = f/2</GhostButton>
          <GhostButton onClick={() => setFe(f + 0.5)}>fₑ = f + 0,5</GhostButton>
        </>
      }
      readouts={[
        { label: "Fréquence du phénomène f", value: `${fmt(f, 1)} Hz` },
        { label: "Fréquence des éclairs fₑ", value: `${fmt(fe, 1)} Hz` },
        { label: "f / fₑ", value: fmt(ratio, 3) },
        {
          label: "Fréquence apparente fₐ = f − k·fₑ",
          value: strobe && kNear >= 1 ? `${fmt(fa, 2)} Hz (k = ${kNear})` : "—",
        },
      ]}
      side={
        <>
          <Slider label="Fréquence du phénomène f" value={f} unit="Hz" min={20} max={100} step={1} onChange={setF} />
          <Slider label="Fréquence des éclairs fₑ" value={fe} unit="Hz" min={5} max={120} step={0.1} digits={1} onChange={setFe} />
          <div className="flex gap-2">
            <GhostButton onClick={() => setFe((x) => Math.max(5, +(x - 0.1).toFixed(1)))}>− 0,1 Hz</GhostButton>
            <GhostButton onClick={() => setFe((x) => Math.min(120, +(x + 0.1).toFixed(1)))}>+ 0,1 Hz</GhostButton>
          </div>
          <Notes>
            <p>Immobilité apparente : f = k·fₑ (k = 1, 2, 3…). La plus grande fréquence d&apos;éclairs donnant l&apos;immobilité (une seule image) est fₑ = f.</p>
            <p>Ralenti apparent : fₐ = f − fₑ. Si f &gt; fₑ, le mouvement apparent est dans le sens réel ; si f &lt; fₑ, il est en sens inverse.</p>
            <p>Si fₑ &gt; f, plusieurs images apparaissent (deux images pour fₑ = 2f).</p>
          </Notes>
        </>
      }
      footnote="Rendu fidèle à l'observation : seules les images prises aux éclairs sont dessinées, et chacune persiste environ 0,07 s, comme sur la rétine. Le temps s'écoule ici en temps réel."
    />
  );
}
