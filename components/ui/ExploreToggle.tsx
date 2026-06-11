"use client";

import { useEffect } from "react";
import { useJourneyStore } from "@/lib/store";

/**
 * Free-explore breakout: suspends the scroll journey and unlocks orbit
 * controls around the current station. Esc or the button returns.
 */
export function ExploreToggle() {
  const exploring = useJourneyStore((s) => s.exploring);
  const setExploring = useJourneyStore((s) => s.setExploring);

  // page must not scroll while orbiting
  useEffect(() => {
    document.body.style.overflow = exploring ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [exploring]);

  return (
    <div className="pointer-events-auto fixed right-6 bottom-8 z-30">
      <button
        type="button"
        onClick={() => setExploring(!exploring)}
        className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-wide2 transition-colors ${
          exploring
            ? "border-accent bg-accent/15 text-lavender"
            : "border-line text-dim hover:border-line-strong hover:text-ink"
        }`}
      >
        {exploring ? "✕ Resume journey · esc" : "◉ Explore station"}
      </button>
    </div>
  );
}
