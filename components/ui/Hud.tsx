"use client";

import { useJourneyStore } from "@/lib/store";
import { ProgressRail } from "./ProgressRail";
import { PromptInput } from "./PromptInput";
import { StagePanel } from "./StagePanel";
import { TopBar } from "./TopBar";

/**
 * Full DOM overlay above the 3D canvas. Everything here is HUD chrome;
 * the scene itself never renders DOM, and the HUD never imports three.js.
 */
export function Hud() {
  const started = useJourneyStore((s) => s.activeStage > 0);
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <TopBar />
      <ProgressRail />
      <StagePanel />
      <PromptInput />
      <p
        className={`pointer-events-none fixed bottom-9 left-6 z-20 font-mono text-[10px] uppercase tracking-wide2 text-faint transition-opacity duration-500 ${
          started ? "opacity-0" : "opacity-100"
        }`}
      >
        Scroll to begin ↓
      </p>
    </div>
  );
}
