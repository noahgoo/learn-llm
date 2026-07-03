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
  const titleY = useMotionValue(24);
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
      // title: rises through the back half, gone by f = 1
      const back = Math.max(0, (f - 0.45) / 0.55);
      titleOpacity.set(Math.sin(Math.PI * back));
      titleY.set((1 - back) * 24);
    });
  }, [numeralOpacity, titleOpacity, titleY]);

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
        style={{ opacity: titleOpacity, y: titleY }}
        className="absolute flex flex-col items-center gap-3 text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
          {chapter ? `Part ${act.numeral} · ${act.title}` : stage.phase}
        </p>
        <h2 className="font-display text-6xl leading-[1.02] text-ink [text-shadow:_0_2px_24px_rgb(6_4_12_/_0.95)]">
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
