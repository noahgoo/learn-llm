"use client";

import { STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";
import { scrollToStage } from "./ScrollTrack";

/**
 * Vertical mission rail on the left edge: one node per journey stage.
 * Clicking a node flies the camera there (via scroll position).
 */
export function ProgressRail() {
  const activeStage = useJourneyStore((s) => s.activeStage);

  return (
    <nav
      aria-label="Journey stages"
      className="pointer-events-auto fixed left-6 top-1/2 z-20 -translate-y-1/2"
    >
      <ol className="relative flex flex-col gap-5">
        {/* spine */}
        <span
          aria-hidden
          className="absolute left-[3.5px] top-2 bottom-2 w-px bg-line"
        />
        {STAGES.map((stage, i) => {
          const active = i === activeStage;
          return (
            <li key={stage.id} className="relative">
              <button
                type="button"
                onClick={() => scrollToStage(i)}
                aria-current={active ? "step" : undefined}
                className="group relative flex items-center outline-none"
              >
                <span
                  className={`relative block h-2 w-2 rounded-full transition-colors duration-300 ${
                    active
                      ? "bg-accent glow-accent"
                      : stage.built
                        ? "bg-dim group-hover:bg-ink group-focus-visible:bg-ink"
                        : "bg-faint group-hover:bg-dim group-focus-visible:bg-dim"
                  }`}
                />
                {/* label: hover/focus-revealed chip, absolutely positioned so
                    it neither blocks the stage copy nor drowns in it */}
                <span
                  className={`pointer-events-none absolute left-full z-30 ml-3 -translate-x-1 border border-line bg-abyss/95 px-2 py-1 font-mono text-[10px] whitespace-nowrap uppercase tracking-wide2 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ${
                    active ? "text-accent" : "text-dim"
                  }`}
                >
                  {stage.short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
