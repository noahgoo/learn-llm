"use client";

import { AnimatePresence, motion } from "motion/react";
import { STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";
import { scrollToStage } from "./ScrollTrack";

const GITHUB_URL = "https://github.com/noahgoo/learn-llm";

export function EndCard() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);
  const finalStage = STAGES.length - 1;
  const visible =
    activeStage === finalStage &&
    beat === STAGES[finalStage].beats - 1 &&
    beatProgress > 0.55;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="end-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="pointer-events-auto fixed left-1/2 bottom-10 z-30 w-[30rem] max-w-[86vw] -translate-x-1/2 border border-line bg-abyss/88 p-5 text-center backdrop-blur-sm"
        >
          <p className="font-mono text-[10px] uppercase tracking-wide3 text-accent">
            Journey complete
          </p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-ink">
            Thank you for learning.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-dim">
            If this helped, leave a star on GitHub so more people can find the
            project.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open GitHub repository"
              className="inline-flex items-center justify-center gap-2 border border-accent-dim bg-accent/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wide2 text-lavender transition-colors hover:border-accent hover:text-ink"
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="h-4 w-4 fill-current"
              >
                <path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.62 2.29 6.69 5.47 7.77.4.08.55-.18.55-.39 0-.19-.01-.84-.01-1.52-2.01.38-2.53-.5-2.69-.96-.09-.24-.48-.96-.82-1.15-.28-.16-.68-.55-.01-.56.63-.01 1.08.59 1.23.84.72 1.24 1.87.89 2.33.68.07-.53.28-.89.51-1.09-1.78-.21-3.64-.91-3.64-4.03 0-.89.31-1.62.82-2.19-.08-.21-.36-1.04.08-2.16 0 0 .67-.22 2.2.84A7.43 7.43 0 0 1 8 3.99c.68 0 1.36.09 2 .27 1.53-1.06 2.2-.84 2.2-.84.44 1.12.16 1.95.08 2.16.51.57.82 1.3.82 2.19 0 3.13-1.87 3.82-3.65 4.03.29.25.54.75.54 1.52 0 1.09-.01 1.97-.01 2.24 0 .21.15.47.55.39A8.08 8.08 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z" />
              </svg>
              GitHub
            </a>
            <button
              type="button"
              onClick={() => scrollToStage(0)}
              className="border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-wide2 text-dim transition-colors hover:border-line-strong hover:text-ink"
            >
              Start over
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
