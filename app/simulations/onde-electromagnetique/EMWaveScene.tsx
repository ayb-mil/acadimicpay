"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { SIM_COLORS } from "../_theme";
import { useGlowCurve, useGlowTexture } from "../_three/glowCurve";
import { C_VIS, SCALE, type EMView } from "./constants";

/* ══════════════════════════════════════════════════════════════════════════
   Onde électromagnétique plane progressive, monochromatique, polarisée
   rectilignement : E selon y, B selon z, propagation selon +x.
   Pour x < 0 : vide (célérité c, longueur d'onde λ₀).
   Pour x > 0 : milieu d'indice n (célérité v = c/n, longueur d'onde λ₀/n).
   La fréquence est la même des deux côtés et la phase est continue en x = 0 :
     x < 0 : φ = k₀·x − ω·t        x > 0 : φ = n·k₀·x − ω·t
   L'échelle est visuelle : 1 nm réel ↔ SCALE unité de scène, et le temps
   est ralenti d'environ 10¹⁵ (voir la page pour le facteur exact).
   ══════════════════════════════════════════════════════════════════════════ */

const X_MIN = -7;
const X_MAX = 7;
const CURVE_PTS = 420;
const ARROWS = 84;
const AMP = 1.3;

const VIEWS: Record<EMView, [number, number, number]> = {
  "3d": [-6.5, 4.2, 11],
  face: [0, 0.2, 15.5],
  top: [0, 16, 0.001],
};

type Params = { lambda0: number; n: number; showE: boolean; showB: boolean };
type Clock = MutableRefObject<number>;

function edgeFade(x: number) {
  const s = (u: number) => {
    const v = Math.min(1, Math.max(0, u / 0.9));
    return v * v * (3 - 2 * v);
  };
  return s(x - X_MIN) * s(X_MAX - x);
}

function Ticker({ clock, running, speed }: { clock: Clock; running: boolean; speed: number }) {
  useFrame((_, delta) => {
    if (running) clock.current += Math.min(delta, 0.05) * speed;
  });
  return null;
}

function Wave({ clock, params }: { clock: Clock; params: Params }) {
  const glowTex = useGlowTexture();
  const e = useGlowCurve(SIM_COLORS.accent, glowTex, CURVE_PTS, 0.28);
  const b = useGlowCurve(SIM_COLORS.vectorY, glowTex, CURVE_PTS, 0.28);

  const eShafts = useRef<THREE.InstancedMesh>(null);
  const bShafts = useRef<THREE.InstancedMesh>(null);
  const eHeads = useRef<THREE.InstancedMesh>(null);
  const bHeads = useRef<THREE.InstancedMesh>(null);
  const eGroup = useRef<THREE.Group>(null);
  const bGroup = useRef<THREE.Group>(null);

  const shaftGeo = useMemo(() => new THREE.CylinderGeometry(0.014, 0.014, 1, 6).translate(0, 0.5, 0), []);
  const headGeo = useMemo(() => new THREE.ConeGeometry(0.055, 0.17, 10).translate(0, 0.085, 0), []);
  useEffect(
    () => () => {
      shaftGeo.dispose();
      headGeo.dispose();
    },
    [shaftGeo, headGeo]
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const { lambda0, n, showE, showB } = params;
    if (eGroup.current) eGroup.current.visible = showE;
    if (bGroup.current) bGroup.current.visible = showB;

    const t = clock.current;
    const k0 = (2 * Math.PI) / (lambda0 * SCALE);
    const omega = C_VIS * k0;
    const field = (x: number) => AMP * edgeFade(x) * Math.sin((x < 0 ? k0 : n * k0) * x - omega * t);

    for (let i = 0; i < CURVE_PTS; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / (CURVE_PTS - 1);
      const v = field(x);
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
      const v = field(x);
      const len = Math.max(Math.abs(v), 1e-3);
      const up = v >= 0;
      const hs = Math.min(1, len / 0.3);

      dummy.position.set(x, 0, 0);
      dummy.rotation.set(0, 0, up ? 0 : Math.PI);
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      es.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, v, 0);
      dummy.scale.set(hs, hs, hs);
      dummy.updateMatrix();
      eh.setMatrixAt(i, dummy.matrix);

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

  return (
    <>
      <group ref={eGroup}>
        <primitive object={e.line} />
        <primitive object={e.glow} />
        <instancedMesh ref={eShafts} args={[shaftGeo, undefined, ARROWS]} frustumCulled={false}>
          <meshBasicMaterial color={SIM_COLORS.accent} transparent opacity={0.5} toneMapped={false} />
        </instancedMesh>
        <instancedMesh ref={eHeads} args={[headGeo, undefined, ARROWS]} frustumCulled={false}>
          <meshBasicMaterial color={SIM_COLORS.accent} toneMapped={false} />
        </instancedMesh>
      </group>
      <group ref={bGroup}>
        <primitive object={b.line} />
        <primitive object={b.glow} />
        <instancedMesh ref={bShafts} args={[shaftGeo, undefined, ARROWS]} frustumCulled={false}>
          <meshBasicMaterial color={SIM_COLORS.vectorY} transparent opacity={0.5} toneMapped={false} />
        </instancedMesh>
        <instancedMesh ref={bHeads} args={[headGeo, undefined, ARROWS]} frustumCulled={false}>
          <meshBasicMaterial color={SIM_COLORS.vectorY} toneMapped={false} />
        </instancedMesh>
      </group>
    </>
  );
}

const labelStyle = (color: string, size = 13) => ({
  color,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace",
  fontSize: size,
  fontWeight: 600,
  whiteSpace: "nowrap" as const,
  pointerEvents: "none" as const,
  userSelect: "none" as const,
  textShadow: `0 0 10px ${SIM_COLORS.canvasBg}`,
});

/** Repère de longueur d'onde : segment horizontal avec deux butées, au-dessus de l'onde. */
function LambdaMarker({ from, to, label, color }: { from: number; to: number; label: string; color: string }) {
  const y = AMP + 0.55;
  return (
    <group>
      <Line points={[[from, y, 0], [to, y, 0]]} color={color} lineWidth={1.5} />
      <Line points={[[from, y - 0.14, 0], [from, y + 0.14, 0]]} color={color} lineWidth={1.5} />
      <Line points={[[to, y - 0.14, 0], [to, y + 0.14, 0]]} color={color} lineWidth={1.5} />
      <Html position={[(from + to) / 2, y + 0.38, 0]} center zIndexRange={[5, 0]}>
        <span style={labelStyle(color)}>{label}</span>
      </Html>
    </group>
  );
}

function Decor({ params }: { params: Params }) {
  const { lambda0, n } = params;
  const hasMedium = n > 1.0001;
  const ls0 = lambda0 * SCALE;
  const ls = ls0 / n;
  const axis = useMemo(
    () => [new THREE.Vector3(X_MIN - 0.6, 0, 0), new THREE.Vector3(X_MAX + 0.7, 0, 0)] as [THREE.Vector3, THREE.Vector3],
    []
  );

  return (
    <>
      <Line points={axis} color={SIM_COLORS.ground} lineWidth={1.2} />
      <mesh position={[X_MAX + 0.85, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.07, 0.24, 12]} />
        <meshBasicMaterial color={SIM_COLORS.ground} toneMapped={false} />
      </mesh>
      <Html position={[X_MAX + 1.3, 0, 0]} center zIndexRange={[5, 0]}>
        <span style={labelStyle(SIM_COLORS.textMuted)}>x</span>
      </Html>
      <Html position={[X_MIN + 0.6, AMP + 0.1, 0]} center zIndexRange={[5, 0]}>
        <span style={labelStyle(SIM_COLORS.accent, 15)}>E</span>
      </Html>
      <Html position={[X_MIN + 0.6, 0, AMP + 0.3]} center zIndexRange={[5, 0]}>
        <span style={labelStyle(SIM_COLORS.vectorY, 15)}>B</span>
      </Html>

      {hasMedium ? (
        <>
          <mesh position={[X_MAX / 2, 0, 0]}>
            <boxGeometry args={[X_MAX, 3.6, 3.6]} />
            <meshBasicMaterial color={SIM_COLORS.accent} transparent opacity={0.05} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[3.6, 3.6]} />
            <meshBasicMaterial
              color={SIM_COLORS.accent}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <Html position={[-X_MAX / 2, -2.3, 0]} center zIndexRange={[5, 0]}>
            <span style={labelStyle(SIM_COLORS.textMuted)}>vide · c</span>
          </Html>
          <Html position={[X_MAX / 2, -2.3, 0]} center zIndexRange={[5, 0]}>
            <span style={labelStyle(SIM_COLORS.textMuted)}>milieu n = {n.toFixed(3)} · v = c/n</span>
          </Html>
          <LambdaMarker
            from={-0.6 - ls0}
            to={-0.6}
            label={`λ₀ = ${Math.round(lambda0)} nm`}
            color={SIM_COLORS.vectorX}
          />
          <LambdaMarker from={0.6} to={0.6 + ls} label={`λ = ${Math.round(lambda0 / n)} nm`} color={SIM_COLORS.vectorResult} />
        </>
      ) : (
        <LambdaMarker
          from={-ls0 / 2}
          to={ls0 / 2}
          label={`λ₀ = ${Math.round(lambda0)} nm`}
          color={SIM_COLORS.vectorX}
        />
      )}
    </>
  );
}

type ControlsLike = { target: THREE.Vector3; update: () => void };

function CameraRig({ view, params }: { view: EMView; params: Params }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    camera.position.set(...VIEWS[view]);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    } else {
      camera.lookAt(0, 0, 0);
    }
    invalidate();
  }, [view, camera, controls, invalidate]);

  // En mode « demand » (pause), un changement de paramètre doit redessiner une image.
  useEffect(() => {
    invalidate();
  }, [params.lambda0, params.n, params.showE, params.showB, invalidate]);

  return null;
}

export default function EMWaveScene({
  lambda0,
  n,
  showE,
  showB,
  running,
  speed,
  view,
}: Params & { running: boolean; speed: number; view: EMView }) {
  const clock = useRef(0.35);
  const params: Params = { lambda0, n, showE, showB };

  return (
    <Canvas
      flat
      frameloop={running ? "always" : "demand"}
      dpr={[1, 2]}
      camera={{ position: VIEWS["3d"], fov: 40 }}
      gl={{ antialias: true }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
    >
      <color attach="background" args={[SIM_COLORS.canvasBg]} />
      <Ticker clock={clock} running={running} speed={speed} />
      <gridHelper args={[30, 30, SIM_COLORS.border, SIM_COLORS.grid]} position={[0, -2.6, 0]} />
      <Decor params={params} />
      <Wave clock={clock} params={params} />
      <OrbitControls makeDefault enablePan={false} enableDamping minDistance={6} maxDistance={26} />
      <CameraRig view={view} params={params} />
    </Canvas>
  );
}
