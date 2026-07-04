"use client";

import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { beatsFor, type BeatAnchor } from "@/content/stages/beats";
import { STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";
import { Cite } from "./Cite";

/**
 * Landing garnish: the suggested prompt types itself out, cursor and all —
 * the hero says "this thing is alive and takes input" before a single
 * scroll. Static under reduced motion.
 */
function TypedPrompt() {
  const prompt = useJourneyStore((s) => s.prompt);
  const reduceMotion = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    // wall-clock based so a throttled background tab catches up instead of
    // freezing mid-word when the page loads out of view
    const t0 = performance.now();
    const timer = setInterval(() => {
      const chars = Math.min(
        prompt.length,
        Math.floor((performance.now() - t0) / 55),
      );
      setN(chars);
      if (chars >= prompt.length) clearInterval(timer);
    }, 55);
    return () => clearInterval(timer);
  }, [prompt, reduceMotion]);
  const shown = reduceMotion ? prompt : prompt.slice(0, n);
  return (
    <p className="font-mono text-[13px] text-peri">
      &ldquo;{shown}
      <span className="animate-pulse text-accent">▌</span>&rdquo;
    </p>
  );
}

/**
 * Scroll-scrubbed visibility envelope for beat captions: fully visible
 * through the first 85% of a beat's dwell (snap gravity parks readers at
 * beat starts, so the parked state must be full-strength), scrubbing out
 * over the last 15% as the next beat approaches. Hidden during travel —
 * the interstitial owns that band. Position-driven, so reverse scrolling
 * mirrors forward exactly.
 */
function useBeatEnvelope() {
  const opacity = useMotionValue(1);
  const y = useMotionValue(0);
  useEffect(
    () =>
      useJourneyStore.subscribe((s) => {
        if (s.traveling) {
          opacity.set(0);
          y.set(6);
          return;
        }
        const bp = s.beatProgress;
        const o = bp > 0.85 ? Math.max(0, 1 - (bp - 0.85) / 0.15) : 1;
        opacity.set(o);
        y.set((1 - o) * -10);
      }),
    [opacity, y],
  );
  return { opacity, y };
}

/**
 * Hybrid text lane (DOM half): the active beat's headline + caption fades
 * into a screen region that varies per beat, so narration appears where the
 * action is instead of in one fixed wall. In-canvas object labels (the other
 * half) live inside each stage visual. Full cited copy lives in the
 * explanation drawer.
 */

/**
 * Two lanes only (Apple rule: copy position is stable within a section).
 * `center` beats are deliberate full-screen moments; every other anchor
 * collapses into ONE side lane per stage, so beats swap content in place
 * instead of hopping around the viewport.
 */
const REGION: Record<BeatAnchor, string> = {
  center: "left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 text-center items-center max-w-[40rem]",
  "top-left": "left-16 top-[46%] max-w-[26rem]",
  "bottom-left": "left-16 top-[46%] max-w-[26rem]",
  right: "left-16 top-[46%] max-w-[26rem]",
};

export function StageCaptions() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const traveling = useJourneyStore((s) => s.traveling);
  const entered = useJourneyStore((s) => s.entered);
  const reduceMotion = useReducedMotion();
  const envelope = useBeatEnvelope();
  // Landing: a real title screen. Says what the site is and how to begin,
  // before the 3D journey and the rest of the chrome reveal on first scroll.
  if (!entered) {
    return (
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex max-w-[44rem] flex-col items-center gap-5 text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
            An interactive 3D explainer
          </p>
          {/* h2: the TopBar wordmark is the page's single h1 */}
          <h2 className="font-display text-6xl leading-[1.02] text-ink [text-shadow:_0_2px_24px_rgb(6_4_12_/_0.95)]">
            Watch a language model think.
          </h2>
          <p className="max-w-[34rem] text-[15px] leading-relaxed text-dim">
            Type a sentence and follow it through GPT-2, one stage at a time —
            tokens, embeddings, attention, and its next-word guess. The whole
            model runs live, right here in your browser.
          </p>
          <TypedPrompt />
          <div className="mt-3 flex flex-col items-center gap-2 text-accent">
            <span className="rounded-full border border-accent-dim bg-abyss/90 px-5 py-2 font-mono text-[11px] uppercase tracking-wide2 backdrop-blur-sm">
              Scroll to begin
            </span>
            <motion.span
              aria-hidden
              animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-base leading-none"
            >
              ↓
            </motion.span>
            <span className="mt-1 font-mono text-[11px] uppercase tracking-wide2 text-faint">
              Scroll · arrow keys · rail · then make the words your own
            </span>
            {/* commitment signal: known cost = higher completion */}
            <span className="font-mono text-[11px] uppercase tracking-wide2 text-faint">
              {STAGES.length} stops · about 5 minutes
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const s = useJourneyStore.getState();
              s.setEntered(true);
              s.setDeepDiveOpen(true);
            }}
            className="pressable pointer-events-auto mt-4 font-mono text-[11px] uppercase tracking-wide2 text-dim underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            Prefer to read? Open the written guide
          </button>
        </motion.div>
      </div>
    );
  }

  const stage = STAGES[activeStage];
  const beats = beatsFor(stage.id);
  const current = beats[Math.min(beat, beats.length - 1)];
  if (!current) return null;

  const centered = current.anchor === "center";
  const region = REGION[current.anchor];

  return (
    // silenced while flying so rapid scrubbing doesn't machine-gun a screen
    // reader with every beat it passes through
    <div aria-live={traveling ? "off" : "polite"} className="pointer-events-none">
      <motion.div
        key={current.key}
        style={{ opacity: envelope.opacity, y: envelope.y }}
        className={`fixed z-10 flex flex-col gap-3 ${region}`}
      >
          <h3
            className={`font-display leading-[1.05] text-ink [text-shadow:_0_2px_24px_rgb(6_4_12_/_0.95)] ${centered ? "text-5xl" : "text-[2rem]"
              }`}
          >
            {current.headline}
          </h3>
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
              <span className="rounded-full border border-accent-dim bg-abyss/90 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide2 backdrop-blur-sm">
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
    </div>
  );
}
