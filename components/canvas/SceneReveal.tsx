"use client";

import type { ReactNode } from "react";
import { useJourneyStore } from "@/lib/store";

/**
 * Holds the 3D scene hidden on the landing screen and fades it in on the first
 * scroll (`entered`). The atmosphere gradient behind it stays visible, so the
 * landing reads as a calm title screen rather than a black void. Kept mounted
 * the whole time (just opacity-faded) so the canvas/model warm up immediately.
 */
export function SceneReveal({ children }: { children: ReactNode }) {
  const entered = useJourneyStore((s) => s.entered);
  return (
    <div
      className="h-full w-full transition-opacity duration-700 ease-out"
      style={{ opacity: entered ? 1 : 0 }}
    >
      {children}
    </div>
  );
}
