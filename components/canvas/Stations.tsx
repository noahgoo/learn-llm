"use client";

import { useFrame } from "@react-three/fiber";
import type { ComponentType } from "react";
import { useRef } from "react";
import * as THREE from "three";
import { STAGES, stationPosition, type StageId } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";
import { AttentionStage } from "./stages/AttentionStage";
import { EmbeddingsStage } from "./stages/EmbeddingsStage";
import { PositionalStage } from "./stages/PositionalStage";
import { TokenizationStage } from "./stages/TokenizationStage";

const VIOLET = new THREE.Color("#9d7bff");
const FAINT = new THREE.Color("#4f4a63");

/** Real visualizations per stage; others keep the placeholder core. */
const STAGE_VISUALS: Partial<Record<StageId, ComponentType>> = {
  tokenization: TokenizationStage,
  embeddings: EmbeddingsStage,
  positional: PositionalStage,
  attention: AttentionStage,
};

function PlaceholderCore({ built }: { built: boolean }) {
  const core = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (core.current) {
      core.current.rotation.y += delta * 0.18;
      core.current.rotation.x += delta * 0.07;
    }
  });
  return (
    <mesh ref={core}>
      <icosahedronGeometry args={[2.4, 1]} />
      <meshBasicMaterial
        color={built ? VIOLET : FAINT}
        wireframe
        transparent
        opacity={built ? 0.85 : 0.35}
      />
    </mesh>
  );
}

function Station({ index }: { index: number }) {
  const stage = STAGES[index];
  const ring = useRef<THREE.Mesh>(null);
  // mount heavy stage visuals only near the camera
  const near = useJourneyStore(
    (s) => Math.abs(s.activeStage - index) <= 1,
  );
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.05;
  });

  const Visual = STAGE_VISUALS[stage.id];
  const color = stage.built ? VIOLET : FAINT;
  return (
    <group position={stationPosition(index)}>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[6.4, 0.045, 8, 96]} />
        <meshBasicMaterial color={color} transparent opacity={stage.built ? 0.6 : 0.3} />
      </mesh>
      {Visual ? (near && <Visual />) : <PlaceholderCore built={stage.built} />}
      <pointLight color={color} intensity={stage.built ? 14 : 4} distance={26} decay={2} />
    </group>
  );
}

export function Stations() {
  return (
    <>
      {STAGES.map((stage, i) => (
        <Station key={stage.id} index={i} />
      ))}
    </>
  );
}
