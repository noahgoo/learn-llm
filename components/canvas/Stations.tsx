"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ComponentType } from "react";
import { useRef } from "react";
import * as THREE from "three";
import { STAGES, stationPosition, type StageId } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";
import { AttentionStage } from "./stages/AttentionStage";
import { EmbeddingsStage } from "./stages/EmbeddingsStage";
import { FeedForwardStage } from "./stages/FeedForwardStage";
import { LayerNormStage } from "./stages/LayerNormStage";
import { MultiHeadStage } from "./stages/MultiHeadStage";
import { PredictionStage } from "./stages/PredictionStage";
import { PositionalStage } from "./stages/PositionalStage";
import { ResidualStage } from "./stages/ResidualStage";
import { TokenizationStage } from "./stages/TokenizationStage";
import { WeightsStage } from "./stages/WeightsStage";

const VIOLET = new THREE.Color("#9d7bff");
const FAINT = new THREE.Color("#4f4a63");

/** Real visualizations per stage; others keep the placeholder core. */
const STAGE_VISUALS: Partial<Record<StageId, ComponentType>> = {
  tokenization: TokenizationStage,
  embeddings: EmbeddingsStage,
  positional: PositionalStage,
  attention: AttentionStage,
  "multi-head": MultiHeadStage,
  ffn: FeedForwardStage,
  residual: ResidualStage,
  layernorm: LayerNormStage,
  prediction: PredictionStage,
  weights: WeightsStage,
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
      {/* the ring marks a station that has no visual yet; once a stage is
          built its own visualization fills the space and the ring would just
          clutter it, so we drop it there */}
      {!stage.built && (
        <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[6.4, 0.045, 8, 96]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}
      {Visual ? (near && <Visual />) : <PlaceholderCore built={stage.built} />}
      {/* connective handoff: what the stream delivers in / hands off out */}
      {near && stage.built && (
        <>
          <Billboard position={[0, -7.2, 6]}>
            <Text font={FONT} fontSize={0.34} color="#a5b8ff" anchorX="center">
              {`IN ▸ ${stage.input}`}
            </Text>
          </Billboard>
          <Billboard position={[0, -7.2, -6]}>
            <Text font={FONT} fontSize={0.34} color="#c9b4ff" anchorX="center">
              {`OUT ▸ ${stage.output}`}
            </Text>
          </Billboard>
        </>
      )}
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
