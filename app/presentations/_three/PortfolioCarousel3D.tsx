"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, RoundedBox, Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, PORTFOLIO_TEXTURES, prefersReducedMotion, textureAspect } from "./shared";

const RADIUS = 4.3;
const SLIDE_W = 2.8;

/**
 * Anneau 3D des réalisations : tourne seul, se fait glisser à la souris ou au
 * doigt, la diapositive de face est agrandie et éclairée. Un clic (sans
 * glisser) ouvre la réalisation en grand via `onSelect`.
 */
function Ring({ onSelect }: { onSelect: (i: number) => void }) {
  const textures = useTexture(PORTFOLIO_TEXTURES);
  const group = useRef<THREE.Group>(null!);
  const slides = useRef<(THREE.Group | null)[]>([]);
  const materials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const still = useMemo(() => prefersReducedMotion(), []);
  const drag = useRef({ current: 0, target: 0, dragging: false, lastX: 0, moved: 0, idle: 2 });
  const { gl } = useThree();
  const n = textures.length;

  const prepared = useMemo(
    () =>
      textures.map((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        const aspect = textureAspect(t);
        return { tex: t, h: Math.max(0.85, SLIDE_W / aspect) };
      }),
    [textures]
  );

  useEffect(() => {
    const el = gl.domElement;
    const d = drag.current;
    const down = (e: PointerEvent) => {
      d.dragging = true;
      d.lastX = e.clientX;
      d.moved = 0;
    };
    const move = (e: PointerEvent) => {
      if (!d.dragging) return;
      const dx = e.clientX - d.lastX;
      d.lastX = e.clientX;
      d.target += dx * 0.0065;
      d.moved += Math.abs(dx);
    };
    const up = () => {
      d.dragging = false;
      d.idle = 0;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const d = drag.current;
    if (!d.dragging) {
      d.idle += delta;
      if (d.idle > 1.6 && !still) d.target -= delta * 0.2;
    }
    d.current = THREE.MathUtils.damp(d.current, d.target, 4, delta);
    group.current.rotation.y = d.current;

    // Mise en avant de la diapositive de face.
    for (let i = 0; i < n; i++) {
      const g = slides.current[i];
      const m = materials.current[i];
      if (!g || !m) continue;
      const angle = (i / n) * Math.PI * 2 + d.current;
      const front = Math.max(0, Math.cos(angle));
      const target = 0.82 + 0.3 * front * front;
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 6, delta));
      m.color.setScalar(0.3 + 0.7 * front);
    }
  });

  return (
    <group ref={group}>
      {prepared.map(({ tex, h }, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <group
            key={i}
            ref={(el) => {
              slides.current[i] = el;
            }}
            position={[Math.sin(a) * RADIUS, 0.2, Math.cos(a) * RADIUS]}
            rotation={[0, a, 0]}
          >
            <RoundedBox args={[SLIDE_W + 0.1, h + 0.1, 0.05]} radius={0.04} smoothness={3}>
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </RoundedBox>
            <mesh
              position={[0, 0, 0.027]}
              onClick={(e) => {
                e.stopPropagation();
                if (drag.current.moved < 8) onSelect(i);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "";
              }}
            >
              <planeGeometry args={[SLIDE_W, h]} />
              <meshBasicMaterial
                ref={(el) => {
                  materials.current[i] = el;
                }}
                map={tex}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function PortfolioCarousel3D({ onSelect }: { onSelect: (i: number) => void }) {
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 2]}
      camera={{ position: [0, 1.1, 10], fov: 38 }}
      gl={{ antialias: true }}
      style={{ touchAction: "pan-y", cursor: "grab" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
    >
      <color attach="background" args={[PALETTE.navy]} />
      <fog attach="fog" args={[PALETTE.navy, 9, 18]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 6]} intensity={2} />
      <spotLight position={[-6, 4, 4]} angle={0.6} penumbra={1} intensity={60} color={PALETTE.teal} />
      <spotLight position={[6, 4, 4]} angle={0.6} penumbra={1} intensity={50} color={PALETTE.violet} />
      <Suspense fallback={null}>
        <Ring onSelect={onSelect} />
      </Suspense>
      <Sparkles count={70} scale={[14, 5, 10]} position={[0, 1, 0]} size={2.4} speed={0.35} color={PALETTE.teal} opacity={0.7} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.15, 0]}>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={1024}
          mixBlur={1}
          mixStrength={25}
          roughness={1}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0A1B3D"
          metalness={0.6}
          mirror={0}
        />
      </mesh>
    </Canvas>
  );
}
