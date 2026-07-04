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
      Part {act.numeral} <span className="text-accent-dim">·</span>{" "}
      <span className="text-dim">{stage.title}</span>{" "}
      <span className="text-accent-dim">·</span> {beat + 1}/{stage.beats}
    </p>
  );
}

export function TopBar() {
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-6 py-5">
        <div className="pointer-events-auto inline-block">
          {/* the page's single h1; stage/beat headings live below it */}
          <h1 className="font-mono text-[11px] uppercase tracking-wide3 text-ink">
            Learn <span className="text-accent">·</span> LLM
          </h1>
          <Breadcrumb />
        </div>
      </header>
      <aside className="pointer-events-auto fixed right-4 bottom-28 left-4 z-40 pane p-4 text-center md:hidden">
        <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
          Best on desktop
        </p>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          The 3D model tour works best with a wide screen. Use a desktop
          browser, or open Explain for the written journey.
        </p>
      </aside>
    </>
  );
}
