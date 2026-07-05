import { useSyncExternalStore } from "react";

/**
 * The single behavioral seam for the mobile experience. Layout is CSS-only
 * (Tailwind `md:`); everything *behavioral* — portrait camera framing, snap
 * strength, fixtures-only inference, perf caps — reads this one signal so
 * the definition of "mobile" never drifts between features.
 *
 * Coarse pointer AND narrow viewport: a mouse-driven narrow window keeps
 * desktop behavior, and a portrait tablet (coarse, ≥768px) keeps desktop
 * layout with desktop behavior for v1 (see MOBILE_PLAN.md §2).
 */
const QUERY = "(pointer: coarse) and (max-width: 767px)";

let mql: MediaQueryList | null | undefined;

function mediaQuery(): MediaQueryList | null {
  if (mql === undefined) {
    mql = typeof window === "undefined" ? null : window.matchMedia(QUERY);
  }
  return mql;
}

/** Plain getter for non-React readers (per-frame callbacks, ScrollTrack). */
export function isMobileExperience(): boolean {
  return mediaQuery()?.matches ?? false;
}

function subscribe(onChange: () => void): () => void {
  const m = mediaQuery();
  if (!m) return () => {};
  // fires on rotation and window resize across the 768px seam
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

/** Reactive flag for components; false on the server/first paint. */
export function useMobileExperience(): boolean {
  return useSyncExternalStore(subscribe, isMobileExperience, () => false);
}
