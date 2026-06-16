"use client";

import { Line, Text } from "@react-three/drei";
import { useMemo } from "react";
import { N_LAYER } from "@/lib/model/protocol";
import { useActiveOutput } from "@/lib/model/data";
import { vectorNorm } from "@/lib/model/math";
import { useJourneyStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";
const STAGE_INDEX = 6;
const D_MODEL = 768;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function ResidualStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);

  const norms = useMemo(() => {
    if (!output?.hiddens.length) return [];
    const tokenIndex = Math.max(0, output.seq - 1);
    return output.hiddens.map((hidden) =>
      vectorNorm(hidden.subarray(tokenIndex * D_MODEL, (tokenIndex + 1) * D_MODEL)),
    );
  }, [output]);

  if (!output || norms.length === 0) return null;

  const max = Math.max(...norms, 1);
  const reveal =
    activeStage < STAGE_INDEX
      ? 0
      : activeStage > STAGE_INDEX
        ? 1
        : beat === 0
          ? smoothstep(beatProgress) * 0.4
          : beat === 1
            ? 0.4 + smoothstep(beatProgress) * 0.35
            : 0.75 + smoothstep(beatProgress) * 0.25;
  const highlightLayer =
    beat < 2 ? -1 : Math.min(N_LAYER, Math.floor(beatProgress * (N_LAYER + 1)));
  const points = norms.map((norm, i) => [
    (i / N_LAYER - 0.5) * 6.4,
    (norm / max - 0.5) * 2.2,
    0,
  ] as [number, number, number]);

  return (
    <group>
      <Line points={points} color="#c9b4ff" transparent opacity={0.25 + reveal * 0.55} lineWidth={2} />
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i === highlightLayer ? 0.16 : 0.09, 12, 12]} />
          <meshBasicMaterial
            color={i === highlightLayer ? "#ffb454" : "#9d7bff"}
            transparent
            opacity={0.25 + reveal * 0.7}
            depthWrite={false}
          />
        </mesh>
      ))}
      {beat >= 1 && (
        <>
          <Line
            points={[
              [-3.2, -1.45, 0],
              [3.2, -1.45, 0],
            ]}
            color="#4f4a63"
            transparent
            opacity={0.45}
          />
          <Text font={FONT} fontSize={0.18} color="#8d87a8" anchorX="center" position={[0, -1.85, 0]} material-depthTest={false}>
            hidden_0 → hidden_12
          </Text>
        </>
      )}
    </group>
  );
}
