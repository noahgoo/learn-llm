"use client";

import { useMemo, useState } from "react";
import { useActiveOutput } from "@/lib/model/data";
import { nucleusIndices, softmax } from "@/lib/model/math";
import { useJourneyStore, usePredictionStore } from "@/lib/store";

export function PredictionControls() {
  const visible = useJourneyStore((s) => s.activeStage === 8 && s.beat >= 1);
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const temperature = usePredictionStore((s) => s.temperature);
  const topP = usePredictionStore((s) => s.topP);
  const setTemperature = usePredictionStore((s) => s.setTemperature);
  const setTopP = usePredictionStore((s) => s.setTopP);
  const [sampled, setSampled] = useState<string | null>(null);

  // the sampling pool under the current dials — same math the stage renders
  const pool = useMemo(() => {
    if (!output || output.finalLogits.length === 0) return null;
    const probs = softmax(output.finalLogits, temperature);
    const ids = nucleusIndices(probs, topP);
    const total = ids.reduce((s, id) => s + probs[id], 0);
    return { probs, ids, total };
  }, [output, temperature, topP]);

  if (!visible) return null;

  const sample = () => {
    if (!pool || !output) return;
    let r = Math.random() * pool.total;
    let picked = pool.ids[pool.ids.length - 1];
    for (const id of pool.ids) {
      r -= pool.probs[id];
      if (r <= 0) {
        picked = id;
        break;
      }
    }
    setSampled(output.topk.find((t) => t.id === picked)?.token ?? `#${picked}`);
  };

  return (
    <aside className="pointer-events-auto fixed top-36 right-6 z-20 hidden w-56 space-y-3 pane p-4 md:block">
      <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
        Sampling shape
      </p>
      <label className="block font-mono text-[11px] uppercase tracking-wide2 text-faint">
        Temperature · <span className="text-accent">{temperature.toFixed(1)}</span>
        <input
          type="range"
          min="0.2"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-accent)]"
        />
      </label>
      <label className="block font-mono text-[11px] uppercase tracking-wide2 text-faint">
        Nucleus p · <span className="text-accent">{topP.toFixed(2)}</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={topP}
          onChange={(e) => setTopP(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-accent)]"
        />
      </label>
      {/* the payoff toy: roll the dice the model actually rolls */}
      <button
        type="button"
        onClick={sample}
        disabled={!pool}
        className="pressable w-full bg-accent px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide2 text-void transition-colors hover:bg-lavender disabled:opacity-40"
      >
        {sampled === null ? "Sample a token" : "Sample again"}
      </button>
      {sampled !== null && (
        <p className="font-mono text-[12px] leading-relaxed text-dim">
          The dice landed on{" "}
          <span className="text-signal">{JSON.stringify(sampled)}</span> — drag
          the dials and roll again.
        </p>
      )}
    </aside>
  );
}
