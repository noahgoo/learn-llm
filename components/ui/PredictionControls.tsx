"use client";

import { useJourneyStore, usePredictionStore } from "@/lib/store";

export function PredictionControls() {
  const visible = useJourneyStore((s) => s.activeStage === 8 && s.beat >= 1);
  const temperature = usePredictionStore((s) => s.temperature);
  const topP = usePredictionStore((s) => s.topP);
  const setTemperature = usePredictionStore((s) => s.setTemperature);
  const setTopP = usePredictionStore((s) => s.setTopP);
  if (!visible) return null;

  return (
    <aside className="pointer-events-auto fixed top-36 right-6 z-20 w-56 space-y-3 border border-line bg-abyss/80 p-4 backdrop-blur-sm">
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
    </aside>
  );
}
