"use client";

import { useModelStore } from "@/lib/model/client";
import { N_HEAD, N_LAYER } from "@/lib/model/protocol";
import { useTelemetryStore } from "@/lib/store";

/**
 * Dev/diagnostic readout (Checkpoint B): proves real tokens, attention
 * tensors, and next-token probabilities are flowing. Stage visualizations
 * take over this data in M2.
 */
export function Telemetry() {
  const output = useModelStore((s) => s.output);
  const error = useModelStore((s) => s.error);
  const visible = useTelemetryStore((s) => s.visible);
  const setVisible = useTelemetryStore((s) => s.setVisible);
  if (!output && !error) return null;

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="pointer-events-auto fixed right-6 bottom-20 z-20 border border-line bg-abyss/80 px-3 py-2 font-mono text-[10px] uppercase tracking-wide2 text-dim backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink"
      >
        Show telemetry
      </button>
    );
  }

  return (
    <aside className="pointer-events-auto fixed right-6 bottom-20 z-20 w-72 border border-line bg-abyss/70 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-wide3 text-accent">
          Telemetry
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="font-mono text-[10px] uppercase tracking-wide2 text-faint transition-colors hover:text-ink"
        >
          Hide
        </button>
      </div>
      {error && (
        <p className="mt-2 font-mono text-[10px] text-signal">{error}</p>
      )}
      {output && (
        <>
          <div className="mt-3 flex flex-wrap gap-1">
            {output.tokens.map((tok, i) => (
              <span
                key={`${i}-${output.ids[i]}`}
                title={`id ${output.ids[i]}`}
                className="border border-line bg-void/60 px-1.5 py-0.5 font-mono text-[10px] text-peri"
              >
                {tok.replaceAll(" ", "␣")}
              </span>
            ))}
          </div>
          {output.truncated && (
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide2 text-signal">
              Truncated to 64 tokens
            </p>
          )}
          <p className="mt-3 font-mono text-[10px] text-dim">
            attention {N_LAYER}L × {N_HEAD}H × {output.seq} × {output.seq}
          </p>
          <div className="mt-3 space-y-1">
            {output.topk.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className="w-16 truncate text-right font-mono text-[10px] text-ink">
                  {JSON.stringify(t.token)}
                </span>
                <div className="h-1.5 flex-1 bg-void/60">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.max(2, t.prob * 100)}%` }}
                  />
                </div>
                <span className="w-10 font-mono text-[10px] text-dim">
                  {(t.prob * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
