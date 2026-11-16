"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SIM_CLASSES, SIM_COLORS, simThemeVars } from "../_theme";
import { C_VIS, SCALE, type EMView } from "./constants";

const EMWaveScene = dynamic(() => import("./EMWaveScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--sim-panel-alt)]" />,
});

/* ══════════════════════════════════════════════════════════════════════════
   Simulation — Onde électromagnétique (lumière monochromatique).
   c = 3,00·10⁸ m/s ; ν = c/λ₀ ; dans un milieu d'indice n : v = c/n et
   λ = v/ν = λ₀/n, la fréquence ne changeant pas. Pour le verre, l'indice
   dépend de λ₀ (dispersion) selon la loi de Cauchy n = a + b/λ₀².
   ══════════════════════════════════════════════════════════════════════════ */

const C = 3.0e8;

/** ν (nu) en italique serif : dans la police du site il se confond avec v (vitesse). */
function Nu() {
  return <span className="font-serif text-[1.08em] italic">ν</span>;
}

type MediumId = "vide" | "eau" | "verre" | "diamant" | "custom";

const MEDIA: { id: MediumId; label: string; n?: number; cauchy?: { a: number; b: number } }[] = [
  { id: "vide", label: "Vide", n: 1 },
  { id: "eau", label: "Eau", n: 1.33 },
  // Verre crown : a = 1,5046 ; b = 4,20·10⁻³ µm² (λ₀ en µm).
  { id: "verre", label: "Verre (dispersif)", cauchy: { a: 1.5046, b: 0.0042 } },
  { id: "diamant", label: "Diamant", n: 2.42 },
  { id: "custom", label: "Personnalisé" },
];

/** Couleur approximative d'une radiation visible (approximation classique de Bruton). */
function wavelengthToRgb(nm: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) {
    r = -(nm - 440) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = -(nm - 510) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / 65;
  } else {
    r = 1;
  }
  const f = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
  const c = (v: number) => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8));
  return [c(r), c(g), c(b)];
}

function colorName(nm: number) {
  if (nm < 450) return "violet";
  if (nm < 495) return "bleu";
  if (nm < 570) return "vert";
  if (nm < 590) return "jaune";
  if (nm < 620) return "orange";
  return "rouge";
}

const SPECTRUM = `linear-gradient(to right, ${Array.from({ length: 21 }, (_, i) => {
  const nm = 380 + i * 20;
  const [r, g, b] = wavelengthToRgb(nm);
  return `rgb(${r}, ${g}, ${b}) ${i * 5}%`;
}).join(", ")})`;

/** a·10ⁿ en écriture scientifique lisible (« 5,45 × 10¹⁴ »). */
function sci(value: number, digits = 2) {
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mant = value / 10 ** exp;
  const sup = String(exp)
    .split("")
    .map((ch) => "⁰¹²³⁴⁵⁶⁷⁸⁹"["0123456789".indexOf(ch)] ?? "⁻")
    .join("");
  return `${mant.toFixed(digits).replace(".", ",")} × 10${sup}`;
}

export default function OndeElectromagnetiquePage() {
  const [lambda0, setLambda0] = useState(550);
  const [mediumId, setMediumId] = useState<MediumId>("eau");
  const [customN, setCustomN] = useState(1.6);
  const [showE, setShowE] = useState(true);
  const [showB, setShowB] = useState(true);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<EMView>("3d");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setRunning(false);
  }, []);

  const medium = MEDIA.find((m) => m.id === mediumId)!;
  const n = useMemo(() => {
    if (medium.cauchy) {
      const um = lambda0 / 1000;
      return medium.cauchy.a + medium.cauchy.b / (um * um);
    }
    return medium.n ?? customN;
  }, [medium, lambda0, customN]);

  const nu = C / (lambda0 * 1e-9);
  const periodFs = (1 / nu) * 1e15;
  const v = C / n;
  const lambda = lambda0 / n;
  const [r, g, b] = wavelengthToRgb(lambda0);
  const swatch = `rgb(${r}, ${g}, ${b})`;
  // Période affichée / période réelle : indépendant de λ₀ (les deux sont ∝ λ₀).
  const slowFactor = (lambda0 * SCALE) / C_VIS / (1 / nu) / speed;

  const fmt = (x: number, d = 2) => x.toFixed(d).replace(".", ",");

  return (
    <div style={simThemeVars()} className="min-h-screen bg-[var(--sim-page)] text-[var(--sim-text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <a
          href="/simulations"
          className="text-sm font-medium text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
        >
          ‹ Retour aux simulations
        </a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Onde électromagnétique</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">
          Une lumière monochromatique est une onde électromagnétique : les champs E et B oscillent en
          phase, perpendiculairement entre eux et à la direction de propagation. En entrant dans un milieu
          transparent, sa fréquence ne change pas, mais sa célérité et sa longueur d&apos;onde sont divisées
          par l&apos;indice n.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className={SIM_CLASSES.card}>
            <div className="relative aspect-[920/520] w-full overflow-hidden rounded-t-3xl">
              <EMWaveScene
                lambda0={lambda0}
                n={n}
                showE={showE}
                showB={showB}
                running={running}
                speed={speed}
                view={view}
              />
              <span className="pointer-events-none absolute bottom-3 start-3 rounded-full border border-[var(--sim-border)] bg-[var(--sim-page)]/70 px-2.5 py-1 text-[11px] text-[var(--sim-text-muted)] backdrop-blur">
                Glissez pour faire tourner la vue · molette ou pincement pour zoomer
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sim-border)] p-4">
              <button type="button" onClick={() => setRunning((x) => !x)} className={SIM_CLASSES.btnPrimary}>
                {running ? "⏸ Pause" : "▶ Lancer"}
              </button>
              <div className="flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
                {(
                  [
                    ["3d", "Vue 3D"],
                    ["face", "Face (E)"],
                    ["top", "Dessus (B)"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      view === id
                        ? "bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                        : "text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="ms-auto flex items-center gap-1 rounded-full border border-[var(--sim-border)] p-1">
                {[0.25, 0.5, 1].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      speed === s
                        ? "bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                        : "text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    }`}
                  >
                    ×{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-3xl bg-[var(--sim-border)] sm:grid-cols-3">
              {[
                { label: <>fréquence <Nu /> = c/λ₀</>, value: `${sci(nu)} Hz` },
                { label: <>période T = 1/<Nu /></>, value: `${fmt(periodFs)} fs` },
                { label: "indice n", value: fmt(n, 3) },
                { label: "célérité v = c/n", value: `${sci(v)} m/s` },
                { label: "λ₀ (dans le vide)", value: `${Math.round(lambda0)} nm` },
                { label: "λ = λ₀/n (milieu)", value: `${fmt(lambda, 0)} nm` },
              ].map((item: { label: ReactNode; value: string }, i) => (
                <div key={i} className="bg-[var(--sim-panel)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-[var(--sim-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${SIM_CLASSES.card} h-fit space-y-5 p-5`}>
            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold tracking-wide text-[var(--sim-text-muted)]">
                  Longueur d&apos;onde λ₀
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full"
                    style={{ background: swatch, boxShadow: `0 0 10px ${swatch}` }}
                  />
                  {Math.round(lambda0)} nm · {colorName(lambda0)}
                </span>
              </div>
              <input
                type="range"
                min={380}
                max={780}
                step={5}
                value={lambda0}
                onChange={(e) => setLambda0(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--sim-accent-strong)]"
              />
              <div className="relative mt-1.5 h-2.5 rounded-full" style={{ background: SPECTRUM }}>
                <span
                  aria-hidden="true"
                  className="absolute -top-1 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_6px_white]"
                  style={{ left: `${((lambda0 - 380) / 400) * 100}%`, height: 18 }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[var(--sim-text-muted)]">
                <span>380 nm</span>
                <span>Spectre visible</span>
                <span>780 nm</span>
              </div>
            </label>

            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--sim-text-muted)]">
                Milieu (x &gt; 0)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MEDIA.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMediumId(m.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      mediumId === m.id
                        ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)] text-[var(--sim-text)]"
                        : "border-[var(--sim-border)] text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {mediumId === "custom" ? (
                <label className="mt-3 block">
                  <div className="flex items-baseline justify-between text-xs text-[var(--sim-text-muted)]">
                    <span>Indice n</span>
                    <span className="font-semibold tabular-nums text-[var(--sim-text)]">{fmt(customN, 2)}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.01}
                    value={customN}
                    onChange={(e) => setCustomN(Number(e.target.value))}
                    className="mt-1.5 w-full accent-[var(--sim-accent-strong)]"
                  />
                </label>
              ) : null}
              {medium.cauchy ? (
                <p className="mt-2 text-xs leading-relaxed text-[var(--sim-text-muted)]">
                  Loi de Cauchy : n = a + b/λ₀², avec a = 1,5046 et b = 4,20·10⁻³ µm². Faites varier λ₀ :
                  l&apos;indice change, c&apos;est la dispersion.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showE}
                  onChange={(e) => setShowE(e.target.checked)}
                  className="accent-[var(--sim-accent-strong)]"
                />
                <span style={{ color: SIM_COLORS.accent }}>Champ E</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showB}
                  onChange={(e) => setShowB(e.target.checked)}
                  className="accent-[var(--sim-accent-strong)]"
                />
                <span style={{ color: SIM_COLORS.vectorY }}>Champ B</span>
              </label>
            </div>

            <div className="space-y-2 border-t border-[var(--sim-border)] pt-4 text-xs leading-relaxed text-[var(--sim-text-muted)]">
              <p>
                c = 3,00·10⁸ m/s · <Nu /> = c/λ₀ · v = c/n · λ = v/<Nu /> = λ₀/n
              </p>
              <p>La fréquence <Nu /> est imposée par la source : elle ne change pas d&apos;un milieu à l&apos;autre.</p>
              <p>
                Animation ralentie environ {sci(slowFactor, 1)} fois. Modèle simplifié : l&apos;onde réfléchie
                et la variation d&apos;amplitude à l&apos;interface ne sont pas représentées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
