"use client";

import { STAGES } from "@/lib/journey";
import { useJourneyStore, useLensStore } from "@/lib/store";

/**
 * Left-side narrative panel, NASA-EDL style: phase label, cinematic title,
 * teaser copy. Full dual-lens MDX content replaces the teaser in M2.
 */
export function StagePanel() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const lens = useLensStore((s) => s.lens);
  const stage = STAGES[activeStage];

  return (
    <section
      aria-live="polite"
      className="pointer-events-none fixed left-16 top-1/2 z-10 w-[26rem] max-w-[38vw] -translate-y-1/2"
    >
      <p className="font-mono text-[11px] uppercase tracking-wide3 text-ion">
        {stage.phase}
      </p>
      <h1 className="mt-3 font-display text-6xl leading-[1.04] text-ink">
        {stage.title}
      </h1>
      <div className="rule-x mt-6 w-24" />
      <p className="mt-6 max-w-[24rem] text-[15px] leading-relaxed text-dim">
        {stage.teaser}
      </p>
      {!stage.built && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide2 text-faint">
          Station under construction
        </p>
      )}
      <p className="mt-8 font-mono text-[10px] uppercase tracking-wide2 text-faint">
        Lens · <span className="text-dim">{lens}</span>
      </p>
    </section>
  );
}
