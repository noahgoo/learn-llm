"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { beatsFor, type BeatAnchor } from "@/content/stages/beats";
import { STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";
import { Cite } from "./Cite";

/**
 * Hybrid text lane (DOM half): the active beat's headline + caption fades
 * into a screen region that varies per beat, so narration appears where the
 * action is instead of in one fixed wall. In-canvas object labels (the other
 * half) live inside each stage visual. Full cited copy lives in Deep Dive.
 */

const REGION: Record<BeatAnchor, string> = {
  center: "left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 text-center items-center max-w-[40rem]",
  "top-left": "left-16 top-28 max-w-[26rem]",
  "bottom-left": "left-16 bottom-32 max-w-[26rem]",
  right: "right-12 top-1/2 -translate-y-1/2 max-w-[22rem] text-right items-end",
};

export function StageCaptions() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const traveling = useJourneyStore((s) => s.traveling);
  const reduceMotion = useReducedMotion();
  const stage = STAGES[activeStage];
  const beats = beatsFor(stage.id);
  const current = beats[Math.min(beat, beats.length - 1)];
  if (!current) return null;

  const centered = current.anchor === "center";

  return (
    <div aria-live="polite" className="pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: traveling ? 0.35 : 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={`fixed z-10 flex flex-col gap-3 ${REGION[current.anchor]}`}
        >
          <h2
            className={`font-display leading-[1.05] text-ink [text-shadow:_0_2px_24px_rgb(6_4_12_/_0.95)] ${centered ? "text-5xl" : "text-[2rem]"
              }`}
          >
            {current.headline}
          </h2>
          {current.caption && (
            <p className="max-w-[24rem] text-[14px] leading-relaxed text-dim [text-shadow:_0_1px_12px_rgb(6_4_12_/_0.9)]">
              {current.caption}
              {current.cite && (
                <span className="pointer-events-auto">
                  {current.cite.map((id) => (
                    <Cite key={id} id={id} />
                  ))}
                </span>
              )}
            </p>
          )}
          {current.cue && !traveling && (
            <div className="mt-3 flex flex-col items-center gap-2 text-accent">
              <span className="rounded-full border border-accent-dim bg-abyss/90 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wide2 backdrop-blur-sm">
                {current.cue}
              </span>
              <motion.span
                aria-hidden
                animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="text-base leading-none"
              >
                ↓
              </motion.span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
