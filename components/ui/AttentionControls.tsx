"use client";

import { useAttentionStore, useJourneyStore } from "@/lib/store";
import { N_HEAD, N_LAYER } from "@/lib/model/protocol";

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide2 text-faint">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`previous ${label}`}
          onClick={() => onChange((value - 1 + max) % max)}
          className="border border-line px-1.5 font-mono text-[11px] text-dim hover:border-line-strong hover:text-ink"
        >
          ‹
        </button>
        <span className="w-10 text-center font-mono text-[11px] text-accent">
          {value + 1}/{max}
        </span>
        <button
          type="button"
          aria-label={`next ${label}`}
          onClick={() => onChange((value + 1) % max)}
          className="border border-line px-1.5 font-mono text-[11px] text-dim hover:border-line-strong hover:text-ink"
        >
          ›
        </button>
      </div>
    </div>
  );
}

/** Layer/head/view selectors — visible only at the attention stage. */
export function AttentionControls() {
  const visible = useJourneyStore((s) => s.activeStage === 3);
  const { layer, head, view, setLayer, setHead, setView } =
    useAttentionStore();
  if (!visible) return null;

  return (
    <aside className="pointer-events-auto fixed top-1/2 right-6 z-20 w-56 -translate-y-1/2 space-y-3 border border-line bg-abyss/70 p-4 backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-wide3 text-accent">
        Attention scope
      </p>
      <Stepper label="Layer" value={layer} max={N_LAYER} onChange={setLayer} />
      <Stepper label="Head" value={head} max={N_HEAD} onChange={setHead} />
      <div className="flex border border-line">
        {(["softmax", "scores"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex-1 px-2 py-1 font-mono text-[10px] uppercase tracking-wide2 transition-colors ${
              view === v ? "bg-ink text-void" : "text-dim hover:text-ink"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="font-mono text-[9px] leading-relaxed text-faint">
        Rows ask, columns answer. Scores = Q·Kᵀ/√d before softmax.
      </p>
    </aside>
  );
}
