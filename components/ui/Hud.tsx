"use client";

import { ProgressRail } from "./ProgressRail";
import { PromptInput } from "./PromptInput";
import { StagePanel } from "./StagePanel";
import { TopBar } from "./TopBar";

/**
 * Full DOM overlay above the 3D canvas. Everything here is HUD chrome;
 * the scene itself never renders DOM, and the HUD never imports three.js.
 */
export function Hud() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <TopBar />
      <ProgressRail />
      <StagePanel />
      <PromptInput />
      <p className="pointer-events-none fixed bottom-9 left-6 z-20 font-mono text-[10px] uppercase tracking-wide2 text-faint">
        Scroll to begin ↓
      </p>
    </div>
  );
}
