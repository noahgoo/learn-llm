"use client";

import { Billboard, Line, Text } from "@react-three/drei";
import { useMemo } from "react";
import { cosineSimilarity } from "@/lib/model/embedding";
import { useActiveOutput } from "@/lib/model/data";
import { useJourneyStore } from "@/lib/store";
import { TokenChip } from "./TokenChip";

const FONT = "/fonts/IBMPlexMono-Regular.ttf";
const D_MODEL = 768;

/**
 * Phase 03 — order made visible: tokens climb a spiral staircase of
 * positions. Link brightness = cosine similarity between consecutive
 * learned position vectors (they form smooth trajectories, not noise).
 */
export function PositionalStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);

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

  return (
    <group>
      {output.tokens.map((tok, i) => {
        const p = place(i);
        return (
          <group key={`${i}-${output.ids[i]}`}>
            <Billboard position={p}>
              <TokenChip
                label={tok.replaceAll(" ", "·")}
                sublabel={`pos ${i}`}
                position={[0, 0, 0]}
                color="#a5b8ff"
                scale={0.9}
              />
            </Billboard>
            {i > 0 && (
              <Line
                points={[place(i - 1), p]}
                color="#9d7bff"
                transparent
                opacity={0.15 + 0.8 * Math.max(0, sims[i - 1])}
                lineWidth={1.5}
              />
            )}
          </group>
        );
      })}
      {n > 1 && (
        <Billboard position={[0, (n * 0.62) / 2 + 1.4, 0]}>
          <Text font={FONT} fontSize={0.26} color="#8d97a7" anchorX="center">
            {`adjacent pos-vector similarity ${
              sims.length
                ? (sims.reduce((a, b) => a + b, 0) / sims.length).toFixed(2)
                : "—"
            }`}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
