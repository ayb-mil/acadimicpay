"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGlowCurve, useGlowTexture } from "../_three/glowCurve";

/* ══════════════════════════════════════════════════════════════════════════
   Scène d'accroche : onde électromagnétique plane progressive.
   E (turquoise) oscille dans le plan vertical, B (violet) dans le plan
   horizontal, en phase et perpendiculaires, l'onde se propageant selon +x
   à la célérité c. Autour flottent les équations des simulations du site.
   Une seule horloge (`clock`) pilote tout : figée sous reduced-motion ou
   quand la section sort de l'écran.
   ══════════════════════════════════════════════════════════════════════════ */

const TEAL = "#22E4D9";
const VIOLET = "#9B7BFF";
const GREEN = "#4ADE80";

const ARROWS = 44;
const CURVE_PTS = 240;
const X_MIN = -6.5;
const X_MAX = 6.5;
const AMP = 1.45;
const K = (2 * Math.PI) / 4.4;
const OMEGA = 1.7;
const STATIC_T = 0.9;

const EQUATIONS = [
  { tex: "n₁·sin θ₁ = n₂·sin θ₂", pos: [0.6, 2.5, -1.4], color: TEAL, phase: 0 },
  { tex: "N(t) = N₀·e^(−λt)", pos: [4.6, -2.3, 0.4], color: GREEN, phase: 1.3 },
  { tex: "u(t) = E·(1 − e^(−t/τ))", pos: [1.4, -2.6, 0.8], color: VIOLET, phase: 2.1 },
  { tex: "T₀ = 2π·√(L/g)", pos: [4.6, 2.6, -2.4], color: VIOLET, phase: 0.7 },
  { tex: "ω₀ = 1/√(LC)", pos: [6.3, 1.5, -2.6], color: TEAL, phase: 2.8 },
  { tex: "E = E° − 0,03·log Q", pos: [6.6, -1.2, -3.2], color: GREEN, phase: 1.9 },
] as const;

/** Positions des 4 premières équations en mode mobile : réparties aux quatre coins de l'onde. */
const COMPACT_POS: readonly (readonly number[])[] = [
  [-2.7, 2.9, -1],
  [2.6, -2.9, 0.4],
  [-2.5, -2.9, 0.4],
  [2.8, 2.7, -1.4],
];

function envelope(x: number) {
  const u = (x - X_MIN) / (X_MAX - X_MIN);
  return Math.pow(Math.sin(Math.PI * u), 0.7);
}

function field(x: number, t: number) {
  return AMP * envelope(x) * Math.sin(K * x - OMEGA * t);
}

type Clock = MutableRefObject<number>;

function Ticker({ clock, animate }: { clock: Clock; animate: boolean }) {
  useFrame((_, delta) => {
    if (animate) clock.current += Math.min(delta, 0.05);
  });
  return null;
}

function Wave({ clock }: { clock: Clock }) {
  const glowTex = useGlowTexture();

  const e = useGlowCurve(TEAL, glowTex, CURVE_PTS);
  const b = useGlowCurve(VIOLET, glowTex, CURVE_PTS);

  const eShafts = useRef<THREE.InstancedMesh>(null);
  const bShafts = useRef<THREE.InstancedMesh>(null);
  const eHeads = useRef<THREE.InstancedMesh>(null);
  const bHeads = useRef<THREE.InstancedMesh>(null);

  const shaftGeo = useMemo(() => new THREE.CylinderGeometry(0.016, 0.016, 1, 6).translate(0, 0.5, 0), []);
  const headGeo = useMemo(() => new THREE.ConeGeometry(0.065, 0.2, 12).translate(0, 0.1, 0), []);
  const axis = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(X_MIN - 1, 0, 0),
      new THREE.Vector3(X_MAX + 1.3, 0, 0),
    ]);
    return new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: "#C8D6F5", transparent: true, opacity: 0.45, toneMapped: false })
    );
  }, []);
  useEffect(
    () => () => {
      shaftGeo.dispose();
      headGeo.dispose();
      axis.geometry.dispose();
      (axis.material as THREE.Material).dispose();
    },
    [shaftGeo, headGeo, axis]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const t = clock.current;

    for (let i = 0; i < CURVE_PTS; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / (CURVE_PTS - 1);
      const v = field(x, t);
      e.attr.setXYZ(i, x, v, 0);
      b.attr.setXYZ(i, x, 0, v);
    }
    e.attr.needsUpdate = true;
    b.attr.needsUpdate = true;

    const es = eShafts.current;
    const bs = bShafts.current;
    const eh = eHeads.current;
    const bh = bHeads.current;
    if (!es || !bs || !eh || !bh) return;

    for (let i = 0; i < ARROWS; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * (i + 0.5)) / ARROWS;
      const v = field(x, t);
      const len = Math.max(Math.abs(v), 1e-3);
      const up = v >= 0;
      const hs = Math.min(1, len / 0.35);

      // E selon ±y.
      dummy.position.set(x, 0, 0);
      dummy.rotation.set(0, 0, up ? 0 : Math.PI);
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      es.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, v, 0);
      dummy.scale.set(hs, hs, hs);
      dummy.updateMatrix();
      eh.setMatrixAt(i, dummy.matrix);

      // B selon ±z (rotation de ±π/2 autour de x : +y → ±z).
      dummy.position.set(x, 0, 0);
      dummy.rotation.set(up ? Math.PI / 2 : -Math.PI / 2, 0, 0);
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      bs.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 0, v);
      dummy.scale.set(hs, hs, hs);
      dummy.updateMatrix();
      bh.setMatrixAt(i, dummy.matrix);
    }
    es.instanceMatrix.needsUpdate = true;
    bs.instanceMatrix.needsUpdate = true;
    eh.instanceMatrix.needsUpdate = true;
    bh.instanceMatrix.needsUpdate = true;
  });

  const label = (text: string, color: string) => (
    <span
      style={{
        color,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace",
        fontWeight: 700,
        fontSize: 18,
        textShadow: `0 0 12px ${color}`,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {text}
    </span>
  );

  return (
    <group rotation={[0.2, -0.62, 0]}>
      <primitive object={axis} />
      <mesh position={[X_MAX + 1.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]} geometry={headGeo}>
        <meshBasicMaterial color="#C8D6F5" transparent opacity={0.7} toneMapped={false} />
      </mesh>

      <primitive object={e.line} />
      <primitive object={e.glow} />
      <primitive object={b.line} />
      <primitive object={b.glow} />

      <instancedMesh ref={eShafts} args={[shaftGeo, undefined, ARROWS]} frustumCulled={false}>
        <meshBasicMaterial color={TEAL} transparent opacity={0.55} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={eHeads} args={[headGeo, undefined, ARROWS]} frustumCulled={false}>
        <meshBasicMaterial color={TEAL} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={bShafts} args={[shaftGeo, undefined, ARROWS]} frustumCulled={false}>
        <meshBasicMaterial color={VIOLET} transparent opacity={0.55} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={bHeads} args={[headGeo, undefined, ARROWS]} frustumCulled={false}>
        <meshBasicMaterial color={VIOLET} toneMapped={false} />
      </instancedMesh>

      <Html position={[X_MAX - 0.6, AMP + 0.45, 0]} center zIndexRange={[5, 0]}>
        {label("E", TEAL)}
      </Html>
      <Html position={[X_MAX - 0.6, 0, AMP + 0.55]} center zIndexRange={[5, 0]}>
        {label("B", VIOLET)}
      </Html>
      <Html position={[X_MAX + 1.7, 0.05, 0]} center zIndexRange={[5, 0]}>
        {label("c", "#C8D6F5")}
      </Html>
    </group>
  );
}

function Equation({
  tex,
  pos,
  color,
  phase,
  clock,
  compact,
}: {
  tex: string;
  pos: readonly number[];
  color: string;
  phase: number;
  clock: Clock;
  compact: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = clock.current;
    g.position.y = pos[1] + Math.sin(t * 0.55 + phase) * 0.22;
    g.rotation.y = Math.sin(t * 0.3 + phase) * 0.18;
  });
  return (
    <group ref={ref} position={[pos[0], pos[1], pos[2]]}>
      <Html transform distanceFactor={compact ? 10 : 4} zIndexRange={[4, 0]}>
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 12,
            border: `1px solid ${color}55`,
            background: "rgba(8, 17, 36, 0.72)",
            boxShadow: `0 0 28px -8px ${color}`,
            color: "#E8EEFA",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace",
            fontSize: 15,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <span style={{ color, marginInlineEnd: 6 }}>●</span>
          {tex}
        </div>
      </Html>
    </group>
  );
}

function Dust({ clock, count }: { clock: Clock; count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color("#E8EEFA"), new THREE.Color(TEAL), new THREE.Color(VIOLET)];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = -Math.random() * 16 + 3;
      const c = palette[i % 7 === 0 ? 1 : i % 11 === 0 ? 2 : 0];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y = clock.current * 0.012;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.7} depthWrite={false} toneMapped={false} />
    </points>
  );
}

function Stage({ clock, side }: { clock: Clock; side: 1 | -1 }) {
  const ref = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0, touch: false });
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  // Mobile : la scène a sa propre fenêtre quasi carrée en haut du hero.
  const compact = aspect < 1.2;

  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      pointer.current.touch = ev.pointerType === "touch";
      pointer.current.x = (ev.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = clock.current;
    const p = pointer.current;
    const tx = p.touch ? Math.sin(t * 0.25) * 0.5 : p.x;
    const ty = p.touch ? 0 : p.y;
    g.rotation.y += (tx * 0.22 - g.rotation.y) * 0.05;
    g.rotation.x += (ty * 0.08 - g.rotation.x) * 0.05;
  });

  // Largeur visible à z = 0 : 2·10·tan(22,5°)·aspect ≈ 8,3·aspect ; l'onde fait 13 unités.
  const scale = compact ? Math.min(0.9, 0.67 * aspect) : Math.min(1, size.width / 1280 + 0.12);
  const position: [number, number, number] = compact ? [0, 0.2, 0] : [side * 2.3, -0.1, 0];
  const equations = compact
    ? EQUATIONS.slice(0, 4).map((eq, i) => ({ ...eq, pos: COMPACT_POS[i] }))
    : EQUATIONS;

  return (
    <group ref={ref} position={position} scale={scale}>
      <Wave clock={clock} />
      {equations.map((eq) => (
        <Equation
          key={eq.tex}
          tex={eq.tex}
          pos={[eq.pos[0] * side, eq.pos[1], eq.pos[2]]}
          color={eq.color}
          phase={eq.phase}
          clock={clock}
          compact={compact}
        />
      ))}
    </group>
  );
}

export default function HeroScene({
  active,
  side = 1,
  onReady,
}: {
  /** Anime la scène (section visible et mouvement autorisé). Sinon : une image fixe. */
  active: boolean;
  /** 1 : scène décalée à droite (FR/EN) ; −1 : à gauche (AR, texte à droite). */
  side?: 1 | -1;
  onReady?: () => void;
}) {
  const clock = useRef(STATIC_T);
  const dustCount = useMemo(() => (typeof window !== "undefined" && window.innerWidth < 768 ? 500 : 1500), []);

  return (
    <Canvas
      flat
      frameloop={active ? "always" : "demand"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 10], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
      style={{ position: "absolute", inset: 0 }}
    >
      <Ticker clock={clock} animate={active} />
      <Dust clock={clock} count={dustCount} />
      <gridHelper args={[60, 60, "#1C2A4A", "#121D36"]} position={[0, -3.4, 0]} />
      <Stage clock={clock} side={side} />
    </Canvas>
  );
}
