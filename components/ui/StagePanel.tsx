"use client";

import { STAGE_CONTENT } from "@/content/stages";
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
  const Content = STAGE_CONTENT[stage.id]?.[lens];

  return (
    <section
      aria-live="polite"
      className="pointer-events-none fixed left-16 top-1/2 z-10 w-[26rem] max-w-[38vw] -translate-y-1/2"
    >
      <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
        {stage.phase}
      </p>
      <h1 className="mt-3 font-display text-6xl leading-[1.04] text-ink">
        {stage.title}
      </h1>
      <div className="rule-x mt-6 w-24" />
      {Content ? (
        <div className="prose-stage pointer-events-auto mt-6 max-h-[38vh] max-w-[24rem] overflow-y-auto pr-3 text-[14px] leading-relaxed text-dim">
          <Content />
        </div>
      ) : (
        <p className="mt-6 max-w-[24rem] text-[15px] leading-relaxed text-dim">
          {stage.teaser}
        </p>
      )}
      {!stage.built && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide2 text-faint">
          Station under construction
        </p>
      )}
      {/* the connective tissue: what flows in, what flows out */}
      <dl className="mt-7 space-y-1.5 font-mono text-[10px] uppercase tracking-wide2">
        <div className="flex gap-3">
          <dt className="w-8 text-faint">In</dt>
          <dd className="text-peri">▸ {stage.input}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-8 text-faint">Out</dt>
          <dd className="text-lavender">▸ {stage.output}</dd>
        </div>
      </dl>
      <p className="mt-6 font-mono text-[10px] uppercase tracking-wide2 text-faint">
        Lens · <span className="text-dim">{lens}</span>
      </p>
    </section>
  );
}
