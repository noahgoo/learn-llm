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
                aria-label={`Go to ${stage.title}`}
                className="group relative -m-2 flex items-center p-2 outline-none"
              >
                <span
                  className={`relative block h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
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
                  className={`pointer-events-none absolute left-full z-30 ml-3 border border-line bg-abyss/95 px-2 py-1 font-mono text-[11px] whitespace-nowrap uppercase tracking-wide2 backdrop-blur-sm transition-all duration-300 ${
                    active ? "text-accent" : "text-dim"
                  } ${
                    active
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")} / {stage.short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
