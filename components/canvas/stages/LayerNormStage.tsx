"use client";

import { Text } from "@react-three/drei";
import { useMemo } from "react";
import { useActiveOutput } from "@/lib/model/data";
import { useJourneyStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";
const STAGE_INDEX = 7;
const D_MODEL = 768;
const BAR_COUNT = 28;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function normalize(values: Float32Array): Float32Array {
  let mean = 0;
  for (const v of values) mean += v;
  mean /= values.length;
  let variance = 0;
  for (const v of values) variance += (v - mean) ** 2;
  const stdev = Math.sqrt(variance / values.length + 1e-5);
  return Float32Array.from(values, (v) => (v - mean) / stdev);
}

export function LayerNormStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);

  const bars = useMemo(() => {
    if (!output?.hiddens.length) return [];
    const tokenIndex = Math.max(0, output.seq - 1);
    const raw = output.hiddens[0].subarray(
      tokenIndex * D_MODEL,
      (tokenIndex + 1) * D_MODEL,
    );
    const normed = normalize(raw);
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const offset = Math.floor((i / BAR_COUNT) * raw.length);
      return {
        raw: Math.max(-1.4, Math.min(1.4, raw[offset] / 6)),
        normed: Math.max(-1.4, Math.min(1.4, normed[offset] / 2.2)),
      };
    });
  }, [output]);

  if (!output || bars.length === 0) return null;

  const mix =
    activeStage < STAGE_INDEX
      ? 0
      : activeStage > STAGE_INDEX
        ? 1
        : beat === 0
          ? 0
          : beat === 1
            ? smoothstep(beatProgress)
            : 1;
  const gateReveal = beat >= 2 ? smoothstep(beatProgress) : 0;

  return (
    <group>
      {bars.map((bar, i) => {
        const x = (i - (bars.length - 1) / 2) * 0.18;
        const v = bar.raw * (1 - mix) + bar.normed * mix;
        return (
          <mesh key={i} position={[x, v / 2, 0]}>
            <boxGeometry args={[0.11, Math.max(0.04, Math.abs(v)), 0.12]} />
            <meshBasicMaterial
              color={mix > 0.5 ? "#c9b4ff" : "#9d7bff"}
              transparent
              opacity={0.4 + mix * 0.35}
              depthWrite={false}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[5.5, 0.035, 0.04]} />
        <meshBasicMaterial color="#4f4a63" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {gateReveal > 0 && (
        <Text font={FONT} fontSize={0.18} color="#c9b4ff" anchorX="center" position={[0, -1.9, 0]} material-depthTest={false}>
          LayerNorm gate before attention and MLP reads
        </Text>
      )}
    </group>
  );
}
