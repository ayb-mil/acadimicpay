"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, PORTFOLIO_TEXTURES, coverTexture, prefersReducedMotion } from "./shared";

const MAX_CARDS = 20;
const CARD_W = 2.0;
const CARD_D = 1.15;
const GAP = 0.065;

/**
 * Représentation 3D de la commande : une pile de diapositives dont la hauteur
 * suit le nombre choisi (15 → 5 cartes, 30 → 10, 60 → 20). « Rédaction » fait
 * apparaître des lignes de texte sur la carte du dessus, « Animations » fait
 * onduler la pile, un pack complet allume un anneau lumineux.
 */
function Stack({
  cards,
  content,
  animations,
  pack,
}: {
  cards: number;
  content: boolean;
  animations: boolean;
  pack: boolean;
}) {
  const textures = useTexture([PORTFOLIO_TEXTURES[0], PORTFOLIO_TEXTURES[1], PORTFOLIO_TEXTURES[3]]);
  const faces = useMemo(() => textures.map((t) => coverTexture(t, CARD_W / CARD_D)), [textures]);
  const root = useRef<THREE.Group>(null!);
  const items = useRef<(THREE.Group | null)[]>([]);
  const lines = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const still = useMemo(() => prefersReducedMotion(), []);

  useFrame((state, delta) => {
    const t = still ? 0 : state.clock.elapsedTime;
    if (!still) root.current.rotation.y = Math.sin(t * 0.4) * 0.35 + 0.5;

    for (let i = 0; i < MAX_CARDS; i++) {
      const g = items.current[i];
      if (!g) continue;
      const visible = i < cards;
      const wave = animations ? Math.sin(t * 2 + i * 0.45) : 0;
      g.position.y = THREE.MathUtils.damp(g.position.y, visible ? i * GAP + wave * 0.04 : -0.8, 7, delta);
      const sc = THREE.MathUtils.damp(g.scale.x, visible ? 1 : 0.001, 9, delta);
      g.scale.setScalar(sc);
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, animations ? wave * 0.22 : i % 2 ? 0.02 : -0.02, 4, delta);
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, animations ? (i - cards / 2) * 0.012 : 0, 4, delta);
    }

    // Lignes de texte au-dessus de la pile (option « Rédaction du contenu »).
    const topY = (cards - 1) * GAP + 0.08;
    lines.current.position.y = THREE.MathUtils.damp(lines.current.position.y, topY, 7, delta);
    const ls = THREE.MathUtils.damp(lines.current.scale.x, content ? 1 : 0.001, 8, delta);
    lines.current.scale.set(ls, ls, ls);

    // Anneau lumineux (pack complet).
    const rs = THREE.MathUtils.damp(ring.current.scale.x, pack ? 1 : 0.001, 6, delta);
    ring.current.scale.set(rs, rs, rs);
    ring.current.rotation.z += delta * 0.6;
  });

  return (
    <group ref={root} position={[0, -0.55, 0]}>
      {Array.from({ length: MAX_CARDS }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            items.current[i] = el;
          }}
          position={[0, -0.8, 0]}
          scale={0.001}
        >
          <RoundedBox args={[CARD_W + 0.06, 0.035, CARD_D + 0.06]} radius={0.015} smoothness={2}>
            <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.05} />
          </RoundedBox>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.0185, 0]}>
            <planeGeometry args={[CARD_W, CARD_D]} />
            <meshBasicMaterial map={faces[i % faces.length]} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group ref={lines} scale={0.001}>
        {[0.32, 0.12, -0.08, -0.28].map((z, k) => (
          <mesh key={k} position={[-0.25 + (k % 2) * 0.12, 0, z]}>
            <boxGeometry args={[k === 0 ? 1.3 : 1.0 - k * 0.1, 0.03, 0.07]} />
            <meshStandardMaterial
              color={k === 0 ? PALETTE.violet : PALETTE.teal}
              emissive={k === 0 ? PALETTE.violet : PALETTE.teal}
              emissiveIntensity={1.4}
            />
          </mesh>
        ))}
      </group>

      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} scale={0.001}>
        <torusGeometry args={[1.55, 0.03, 16, 96]} />
        <meshStandardMaterial color={PALETTE.teal} emissive={PALETTE.teal} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function ConfiguratorStack3D({
  slides,
  content,
  animations,
  pack,
}: {
  slides: number;
  content: boolean;
  animations: boolean;
  pack: boolean;
}) {
  const cards = Math.min(MAX_CARDS, Math.max(1, Math.round(slides / 3)));
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 2]}
      camera={{ position: [0, 2.3, 3.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={2.2} />
      <spotLight position={[-4, 3, 2]} angle={0.7} penumbra={1} intensity={25} color={PALETTE.teal} />
      <Suspense fallback={null}>
        <Stack cards={cards} content={content} animations={animations} pack={pack} />
      </Suspense>
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="ring" color={PALETTE.violet} intensity={3} position={[4, 1, 2]} scale={3} />
      </Environment>
    </Canvas>
  );
}
