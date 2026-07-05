"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

const ATTENTION_INDEX = STAGES.findIndex((s) => s.id === "attention");

/**
 * One-time re-engagement nudge at the attention stage. The payload editor
 * auto-collapses back at tokenization, and by the time the arcs appear most
 * readers have forgotten the model is running on THEIR text — the site's
 * core mechanic. One pill, dismissible, never returns once acted on.
 */
export function PromptNudge() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const traveling = useJourneyStore((s) => s.traveling);
  const payloadOpen = useJourneyStore((s) => s.payloadOpen);
  const setPayloadOpen = useJourneyStore((s) => s.setPayloadOpen);
  const [dismissed, setDismissed] = useState(false);

  const show =
    !dismissed && !payloadOpen && !traveling && activeStage === ATTENTION_INDEX;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="prompt-nudge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.8 }}
          className="pointer-events-auto fixed bottom-8 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 pane px-4 py-2.5 md:flex"
        >
          <p className="font-mono text-[11px] uppercase tracking-wide2 text-dim">
            These arcs are for <span className="text-peri">your</span> sentence
          </p>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              setPayloadOpen(true);
            }}
            className="pressable border border-accent-dim bg-accent/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide2 text-lavender transition-colors hover:border-accent hover:text-ink"
          >
            Try your own words
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
            className="pressable font-mono text-[11px] text-faint transition-colors hover:text-ink"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
