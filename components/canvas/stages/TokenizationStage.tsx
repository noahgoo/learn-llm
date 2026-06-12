"use client";

import { Billboard } from "@react-three/drei";
import { useJourneyStore } from "@/lib/store";
import { useActiveOutput } from "@/lib/model/data";
import { TokenChip } from "./TokenChip";

/**
 * Phase 01 — the user's text as real BPE tokens on a world-fixed arc that
 * wraps around the station, so peeking the camera reveals real depth.
 * Each chip billboards individually for readability; positions never
 * follow the camera.
 */
export function TokenizationStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  if (!output) return null;

  const n = output.seq;
  const radius = Math.max(5, n * 0.7);
  const span = Math.min(Math.PI * 1.3, Math.max(1.6, n * 0.34));

  return (
    <group>
      {output.tokens.map((tok, i) => {
        const a = (i / Math.max(1, n - 1) - 0.5) * span;
        return (
          <Billboard
            key={`${i}-${output.ids[i]}`}
            position={[
              Math.sin(a) * radius,
              (i % 2 ? 0.55 : -0.55) + Math.cos(a) * 0.8,
              (1 - Math.cos(a)) * radius * 0.55,
            ]}
          >
            <TokenChip
              label={tok.replaceAll(" ", "·")}
              sublabel={`${output.ids[i]}`}
              position={[0, 0, 0]}
              color={i % 2 ? "#c9b4ff" : "#a5b8ff"}
            />
          </Billboard>
        );
      })}
    </group>
  );
}
