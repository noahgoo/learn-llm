"use client";

import { STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

export function TopBar() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const stage = STAGES[activeStage];
  const count = `${String(activeStage + 1).padStart(2, "0")} / ${String(
    STAGES.length,
  ).padStart(2, "0")}`;

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 grid grid-cols-[auto_1fr_auto] items-start gap-6 px-6 py-5">
        <div className="pointer-events-auto">
          <p className="font-mono text-[11px] uppercase tracking-wide3 text-ink">
            Learn <span className="text-accent">·</span> LLM
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide2 text-faint">
            Inside the Model
          </p>
        </div>
        <div className="justify-self-center border border-line bg-abyss/75 px-4 py-2 text-center font-mono text-[11px] uppercase tracking-wide2 backdrop-blur-sm">
          <p className="text-accent">
            {count} <span className="text-faint">/</span> {stage.short}
          </p>
          <p className="mt-1 text-faint">Scroll / arrow keys / rail</p>
        </div>
        <div aria-hidden />
      </header>
      <aside className="pointer-events-auto fixed right-4 bottom-28 left-4 z-40 border border-line bg-abyss/92 p-4 text-center backdrop-blur-sm md:hidden">
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
