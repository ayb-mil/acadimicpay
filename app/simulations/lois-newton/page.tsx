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
   Les trois lois de Newton.
   • Inertie : mobile autoporteur ; soufflerie en marche → P + R = 0,
     système pseudo-isolé, mouvement rectiligne uniforme. Soufflerie
     arrêtée → frottement f = μ·m·g, le mouvement est retardé.
   • 2ᵉ loi : chariot sans frottement tiré par F ; a = F/m, lue sur la pente
     de v(t).
   • 3ᵉ loi : deux patineurs se repoussent pendant Δt : F_A/B = −F_B/A, d'où
     m_A·v_A + m_B·v_B = 0 ; gravitation : F = G·m_A·m_B/d², même valeur
     pour les deux corps.
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 520;
const G_CONST = 6.67e-11;
const g = 9.81;
const TABLE = { x: 60, y: 90, w: 800, h: 260, metres: 2 };
const STROBE = 0.1;

type Mode = "inertie" | "deuxieme" | "troisieme";
const MODES = ["inertie", "deuxieme", "troisieme"] as const;
type Third = "contact" | "gravitation";

const GRAV = [
  { id: "terre-lune", label: "Terre – Lune", A: "Terre", B: "Lune", mA: 5.97e24, mB: 7.35e22, d: 3.84e8 },
  { id: "terre-sat", label: "Terre – satellite", A: "Terre", B: "Satellite", mA: 5.97e24, mB: 1000, d: 6.77e6 },
  { id: "boules", label: "Deux boules de 10 kg", A: "Boule A", B: "Boule B", mA: 10, mB: 10, d: 0.5 },
];

function sci(value: number, digits = 2) {
  if (value === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(value)));
  if (exp >= -2 && exp <= 3) return fmt(value, digits);
  const mant = value / 10 ** exp;
  const sup = String(exp)
    .split("")
    .map((ch) => "⁰¹²³⁴⁵⁶⁷⁸⁹"["0123456789".indexOf(ch)] ?? "⁻")
    .join("");
  return `${fmt(mant, digits)} × 10${sup}`;
}

export default function LoisNewtonPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "inertie");
  const [blower, setBlower] = useState(true);
  const [v0, setV0] = useState(0.6);
  const [F, setF] = useState(1);
  const [m, setM] = useState(0.5);
  const [third, setThird] = useState<Third>("contact");
  const [mA, setMA] = useState(70);
  const [mB, setMB] = useState(50);
  const [gravId, setGravId] = useState("terre-lune");
  const [running, setRunning] = useState(true);
  const [t, setT] = useSimClock(running, 1);

  const restart = () => {
    setT(0);
    setRunning(true);
  };
  useEffect(() => {
    setT(0);
    setRunning(true);
  }, [mode, blower, v0, F, m, third, mA, mB, setT]);

  // ---- Inertie ----
  const mu = 0.12;
  const decel = blower ? 0 : mu * g;
  const tStop = decel > 0 ? v0 / decel : Infinity;
  const xIn = (tt: number) => {
    const te = Math.min(tt, tStop);
    return v0 * te - 0.5 * decel * te * te;
  };
  const vIn = (tt: number) => Math.max(0, v0 - decel * tt);

  // ---- 2ᵉ loi ----
  const a2 = F / m;
  const x2 = (tt: number) => 0.2 + 0.5 * a2 * tt * tt;
  const v2 = (tt: number) => a2 * tt;
  const t2End = Math.sqrt((2 * (TABLE.metres - 0.4)) / Math.max(a2, 1e-6));

  // ---- 3ᵉ loi : poussée de 200 N pendant 0,5 s ----
  const FP = 200;
  const DT = 0.5;
  const vAf = -(FP * DT) / mA;
  const vBf = (FP * DT) / mB;
  const pos3 = (tt: number, mass: number, sign: number) => {
    const te = Math.min(tt, DT);
    const aa = FP / mass;
    const x = 0.5 * aa * te * te + (tt > DT ? aa * DT * (tt - DT) : 0);
    return sign * x;
  };
  const grav = GRAV.find((x) => x.id === gravId)!;
  const Fg = (G_CONST * grav.mA * grav.mB) / grav.d ** 2;

  // Fin d'animation : bord de la table ou arrêt (1ʳᵉ loi), bout du rail (2ᵉ loi), peu après la poussée (3ᵉ loi).
  const done =
    mode === "inertie"
      ? xIn(t) >= TABLE.metres - 0.3 || t >= tStop
      : mode === "deuxieme"
        ? t >= t2End
        : third === "contact"
          ? t >= DT + 0.7
          : false;
  useEffect(() => {
    if (done) setRunning(false);
  }, [done]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const PXM = TABLE.w / TABLE.metres;
    const X = (xm: number) => TABLE.x + xm * PXM;

    const title = (txt: string, sub: string) => {
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.font = "600 19px ui-sans-serif, system-ui";
      ctx.fillText(txt, 24, 32);
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText(sub, 24, 56);
    };
    const ruler = (y: number) => {
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      for (let k = 0; k <= TABLE.metres * 10; k++) {
        const px = X(k / 10);
        ctx.fillRect(px, y, 1, k % 5 === 0 ? 10 : 5);
        if (k % 5 === 0) ctx.fillText(`${fmt(k / 10, 1)}`, px - 8, y + 24);
      }
      ctx.fillText("x (m)", X(TABLE.metres) - 30, y + 42);
    };

    if (mode === "inertie" || mode === "deuxieme") {
      const xf = mode === "inertie" ? xIn : x2;
      const xNow = Math.min(xf(t), TABLE.metres - 0.05);
      const yc = TABLE.y + TABLE.h / 2;
      // Table (vue de dessus) ou rail.
      ctx.fillStyle = "rgba(34, 228, 217, 0.05)";
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.fillRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
      ctx.strokeRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
      ruler(TABLE.y + TABLE.h + 6);
      // Chronophotographie : une position tous les 0,1 s.
      for (let k = 0; k * STROBE <= t; k++) {
        const xx = xf(k * STROBE);
        if (xx > TABLE.metres - 0.05) break;
        ctx.strokeStyle = SIM_COLORS.vectorX;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(X(xx), yc, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // Mobile.
      ctx.fillStyle = SIM_COLORS.panel;
      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (mode === "inertie") ctx.arc(X(xNow), yc, 22, 0, Math.PI * 2);
      else ctx.rect(X(xNow) - 30, yc - 18, 60, 36);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = SIM_COLORS.accent;
      ctx.beginPath();
      ctx.arc(X(xNow), yc, 3, 0, Math.PI * 2);
      ctx.fill();
      const vNow = mode === "inertie" ? vIn(t) : v2(t);
      if (vNow > 0.02) drawArrow(ctx, X(xNow), yc - 40, X(xNow) + vNow * 70, yc - 40, SIM_COLORS.accent, "v");
      if (mode === "deuxieme") drawArrow(ctx, X(xNow) + 30, yc, X(xNow) + 30 + F * 28, yc, SIM_COLORS.vectorX, "F");
      if (mode === "inertie" && !blower && vNow > 0.02) drawArrow(ctx, X(xNow) - 22, yc, X(xNow) - 22 - 50, yc, SIM_COLORS.vectorX, "f");

      // Petit schéma de profil : forces verticales.
      const bx = 820;
      const by = 445;
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.beginPath();
      ctx.moveTo(bx - 50, by + 20);
      ctx.lineTo(bx + 50, by + 20);
      ctx.stroke();
      ctx.fillStyle = SIM_COLORS.panel;
      ctx.strokeStyle = SIM_COLORS.accent;
      ctx.fillRect(bx - 20, by - 4, 40, 24);
      ctx.strokeRect(bx - 20, by - 4, 40, 24);
      drawArrow(ctx, bx, by + 8, bx, by + 8 + 44, SIM_COLORS.vectorY, "P");
      drawArrow(ctx, bx, by + 8, bx, by + 8 - 44, SIM_COLORS.vectorResult, "R");
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText("Vue de profil : P + R = 0", bx - 160, by + 6);

      if (mode === "inertie") {
        title(
          blower ? "Système pseudo-isolé : mouvement rectiligne uniforme" : "Soufflerie arrêtée : le frottement freine le mobile",
          blower
            ? "Les points, pris toutes les 0,1 s, sont régulièrement espacés : la vitesse est constante."
            : "Le frottement n'est pas compensé : ΣF ≠ 0, les points se resserrent jusqu'à l'arrêt."
        );
      } else {
        // Graphe v(t).
        const Gr = { x: 70, y: 400, w: 600, h: 100 };
        const tSpan = Math.max(t2End, 0.5);
        const vSpan = Math.max(v2(t2End), 0.5);
        const gx = (tt: number) => Gr.x + (tt / tSpan) * Gr.w;
        const gy = (vv: number) => Gr.y + Gr.h - (vv / vSpan) * Gr.h;
        ctx.strokeStyle = SIM_COLORS.ground;
        ctx.beginPath();
        ctx.moveTo(Gr.x, Gr.y);
        ctx.lineTo(Gr.x, Gr.y + Gr.h);
        ctx.lineTo(Gr.x + Gr.w, Gr.y + Gr.h);
        ctx.stroke();
        ctx.strokeStyle = SIM_COLORS.accent;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(gx(0), gy(0));
        ctx.lineTo(gx(Math.min(t, t2End)), gy(v2(Math.min(t, t2End))));
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = SIM_COLORS.textMuted;
        ctx.font = SIM_FONT;
        ctx.fillText("v (m/s)", Gr.x - 50, Gr.y + 4);
        ctx.fillText(fmt(vSpan, 1), Gr.x - 34, Gr.y + 14);
        ctx.fillText("t (s)", Gr.x + Gr.w - 30, Gr.y + Gr.h + 18);
        ctx.fillText(fmt(tSpan, 2), Gr.x + Gr.w - 12, Gr.y + Gr.h + 32);
        title("2ᵉ loi : ΣF = m·a", `F = ${fmt(F, 1)} N et m = ${fmt(m, 2)} kg : la pente de v(t) donne a = F/m.`);
      }
    } else if (third === "contact") {
      const yc = 230;
      const xA = 1 + pos3(t, mA, -1);
      const xB = 1 + pos3(t, mB, 1);
      ctx.strokeStyle = SIM_COLORS.ground;
      ctx.beginPath();
      ctx.moveTo(TABLE.x, yc + 60);
      ctx.lineTo(TABLE.x + TABLE.w, yc + 60);
      ctx.stroke();
      ruler(yc + 66);
      const skater = (x: number, mass: number, color: string, name: string) => {
        const r = 14 + mass / 8;
        ctx.fillStyle = SIM_COLORS.panel;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(X(x), yc, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = color;
        ctx.font = "600 14px ui-sans-serif, system-ui";
        ctx.fillText(`${name} (${mass} kg)`, X(x) - 36, yc + r + 22);
        return r;
      };
      const rA = skater(Math.max(0.05, xA), mA, SIM_COLORS.vectorX, "A");
      const rB = skater(Math.min(TABLE.metres - 0.05, xB), mB, SIM_COLORS.vectorY, "B");
      if (t <= DT) {
        drawArrow(ctx, X(xB) - rB, yc - 40, X(xB) - rB + 90, yc - 40, SIM_COLORS.vectorY, "F_A/B");
        drawArrow(ctx, X(xA) + rA, yc - 40, X(xA) + rA - 90, yc - 40, SIM_COLORS.vectorX, "F_B/A");
      } else {
        drawArrow(ctx, X(xA), yc - 50, X(xA) + vAf * 60, yc - 50, SIM_COLORS.vectorX, "v_A");
        drawArrow(ctx, X(xB), yc - 50, X(xB) + vBf * 60, yc - 50, SIM_COLORS.vectorY, "v_B");
      }
      title(
        "3ᵉ loi : F_A/B = −F_B/A",
        t <= DT ? "Pendant la poussée, chacun exerce sur l'autre une force de même valeur, de sens opposé." : "Après la poussée : le plus léger part le plus vite (m_A·v_A + m_B·v_B = 0)."
      );
    } else {
      const yc = 250;
      const xa = 230;
      const xb = 690;
      const big = (mass: number) => Math.max(10, Math.min(70, 8 * Math.log10(mass + 1)));
      ctx.fillStyle = SIM_COLORS.panelAlt;
      ctx.strokeStyle = SIM_COLORS.vectorX;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(xa, yc, big(grav.mA), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = SIM_COLORS.vectorY;
      ctx.beginPath();
      ctx.arc(xb, yc, big(grav.mB), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1;
      drawArrow(ctx, xa + big(grav.mA), yc, xa + big(grav.mA) + 110, yc, SIM_COLORS.vectorY, "F_B/A");
      drawArrow(ctx, xb - big(grav.mB), yc, xb - big(grav.mB) - 110, yc, SIM_COLORS.vectorX, "F_A/B");
      ctx.strokeStyle = SIM_COLORS.textMuted;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(xa, yc + 110);
      ctx.lineTo(xb, yc + 110);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      ctx.fillText(`d = ${sci(grav.d)} m`, (xa + xb) / 2 - 50, yc + 102);
      ctx.fillStyle = SIM_COLORS.textPrimary;
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText(grav.A, xa - 20, yc + 90);
      ctx.fillText(grav.B, xb - 30, yc + 90);
      title("Interaction gravitationnelle : F = G·m_A·m_B / d²", "Les deux forces ont la même valeur, même si les masses sont très différentes. Schéma sans échelle.");
    }
  });

  return (
    <SimShell
      title="Les trois lois de Newton"
      intro="1ʳᵉ loi : un corps isolé ou pseudo-isolé est immobile ou en mouvement rectiligne uniforme. 2ᵉ loi : ΣF_ext = m·a_G. 3ᵉ loi : deux corps en interaction exercent l'un sur l'autre des forces opposées, F_A/B = −F_B/A."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <PlayButton running={running} onToggle={() => setRunning((r) => !r)} />
          <GhostButton onClick={restart}>⟲ Recommencer</GhostButton>
          <Segmented
            className="ms-auto"
            options={[
              { id: "inertie", label: "1ʳᵉ loi" },
              { id: "deuxieme", label: "2ᵉ loi" },
              { id: "troisieme", label: "3ᵉ loi" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </>
      }
      readouts={
        mode === "inertie"
          ? [
              { label: "Système", value: blower ? "pseudo-isolé (ΣF = 0)" : "non isolé (ΣF = f)" },
              { label: "Vitesse v", value: `${fmt(vIn(t), 2)} m/s` },
              { label: "Écart entre 2 points (0,1 s)", value: `${fmt((xIn(t) - xIn(Math.max(0, t - STROBE))) * 100, 1)} cm` },
              { label: "Mouvement", value: blower ? "rectiligne uniforme" : vIn(t) > 0 ? "rectiligne retardé" : "arrêt" },
            ]
          : mode === "deuxieme"
            ? [
                { label: "Force F", value: `${fmt(F, 1)} N` },
                { label: "Masse m", value: `${fmt(m, 2)} kg` },
                { label: "a mesurée (pente de v(t))", value: t > 0.05 ? `${fmt(v2(Math.min(t, t2End)) / Math.min(t, t2End), 2)} m/s²` : "—" },
                { label: "F / m", value: `${fmt(a2, 2)} m/s²` },
              ]
            : third === "contact"
              ? [
                  { label: "F_A/B = F_B/A", value: `${FP} N pendant ${fmt(DT, 1)} s` },
                  { label: "v_A après la poussée", value: `${fmt(vAf, 2)} m/s` },
                  { label: "v_B après la poussée", value: `${fmt(vBf, 2)} m/s` },
                  { label: "m_A·v_A + m_B·v_B", value: `${fmt(mA * vAf + mB * vBf, 2)} kg·m/s` },
                ]
              : [
                  { label: "m_A", value: `${sci(grav.mA)} kg` },
                  { label: "m_B", value: `${sci(grav.mB)} kg` },
                  { label: "d", value: `${sci(grav.d)} m` },
                  { label: "F_A/B = F_B/A", value: `${sci(Fg)} N` },
                ]
      }
      side={
        <>
          {mode === "inertie" ? (
            <>
              <Segmented
                options={[
                  { id: "on", label: "Soufflerie en marche" },
                  { id: "off", label: "Soufflerie arrêtée" },
                ]}
                value={blower ? "on" : "off"}
                onChange={(val) => setBlower(val === "on")}
              />
              <Slider label="Vitesse de lancement" value={v0} unit="m/s" min={0.2} max={1.2} step={0.05} digits={2} onChange={setV0} />
            </>
          ) : null}
          {mode === "deuxieme" ? (
            <>
              <Slider label="Force F" value={F} unit="N" min={0.2} max={4} step={0.1} digits={1} onChange={setF} />
              <Slider label="Masse m" value={m} unit="kg" min={0.2} max={2} step={0.05} digits={2} onChange={setM} />
            </>
          ) : null}
          {mode === "troisieme" ? (
            <>
              <Segmented
                options={[
                  { id: "contact", label: "Patineurs" },
                  { id: "gravitation", label: "Gravitation" },
                ]}
                value={third}
                onChange={setThird}
              />
              {third === "contact" ? (
                <>
                  <Slider label="Masse de A" value={mA} unit="kg" min={30} max={100} step={5} onChange={setMA} />
                  <Slider label="Masse de B" value={mB} unit="kg" min={30} max={100} step={5} onChange={setMB} />
                </>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {GRAV.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setGravId(x.id)}
                      aria-pressed={gravId === x.id}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        gravId === x.id
                          ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                          : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}
          <Notes>
            {mode === "inertie" ? (
              <>
                <p>Forces extérieures : exercées par des corps qui n&apos;appartiennent pas au système. Forces intérieures : exercées par une partie du système sur une autre.</p>
                <p>Système isolé : aucune force extérieure. Pseudo-isolé : les forces extérieures se compensent.</p>
                <p>Ici, les forces extérieures sont P (Terre) et R (coussin d&apos;air). Elles se compensent : le système est pseudo-isolé.</p>
                <p>Dans un référentiel galiléen (ici terrestre), il est alors en mouvement rectiligne uniforme.</p>
              </>
            ) : mode === "deuxieme" ? (
              <>
                <p>Dans un référentiel galiléen : ΣF_ext = m·a_G. Ici P et R se compensent, donc a = F/m.</p>
                <p>Doublez F : a double. Doublez m : a est divisée par deux.</p>
              </>
            ) : (
              <>
                <p>F_A/B = −F_B/A : même droite d&apos;action, même valeur, sens opposés, même si les masses diffèrent.</p>
                <p>Gravitation : F = G·m_A·m_B/d², avec G = 6,67·10⁻¹¹ N·m²·kg⁻².</p>
              </>
            )}
          </Notes>
        </>
      }
    />
  );
}
