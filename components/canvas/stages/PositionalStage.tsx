"use client";

import { Billboard, Line, Text } from "@react-three/drei";
import { useMemo } from "react";
import { cosineSimilarity } from "@/lib/model/embedding";
import { useActiveOutput } from "@/lib/model/data";
import { useJourneyStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";
const D_MODEL = 768;
const STAGE_INDEX = 2;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Phase 03 backdrop. TokenFlow owns the moving beads; this component renders
 * the problem framing, position-vector arrows, and the ordered ribbon those
 * beads settle onto.
 */
export function PositionalStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);

  const sims = useMemo(() => {
    if (!output) return [];
    const out: number[] = [];
    for (let i = 1; i < output.seq; i++) {
      out.push(
        cosineSimilarity(
          output.posEmb.subarray((i - 1) * D_MODEL, i * D_MODEL),
          output.posEmb.subarray(i * D_MODEL, (i + 1) * D_MODEL),
        ),
      );
    }
    return out;
  }, [output]);

  if (!output) return null;
  const n = output.seq;
  const place = (i: number): [number, number, number] => {
    const a = i * 0.62 - Math.PI / 2;
    return [Math.cos(a) * 4.6, i * 0.62 - (n * 0.62) / 2, Math.sin(a) * 4.6];
  };
  const vectorReveal =
    activeStage < STAGE_INDEX
      ? 0
      : activeStage > STAGE_INDEX
        ? 1
        : beat === 0
          ? 0
          : beat === 1
            ? smoothstep(beatProgress)
            : 1;
  const ribbonReveal =
    activeStage < STAGE_INDEX
      ? 0
      : activeStage > STAGE_INDEX
        ? 1
        : beat < 2
          ? 0
          : smoothstep(beatProgress);

  return (
    <group>
      {output.tokens.map((_, i) => {
        const p = place(i);
        const arrowBase: [number, number, number] = [p[0] * 0.45, p[1], p[2] * 0.45];
        return (
          <group key={`${i}-${output.ids[i]}`}>
            <Line
              points={[arrowBase, p]}
              color="#ffb454"
              transparent
              opacity={0.15 + 0.65 * vectorReveal}
              lineWidth={1 + 2 * vectorReveal}
            />
            <mesh position={p}>
              <sphereGeometry args={[0.07 + 0.08 * vectorReveal, 10, 10]} />
              <meshBasicMaterial color="#ffb454" transparent opacity={0.25 + 0.65 * vectorReveal} />
            </mesh>
            <Billboard position={[p[0], p[1] + 0.46, p[2]]}>
              <Text
                font={FONT}
                fontSize={0.16}
                color="#8d87a8"
                anchorX="center"
              >
                {`slot ${i}`}
              </Text>
            </Billboard>
            {i > 0 && (
              <Line
                points={[place(i - 1), p]}
                color="#9d7bff"
                transparent
                opacity={ribbonReveal * (0.15 + 0.8 * Math.max(0, sims[i - 1]))}
                lineWidth={1.5}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
