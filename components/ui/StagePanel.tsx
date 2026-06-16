"use client";

import { AnimatePresence, motion } from "motion/react";
import { beatsFor } from "@/content/stages/beats";
import { STAGES } from "@/lib/journey";
import { useJourneyStore, useLensStore } from "@/lib/store";

/**
 * Compact stage identity chip, top-left: phase label, title, and the
 * IN ▸ / OUT ▸ connective tissue. The narrative itself now lives in the
 * beat captions (StageCaptions); full cited copy lives in Deep Dive. Fades
 * between stages so it reads as a quiet "where am I" marker, not a wall.
 */
export function StagePanel() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const traveling = useJourneyStore((s) => s.traveling);
  const lens = useLensStore((s) => s.lens);
  const stage = STAGES[activeStage];
  const currentBeat = beatsFor(stage.id)[beat];
  const quiet = stage.built && currentBeat?.anchor === "center" && !traveling;

  return (
    <section
      aria-live="polite"
      className="pointer-events-none fixed left-16 top-24 z-10 w-[20rem]"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: quiet ? 0.22 : 1, x: quiet ? -10 : 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
            {stage.phase}
          </p>
          <h1 className="mt-1.5 font-display text-3xl leading-[1.05] text-ink">
            {stage.title}
          </h1>
          {!stage.built && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wide2 text-faint">
              Station under construction
            </p>
          )}
          <div className="rule-x mt-4 w-16" />
          <dl className="mt-4 space-y-1.5 font-mono text-[10px] uppercase tracking-wide2">
            <div className="flex gap-3">
              <dt className="w-8 text-faint">In</dt>
              <dd className="text-peri">▸ {stage.input}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-8 text-faint">Out</dt>
              <dd className="text-lavender">▸ {stage.output}</dd>
            </div>
          </dl>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-wide2 text-faint">
            Lens · <span className="text-dim">{lens}</span>
          </p>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
