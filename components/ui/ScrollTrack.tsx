"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import {
  JOURNEY_UNITS,
  journeyFromProgress,
  scrollOffsetForStage,
} from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Inertial scroll source (Noomo-style glide). Owns wheel smoothing AND
 * programmatic flights (rail clicks, keyboard nav); user wheel input
 * interrupts an in-flight scrollTo natively. Null under
 * prefers-reduced-motion — everything falls back to instant jumps.
 */
let lenis: Lenis | null = null;

/** Max scrollable pixels for the current runway height. */
function scrollMax() {
  return Math.max(1, (JOURNEY_UNITS - 1) * window.innerHeight);
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Smoothly scroll so the journey sits at `progress` (0..1). */
function scrollToProgress(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const target = clamped * scrollMax();
  if (!lenis) {
    window.scrollTo(0, target);
    return;
  }
  const distance = Math.abs(target - lenis.scroll);
  lenis.scrollTo(target, {
    duration: Math.min(0.9, 0.35 + distance * 0.00025),
    easing: easeInOutCubic,
  });
}

/** Fly to the first beat of a given stage (used by the progress rail). */
export function scrollToStage(index: number) {
  scrollToProgress(scrollOffsetForStage(index));
}

/** Step one beat/travel unit along the timeline (keyboard nav). */
function scrollByUnit(dir: 1 | -1) {
  // targetScroll is where an in-flight animation is heading (equals the
  // current position at rest), so rapid keypresses chain correctly.
  const base = lenis
    ? Math.min(1, Math.max(0, lenis.targetScroll / scrollMax()))
    : useJourneyStore.getState().progress;
  const pos = base * JOURNEY_UNITS;
  const targetUnit = Math.min(
    JOURNEY_UNITS,
    Math.max(0, Math.round(pos) + dir),
  );
  scrollToProgress(targetUnit / JOURNEY_UNITS);
}

/**
 * Invisible scroll runway: JOURNEY_UNITS viewport-heights tall. Window scroll
 * maps to journey progress (0..1); the beat-scroll model in `journey.ts`
 * turns that into stage / beat / camera position, consumed per frame by the
 * camera rig and the stage visuals. Also owns keyboard navigation.
 */
export function ScrollTrack() {
  const setProgress = useJourneyStore((s) => s.setProgress);
  const setJourney = useJourneyStore((s) => s.setJourney);
  const setCameraT = useJourneyStore((s) => s.setCameraT);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollMax()));
      const j = journeyFromProgress(progress);
      setProgress(progress);
      // Reveal HUD chrome on the first deliberate scroll. Sticky: a small
      // threshold ignores sub-pixel jitter at rest; never flips back, so
      // scrolling home again won't re-bare the landing.
      if (!useJourneyStore.getState().entered) {
        const enterPx = Math.max(8, window.innerHeight * 0.02);
        if (window.scrollY > enterPx) useJourneyStore.getState().setEntered(true);
      }
      setCameraT(j.cameraT);
      const state = useJourneyStore.getState();
      if (
        state.activeStage !== j.stageIndex ||
        state.beat !== j.beatIndex ||
        state.traveling !== j.traveling ||
        Math.abs(state.beatProgress - j.beatProgress) > 0.001
      ) {
        setJourney({
          activeStage: j.stageIndex,
          beat: j.beatIndex,
          beatProgress: j.beatProgress,
          traveling: j.traveling,
        });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          scrollByUnit(1);
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          scrollByUnit(-1);
          break;
        case "Home":
          e.preventDefault();
          scrollToProgress(0);
          break;
        case "End":
          e.preventDefault();
          scrollToProgress(1);
          break;
      }
    };

    // Lenis animates window scroll itself, so the native scroll listener
    // above keeps working unchanged. Touch stays native (Lenis default).
    let raf: number | null = null;
    if (!prefersReducedMotion()) {
      lenis = new Lenis();
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      if (raf !== null) cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, [setProgress, setJourney, setCameraT]);

  return <div aria-hidden style={{ height: `${JOURNEY_UNITS * 100}svh` }} />;
}
