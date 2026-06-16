"use client";

import { AnimatePresence, motion } from "motion/react";
import { STAGE_CONTENT } from "@/content/stages";
import { STAGES } from "@/lib/journey";
import { useJourneyStore, useLensStore } from "@/lib/store";

/**
 * Opt-in depth. Beat captions stay short; the full cited prose for the
 * active stage (incl. the technical-lens math) lives here, expanded on
 * demand. Replaces the always-on MDX wall the StagePanel used to carry.
 */
export function DeepDive() {
  const open = useJourneyStore((s) => s.deepDiveOpen);
  const setOpen = useJourneyStore((s) => s.setDeepDiveOpen);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const lens = useLensStore((s) => s.lens);
  const stage = STAGES[activeStage];
  const Content = STAGE_CONTENT[stage.id]?.[lens];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="pointer-events-auto fixed right-6 top-16 z-30 flex items-center gap-2 border border-line bg-abyss/80 px-3 py-2 font-mono text-[10px] uppercase tracking-wide2 text-dim backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink"
      >
        <span className="text-accent">{open ? "✕" : "≡"}</span>
        Deep dive
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="deep-dive"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto fixed right-6 top-28 bottom-24 z-30 flex w-[26rem] max-w-[80vw] flex-col border border-line bg-abyss/95 backdrop-blur-sm"
          >
            <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide3 text-accent">
                  {stage.phase}
                </p>
                <h2 className="mt-1 font-display text-2xl leading-tight text-ink">
                  {stage.title}
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wide2 text-faint">
                {lens}
              </span>
            </div>
            <div className="prose-stage flex-1 overflow-y-auto px-5 py-4 text-[14px] leading-relaxed text-dim">
              {Content ? (
                <Content />
              ) : (
                <p>Full write-up for this station lands in a later milestone.</p>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
