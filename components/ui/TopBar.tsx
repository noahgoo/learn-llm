"use client";

import { ACTS, actIndexForStage, STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

/**
 * Breadcrumb under the wordmark: `Part II · Attention · 2/3`. Always-on
 * orientation at act + stage + beat granularity. Subscribes to low-frequency
 * state only (stage/beat flips, not beatProgress).
 */
function Breadcrumb() {
  const entered = useJourneyStore((s) => s.entered);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  if (!entered) {
    return (
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide2 text-faint">
        Inside the Model
      </p>
    );
  }
  const stage = STAGES[activeStage];
  const act = ACTS[actIndexForStage(activeStage)];
  return (
    <p className="mt-1 font-mono text-[11px] uppercase tracking-wide2 text-faint">
      Part {act.numeral}{" "}
      {/* stage name is desktop-only: on mobile the StagePanel title sits
          directly below, and the lens pill needs the horizontal room */}
      <span className="hidden md:inline">
        <span className="text-accent-dim">·</span>{" "}
        <span className="text-dim">{stage.title}</span>
      </span>{" "}
      <span className="text-accent-dim">·</span> {beat + 1}/{stage.beats}
    </p>
  );
}

export function TopBar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:py-5">
      <div className="pointer-events-auto inline-block">
        {/* the page's single h1; stage/beat headings live below it */}
        <h1 className="font-mono text-[11px] uppercase tracking-wide3 text-ink">
          Learn <span className="text-accent">·</span> LLM
        </h1>
        <Breadcrumb />
      </div>
    </header>
  );
}
