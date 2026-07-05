"use client";

import { useFrame } from "@react-three/fiber";
import type { ComponentType } from "react";
import { useRef } from "react";
import * as THREE from "three";
import { STAGE_COUNT, STAGES, stationPosition, type StageId } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

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

/**
 * Per-stage size multiplier for the visual. The tower stages are framed from
 * 23–27 units out (see CAMERA_OFFSETS) while their content spans only ~5
 * units, which made them too small to read — scale the content up instead of
 * pulling the camera in, so the flight choreography stays authored as-is.
 */
const VISUAL_SCALE: Partial<Record<StageId, number>> = {
  "multi-head": 1.9,
  ffn: 1.9,
  residual: 1.9,
  layernorm: 2.4,
  prediction: 1.9,
  weights: 1.8,
};

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

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Build-on-approach (NRG pattern): the station's contents assemble during
 * the back half of the flight toward it — rising and scaling into place,
 * complete just before arrival. Scrubbed by cameraT, so scrolling backward
 * un-builds it. Stage 0 is exempt (it must exist at the journey's mouth).
 */
function ApproachReveal({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    if (index === 0) {
      g.scale.setScalar(1);
      g.position.y = 0;
      return;
    }
    const { cameraT } = useJourneyStore.getState();
    // 0 → 1 across the final approach (last ~half of the travel band)
    const u = cameraT * (STAGE_COUNT - 1) - (index - 0.55);
    const r = smooth(Math.min(1, Math.max(0, u / 0.5)));
    g.visible = r > 0.001;
    g.scale.setScalar(Math.max(0.0001, r));
    g.position.y = (1 - r) * -1.5;
  });
  return <group ref={group}>{children}</group>;
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
      <ApproachReveal index={index}>
        {/* the ring marks a station that has no visual yet; once a stage is
            built its own visualization fills the space and the ring would just
            clutter it, so we drop it there */}
        {!stage.built && (
          <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
            <torusGeometry args={[6.4, 0.045, 8, 96]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </mesh>
        )}
        {Visual ? (
          near && (
            <group scale={VISUAL_SCALE[stage.id] ?? 1}>
              <Visual />
            </group>
          )
        ) : (
          <PlaceholderCore built={stage.built} />
        )}
      </ApproachReveal>
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
