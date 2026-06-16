"use client";

import { Line, Text } from "@react-three/drei";
import { useMemo } from "react";
import { useActiveOutput } from "@/lib/model/data";
import { useJourneyStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";
const STAGE_INDEX = 5;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function FeedForwardStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);

  const tokens = useMemo(() => {
    if (!output) return [];
    return output.tokens.slice(-Math.min(output.seq, 9));
  }, [output]);

  if (!output) return null;
  const expand =
    activeStage === STAGE_INDEX && beat === 1
      ? smoothstep(beatProgress)
      : activeStage > STAGE_INDEX || beat > 1
        ? 1
        : 0;
  const compress =
    activeStage === STAGE_INDEX && beat === 2
      ? smoothstep(beatProgress)
      : activeStage > STAGE_INDEX
        ? 1
        : 0;

  return (
    <group>
      {tokens.map((tok, i) => {
        const x = (i - (tokens.length - 1) / 2) * 0.72;
        const height = 0.55 + expand * 1.1 - compress * 0.65;
        return (
          <group key={`${i}-${tok}`} position={[x, 0, 0]}>
            <Line
              points={[
                [0, -1.25, 0],
                [0, 1.25, 0],
              ]}
              color="#4f4a63"
              transparent
              opacity={0.35}
              lineWidth={1}
            />
            <mesh position={[0, 0, 0.05]}>
              <boxGeometry args={[0.32, height, 0.16]} />
              <meshBasicMaterial color="#9d7bff" transparent opacity={0.32 + expand * 0.35} />
            </mesh>
            <mesh position={[0, 0, 0.22]}>
              <boxGeometry args={[0.18, Math.max(0.22, height * 0.42), 0.16]} />
              <meshBasicMaterial color="#ffb454" transparent opacity={0.15 + expand * 0.55} />
            </mesh>
          </group>
        );
      })}
      <Text font={FONT} fontSize={0.2} color="#8d87a8" anchorX="center" position={[0, 2.1, 0]} material-depthTest={false}>
        768 → 3072 → 768
      </Text>
      <Text font={FONT} fontSize={0.16} color="#c9b4ff" anchorX="center" position={[0, -2.05, 0]} material-depthTest={false}>
        per-token MLP lanes
      </Text>
    </group>
  );
}
