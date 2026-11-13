"use client";

import { Suspense, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Lightformer,
  MeshReflectorMaterial,
  RoundedBox,
  Sparkles,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, PORTFOLIO_TEXTURES, coverTexture, prefersReducedMotion } from "./shared";

type ScrollSource = { get(): number };

const SCREEN_W = 2.9;
const SCREEN_H = 1.8;
const METAL = { color: "#cfd5e3", metalness: 0.85, roughness: 0.25 };

/**
 * Laptop entièrement procédural (aucun modèle 3D externe à télécharger).
 * Le capot s'ouvre à l'arrivée, l'écran fait défiler les vraies réalisations
 * en fondu enchaîné.
 */
function Laptop({ textures, still }: { textures: THREE.Texture[]; still: boolean }) {
  const lid = useRef<THREE.Group>(null!);
  const screenA = useRef<THREE.MeshBasicMaterial>(null!);
  const screenB = useRef<THREE.MeshBasicMaterial>(null!);
  const covered = useMemo(() => textures.map((t) => coverTexture(t, SCREEN_W / SCREEN_H)), [textures]);
  const s = useRef({ idx: 0, next: 1, fade: 1, timer: 0, open: still ? 1 : 0 });

  useFrame((_, delta) => {
    const st = s.current;
    // Ouverture du capot (fermé = +90°, ouvert = légèrement incliné vers l'arrière).
    st.open = Math.min(1, st.open + delta * 0.55);
    const eased = 1 - Math.pow(1 - st.open, 3);
    lid.current.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, -0.28, eased);

    // Diaporama de l'écran : nouvelle réalisation toutes les 3,2 s, fondu enchaîné.
    if (st.open < 1) return;
    st.timer += delta;
    if (st.timer > 3.2 && st.fade >= 1) {
      st.timer = 0;
      st.fade = 0;
      st.next = (st.idx + 1) % covered.length;
      screenB.current.map = covered[st.next];
      screenB.current.needsUpdate = true;
    }
    if (st.fade < 1) {
      st.fade = Math.min(1, st.fade + delta * 1.6);
      screenB.current.opacity = st.fade;
      if (st.fade >= 1) {
        st.idx = st.next;
        screenA.current.map = covered[st.idx];
        screenA.current.needsUpdate = true;
        screenB.current.opacity = 0;
      }
    }
  });

  return (
    <group>
      {/* Base + clavier + pavé tactile */}
      <RoundedBox args={[3.3, 0.12, 2.25]} radius={0.05} smoothness={4} castShadow>
        <meshStandardMaterial {...METAL} envMapIntensity={1.3} />
      </RoundedBox>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.061, -0.28]}>
        <planeGeometry args={[2.9, 1.1]} />
        <meshStandardMaterial color="#141b30" roughness={0.6} />
      </mesh>
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 13 }).map((__, col) => (
          <mesh
            key={`${row}-${col}`}
            rotation-x={-Math.PI / 2}
            position={[-1.32 + col * 0.22, 0.063, -0.72 + row * 0.2]}
          >
            <planeGeometry args={[0.17, 0.15]} />
            <meshStandardMaterial color="#232c46" roughness={0.5} />
          </mesh>
        ))
      )}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.062, 0.63]}>
        <planeGeometry args={[1.05, 0.6]} />
        <meshStandardMaterial color="#b9c1d3" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Capot articulé sur le bord arrière */}
      <group ref={lid} position={[0, 0.06, -1.1]}>
        <RoundedBox args={[3.3, 2.15, 0.07]} radius={0.04} smoothness={4} position={[0, 1.075, 0]}>
          <meshStandardMaterial {...METAL} envMapIntensity={1.3} />
        </RoundedBox>
        <mesh position={[0, 1.075, 0.0362]}>
          <planeGeometry args={[3.2, 2.05]} />
          <meshStandardMaterial color="#070b17" roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.1, 0.037]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial ref={screenA} map={covered[0]} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.1, 0.0375]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial ref={screenB} map={covered[1]} transparent opacity={0} toneMapped={false} />
        </mesh>
        {/* Lueur de l'écran sur le clavier */}
        <pointLight position={[0, 1.1, 0.9]} intensity={4} distance={4} color={PALETTE.teal} />
      </group>
    </group>
  );
}

/** Une diapositive flottante (cadre blanc + vraie réalisation en texture). */
function FloatingSlide({
  texture,
  position,
  rotation,
  speed,
}: {
  texture: THREE.Texture;
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
}) {
  const covered = useMemo(() => coverTexture(texture, 16 / 9), [texture]);
  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={1.1}>
      <group position={position} rotation={rotation}>
        <RoundedBox args={[1.68, 0.98, 0.035]} radius={0.03} smoothness={3}>
          <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.1} />
        </RoundedBox>
        <mesh position={[0, 0, 0.019]}>
          <planeGeometry args={[1.6, 0.9]} />
          <meshBasicMaterial map={covered} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  );
}

const SLIDE_LAYOUT: { position: [number, number, number]; rotation: [number, number, number]; speed: number }[] = [
  { position: [-3.2, 1.6, -1.4], rotation: [0, 0.5, 0.05], speed: 1.4 },
  { position: [-2.7, -0.1, 0.7], rotation: [0, 0.35, -0.05], speed: 1.8 },
  { position: [3.1, 1.9, -1.2], rotation: [0, -0.5, -0.05], speed: 1.2 },
  { position: [2.8, 0.15, 0.85], rotation: [0, -0.4, 0.06], speed: 1.6 },
  { position: [0.2, 3.0, -2.4], rotation: [0.1, 0, 0], speed: 1.1 },
  { position: [-1.5, 2.65, -2.0], rotation: [0.05, 0.25, 0], speed: 1.5 },
  { position: [1.8, 2.75, -2.2], rotation: [0.05, -0.25, 0], speed: 1.3 },
];

/** Positionne la scène selon l'écran : à côté du texte sur desktop, sous le texte sur mobile. */
function Stage({ rtl, children }: { rtl: boolean; children: React.ReactNode }) {
  const { viewport, size } = useThree();
  // Même point de bascule que la mise en page CSS (lg = 1024px) : en dessous,
  // le texte occupe le haut du hero et la scène se place dans la moitié basse.
  const narrow = size.width < 1024;
  const x = narrow ? 0 : (rtl ? -1 : 1) * Math.min(viewport.width * 0.21, 2.7);
  const y = narrow ? -viewport.height * 0.17 : -0.85;
  const scale = narrow ? Math.min(0.72, viewport.width / 6.5) : 0.8;
  return (
    <group position={[x, y, 0]} scale={scale}>
      {children}
    </group>
  );
}

/** Caméra qui suit la souris et descend légèrement avec le scroll. */
function Rig({ scroll, still }: { scroll?: ScrollSource; still: boolean }) {
  useFrame((state, delta) => {
    const p = still ? { x: 0, y: 0 } : state.pointer;
    const sc = scroll?.get() ?? 0;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, p.x * 0.9, 2.5, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.3 + p.y * 0.55 + sc * 1.8, 2.5, delta);
    state.camera.lookAt(0, 0.6 - sc * 0.6, 0);
  });
  return null;
}

function Orbit({ children, still }: { children: React.ReactNode; still: boolean }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((state) => {
    if (still) return;
    g.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.22;
  });
  return <group ref={g}>{children}</group>;
}

function Scene({ rtl, scroll }: { rtl: boolean; scroll?: ScrollSource }) {
  const textures = useTexture(PORTFOLIO_TEXTURES);
  const still = useMemo(() => prefersReducedMotion(), []);

  return (
    <>
      <color attach="background" args={[PALETTE.navy]} />
      <fog attach="fog" args={[PALETTE.navy, 9, 22]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 5]} intensity={2.2} />
      <spotLight position={[-7, 4, 3]} angle={0.5} penumbra={1} intensity={90} color={PALETTE.teal} />
      <spotLight position={[7, 3, 2]} angle={0.5} penumbra={1} intensity={70} color={PALETTE.violet} />

      <Stage rtl={rtl}>
        <Orbit still={still}>
          <Float speed={still ? 0 : 1.2} rotationIntensity={0.15} floatIntensity={0.4}>
            <group rotation={[0.12, rtl ? 0.35 : -0.35, 0]}>
              <Laptop textures={textures} still={still} />
            </group>
          </Float>
          {SLIDE_LAYOUT.map((slide, i) => (
            <FloatingSlide
              key={i}
              texture={textures[i % textures.length]}
              position={slide.position}
              rotation={slide.rotation}
              speed={still ? 0 : slide.speed}
            />
          ))}
        </Orbit>

        <Sparkles count={90} scale={[12, 6, 6]} position={[0, 1.5, 0]} size={2.6} speed={still ? 0 : 0.4} color={PALETTE.teal} opacity={0.75} />
        <Sparkles count={50} scale={[10, 5, 5]} position={[0, 2, -1]} size={3} speed={still ? 0 : 0.3} color={PALETTE.violet} opacity={0.6} />

        {/* Sol réfléchissant */}
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.07, 0]}>
          <planeGeometry args={[40, 40]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={30}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0A1B3D"
            metalness={0.6}
            mirror={0}
          />
        </mesh>
      </Stage>

      {/* Éclairage d'environnement local (aucun fichier HDR téléchargé) */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="ring" color={PALETTE.teal} intensity={6} rotation-y={Math.PI / 2} position={[-1, -1, -1]} scale={8} />
          <Lightformer form="rect" color={PALETTE.violet} intensity={4} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[10, 2, 1]} />
        </group>
      </Environment>

      <Rig scroll={scroll} still={still} />
    </>
  );
}

export default function HeroScene({
  rtl,
  scroll,
  eventSource,
}: {
  rtl: boolean;
  scroll?: ScrollSource;
  eventSource?: RefObject<HTMLElement>;
}) {
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 2]}
      camera={{ position: [0, 1.3, 7.6], fov: 35 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      eventSource={eventSource as MutableRefObject<HTMLElement> | undefined}
      eventPrefix="client"
      fallback={
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/presentations/hero-devices.webp" alt="" className="h-full w-full object-contain p-10" />
      }
    >
      <Suspense fallback={null}>
        <Scene rtl={rtl} scroll={scroll} />
      </Suspense>
    </Canvas>
  );
}
