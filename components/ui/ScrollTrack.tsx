"use client";

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

let scrollAnim: number | null = null;
/** Progress (0..1) an in-flight animation is heading to (rapid keypresses chain). */
let flightProgress: number | null = null;

function cancelScrollAnimation() {
  if (scrollAnim !== null) {
    cancelAnimationFrame(scrollAnim);
    scrollAnim = null;
  }
  flightProgress = null;
}

/** Max scrollable pixels for the current runway height. */
function scrollMax() {
  return Math.max(1, (JOURNEY_UNITS - 1) * window.innerHeight);
}

/**
 * Smoothly scroll so the journey sits at `progress` (0..1).
 * Animated via rAF rather than `behavior: "smooth"` — native smooth
 * scrolling is unreliable (observed scrolling 0px in Chrome profiles
 * with smooth scrolling disabled).
 */
function scrollToProgress(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const target = clamped * scrollMax();
  cancelScrollAnimation();
  flightProgress = clamped;
  if (prefersReducedMotion()) {
    window.scrollTo(0, target);
    flightProgress = null;
    return;
  }
  const start = window.scrollY;
  const distance = target - start;
  const duration = Math.min(900, 350 + Math.abs(distance) * 0.25);
  const t0 = performance.now();
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + distance * easeInOutCubic(t));
    if (t < 1) {
      scrollAnim = requestAnimationFrame(step);
    } else {
      scrollAnim = null;
      flightProgress = null;
    }
  };
  scrollAnim = requestAnimationFrame(step);
}

/** Fly to the first beat of a given stage (used by the progress rail). */
export function scrollToStage(index: number) {
  scrollToProgress(scrollOffsetForStage(index));
}

/** Step one beat/travel unit along the timeline (keyboard nav). */
function scrollByUnit(dir: 1 | -1) {
  const base =
    flightProgress ?? useJourneyStore.getState().progress;
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

    // user wheel/touch input takes over from any in-flight animation
    const onUserScroll = () => cancelScrollAnimation();

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setProgress, setJourney, setCameraT]);

  return <div aria-hidden style={{ height: `${JOURNEY_UNITS * 100}svh` }} />;
}
