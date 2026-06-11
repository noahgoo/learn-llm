"use client";

import { useEffect } from "react";
import { STAGE_COUNT, stageIndexForProgress } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let scrollAnim: number | null = null;
/** Stage an in-flight animation is heading to (rapid keypresses chain). */
let flightTarget: number | null = null;

function cancelScrollAnimation() {
  if (scrollAnim !== null) {
    cancelAnimationFrame(scrollAnim);
    scrollAnim = null;
  }
  flightTarget = null;
}

/**
 * Scroll the page so stage `index` is centered in the journey.
 * Animated via rAF rather than `behavior: "smooth"` — native smooth
 * scrolling is unreliable (observed scrolling 0px in Chrome profiles
 * with smooth scrolling disabled).
 */
export function scrollToStage(index: number) {
  const clamped = Math.min(STAGE_COUNT - 1, Math.max(0, index));
  const target = clamped * window.innerHeight;
  cancelScrollAnimation();
  flightTarget = clamped;
  if (prefersReducedMotion()) {
    window.scrollTo(0, target);
    flightTarget = null;
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
      flightTarget = null;
    }
  };
  scrollAnim = requestAnimationFrame(step);
}

/**
 * Invisible scroll runway: N viewport-heights tall. Window scroll maps to
 * journey progress (0..1) in the store; the camera rig consumes it per
 * frame. Also owns keyboard navigation between stages.
 */
export function ScrollTrack() {
  const setProgress = useJourneyStore((s) => s.setProgress);
  const setActiveStage = useJourneyStore((s) => s.setActiveStage);

  useEffect(() => {
    const onScroll = () => {
      const max = (STAGE_COUNT - 1) * window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setProgress(progress);
      const stage = stageIndexForProgress(progress);
      if (useJourneyStore.getState().activeStage !== stage) {
        setActiveStage(stage);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const { activeStage, exploring, setExploring } =
        useJourneyStore.getState();
      if (exploring) {
        if (e.key === "Escape") setExploring(false);
        return;
      }
      // chain from the in-flight destination so rapid presses advance
      const current = flightTarget ?? activeStage;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          scrollToStage(current + 1);
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          scrollToStage(current - 1);
          break;
        case "Home":
          e.preventDefault();
          scrollToStage(0);
          break;
        case "End":
          e.preventDefault();
          scrollToStage(STAGE_COUNT - 1);
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
  }, [setProgress, setActiveStage]);

  return <div aria-hidden style={{ height: `${STAGE_COUNT * 100}svh` }} />;
}
