"use client";

import { motion, useMotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { ACTS, actIndexForStage, STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

/**
 * Travel-band typography, scrubbed directly by scroll (no time-fired
 * animation, so reverse scrolling mirrors forward exactly):
 *
 *  - a huge ghost numeral behind the scene, peaking mid-flight
 *  - the arriving stage's title, rising through the back half of the
 *    flight and gone by arrival — the StagePanel chip takes over.
 *
 * When the travel band crosses an act boundary the interstitial becomes a
 * full chapter divider: the ghost numeral shows the act (I / II / III) and
 * the title block announces the act, Apple-chapter style.
 *
 * High-frequency values ride MotionValues fed by a store subscription;
 * React only re-renders when the *target stage* changes.
 */
export function TravelInterstitial() {
  const numeralOpacity = useMotionValue(0);
  const titleOpacity = useMotionValue(0);
  const titleX = useMotionValue(0);
  const titleY = useMotionValue(24);
  const titleScale = useMotionValue(1);
  const [target, setTarget] = useState(-1);

  useEffect(() => {
    let currentTarget = -1;
    return useJourneyStore.subscribe((s) => {
      if (!s.traveling) {
        numeralOpacity.set(0);
        titleOpacity.set(0);
        return;
      }
      const f = s.travelProgress;
      // during the first half activeStage is still the departed station
      const t = f < 0.5 ? s.activeStage + 1 : s.activeStage;
      if (t !== currentTarget) {
        currentTarget = t;
        setTarget(t);
      }
      // numeral: swells in, dissolves before arrival
      numeralOpacity.set(Math.sin(Math.PI * f) * 0.9);
      // title: rises through the back half…
      const back = Math.max(0, (f - 0.45) / 0.55);
      const rise = Math.min(1, back / 0.4);
      // …then DOCKS: over the last fifth of the flight it shrinks and slides
      // toward the top-left StagePanel corner, dissolving as the panel's own
      // chip fades in — a shared-element hand-off, scrubbed both directions.
      // Chapter dividers stay centered (they announce an act, not the chip).
      const chapter =
        t > 0 && actIndexForStage(t - 1) !== actIndexForStage(t);
      const dock = chapter ? 0 : Math.max(0, (f - 0.8) / 0.2);
      const glide = dock * dock * (3 - 2 * dock);
      titleOpacity.set(
        chapter ? Math.sin(Math.PI * back) : rise * (1 - glide * glide),
      );
      titleX.set(-glide * window.innerWidth * 0.36);
      titleY.set((1 - rise) * 24 - glide * window.innerHeight * 0.3);
      titleScale.set(1 - 0.45 * glide);
    });
  }, [numeralOpacity, titleOpacity, titleX, titleY, titleScale]);

  const stage = STAGES[target];
  if (!stage) return null;

  const actIndex = actIndexForStage(target);
  const act = ACTS[actIndex];
  // an act boundary: this travel band enters a new chapter
  const chapter = target > 0 && actIndexForStage(target - 1) !== actIndex;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] flex flex-col items-center justify-center"
    >
      <motion.p
        style={{ opacity: numeralOpacity }}
        className={`font-mono leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_var(--color-line)] ${
          chapter ? "text-[30vw] tracking-normal" : "text-[24vw] tracking-tighter"
        }`}
      >
        {chapter ? act.numeral : String(target + 1).padStart(2, "0")}
      </motion.p>
      <motion.div
        style={{ opacity: titleOpacity, x: titleX, y: titleY, scale: titleScale }}
        className="absolute flex flex-col items-center gap-3 px-6 text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
          {chapter ? `Part ${act.numeral} · ${act.title}` : stage.phase}
        </p>
        <h2 className="font-display text-4xl leading-[1.02] text-ink [text-shadow:_0_2px_24px_rgb(6_4_12_/_0.95)] md:text-6xl">
          {chapter ? act.title : stage.title}
        </h2>
        {chapter && (
          <p className="font-mono text-[11px] uppercase tracking-wide2 text-dim">
            First stop ▸ {stage.title}
          </p>
        )}
      </motion.div>
    </div>
  );
}
