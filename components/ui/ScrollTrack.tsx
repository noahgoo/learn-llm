"use client";

import { useEffect } from "react";
import { STAGE_COUNT, stageIndexForProgress } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll the page so stage `index` is centered in the journey. */
export function scrollToStage(index: number) {
  const clamped = Math.min(STAGE_COUNT - 1, Math.max(0, index));
  window.scrollTo({
    top: clamped * window.innerHeight,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
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
      const current = useJourneyStore.getState().activeStage;
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

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setProgress, setActiveStage]);

  return <div aria-hidden style={{ height: `${STAGE_COUNT * 100}svh` }} />;
}
