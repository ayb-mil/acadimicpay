"use client";

import { useEffect, useRef, useState } from "react";
import { SIM_CLASSES, SIM_COLORS } from "../_theme";
import { GhostButton, Notes, Segmented, SimCanvas, SimShell, Slider, SIM_FONT, fmt, prepareCanvas, useModeParam } from "../_lib/sim";
import { radiationName, rgbCss, wavelengthToRgb } from "../_lib/spectrum";

/* ══════════════════════════════════════════════════════════════════════════
   Diffraction de la lumière par une fente de largeur a (ou un fil de
   diamètre a, même figure d'après le théorème de Babinet, hors centre).
   Sur l'écran à la distance D, intensité exacte de Fraunhofer :
     I(x) = (sin β / β)²,  β = π·a·sin θ / λ,  sin θ = x / √(x² + D²).
   Premières extinctions : sin θ = λ/a ; aux petits angles, θ ≈ λ/a et la
   tache centrale a pour largeur L = 2·λ·D/a (relations du cours).
   Lumière blanche : somme des figures de 400 à 780 nm, chacune avec sa
   couleur ; le centre est blanc, les bords irisés.
   Mode graphe : on relève L pour plusieurs a ; L = (2λD)·(1/a) est une
   droite passant par l'origine, de pente k = 2λD, d'où λ = k/(2D).
   ══════════════════════════════════════════════════════════════════════════ */

const W = 920;
const H = 580;
const STRIP = { x: 60, y: 245, w: 800, h: 80 };
const GRAPH = { x: 60, y: 365, w: 800, h: 170 };

type Mode = "mono" | "blanche" | "graphe";
type Obj = "fente" | "fil" | "cheveu";
const MODES = ["mono", "blanche", "graphe"] as const;
const HAIR_UM = 72;
const WHITE = Array.from({ length: 39 }, (_, i) => 400 + i * 10);

function intensity(x: number, aM: number, lamM: number, D: number) {
  const s = x / Math.hypot(x, D);
  const beta = (Math.PI * aM * s) / lamM;
  if (Math.abs(beta) < 1e-9) return 1;
  const v = Math.sin(beta) / beta;
  return v * v;
}

export default function DiffractionLumierePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useModeParam<Mode>(MODES, "mono");
  const [obj, setObj] = useState<Obj>("fente");
  const [lambda, setLambda] = useState(633);
  const [aUm, setAUm] = useState(100);
  const [D, setD] = useState(2);
  const [reveal, setReveal] = useState(false);
  const [points, setPoints] = useState<{ invA: number; L: number }[]>([]);

  const a = obj === "cheveu" ? HAIR_UM : aUm;
  const aM = a * 1e-6;
  const lamM = (mode === "blanche" ? 600 : lambda) * 1e-9;
  const theta = lamM / aM;
  const L = (2 * lamM * D) / aM;
  const X = 2.3 * L;

  const fit = (() => {
    if (points.length < 2) return null;
    const sxy = points.reduce((s, p) => s + p.invA * p.L, 0);
    const sxx = points.reduce((s, p) => s + p.invA * p.invA, 0);
    const k = sxy / sxx;
    return { k, lambdaNm: (k / (2 * D)) * 1e9 };
  })();

  useEffect(() => {
    setPoints([]);
  }, [lambda, D]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, W, H);
    const laserRgb = wavelengthToRgb(mode === "blanche" ? 560 : lambda);
    const beamCss = mode === "blanche" ? "rgba(255,255,255,0.9)" : rgbCss(laserRgb);

    // ---- Montage (vue de dessus, angle agrandi) ----
    const yb = 120;
    const xs = 300;
    const xe = 840;
    ctx.fillStyle = SIM_COLORS.panel;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.fillRect(30, yb - 18, 90, 36);
    ctx.strokeRect(30, yb - 18, 90, 36);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.fillText(mode === "blanche" ? "lumière blanche" : "laser", 38, yb + 40);
    ctx.strokeStyle = beamCss;
    ctx.lineWidth = 4;
    ctx.shadowColor = beamCss;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(120, yb);
    ctx.lineTo(xs, yb);
    ctx.stroke();
    // Tache centrale : demi-angle visuel agrandi.
    const half = Math.min(80, 30 + 8000 * theta);
    ctx.fillStyle = mode === "blanche" ? "rgba(255,255,255,0.12)" : rgbCss(laserRgb, 0.16);
    ctx.beginPath();
    ctx.moveTo(xs, yb);
    ctx.lineTo(xe, yb - half);
    ctx.lineTo(xe, yb + half);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = beamCss;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(xs, yb);
    ctx.lineTo(xe, yb - half);
    ctx.moveTo(xs, yb);
    ctx.lineTo(xe, yb + half);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.beginPath();
    ctx.moveTo(xs, yb);
    ctx.lineTo(xe, yb);
    ctx.stroke();
    ctx.setLineDash([]);
    // Fente ou fil.
    ctx.fillStyle = SIM_COLORS.textMuted;
    if (obj === "fente") {
      ctx.fillRect(xs - 4, yb - 70, 8, 64);
      ctx.fillRect(xs - 4, yb + 6, 8, 64);
    } else {
      ctx.beginPath();
      ctx.arc(xs, yb, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Écran.
    ctx.fillStyle = SIM_COLORS.panelAlt;
    ctx.strokeStyle = SIM_COLORS.ground;
    ctx.fillRect(xe, yb - 90, 10, 180);
    ctx.strokeRect(xe, yb - 90, 10, 180);
    // Angle θ.
    ctx.strokeStyle = SIM_COLORS.vectorResult;
    ctx.beginPath();
    ctx.arc(xs, yb, 90, -Math.atan(half / (xe - xs)), 0);
    ctx.stroke();
    ctx.fillStyle = SIM_COLORS.vectorResult;
    ctx.font = "italic 600 16px ui-serif, Georgia, serif";
    ctx.fillText("θ", xs + 96, yb - 8);
    // Cotes D et L.
    ctx.strokeStyle = SIM_COLORS.textMuted;
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = SIM_FONT;
    ctx.beginPath();
    ctx.moveTo(xs, yb + 100);
    ctx.lineTo(xe, yb + 100);
    ctx.stroke();
    ctx.fillText(`D = ${fmt(D, 2)} m`, (xs + xe) / 2 - 30, yb + 94);
    ctx.fillText("L", xe + 18, yb + 4);
    ctx.fillText(obj === "fente" ? `fente a = ${obj === "fente" ? fmt(a, 0) : "?"} µm` : obj === "fil" ? `fil a = ${fmt(a, 0)} µm` : `cheveu a = ${reveal ? `${HAIR_UM} µm` : "?"}`, xs + 12, yb + 74);
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.fillText("Schéma : angle agrandi", W - 190, 30);

    // ---- Figure sur l'écran ----
    const px = (x: number) => STRIP.x + ((x + X) / (2 * X)) * STRIP.w;
    const img = ctx.createImageData(Math.round(STRIP.w), 1);
    const sumWhite = WHITE.reduce(
      (s, nm) => {
        const c = wavelengthToRgb(nm);
        return [s[0] + c[0], s[1] + c[1], s[2] + c[2]];
      },
      [0, 0, 0]
    );
    for (let i = 0; i < img.width; i++) {
      const x = -X + (2 * X * i) / img.width;
      let rgb: [number, number, number];
      if (mode === "blanche") {
        const acc = [0, 0, 0];
        for (const nm of WHITE) {
          const I = intensity(x, aM, nm * 1e-9, D);
          const c = wavelengthToRgb(nm);
          acc[0] += c[0] * I;
          acc[1] += c[1] * I;
          acc[2] += c[2] * I;
        }
        // Chaque canal normalisé par sa valeur au centre : le centre est exactement blanc.
        rgb = acc.map((v, c) => 255 * Math.pow(v / sumWhite[c], 0.55)) as [number, number, number];
      } else {
        const I = Math.pow(intensity(x, aM, lambda * 1e-9, D), 0.55);
        rgb = [laserRgb[0] * I, laserRgb[1] * I, laserRgb[2] * I];
      }
      img.data[i * 4] = rgb[0];
      img.data[i * 4 + 1] = rgb[1];
      img.data[i * 4 + 2] = rgb[2];
      img.data[i * 4 + 3] = 255;
    }
    const tmp = document.createElement("canvas");
    tmp.width = img.width;
    tmp.height = 1;
    tmp.getContext("2d")!.putImageData(img, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(STRIP.x, STRIP.y, STRIP.w, STRIP.h);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, STRIP.x, STRIP.y, STRIP.w, STRIP.h);
    ctx.strokeStyle = SIM_COLORS.border;
    ctx.strokeRect(STRIP.x, STRIP.y, STRIP.w, STRIP.h);
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 15px ui-sans-serif, system-ui";
    ctx.fillText("Ce que l'on voit sur l'écran", STRIP.x, STRIP.y - 12);

    // Cote L sous la figure.
    const half2 = (lamM * D) / aM;
    const yL = STRIP.y + STRIP.h + 16;
    ctx.strokeStyle = SIM_COLORS.vectorX;
    ctx.fillStyle = SIM_COLORS.vectorX;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(-half2), yL);
    ctx.lineTo(px(half2), yL);
    ctx.moveTo(px(-half2), yL - 7);
    ctx.lineTo(px(-half2), yL + 7);
    ctx.moveTo(px(half2), yL - 7);
    ctx.lineTo(px(half2), yL + 7);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.font = "italic 600 15px ui-serif, Georgia, serif";
    ctx.fillText(`L = ${fmt(L * 1000, 1)} mm`, px(half2) + 10, yL + 5);

    // ---- Graphe : I(x) ou L = f(1/a) ----
    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 15px ui-sans-serif, system-ui";
    ctx.strokeStyle = SIM_COLORS.ground;
    if (mode !== "graphe") {
      ctx.fillText("Intensité lumineuse sur l'écran", GRAPH.x, GRAPH.y - 6);
      ctx.beginPath();
      ctx.moveTo(GRAPH.x, GRAPH.y + GRAPH.h);
      ctx.lineTo(GRAPH.x + GRAPH.w, GRAPH.y + GRAPH.h);
      ctx.stroke();
      const curve = (nm: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 800; i++) {
          const x = -X + (2 * X * i) / 800;
          const y = GRAPH.y + GRAPH.h - 6 - intensity(x, aM, nm * 1e-9, D) * (GRAPH.h - 14);
          if (i === 0) ctx.moveTo(px(x), y);
          else ctx.lineTo(px(x), y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
      };
      if (mode === "blanche") {
        curve(450, rgbCss(wavelengthToRgb(450)));
        curve(550, rgbCss(wavelengthToRgb(550)));
        curve(700, rgbCss(wavelengthToRgb(700)));
      } else curve(lambda, rgbCss(laserRgb));
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      for (const xm of [-2 * half2, -half2, 0, half2, 2 * half2]) {
        ctx.fillText(fmt(xm * 1000, 1), px(xm) - 12, GRAPH.y + GRAPH.h + 18);
      }
      ctx.fillText("x (mm)", GRAPH.x + GRAPH.w - 40, GRAPH.y + GRAPH.h + 34);
    } else {
      ctx.fillText("L en fonction de 1/a", GRAPH.x, GRAPH.y - 6);
      const xMax = 1 / 20e-6;
      const yMax = (2 * lambda * 1e-9 * D) * xMax * 1.05;
      const gx = (v: number) => GRAPH.x + 40 + (v / xMax) * (GRAPH.w - 60);
      const gy = (v: number) => GRAPH.y + GRAPH.h - (v / yMax) * (GRAPH.h - 10);
      ctx.beginPath();
      ctx.moveTo(gx(0), GRAPH.y);
      ctx.lineTo(gx(0), GRAPH.y + GRAPH.h);
      ctx.lineTo(gx(xMax), GRAPH.y + GRAPH.h);
      ctx.stroke();
      ctx.fillStyle = SIM_COLORS.textMuted;
      ctx.font = SIM_FONT;
      for (let k = 0; k <= 5; k++) {
        const v = (xMax * k) / 5;
        ctx.fillText(`${fmt(v / 1000, 0)}`, gx(v) - 8, GRAPH.y + GRAPH.h + 18);
      }
      ctx.fillText("1/a (mm⁻¹)", gx(xMax) - 70, GRAPH.y + GRAPH.h + 34);
      ctx.fillText("L (mm)", gx(0) + 8, GRAPH.y + 12);
      for (let k = 1; k <= 4; k++) {
        const v = (yMax * k) / 4;
        ctx.fillText(fmt(v * 1000, 0), GRAPH.x - 4, gy(v) + 4);
        ctx.strokeStyle = SIM_COLORS.grid;
        ctx.beginPath();
        ctx.moveTo(gx(0), gy(v));
        ctx.lineTo(gx(xMax), gy(v));
        ctx.stroke();
      }
      if (fit) {
        ctx.strokeStyle = SIM_COLORS.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx(0), gy(0));
        ctx.lineTo(gx(xMax), gy(fit.k * xMax));
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      for (const p of points) {
        ctx.fillStyle = SIM_COLORS.vectorX;
        ctx.beginPath();
        ctx.arc(gx(p.invA), gy(p.L), 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!points.length) {
        ctx.fillStyle = SIM_COLORS.textMuted;
        ctx.fillText("Changez a, puis « Ajouter la mesure » : chaque point (1/a ; L) se place ici.", gx(0) + 20, GRAPH.y + GRAPH.h / 2);
      }
    }

    ctx.fillStyle = SIM_COLORS.textPrimary;
    ctx.font = "600 19px ui-sans-serif, system-ui";
    ctx.fillText(
      mode === "blanche"
        ? "Lumière blanche : centre blanc, bords irisés"
        : `Lumière monochromatique λ = ${lambda} nm (${radiationName(lambda)})`,
      24,
      30
    );
  });

  const lambdaPresets = [
    { nm: 405, label: "Violet 405" },
    { nm: 532, label: "Vert 532" },
    { nm: 633, label: "Rouge 633" },
  ];

  return (
    <SimShell
      title="Diffraction de la lumière"
      intro="Un faisceau laser traverse une fente fine (ou contourne un fil) : sur l'écran, la lumière s'étale en une tache centrale entourée de taches plus faibles. La lumière est une onde. L'écart angulaire vaut θ = λ/a et la tache centrale a pour largeur L = 2λD/a."
      canvas={<SimCanvas canvasRef={canvasRef} W={W} H={H} />}
      toolbar={
        <>
          <Segmented
            options={[
              { id: "mono", label: "Monochromatique" },
              { id: "blanche", label: "Lumière blanche" },
              { id: "graphe", label: "Graphe L = f(1/a)" },
            ]}
            value={mode}
            onChange={setMode}
          />
          {mode === "graphe" ? (
            <>
              <button
                type="button"
                onClick={() => setPoints((ps) => [...ps.filter((p) => Math.abs(p.invA - 1 / aM) > 1), { invA: 1 / aM, L }])}
                disabled={obj === "cheveu"}
                title={obj === "cheveu" ? "Choisissez une fente ou un fil pour tracer le graphe" : undefined}
                className={`${SIM_CLASSES.btnPrimary} disabled:opacity-40`}
              >
                + Ajouter la mesure
              </button>
              <GhostButton onClick={() => setPoints([])}>Effacer</GhostButton>
            </>
          ) : null}
        </>
      }
      readouts={
        mode === "graphe"
          ? [
              { label: "Points relevés", value: `${points.length}` },
              { label: "Pente k = 2λD", value: fit ? `${fmt(fit.k * 1e6, 2)} × 10⁻⁶ m²` : "au moins 2 points" },
              { label: "λ = k / (2D)", value: fit ? `${fmt(fit.lambdaNm, 0)} nm` : "—" },
              { label: "L actuelle", value: `${fmt(L * 1000, 1)} mm` },
            ]
          : [
              { label: "Écart angulaire θ = λ/a", value: `${fmt(theta * 1000, 2)} mrad` },
              { label: "Largeur L = 2λD/a", value: `${fmt(L * 1000, 1)} mm` },
              { label: obj === "cheveu" && !reveal ? "Diamètre a = 2λD/L" : "Largeur a", value: obj === "cheveu" && !reveal ? "à calculer" : `${fmt(a, 0)} µm` },
              { label: "a / λ", value: fmt(aM / lamM, 0) },
            ]
      }
      side={
        <>
          <Segmented
            options={[
              { id: "fente", label: "Fente" },
              { id: "fil", label: "Fil" },
              { id: "cheveu", label: "Cheveu (a inconnu)" },
            ]}
            value={obj}
            onChange={(o) => {
              setObj(o);
              setReveal(false);
            }}
          />
          {mode !== "blanche" ? (
            <>
              <Slider label="Longueur d'onde λ" value={lambda} unit="nm" min={400} max={780} step={1} onChange={setLambda} />
              <div className="flex flex-wrap gap-1.5">
                {lambdaPresets.map((p) => (
                  <button
                    key={p.nm}
                    type="button"
                    onClick={() => setLambda(p.nm)}
                    className="rounded-full border border-[var(--sim-border)] px-3 py-1 text-xs font-semibold text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    style={{ borderColor: lambda === p.nm ? rgbCss(wavelengthToRgb(p.nm)) : undefined }}
                  >
                    {p.label} nm
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {obj !== "cheveu" ? (
            <Slider label={obj === "fente" ? "Largeur de la fente a" : "Diamètre du fil a"} value={aUm} unit="µm" min={20} max={400} step={5} onChange={setAUm} />
          ) : (
            <GhostButton onClick={() => setReveal((r) => !r)}>{reveal ? "Masquer" : "Révéler"} le diamètre</GhostButton>
          )}
          <Slider label="Distance fente–écran D" value={D} unit="m" min={0.5} max={3} step={0.05} digits={2} onChange={setD} />
          <Notes>
            <p>θ = λ/a (en radians) et tan θ ≈ θ = (L/2)/D, d&apos;où L = 2λD/a.</p>
            <p>Une fente plus fine donne une tache plus large ; une longueur d&apos;onde plus courte donne une tache plus étroite.</p>
            <p>Un fil de diamètre a donne la même figure qu&apos;une fente de largeur a.</p>
            {obj === "cheveu" ? <p>Mesurez L sur la figure, puis calculez a = 2λD/L.</p> : null}
          </Notes>
        </>
      }
      footnote="Figure calculée avec l'intensité exacte (sin β / β)². Les relations θ = λ/a et L = 2λD/a sont celles du cours (petits angles) ; l'écart avec le calcul exact est ici inférieur à 0,1 %."
    />
  );
}
