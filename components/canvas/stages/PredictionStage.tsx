"use client";

import { Text } from "@react-three/drei";
import { useMemo } from "react";
import { useActiveOutput } from "@/lib/model/data";
import { nucleusIndices, softmax, topkIndices } from "@/lib/model/math";
import { useJourneyStore, usePredictionStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";
const STAGE_INDEX = 8;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function PredictionStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);
  const temperature = usePredictionStore((s) => s.temperature);
  const topP = usePredictionStore((s) => s.topP);

  const ranked = useMemo(() => {
    if (!output || output.finalLogits.length === 0) return [];
    const probs = softmax(output.finalLogits, temperature);
    const allowed = new Set(nucleusIndices(probs, topP));
    return topkIndices(probs, 8).map((id) => ({
      id,
      token: output.topk.find((t) => t.id === id)?.token ?? `#${id}`,
      prob: probs[id],
      inNucleus: allowed.has(id),
    }));
  }, [output, temperature, topP]);

  if (!output || ranked.length === 0) return null;

  const reveal =
    activeStage < STAGE_INDEX
      ? 0
      : activeStage > STAGE_INDEX
        ? 1
        : beat === 0
          ? smoothstep(beatProgress) * 0.25
          : beat === 1
            ? 0.25 + smoothstep(beatProgress) * 0.5
            : 0.75 + smoothstep(beatProgress) * 0.25;
  const max = ranked[0]?.prob ?? 1;

  return (
    <group>
      {ranked.map((item, i) => {
        const width = Math.max(0.12, (item.prob / max) * 4.2 * reveal);
        const y = 1.6 - i * 0.42;
        return (
          <group key={item.id} position={[0, y, 0]}>
            <Text font={FONT} fontSize={0.18} color="#ede9f7" anchorX="right" position={[-2.35, 0, 0]} material-depthTest={false}>
              {JSON.stringify(item.token)}
            </Text>
            <mesh position={[-0.1 + width / 2, 0, 0]}>
              <boxGeometry args={[width, 0.16, 0.12]} />
              <meshBasicMaterial
                color={item.inNucleus ? "#c9b4ff" : "#4f4a63"}
                transparent
                opacity={0.35 + reveal * 0.55}
                depthWrite={false}
              />
            </mesh>
            <Text font={FONT} fontSize={0.13} color="#8d87a8" anchorX="left" position={[2.35, 0, 0]} material-depthTest={false}>
              {(item.prob * 100).toFixed(1)}%
            </Text>
          </group>
        );
      })}
      {beat >= 2 && (
        <Text font={FONT} fontSize={0.16} color="#ffb454" anchorX="center" position={[0, -2.1, 0]} material-depthTest={false}>
          nucleus pool highlighted · T={temperature.toFixed(1)} · p={topP.toFixed(2)}
        </Text>
      )}
    </group>
  );
}
