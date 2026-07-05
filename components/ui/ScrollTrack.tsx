"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import {
  JOURNEY_UNITS,
  journeyFromProgress,
  scrollOffsetForStage,
  STAGES,
} from "@/lib/journey";
import { isMobileExperience } from "@/lib/mobile";
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

/**
 * Max scrollable pixels for the current runway height. Measured from the
 * document rather than derived from innerHeight: the runway is sized in svh
 * (stable), but innerHeight grows when mobile browser toolbars collapse
 * mid-scroll — deriving from it would make progress jump under the thumb.
 */
function scrollMax() {
  return Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Smoothly scroll so the journey sits at `progress` (0..1). */
function scrollToProgress(progress: number, immediate = false) {
  const clamped = Math.min(1, Math.max(0, progress));
  const target = clamped * scrollMax();
  if (!lenis || immediate) {
    lenis?.scrollTo(target, { immediate: true });
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
      // Deep link: keep the URL hash on the active stage so any stop is
      // shareable and reload resumes in place. replaceState — no history
      // spam, no native anchor-jump.
      if (state.entered && state.activeStage !== j.stageIndex) {
        history.replaceState(null, "", `#${STAGES[j.stageIndex].id}`);
      }
      if (
        state.activeStage !== j.stageIndex ||
        state.beat !== j.beatIndex ||
        state.traveling !== j.traveling ||
        Math.abs(state.beatProgress - j.beatProgress) > 0.001 ||
        Math.abs(state.travelProgress - j.travelProgress) > 0.001
      ) {
        setJourney({
          activeStage: j.stageIndex,
          beat: j.beatIndex,
          beatProgress: j.beatProgress,
          traveling: j.traveling,
          travelProgress: j.travelProgress,
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

    // Soft snap gravity: when scrolling rests mid-beat NEAR a beat boundary,
    // drift gently to it so readers settle on complete states. Deliberately
    // weak — only pulls within 0.3 units, never mid-dwell, and any user
    // input interrupts it (Lenis). Off under reduced motion (no Lenis).
    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    const armSnap = () => {
      if (!lenis) return;
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const state = useJourneyStore.getState();
        if (!state.entered) return;
        const pos = state.progress * JOURNEY_UNITS;
        const nearest = Math.round(pos);
        const dist = Math.abs(pos - nearest);
        // resting mid-travel is always awkward (camera parked between
        // stations), so travel bands snap from anywhere; dwells keep the
        // gentle 0.3-unit catch radius. On mobile the radius covers the
        // whole unit (hybrid scroll-snap, MOBILE_PLAN.md §4): a flick may
        // carry several beats, but it always settles ON one.
        const radius = isMobileExperience() ? 0.5 : 0.3;
        if (dist > 0.02 && (state.traveling || dist < radius)) {
          scrollToProgress(nearest / JOURNEY_UNITS);
        }
      }, 700);
    };
    window.addEventListener("scroll", armSnap, { passive: true });

    // Deep-link restore: `#attention` (or a reload mid-journey) jumps
    // straight to that stage's first beat, chrome revealed — no 40-screen
    // re-scroll to get back to where you were.
    const linked = STAGES.findIndex(
      (s) => `#${s.id}` === window.location.hash,
    );
    if (linked > 0) {
      useJourneyStore.getState().setEntered(true);
      scrollToProgress(scrollOffsetForStage(linked) + 1e-4, true);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", armSnap);
      window.removeEventListener("keydown", onKeyDown);
      if (snapTimer) clearTimeout(snapTimer);
      if (raf !== null) cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, [setProgress, setJourney, setCameraT]);

  return <div aria-hidden style={{ height: `${JOURNEY_UNITS * 100}svh` }} />;
}
