"use client";

import { Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { N_HEAD } from "@/lib/model/protocol";
import { useActiveOutput } from "@/lib/model/data";
import { useAttentionStore, useJourneyStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";
const STAGE_INDEX = 4;
const CELL = 0.16;
const GAP = 1.25;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function MultiHeadStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);
  const layer = useAttentionStore((s) => s.layer);

  const reveal =
    activeStage < STAGE_INDEX
      ? 0
      : activeStage > STAGE_INDEX
        ? 1
        : beat === 0
          ? smoothstep(beatProgress) * 0.35
          : beat === 1
            ? 0.35 + smoothstep(beatProgress) * 0.45
            : 0.8 + smoothstep(beatProgress) * 0.2;

  const data = useMemo(() => {
    if (!output) return null;
    const n = Math.min(output.seq, 8);
    const start = Math.max(0, output.seq - n);
    const src = output.attention[layer];
    return { n, start, src };
  }, [output, layer]);

  if (!output || !data) return null;

  return (
    <group>
      {Array.from({ length: N_HEAD }, (_, head) => {
        const col = head % 4;
        const row = Math.floor(head / 4);
        const x0 = (col - 1.5) * GAP;
        const y0 = (1 - row) * GAP;
        return (
          <group key={head} position={[x0, y0, 0]}>
            {Array.from({ length: data.n * data.n }, (_, idx) => {
              const q = Math.floor(idx / data.n);
              const k = idx % data.n;
              const modelQ = data.start + q;
              const modelK = data.start + k;
              const w =
                modelK <= modelQ
                  ? data.src[(head * output.seq + modelQ) * output.seq + modelK]
                  : -1;
              const hot = w >= 0 ? Math.min(1, w * 4) : 0;
              return (
                <mesh
                  key={idx}
                  position={[
                    (k - (data.n - 1) / 2) * CELL,
                    ((data.n - 1) / 2 - q) * CELL,
                    0.04 * hot,
                  ]}
                  scale={[0.82, 0.82, 0.06 + hot * 0.4]}
                >
                  <boxGeometry args={[CELL, CELL, 1]} />
                  <meshBasicMaterial
                    color={w < 0 ? "#14101d" : hot > 0.55 ? "#e7dcff" : "#9d7bff"}
                    transparent
                    opacity={(w < 0 ? 0.15 : 0.25 + hot * 0.7) * reveal}
                    depthWrite={false}
                  />
                </mesh>
              );
            })}
            <Text
              font={FONT}
              fontSize={0.12}
              color="#8d87a8"
              anchorX="center"
              position={[0, -0.78, 0]}
              material-depthTest={false}
            >
              {`head ${head + 1}`}
            </Text>
          </group>
        );
      })}
      {beat >= 2 && (
        <mesh position={[0, -2.55, 0]}>
          <boxGeometry args={[5.6, 0.08, 0.08]} />
          <meshBasicMaterial color="#c9b4ff" transparent opacity={0.45} />
        </mesh>
      )}
      {beat >= 2 && (
        <Text
          font={FONT}
          fontSize={0.18}
          color="#c9b4ff"
          anchorX="center"
          position={[0, -2.9, 0]}
          material-depthTest={false}
        >
          concat heads + output projection
        </Text>
      )}
    </group>
  );
}
