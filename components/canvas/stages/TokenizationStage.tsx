"use client";

import { Billboard } from "@react-three/drei";
import { useJourneyStore } from "@/lib/store";
import { useActiveOutput } from "@/lib/model/data";
import { TokenChip } from "./TokenChip";

/**
 * Phase 01 — the user's text as real BPE tokens, fanned in an arc through
 * the station. Labels show the token string; sublabels its vocabulary id.
 */
export function TokenizationStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  if (!output) return null;

  const n = output.seq;
  const radius = Math.max(4.5, n * 0.62);
  const span = Math.min(Math.PI * 1.25, n * 0.32);

  return (
    <Billboard>
      {output.tokens.map((tok, i) => {
        const a = (i / Math.max(1, n - 1) - 0.5) * span;
        return (
          <TokenChip
            key={`${i}-${output.ids[i]}`}
            label={tok.replaceAll(" ", "·")}
            sublabel={`${output.ids[i]}`}
            position={[
              Math.sin(a) * radius,
              Math.cos(a) * radius * 0.4 - radius * 0.12,
              0,
            ]}
            color={i % 2 ? "#c9b4ff" : "#a5b8ff"}
          />
        );
      })}
    </Billboard>
  );
}
